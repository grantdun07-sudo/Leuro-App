// Supabase Edge Function: paystack-webhook
//
// Receives Paystack charge.success webhooks (JSON, HMAC-SHA512 signed)
// and activates per-child subscription plans.
//
// DEPLOY WITHOUT JWT VERIFICATION:
//   supabase functions deploy paystack-webhook --no-verify-jwt
//
// Reference format: LEURO-{learner_id}-{timestamp}
//   learner_id is the UUID from the learners table (NOT the parent user_id).
//   The webhook updates learners.subscription_tier for that specific child.
//
// Flow:
//   1. Verify HMAC-SHA512 x-paystack-signature header.
//   2. Check event.data.status === "success".
//   3. Parse reference LEURO-{learner_id}-{timestamp} → learner_id (UUID).
//   4. Determine tier from amount in kobo: ≤9900 = basic | >9900 = premium.
//   5. UPDATE learners.subscription_tier for that learner_id.
//   6. If amount < full price → INSERT subscription_discounts (tied to parent user_id).
//   7. INSERT subscription_history (learner_id traces which child was billed).
//   8. Always return 200 OK (Paystack retries on non-2xx).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Full prices in kobo (1 kobo = R0.01)
const FULL_PRICE_KOBO = { basic: 9900, premium: 19900 } as const;

function tierFromKobo(amountKobo: number): "basic" | "premium" {
  return amountKobo <= 9900 ? "basic" : "premium";
}

// Extract learner_id UUID from LEURO-{uuid}-{timestamp}.
// UUIDs contain dashes internally, but the timestamp has none, so the last
// dash in the stripped string is always the uuid/timestamp separator.
function extractLearnerId(reference: string): string | null {
  if (!reference) return null;
  const withoutPrefix = reference.replace(/^LEURO-/, "");
  const lastDash = withoutPrefix.lastIndexOf("-");
  if (lastDash <= 0) return null;
  return withoutPrefix.slice(0, lastDash);
}

// Verify Paystack HMAC-SHA512 signature over the raw request body.
async function verifySignature(rawBody: string, signature: string): Promise<boolean> {
  try {
    const secret = Deno.env.get("PAYSTACK_TEST_SECRET") ?? "";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"],
    );
    const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const hex = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex === signature;
  } catch {
    return false;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";

    if (!await verifySignature(rawBody, signature)) {
      console.error("paystack-webhook: invalid signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const data = event?.data ?? {};
    console.log("paystack-webhook: event:", event.event, "status:", data.status, "ref:", data.reference);

    if (data.status !== "success") {
      console.log("paystack-webhook: ignoring non-success status:", data.status);
      return new Response("OK", { status: 200 });
    }

    const reference: string = data.reference ?? "";
    const amountKobo: number = Number(data.amount ?? 0);
    const amountRand: number = amountKobo / 100;

    const learnerId = extractLearnerId(reference);
    if (!learnerId) {
      console.error("paystack-webhook: unrecognised reference:", reference);
      return new Response("OK", { status: 200 });
    }

    const tier = tierFromKobo(amountKobo);
    const fullPriceKobo = FULL_PRICE_KOBO[tier];

    // Load the learner to get current tier and the parent's user_id.
    const { data: learner } = await supabase
      .from("learners")
      .select("id, user_id, subscription_tier")
      .eq("id", learnerId)
      .single();

    if (!learner) {
      console.error("paystack-webhook: learner not found:", learnerId);
      return new Response("OK", { status: 200 });
    }

    const tierFrom = learner.subscription_tier ?? null;
    const parentUserId: string = learner.user_id;

    // Load the parent's profile for referral discount context.
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code_used")
      .eq("id", parentUserId)
      .single();

    // 1) Activate the new tier on the child's learner record.
    const { error: updateErr } = await supabase
      .from("learners")
      .update({ subscription_tier: tier })
      .eq("id", learnerId);
    if (updateErr) {
      console.error("paystack-webhook: tier update failed:", JSON.stringify(updateErr));
      return new Response("OK", { status: 200 });
    }
    console.log(`paystack-webhook: set learner ${learnerId} → ${tier}`);

    // 2) Record discount when amount is below the full tier price.
    const discountKobo = fullPriceKobo - amountKobo;
    if (discountKobo > 0) {
      const discountRand = discountKobo / 100;
      const { error: discountErr } = await supabase
        .from("subscription_discounts")
        .insert({
          user_id: parentUserId,
          code: profile?.referral_code_used ?? "REFERRAL",
          discount_amount: discountRand,
        });
      if (discountErr) {
        console.error("paystack-webhook: discount insert failed:", JSON.stringify(discountErr));
      } else {
        console.log(`paystack-webhook: recorded discount R${discountRand} for parent ${parentUserId}`);
      }
    }

    // 3) Record the subscription event (learner_id traces which child was billed).
    const { error: historyErr } = await supabase
      .from("subscription_history")
      .insert({
        user_id: parentUserId,
        learner_id: learnerId,
        tier_from: tierFrom,
        tier_to: tier,
        amount_paid: amountRand,
        currency: "ZAR",
        payment_ref: reference,
        source: "paystack",
      });
    if (historyErr) {
      console.error("paystack-webhook: history insert failed:", JSON.stringify(historyErr));
    } else {
      console.log("paystack-webhook: recorded subscription_history for learner", learnerId);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("paystack-webhook error:", err);
    // Return 200 to prevent Paystack retry storms.
    return new Response("OK", { status: 200 });
  }
});

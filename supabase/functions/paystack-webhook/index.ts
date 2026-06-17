// Supabase Edge Function: paystack-webhook
//
// Receives Paystack charge.success webhooks (JSON, HMAC-SHA512 signed)
// and activates the learner's subscription plan.
//
// DEPLOY WITHOUT JWT VERIFICATION:
//   supabase functions deploy paystack-webhook --no-verify-jwt
//
// SET SECRETS BEFORE DEPLOYING:
//   supabase secrets set PAYSTACK_TEST_SECRET=sk_test_a51aa1055986a6f82f5079095c4353d6c9e9f30d
//   supabase secrets set PAYSTACK_TEST_PUBLIC=pk_test_243ec9c224153ee5679f251dba0f8459772525a1
//
// PAYSTACK DASHBOARD (manual):
//   Settings → API Keys & Webhooks → Webhook URL:
//   https://xekmcqzsqifcqpmjycct.supabase.co/functions/v1/paystack-webhook
//   Events: charge.success
//
// Flow:
//   1. Verify HMAC-SHA512 x-paystack-signature header.
//   2. Check event.data.status === "success".
//   3. Parse reference LEURO-{user_id}-{timestamp} → user_id.
//   4. Determine tier from amount in kobo:
//        ≤9900 = basic | >9900 = premium
//   5. UPDATE profiles.subscription_tier.
//   6. If amount < full price (9900/19900 kobo) → INSERT subscription_discounts.
//   7. INSERT subscription_history.
//   8. Always return 200 OK (Paystack retries on non-2xx).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Full prices in kobo (smallest ZAR unit, 1 kobo = R0.01)
const FULL_PRICE_KOBO = { basic: 9900, premium: 19900 } as const;

function tierFromKobo(amountKobo: number): "basic" | "premium" {
  return amountKobo <= 9900 ? "basic" : "premium";
}

// Extract UUID user_id from LEURO-{uuid}-{timestamp} by stripping the prefix
// and dropping the trailing "-{timestamp}" segment (split on last dash).
function extractUserId(reference: string): string | null {
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

    const userId = extractUserId(reference);
    if (!userId) {
      console.error("paystack-webhook: unrecognised reference:", reference);
      return new Response("OK", { status: 200 });
    }

    const tier = tierFromKobo(amountKobo);
    const fullPriceKobo = FULL_PRICE_KOBO[tier];

    // Read current profile (tier_from for history, referral_code_used for discounts).
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, referral_code_used")
      .eq("id", userId)
      .single();
    const tierFrom = profile?.subscription_tier ?? null;

    // 1) Activate the new tier.
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ subscription_tier: tier })
      .eq("id", userId);
    if (updateErr) {
      console.error("paystack-webhook: tier update failed:", JSON.stringify(updateErr));
      return new Response("OK", { status: 200 });
    }
    console.log(`paystack-webhook: set ${userId} → ${tier}`);

    // 2) Record discount when amount is below the full tier price.
    const discountKobo = fullPriceKobo - amountKobo;
    if (discountKobo > 0) {
      const discountRand = discountKobo / 100;
      const { error: discountErr } = await supabase
        .from("subscription_discounts")
        .insert({
          user_id: userId,
          code: profile?.referral_code_used ?? "REFERRAL",
          discount_amount: discountRand,
        });
      if (discountErr) {
        console.error("paystack-webhook: discount insert failed:", JSON.stringify(discountErr));
      } else {
        console.log(`paystack-webhook: recorded discount R${discountRand} for ${userId}`);
      }
    }

    // 3) Record the subscription event.
    const { error: historyErr } = await supabase
      .from("subscription_history")
      .insert({
        user_id: userId,
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
      console.log("paystack-webhook: recorded subscription_history for", userId);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("paystack-webhook error:", err);
    // Return 200 to prevent Paystack retry storms.
    return new Response("OK", { status: 200 });
  }
});

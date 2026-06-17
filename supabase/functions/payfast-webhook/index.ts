// Supabase Edge Function: payfast-webhook
//
// Receives PayFast IPN (Instant Payment Notification) POSTs for recurring
// subscription payments and activates / records the learner's plan.
//
// PayFast posts as application/x-www-form-urlencoded and WITHOUT a JWT, so
// this function MUST be deployed with JWT verification turned OFF
// (supabase functions deploy payfast-webhook --no-verify-jwt, or toggle
// "Enforce JWT Verification" off in the dashboard).
//
// DB access uses the Supabase JS client created with the service role key,
// which bypasses Row Level Security (this avoids the 403 seen when updating
// profiles via the raw REST endpoint).
//
// Flow:
//   1. Parse the IPN form body with URLSearchParams.
//   2. Read m_payment_id (LEURO-{uuid}-{timestamp}) -> user_id.
//   3. Read item_name -> tier ('premium' if it contains "remium", else 'basic').
//   4. Update profiles.subscription_tier for that user.
//   5. Insert a row to subscription_history.
//   6. Always return 200 OK so PayFast does not retry-storm us.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Extract the learner's user_id (a UUID, which itself contains hyphens) from
// an m_payment_id of the form "LEURO-{uuid}-{timestamp}". Strip the prefix,
// then drop the trailing "-{timestamp}" segment by splitting on the LAST dash.
function extractUserId(mPaymentId: string): string | null {
  if (!mPaymentId) return null;
  const withoutPrefix = mPaymentId.replace(/^LEURO-/, "");
  const lastDash = withoutPrefix.lastIndexOf("-");
  if (lastDash <= 0) return null;
  return withoutPrefix.slice(0, lastDash);
}

// Map the PayFast item_name to a subscription tier. "remium" matches both
// "Premium" and "premium" without needing a case fold.
function tierFromItemName(itemName: string): "premium" | "basic" {
  return (itemName || "").includes("remium") ? "premium" : "basic";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // PayFast retries on any non-2xx response, so on soft failures we log loudly
  // and still return 200.
  try {
    if (req.method !== "POST") {
      console.error("payfast-webhook: bad method:", req.method);
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    // PayFast posts application/x-www-form-urlencoded.
    const raw = await req.text();
    const params = new URLSearchParams(raw);
    const data: Record<string, string> = {};
    for (const [key, value] of params.entries()) data[key] = value;
    console.log("payfast-webhook: received IPN:", JSON.stringify(data));

    const mPaymentId = data["m_payment_id"] || "";
    const itemName = data["item_name"] || "";
    const paymentStatus = data["payment_status"] || "";
    const amountGross =
      data["amount_gross"] || data["recurring_amount"] || data["amount"] || null;
    const pfPaymentId = data["pf_payment_id"] || mPaymentId || null;

    // Only act on completed payments. Anything else (e.g. CANCELLED) is
    // acknowledged but not applied.
    if (paymentStatus && paymentStatus.toUpperCase() !== "COMPLETE") {
      console.log("payfast-webhook: ignoring non-complete status:", paymentStatus);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const userId = extractUserId(mPaymentId);
    if (!userId) {
      console.error("payfast-webhook: bad m_payment_id:", mPaymentId);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
    const tier = tierFromItemName(itemName);

    // Read the current tier first (for history's tier_from).
    let tierFrom: string | null = null;
    const { data: existing, error: readErr } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();
    if (readErr) {
      console.error("payfast-webhook: profile read failed:", JSON.stringify(readErr));
    } else {
      tierFrom = existing?.subscription_tier ?? null;
    }

    // 1) Activate the new tier.
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ subscription_tier: tier })
      .eq("id", userId);
    if (updateErr) {
      console.error("payfast-webhook: tier update failed:", JSON.stringify(updateErr));
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
    console.log(`payfast-webhook: set ${userId} -> ${tier}`);

    // 2) If user signed up with a referral code, record the discount applied.
    if (amountGross !== null) {
      const { data: profileFull } = await supabase
        .from("profiles")
        .select("referral_code_used")
        .eq("id", userId)
        .single();
      if (profileFull?.referral_code_used) {
        const baseAmount = tier === "premium" ? 199 : 99;
        const paidAmount = Number(amountGross);
        const discountAmount = Math.max(0, baseAmount - paidAmount);
        if (discountAmount > 0) {
          const { error: discountErr } = await supabase
            .from("subscription_discounts")
            .insert({
              user_id: userId,
              code: profileFull.referral_code_used,
              discount_amount: discountAmount,
            });
          if (discountErr) {
            console.error("payfast-webhook: discount insert failed:", JSON.stringify(discountErr));
          } else {
            console.log(`payfast-webhook: recorded discount R${discountAmount} for ${userId}`);
          }
        }
      }
    }

    // 3) Record the subscription event.
    const historyRow = {
      user_id: userId,
      tier_from: tierFrom,
      tier_to: tier,
      amount_paid: amountGross !== null ? Number(amountGross) : null,
      currency: "ZAR",
      payment_ref: pfPaymentId,
      source: "payfast",
    };
    const { error: historyErr } = await supabase
      .from("subscription_history")
      .insert(historyRow);
    if (historyErr) {
      // Tier is already updated; don't fail the webhook over history logging.
      console.error("payfast-webhook: history insert failed:", JSON.stringify(historyErr));
    } else {
      console.log("payfast-webhook: recorded subscription_history for", userId);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("payfast-webhook error:", err);
    // Return 200 to stop PayFast retry storms; the error is logged above.
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});

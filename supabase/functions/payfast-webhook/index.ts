// Supabase Edge Function: payfast-webhook
//
// Receives PayFast IPN (Instant Payment Notification) POSTs for recurring
// subscription payments and activates / records the learner's plan.
//
// PayFast posts as application/x-www-form-urlencoded and WITHOUT a JWT, so
// this function must be deployed with JWT verification turned OFF
// (supabase functions deploy payfast-webhook --no-verify-jwt).
//
// STANDALONE: no shared imports - everything is inlined so this file can be
// pasted directly into the Supabase dashboard editor.
//
// Authorization comes from the service role key, which bypasses RLS so the
// function can update any learner's profile / insert subscription history.
//
// Flow:
//   1. Parse the IPN form body.
//   2. Read m_payment_id (format: LEURO-{userId}-{timestamp}) -> user_id.
//   3. Read item_name ("Leuro Basic Monthly" / "Leuro Premium Monthly") -> tier.
//   4. Update profiles.subscription_tier for that user.
//   5. Insert a subscription_history row.
//   6. Always return 200 OK so PayFast does not keep retrying.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Extract the learner's user_id (a UUID, which itself contains hyphens) from
// an m_payment_id of the form "LEURO-{uuid}-{timestamp}". We strip the prefix
// and then drop the trailing "-{timestamp}" segment.
function extractUserId(mPaymentId: string): string | null {
  if (!mPaymentId) return null;
  const withoutPrefix = mPaymentId.replace(/^LEURO-/, "");
  const lastDash = withoutPrefix.lastIndexOf("-");
  if (lastDash <= 0) return null;
  return withoutPrefix.slice(0, lastDash);
}

// Map the PayFast item_name to a subscription tier.
function tierFromItemName(itemName: string): "basic" | "premium" | null {
  const name = (itemName || "").toLowerCase();
  if (name.includes("premium")) return "premium";
  if (name.includes("basic")) return "basic";
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // PayFast retries on non-2xx, so we return 200 even for soft failures and
  // log loudly instead.
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
    const amountGross = data["amount_gross"] || data["recurring_amount"] || data["amount"] || null;
    const pfPaymentId = data["pf_payment_id"] || mPaymentId || null;

    // Only act on completed payments. Other statuses (e.g. CANCELLED) are
    // acknowledged but not applied.
    if (paymentStatus && paymentStatus.toUpperCase() !== "COMPLETE") {
      console.log("payfast-webhook: ignoring non-complete status:", paymentStatus);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const userId = extractUserId(mPaymentId);
    const tier = tierFromItemName(itemName);

    if (!userId) {
      console.error("payfast-webhook: could not extract user_id from m_payment_id:", mPaymentId);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
    if (!tier) {
      console.error("payfast-webhook: could not determine tier from item_name:", itemName);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read the current tier first so we can record tier_from in the history.
    const { data: existing, error: readErr } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();
    if (readErr) {
      console.error("payfast-webhook: failed to read profile:", JSON.stringify(readErr));
    }
    const tierFrom = existing?.subscription_tier || null;

    // 1) Activate the new tier.
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ subscription_tier: tier })
      .eq("id", userId);
    if (updateErr) {
      console.error("payfast-webhook: failed to update tier:", JSON.stringify(updateErr));
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
    console.log(`payfast-webhook: set ${userId} -> ${tier}`);

    // 2) Record the subscription event.
    const historyRow = {
      user_id: userId,
      tier_from: tierFrom,
      tier_to: tier,
      amount_paid: amountGross ? Number(amountGross) : null,
      currency: "ZAR",
      payment_ref: pfPaymentId,
      source: "payfast",
    };
    const { error: historyErr } = await supabase
      .from("subscription_history")
      .insert(historyRow);
    if (historyErr) {
      console.error("payfast-webhook: failed to insert history:", JSON.stringify(historyErr));
      // Tier is already updated; don't fail the webhook over history logging.
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

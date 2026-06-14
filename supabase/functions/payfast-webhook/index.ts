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
// STANDALONE: no shared imports and no SDK. All Supabase access is done with
// plain Deno fetch() calls against the PostgREST REST API, authorized with
// the service role key (which bypasses RLS). This keeps the file copy-paste
// deployable straight into the Supabase dashboard editor.
//
// Flow:
//   1. Parse the IPN form body with URLSearchParams.
//   2. Read m_payment_id (LEURO-{uuid}-{timestamp}) -> user_id.
//   3. Read item_name -> tier ('premium' if it contains "remium", else 'basic').
//   4. PATCH profiles.subscription_tier for that user.
//   5. POST a row to subscription_history.
//   6. Always return 200 OK so PayFast does not retry-storm us.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Headers for every PostgREST request. The service role key is sent both as
// apikey and as the Bearer token so it bypasses Row Level Security.
function restHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

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

    // Read the current tier first (for history's tier_from) via REST.
    let tierFrom: string | null = null;
    try {
      const readRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=subscription_tier`,
        { headers: restHeaders() },
      );
      if (readRes.ok) {
        const rows = await readRes.json();
        tierFrom = Array.isArray(rows) && rows[0] ? rows[0].subscription_tier ?? null : null;
      } else {
        console.error("payfast-webhook: profile read failed:", readRes.status, await readRes.text());
      }
    } catch (e) {
      console.error("payfast-webhook: profile read error:", e);
    }

    // 1) Activate the new tier (PATCH profiles).
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: "PATCH",
        headers: restHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify({ subscription_tier: tier }),
      },
    );
    if (!updateRes.ok) {
      console.error("payfast-webhook: tier update failed:", updateRes.status, await updateRes.text());
      return new Response("OK", { status: 200, headers: corsHeaders });
    }
    console.log(`payfast-webhook: set ${userId} -> ${tier}`);

    // 2) Record the subscription event (POST subscription_history).
    const historyRow = {
      user_id: userId,
      tier_from: tierFrom,
      tier_to: tier,
      amount_paid: amountGross !== null ? Number(amountGross) : null,
      currency: "ZAR",
      payment_ref: pfPaymentId,
      source: "payfast",
    };
    const historyRes = await fetch(`${SUPABASE_URL}/rest/v1/subscription_history`, {
      method: "POST",
      headers: restHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify(historyRow),
    });
    if (!historyRes.ok) {
      // Tier is already updated; don't fail the webhook over history logging.
      console.error("payfast-webhook: history insert failed:", historyRes.status, await historyRes.text());
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

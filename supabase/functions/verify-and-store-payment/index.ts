// Supabase Edge Function: verify-and-store-payment
// (self-contained, no _shared imports)
// DEPLOY: supabase functions deploy verify-and-store-payment --no-verify-jwt
// SECRETS: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, PAYSTACK_TEST_SECRET
//
// Path B recurring billing — server-side confirmation + token-capture step.
// Called by the client right after the Paystack popup reports success. Independently
// re-verifies the transaction with Paystack (never trusts the client-reported result),
// captures the reusable authorization_code/customer_code for future off-session
// charges, and activates the learner's tier.
//
// Reference format: LEURO-{learner_id}-{timestamp}
//   learner_id is the UUID from the learners table (NOT the parent user_id).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const FULL_PRICE_KOBO = { basic: 9900, premium: 19900 } as const;

function tierFromKobo(amountKobo: number): "basic" | "premium" {
  return amountKobo <= FULL_PRICE_KOBO.basic ? "basic" : "premium";
}

// UUIDs contain dashes internally, but the trailing timestamp does not, so the
// last dash in the stripped string is always the uuid/timestamp separator.
function extractLearnerId(reference: string): string | null {
  if (!reference) return null;
  const withoutPrefix = reference.replace(/^LEURO-/, "");
  const lastDash = withoutPrefix.lastIndexOf("-");
  if (lastDash <= 0) return null;
  return withoutPrefix.slice(0, lastDash).trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonRes({ success: false, reason: "method_not_allowed" }, 405);

  return await (async () => {
    const supabaseUrl   = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey       = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const paystackSecret = Deno.env.get("PAYSTACK_TEST_SECRET") ?? "";

    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error("verify-and-store-payment: missing required env vars");
      return jsonRes({ success: false, reason: "server_error" }, 200);
    }

    // 1. Verify caller JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return jsonRes({ success: false, reason: "unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user: caller }, error: jwtErr } = await userClient.auth.getUser();
    if (jwtErr || !caller) {
      console.warn("verify-and-store-payment: invalid JWT:", jwtErr?.message);
      return jsonRes({ success: false, reason: "unauthorized" }, 401);
    }

    const callerId = caller.id;

    // 2. Parse body
    let body: { reference?: unknown };
    try { body = await req.json(); } catch { return jsonRes({ success: false, reason: "invalid_json" }, 200); }

    const reference = String(body.reference ?? "").trim();
    if (!reference) return jsonRes({ success: false, reason: "missing_reference" }, 200);

    const admin = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 3. Verify the transaction with Paystack — never trust the client.
    let paystackData: any;
    try {
      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${paystackSecret}` },
      });
      paystackData = await verifyRes.json();
    } catch (e) {
      console.error("verify-and-store-payment: Paystack verify fetch threw:", e);
      return jsonRes({ success: false, reason: "server_error" }, 200);
    }

    const txn = paystackData?.data;
    if (!txn || txn.status !== "success") {
      console.log("verify-and-store-payment: not successful, reference:", reference, "status:", txn?.status);
      return jsonRes({ success: false, reason: "not_successful" }, 200);
    }

    const authorizationCode = txn.authorization?.authorization_code ?? null;
    const customerCode = txn.customer?.customer_code ?? null;
    const cardLast4 = txn.authorization?.last4 ?? null;
    const cardBrand = txn.authorization?.brand ?? null;
    const amountKobo: number = Number(txn.amount ?? 0);

    // 4. Parse learner id from reference.
    const learnerId = extractLearnerId(reference);
    if (!learnerId) {
      console.error("verify-and-store-payment: unrecognised reference:", reference);
      return jsonRes({ success: false, reason: "invalid_reference" }, 200);
    }

    // 5. Security check — confirm the learner row exists AND the caller owns it.
    // Select-then-update (not update-and-hope): a learner row must be confirmed
    // to exist before we ever report success, since a mismatched/garbage id in
    // the reference (e.g. a user_id instead of a learners.id) must never be
    // allowed to silently no-op into a false "success".
    const { data: learner, error: learnerErr } = await admin
      .from("learners")
      .select("id, user_id, subscription_tier")
      .eq("id", learnerId)
      .single();

    if (learnerErr || !learner) {
      console.error("verify-and-store-payment: learner lookup failed:", learnerErr?.message, "id:", learnerId);
      return jsonRes({ success: false, reason: "learner_not_found" }, 200);
    }

    if (learner.user_id !== callerId) {
      console.warn("verify-and-store-payment: caller", callerId, "does not own learner", learnerId);
      return jsonRes({ success: false, reason: "learner_not_found" }, 403);
    }

    const tierFrom = learner.subscription_tier ?? null;
    const tier = tierFromKobo(amountKobo);
    const now = new Date();
    const nextPaymentDate = new Date(now);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    const nowIso = now.toISOString();
    const nextPaymentIso = nextPaymentDate.toISOString();

    // 6. Writes (service role).
    const { error: tokenErr } = await admin
      .from("billing_tokens")
      .upsert({
        learner_id: learnerId,
        paystack_customer_code: customerCode,
        authorization_code: authorizationCode,
        card_last4: cardLast4,
        card_brand: cardBrand,
        updated_at: nowIso,
      }, { onConflict: "learner_id" });

    if (tokenErr) {
      console.error("verify-and-store-payment: billing_tokens upsert failed:", tokenErr.message);
      return jsonRes({ success: false, reason: "server_error" }, 200);
    }

    // .select() on the update forces PostgREST to return the rows it actually
    // touched — if the row vanished between the lookup above and this write
    // (or the id was somehow wrong despite the lookup), we get an empty array
    // back rather than silently reporting success with nothing written.
    const { data: updatedLearners, error: learnerUpdateErr } = await admin
      .from("learners")
      .update({
        subscription_tier: tier,
        subscription_status: "active",
        next_payment_date: nextPaymentIso,
        last_charge_at: nowIso,
      })
      .eq("id", learnerId)
      .select("id");

    if (learnerUpdateErr) {
      console.error("verify-and-store-payment: learners update failed:", learnerUpdateErr.message);
      return jsonRes({ success: false, reason: "server_error" }, 200);
    }

    if (!updatedLearners || updatedLearners.length === 0) {
      console.error("verify-and-store-payment: learners update affected 0 rows for id:", learnerId);
      return jsonRes({ success: false, reason: "learner_not_found" }, 200);
    }

    const { error: historyErr } = await admin
      .from("subscription_history")
      .insert({
        user_id: learner.user_id,
        learner_id: learnerId,
        tier_from: tierFrom,
        tier_to: tier,
        amount_paid: amountKobo / 100,
        currency: "ZAR",
        payment_ref: reference,
        source: "paystack",
      });

    if (historyErr) {
      console.error("verify-and-store-payment: subscription_history insert failed:", historyErr.message);
    }

    console.log("verify-and-store-payment: success, learner:", learnerId, "tier:", tier);

    return jsonRes({
      success: true,
      tier,
      card_last4: cardLast4,
      card_brand: cardBrand,
      next_payment_date: nextPaymentIso,
    }, 200);

  })().catch((e: unknown) => {
    const eMsg = e instanceof Error ? `${e.message} | stack: ${e.stack ?? "none"}` : String(e);
    console.error("verify-and-store-payment: UNHANDLED EXCEPTION:", eMsg);
    return jsonRes({ success: false, reason: "server_error" }, 200);
  });
});

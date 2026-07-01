// Supabase Edge Function: cancel-child-subscription
// (self-contained, no _shared imports)
// DEPLOY: supabase functions deploy cancel-child-subscription --no-verify-jwt
// SECRETS: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, PAYSTACK_TEST_SECRET
//
// Parent-triggered cancellation for a child's native Paystack subscription.
// This function only TRIGGERS the cancellation at Paystack — it never writes
// subscription_status/subscription_tier itself. The subscription.disable
// webhook (already fixed to look up by paystack_customer_code first) is the
// authoritative writer once Paystack actually confirms the cancellation.
//
// Expected request:
//   POST /functions/v1/cancel-child-subscription
//   Authorization: Bearer <parent JWT>
//   Content-Type: application/json
//   { "learnerId": "<uuid>" }
//
// Responses (all 200 unless noted):
//   { success: true, message: "..." }
//   { success: false, reason: "no_active_subscription" }               — no paystack_customer_code stored yet
//   { success: false, reason: "no_active_subscription_found_at_paystack" } — Paystack has no active sub for this customer
//   { success: false, reason: "paystack_disable_failed", detail }      — Paystack's disable call itself failed
//   { success: false, reason: "missing_learner_id" }
//   { success: false, reason: "learner_not_found" }
//   { success: false, reason: "server_error" }                         — unexpected error, logged server-side
//   401  { success: false, reason: "unauthorized" }
//   403  { success: false, reason: "forbidden" }
//   405  { success: false, reason: "method_not_allowed" }

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

type PaystackSubscription = {
  subscription_code?: string;
  email_token?: string;
  status?: string;
  createdAt?: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonRes({ success: false, reason: "method_not_allowed" }, 405);

  return await (async () => {
    const supabaseUrl    = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey        = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const paystackSecret = Deno.env.get("PAYSTACK_TEST_SECRET") ?? "";

    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error("cancel-child-subscription: missing required env vars");
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
      console.warn("cancel-child-subscription: invalid JWT:", jwtErr?.message);
      return jsonRes({ success: false, reason: "unauthorized" }, 401);
    }

    const callerId = caller.id;

    // Service role client — both Authorization AND apikey set explicitly to the
    // service role key so PostgREST always resolves service_role and bypasses RLS.
    const admin = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Confirm the caller's profile role is 'parent'.
    const { data: callerProfile, error: profileErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", callerId)
      .single();

    if (profileErr || !callerProfile) {
      console.error("cancel-child-subscription: profile lookup failed for caller", callerId, profileErr?.message);
      return jsonRes({ success: false, reason: "unauthorized" }, 401);
    }

    if (callerProfile.role !== "parent") {
      console.warn("cancel-child-subscription: caller is not a parent:", callerId, "role:", callerProfile.role);
      return jsonRes({ success: false, reason: "forbidden" }, 403);
    }

    // 2. Parse body
    let body: { learnerId?: unknown };
    try { body = await req.json(); } catch { return jsonRes({ success: false, reason: "invalid_json" }, 200); }

    const learnerId = String(body.learnerId ?? "").trim();
    if (!learnerId) return jsonRes({ success: false, reason: "missing_learner_id" }, 200);

    // 3. Ownership check — confirm this learner is actually linked to the caller.
    const { data: parentRecord, error: parentErr } = await admin
      .from("parents")
      .select("linked_learners")
      .eq("user_id", callerId)
      .single();

    if (parentErr || !parentRecord) {
      console.error("cancel-child-subscription: parent record not found for user", callerId, parentErr?.message);
      return jsonRes({ success: false, reason: "forbidden" }, 403);
    }

    const linkedLearners: string[] = parentRecord.linked_learners ?? [];
    if (!linkedLearners.includes(learnerId)) {
      console.warn("cancel-child-subscription: caller", callerId, "does not own learner", learnerId);
      return jsonRes({ success: false, reason: "forbidden" }, 403);
    }

    // 4. Fetch the learner's stored subscription anchor.
    const { data: learner, error: learnerErr } = await admin
      .from("learners")
      .select("id, subscription_status, paystack_customer_code, subscription_tier")
      .eq("id", learnerId)
      .single();

    if (learnerErr || !learner) {
      console.error("cancel-child-subscription: learner lookup failed:", learnerErr?.message, "id:", learnerId);
      return jsonRes({ success: false, reason: "learner_not_found" }, 200);
    }

    if (!learner.paystack_customer_code) {
      console.log("cancel-child-subscription: learner", learnerId, "has no paystack_customer_code — nothing to cancel");
      return jsonRes({ success: false, reason: "no_active_subscription" }, 200);
    }

    // 5. Look up the customer's subscriptions at Paystack — never trust local
    // state alone for which subscription_code/email_token to disable.
    const listRes = await fetch(
      `https://api.paystack.co/subscription?customer=${encodeURIComponent(learner.paystack_customer_code)}`,
      { method: "GET", headers: { Authorization: `Bearer ${paystackSecret}` } },
    );
    const listBody = await listRes.json();
    const subscriptions: PaystackSubscription[] = Array.isArray(listBody?.data) ? listBody.data : [];

    const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
    activeSubscriptions.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    const activeSubscription = activeSubscriptions[0];

    if (!activeSubscription?.subscription_code || !activeSubscription?.email_token) {
      console.error(
        "cancel-child-subscription: no active subscription found at Paystack for customer_code:",
        learner.paystack_customer_code, "| raw list:", JSON.stringify(listBody),
      );
      return jsonRes({ success: false, reason: "no_active_subscription_found_at_paystack" }, 200);
    }

    // 6. Disable the subscription at Paystack. The learner's own tier/status
    // rows are NOT touched here — subscription.disable will land on the
    // webhook shortly after and is the single authoritative writer.
    const disableRes = await fetch("https://api.paystack.co/subscription/disable", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: activeSubscription.subscription_code,
        token: activeSubscription.email_token,
      }),
    });
    const disableBody = await disableRes.json();

    if (disableBody?.status === true) {
      console.log("cancel-child-subscription: disabled subscription", activeSubscription.subscription_code, "for learner", learnerId);
      return jsonRes({
        success: true,
        message: "Subscription cancelled — access continues until the current billing period ends.",
      }, 200);
    }

    console.error(
      "cancel-child-subscription: Paystack disable failed for learner", learnerId,
      "| subscription_code:", activeSubscription.subscription_code,
      "| response:", JSON.stringify(disableBody),
    );
    return jsonRes({
      success: false,
      reason: "paystack_disable_failed",
      detail: disableBody?.message ?? null,
    }, 200);

  })().catch((e: unknown) => {
    const eMsg = e instanceof Error ? `${e.message} | stack: ${e.stack ?? "none"}` : String(e);
    console.error("cancel-child-subscription: UNHANDLED EXCEPTION:", eMsg);
    return jsonRes({ success: false, reason: "server_error" }, 200);
  });
});

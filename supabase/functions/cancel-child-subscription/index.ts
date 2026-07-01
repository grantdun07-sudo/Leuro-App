// Supabase Edge Function: cancel-child-subscription
// (self-contained, no _shared imports)
// DEPLOY: paste via Supabase dashboard — Verify JWT must be ON (this function
// relies on auth.getUser() to identify the calling parent; do NOT disable JWT
// verification for this function).
// SECRETS: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, PAYSTACK_TEST_SECRET
//
// Parent-triggered cancellation for a child's native Paystack subscription.
// This function only TRIGGERS the cancellation at Paystack — it never writes
// subscription_status/subscription_tier itself. The subscription.disable
// webhook (already fixed to look up by paystack_customer_code first) is the
// authoritative writer once Paystack actually confirms the cancellation.
//
// IMPORTANT — why subscription_code, not just customer_code:
//   Paystack deduplicates customers by email. Since every one of a parent's
//   children subscribes using the PARENT's email, ALL of a parent's children
//   share the exact same Paystack customer_code and numeric customer id.
//   customer_code/numeric id therefore cannot tell us which of a parent's
//   several paid children' subscription we're looking at — only
//   subscription_code (captured per-learner by the paystack-webhook's
//   charge.success handler) is unique per learner. This function ALWAYS
//   prefers the learner's own stored subscription_code when present (a
//   single direct GET /subscription/{code} call, no ambiguity possible).
//   Only when subscription_code is null does it fall back to listing the
//   shared customer's subscriptions and filtering by plan_code + excluding
//   any subscription_code already claimed by a sibling learner row — the
//   same exclusion logic used when paystack-webhook claims a subscription_code
//   on the initial charge. The path actually used is reported back in the
//   response (`path`) for debugging.
//
// Expected request:
//   POST /functions/v1/cancel-child-subscription
//   Authorization: Bearer <parent JWT>
//   Content-Type: application/json
//   { "learnerId": "<uuid>" }
//
// Responses (all 200 unless noted). `path` is included whenever a Paystack
// lookup was attempted — "subscription_code_direct" or "customer_lookup_fallback".
//   { success: true, message: "...", path }
//   { success: false, reason: "no_active_subscription" }               — no paystack_customer_code stored yet
//   { success: false, reason: "no_active_subscription_found_at_paystack", path } — Paystack has no active/unclaimed sub for this learner
//   { success: false, reason: "paystack_disable_failed", detail, path } — Paystack's disable call itself failed
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
  plan?: { plan_code?: string };
};

type LearnerClaim = { id: string; subscription_code: string | null };

// Reverse of paystack-webhook's PLAN_TIER_MAP — used only for the fallback
// path, to filter the shared customer's subscription list down to the plan
// matching this learner's current tier.
const TIER_PLAN_MAP: Record<string, string> = {
  basic: "PLN_x2bz5sdsky99bk5",
  premium: "PLN_gmx6yhgo5ikqg64",
};

// Returns every learner claiming any of these subscription_codes — used to
// exclude candidates already claimed by a DIFFERENT (sibling) learner row,
// same exclusion logic as paystack-webhook's initial-claim step.
async function findLearnersBySubscriptionCodes(
  admin: ReturnType<typeof createClient>,
  subscriptionCodes: string[],
): Promise<LearnerClaim[]> {
  if (subscriptionCodes.length === 0) return [];
  const { data, error } = await admin
    .from("learners")
    .select("id, subscription_code")
    .in("subscription_code", subscriptionCodes);
  if (error || !data) return [];
  return data as LearnerClaim[];
}

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
      .select("id, subscription_status, paystack_customer_code, subscription_tier, subscription_code")
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

    // 5. Resolve which Paystack subscription_code + email_token to disable.
    // ALWAYS prefer the learner's own stored subscription_code — the only
    // unambiguous key, since paystack_customer_code is shared across every
    // one of a parent's children. Only fall back to listing the shared
    // customer's subscriptions (filtered by plan + sibling-exclusion) when
    // this learner has no subscription_code recorded yet.
    let subscriptionCode: string | null = null;
    let emailToken: string | null = null;
    let pathUsed: "subscription_code_direct" | "customer_lookup_fallback";

    if (learner.subscription_code) {
      pathUsed = "subscription_code_direct";

      const subRes = await fetch(
        `https://api.paystack.co/subscription/${encodeURIComponent(learner.subscription_code)}`,
        { method: "GET", headers: { Authorization: `Bearer ${paystackSecret}` } },
      );
      const subBody = await subRes.json();
      subscriptionCode = (subBody?.data?.subscription_code as string) ?? null;
      emailToken = (subBody?.data?.email_token as string) ?? null;

      if (!subscriptionCode || !emailToken) {
        console.error(
          "cancel-child-subscription: direct subscription_code lookup failed for learner", learnerId,
          "| subscription_code:", learner.subscription_code, "| raw response:", JSON.stringify(subBody),
        );
        return jsonRes({ success: false, reason: "no_active_subscription_found_at_paystack", path: pathUsed }, 200);
      }
    } else {
      pathUsed = "customer_lookup_fallback";

      const planCode = TIER_PLAN_MAP[learner.subscription_tier ?? ""] ?? null;
      if (!planCode) {
        console.error(
          "cancel-child-subscription: learner", learnerId,
          "has no subscription_code and an unrecognised/missing tier for plan matching:", learner.subscription_tier,
        );
        return jsonRes({ success: false, reason: "no_active_subscription_found_at_paystack", path: pathUsed }, 200);
      }

      // Resolve the numeric customer id — Paystack's subscription-list
      // endpoint requires the numeric id, not the CUS_xxx code string we
      // have stored.
      const customerRes = await fetch(
        `https://api.paystack.co/customer/${encodeURIComponent(learner.paystack_customer_code)}`,
        { method: "GET", headers: { Authorization: `Bearer ${paystackSecret}` } },
      );
      const customerBody = await customerRes.json();
      const numericCustomerId = typeof customerBody?.data?.id === "number" ? customerBody.data.id : null;

      if (numericCustomerId == null) {
        console.error(
          "cancel-child-subscription: could not resolve numeric customer id for customer_code:",
          learner.paystack_customer_code, "| raw response:", JSON.stringify(customerBody),
        );
        return jsonRes({ success: false, reason: "no_active_subscription_found_at_paystack", path: pathUsed }, 200);
      }

      const listRes = await fetch(
        `https://api.paystack.co/subscription?customer=${numericCustomerId}`,
        { method: "GET", headers: { Authorization: `Bearer ${paystackSecret}` } },
      );
      const listBody = await listRes.json();
      const subscriptions: PaystackSubscription[] = Array.isArray(listBody?.data) ? listBody.data : [];

      const candidates = subscriptions.filter((s) => s.status === "active" && s.plan?.plan_code === planCode);
      if (candidates.length === 0) {
        console.error(
          "cancel-child-subscription: no active subscription matching plan", planCode,
          "found at Paystack for customer", numericCustomerId, "| raw list:", JSON.stringify(listBody),
        );
        return jsonRes({ success: false, reason: "no_active_subscription_found_at_paystack", path: pathUsed }, 200);
      }

      const candidateCodes = candidates.map((c) => c.subscription_code).filter((c): c is string => !!c);
      const claims = await findLearnersBySubscriptionCodes(admin, candidateCodes);
      const claimedByOthers = new Set(
        claims.filter((l) => l.id !== learnerId && l.subscription_code).map((l) => l.subscription_code as string),
      );

      const unclaimed = candidates.filter((c) => c.subscription_code && !claimedByOthers.has(c.subscription_code));
      if (unclaimed.length === 0) {
        console.error(
          "cancel-child-subscription: all", candidates.length, "candidate subscription(s) for customer", numericCustomerId,
          "plan", planCode, "are already claimed by sibling learners — cannot identify learner", learnerId, "'s own subscription",
        );
        return jsonRes({ success: false, reason: "no_active_subscription_found_at_paystack", path: pathUsed }, 200);
      }

      unclaimed.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      const chosen = unclaimed[0];
      subscriptionCode = chosen.subscription_code ?? null;
      emailToken = chosen.email_token ?? null;

      if (!subscriptionCode || !emailToken) {
        console.error(
          "cancel-child-subscription: resolved candidate missing subscription_code/email_token for learner", learnerId,
        );
        return jsonRes({ success: false, reason: "no_active_subscription_found_at_paystack", path: pathUsed }, 200);
      }
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
        code: subscriptionCode,
        token: emailToken,
      }),
    });
    const disableBody = await disableRes.json();

    if (disableBody?.status === true) {
      console.log(
        "cancel-child-subscription: disabled subscription", subscriptionCode, "for learner", learnerId,
        "| path:", pathUsed,
      );
      return jsonRes({
        success: true,
        message: "Subscription cancelled — access continues until the current billing period ends.",
        path: pathUsed,
      }, 200);
    }

    console.error(
      "cancel-child-subscription: Paystack disable failed for learner", learnerId,
      "| subscription_code:", subscriptionCode, "| path:", pathUsed,
      "| response:", JSON.stringify(disableBody),
    );
    return jsonRes({
      success: false,
      reason: "paystack_disable_failed",
      detail: disableBody?.message ?? null,
      path: pathUsed,
    }, 200);

  })().catch((e: unknown) => {
    const eMsg = e instanceof Error ? `${e.message} | stack: ${e.stack ?? "none"}` : String(e);
    console.error("cancel-child-subscription: UNHANDLED EXCEPTION:", eMsg);
    return jsonRes({ success: false, reason: "server_error" }, 200);
  });
});

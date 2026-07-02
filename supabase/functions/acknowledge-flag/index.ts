// Supabase Edge Function: acknowledge-flag
// (self-contained, no _shared imports)
// DEPLOY: paste via Supabase dashboard — Verify JWT must be ON (this function
// relies on auth.getUser() to identify the calling PARENT; do NOT disable
// JWT verification for this function).
// SECRETS: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//
// *** SECURITY FIX ***
// This endpoint used to be fully public/unauthenticated, keyed on a bare
// content_flags.id passed as "token". That id was returned directly in
// save-content-flag's response to whichever client called it — which, for
// every real safety flag, is the FLAGGED LEARNER's own browser (visible in
// their own network response / console log). That meant a learner whose
// account got frozen for self-harm/crisis language could read their own
// flag id and self-reactivate their own account via the old public
// /acknowledge?token=<id> link, with zero parent involvement — completely
// bypassing the human-in-the-loop review the freeze exists to require.
//
// Now requires:
//   1. A valid parent JWT (auth.getUser()).
//   2. profiles.role === 'parent'.
//   3. The target learner must be present in the caller's OWN
//      parents.linked_learners array — a parent can only acknowledge flags
//      for their own linked children, never an arbitrary learner id.
// save-content-flag no longer returns the flag id to its caller at all (see
// that function's own fix) — the flagged learner has no way to obtain it.
//
// WHY THIS TAKES { learnerId }, NOT A SPECIFIC FLAG ID:
// parent_alerts has no flag_id column, and the whole point of this fix is
// that a flag's own id must never reach the flagged learner's browser again
// — so there is no remaining channel for a specific flagId to reach the
// parent's UI without either (a) a new DB column, or (b) re-leaking it
// through the learner's client. Instead, this resolves "the flag to
// acknowledge" server-side as the MOST RECENT still-pending
// (parent_acknowledged = false) content_flags row for the given,
// ownership-verified learnerId — which the parent's UI already has on hand
// from parent_alerts.learner_id, no new plumbing required. This also gives
// natural idempotency: once a flag is acknowledged it stops matching future
// lookups, so replaying the same request is a clean no-op, not an error.
//
// Looks up by learner_id OR the child's own user_id (falls back to the
// latter since content_flags.learner_id may be null on some rows — e.g. if
// the learner record hadn't loaded client-side at flag time) so a flag
// isn't left permanently unacknowledgeable due to that historical gap.
//
// Expected request:
//   POST /functions/v1/acknowledge-flag
//   Authorization: Bearer <parent JWT>
//   Content-Type: application/json
//   { "learnerId": "<uuid>" }
//
// Responses (all 200 unless noted):
//   { success: true }                            — a pending flag was found and acknowledged
//   { success: true, alreadyAcknowledged: true }  — no pending flag found (already done, or none ever existed) — no-op
//   { success: false, reason: "missing_learner_id" }
//   { success: false, reason: "learner_not_found" }
//   { success: false, reason: "server_error" }
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonRes({ success: false, reason: "method_not_allowed" }, 405);

  return await (async () => {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error("acknowledge-flag: missing required env vars");
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
      console.warn("acknowledge-flag: invalid JWT:", jwtErr?.message);
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
      console.error("acknowledge-flag: profile lookup failed for caller", callerId, profileErr?.message);
      return jsonRes({ success: false, reason: "unauthorized" }, 401);
    }

    if (callerProfile.role !== "parent") {
      console.warn("acknowledge-flag: caller is not a parent:", callerId, "role:", callerProfile.role);
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
      console.error("acknowledge-flag: parent record not found for user", callerId, parentErr?.message);
      return jsonRes({ success: false, reason: "forbidden" }, 403);
    }

    const linkedLearners: string[] = parentRecord.linked_learners ?? [];
    if (!linkedLearners.includes(learnerId)) {
      console.warn("acknowledge-flag: caller", callerId, "does not own learner", learnerId, "— refusing to acknowledge");
      return jsonRes({ success: false, reason: "forbidden" }, 403);
    }

    // 4. Resolve the child's own auth id too, so the flag lookup below can
    // fall back to user_id for rows where learner_id is null.
    const { data: learner, error: learnerErr } = await admin
      .from("learners")
      .select("id, user_id")
      .eq("id", learnerId)
      .maybeSingle();

    if (learnerErr || !learner) {
      console.error("acknowledge-flag: learner lookup failed:", learnerErr?.message, "id:", learnerId);
      return jsonRes({ success: false, reason: "learner_not_found" }, 200);
    }

    const childAuthId = learner.user_id;

    // 5. Find the most recent STILL-PENDING flag for this (now
    // ownership-verified) learner. Filtering on parent_acknowledged = false
    // gives natural idempotency — a replayed request simply finds nothing
    // once the flag has already been acknowledged.
    const { data: flag, error: flagErr } = await admin
      .from("content_flags")
      .select("id, user_id")
      .or(`learner_id.eq.${learnerId},user_id.eq.${childAuthId}`)
      .eq("parent_acknowledged", false)
      .order("flagged_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (flagErr) {
      console.error("acknowledge-flag: flag lookup failed for learner", learnerId, ":", flagErr.message);
      return jsonRes({ success: false, reason: "server_error" }, 200);
    }

    if (!flag) {
      console.log("acknowledge-flag: no pending flag found for learner", learnerId, "— already acknowledged or none exists, no-op");
      return jsonRes({ success: true, alreadyAcknowledged: true }, 200);
    }

    // 6. Mark the flag acknowledged FIRST — if this fails, do not touch the
    // profile, so we never reactivate an account without a recorded
    // acknowledgment.
    const { error: updateFlagErr } = await admin
      .from("content_flags")
      .update({ parent_acknowledged: true })
      .eq("id", flag.id);

    if (updateFlagErr) {
      console.error("acknowledge-flag: failed to mark flag", flag.id, "acknowledged:", updateFlagErr.message);
      return jsonRes({ success: false, reason: "server_error" }, 200);
    }

    // 7. Reactivate the learner's account.
    if (flag.user_id) {
      const { error: profileUpdateErr } = await admin
        .from("profiles")
        .update({ account_frozen: false, freeze_reason: null })
        .eq("id", flag.user_id);

      if (profileUpdateErr) {
        console.error("acknowledge-flag: failed to reactivate profile", flag.user_id, ":", profileUpdateErr.message);
        return jsonRes({ success: false, reason: "server_error" }, 200);
      }
    }

    console.log("acknowledge-flag: learner", learnerId, "flag", flag.id, "acknowledged by parent", callerId);
    return jsonRes({ success: true }, 200);

  })().catch((e: unknown) => {
    const eMsg = e instanceof Error ? `${e.message} | stack: ${e.stack ?? "none"}` : String(e);
    console.error("acknowledge-flag: UNHANDLED EXCEPTION:", eMsg);
    return jsonRes({ success: false, reason: "server_error" }, 200);
  });
});

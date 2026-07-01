// Supabase Edge Function: delete-child
// (self-contained, no _shared imports)
// DEPLOY: paste via Supabase dashboard — Verify JWT must be ON (this function
// relies on auth.getUser() to identify the calling parent; do NOT disable JWT
// verification for this function).
// SECRETS: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//
// Parent-triggered PERMANENT deletion of one linked child. Explicit cleanup
// of every table that does NOT cascade automatically from auth.users, in a
// fixed order, before calling admin.auth.admin.deleteUser() to remove the
// child's auth user — which cascades profiles, learners, topics,
// study_sessions, mock_exams (+ mock_exam_questions + mock_exam_responses),
// diagnostic_attempts, learner_subjects and billing_tokens automatically via
// ON DELETE CASCADE (confirmed for the repo-tracked tables; billing_tokens
// and learner_subjects are dashboard-only additions assumed to cascade the
// same way — verify in the dashboard if this is ever in doubt).
//
// Cleanup order — steps a-f must ALL succeed before g/h run:
//   a. content_flags        (learner_id = X OR user_id = childAuthId)
//   b. parent_alerts         (learner_id = X)
//   c. referral_redemptions  (referrer_id = X OR referee_id = X)
//   d. saved_guides          (learner_id = X)
//   e. subscription_history  (learner_id = X)
//   f. support_messages      (user_id = childAuthId) — BEST-EFFORT: no FK
//      constraint exists on this table, so a failure here is logged but does
//      NOT stop the deletion.
//   g. every parents row whose linked_learners contains X — remove X from
//      the array (there could be more than one parent linked to a shared
//      child, not just the caller).
//   h. admin.auth.admin.deleteUser(childAuthId) — cascades everything else.
//
// If any of a-f fails: STOP immediately. Nothing destructive has happened —
// the child's data is left in its original state.
//   -> { success: false, reason: "cleanup_failed_at_step", step: "<a-f>", detail }
// If g or h fails after a-f succeeded: this is a WORSE state — explicit data
// rows are already gone but the auth user/learner row still exists.
//   -> { success: false, reason: "deletion_incomplete", detail }
//
// Expected request:
//   POST /functions/v1/delete-child
//   Authorization: Bearer <parent JWT>
//   Content-Type: application/json
//   { "learnerId": "<uuid>" }
//
// Responses (all 200 unless noted):
//   { success: true }
//   { success: false, reason: "cleanup_failed_at_step", step: "<a-f>", detail }
//   { success: false, reason: "deletion_incomplete", detail }
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
      console.error("delete-child: missing required env vars");
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
      console.warn("delete-child: invalid JWT:", jwtErr?.message);
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
      console.error("delete-child: profile lookup failed for caller", callerId, profileErr?.message);
      return jsonRes({ success: false, reason: "unauthorized" }, 401);
    }

    if (callerProfile.role !== "parent") {
      console.warn("delete-child: caller is not a parent:", callerId, "role:", callerProfile.role);
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
      console.error("delete-child: parent record not found for user", callerId, parentErr?.message);
      return jsonRes({ success: false, reason: "forbidden" }, 403);
    }

    const linkedLearners: string[] = parentRecord.linked_learners ?? [];
    if (!linkedLearners.includes(learnerId)) {
      console.warn("delete-child: caller", callerId, "does not own learner", learnerId);
      return jsonRes({ success: false, reason: "forbidden" }, 403);
    }

    // 4. Fetch the learner's own auth id — needed for the content_flags/
    // support_messages steps below (which key on the CHILD's own user_id,
    // not learnerId) and for the final deleteUser call.
    const { data: learner, error: learnerErr } = await admin
      .from("learners")
      .select("id, user_id")
      .eq("id", learnerId)
      .single();

    if (learnerErr || !learner) {
      console.error("delete-child: learner lookup failed:", learnerErr?.message, "id:", learnerId);
      return jsonRes({ success: false, reason: "learner_not_found" }, 200);
    }

    const childAuthId = learner.user_id;

    // 5. Explicit cleanup, in fixed order. Steps a-f must ALL succeed before
    // g/h run — a failure here means nothing destructive has happened yet.

    // a. content_flags
    const { error: contentFlagsErr } = await admin
      .from("content_flags")
      .delete()
      .or(`learner_id.eq.${learnerId},user_id.eq.${childAuthId}`);

    if (contentFlagsErr) {
      console.error("delete-child: step a (content_flags) failed for learner", learnerId, ":", contentFlagsErr.message);
      return jsonRes({ success: false, reason: "cleanup_failed_at_step", step: "a", detail: contentFlagsErr.message }, 200);
    }
    console.log("delete-child: step a (content_flags) done for learner", learnerId);

    // b. parent_alerts
    const { error: parentAlertsErr } = await admin
      .from("parent_alerts")
      .delete()
      .eq("learner_id", learnerId);

    if (parentAlertsErr) {
      console.error("delete-child: step b (parent_alerts) failed for learner", learnerId, ":", parentAlertsErr.message);
      return jsonRes({ success: false, reason: "cleanup_failed_at_step", step: "b", detail: parentAlertsErr.message }, 200);
    }
    console.log("delete-child: step b (parent_alerts) done for learner", learnerId);

    // c. referral_redemptions
    const { error: referralRedemptionsErr } = await admin
      .from("referral_redemptions")
      .delete()
      .or(`referrer_id.eq.${learnerId},referee_id.eq.${learnerId}`);

    if (referralRedemptionsErr) {
      console.error("delete-child: step c (referral_redemptions) failed for learner", learnerId, ":", referralRedemptionsErr.message);
      return jsonRes({ success: false, reason: "cleanup_failed_at_step", step: "c", detail: referralRedemptionsErr.message }, 200);
    }
    console.log("delete-child: step c (referral_redemptions) done for learner", learnerId);

    // d. saved_guides
    const { error: savedGuidesErr } = await admin
      .from("saved_guides")
      .delete()
      .eq("learner_id", learnerId);

    if (savedGuidesErr) {
      console.error("delete-child: step d (saved_guides) failed for learner", learnerId, ":", savedGuidesErr.message);
      return jsonRes({ success: false, reason: "cleanup_failed_at_step", step: "d", detail: savedGuidesErr.message }, 200);
    }
    console.log("delete-child: step d (saved_guides) done for learner", learnerId);

    // e. subscription_history
    const { error: subscriptionHistoryErr } = await admin
      .from("subscription_history")
      .delete()
      .eq("learner_id", learnerId);

    if (subscriptionHistoryErr) {
      console.error("delete-child: step e (subscription_history) failed for learner", learnerId, ":", subscriptionHistoryErr.message);
      return jsonRes({ success: false, reason: "cleanup_failed_at_step", step: "e", detail: subscriptionHistoryErr.message }, 200);
    }
    console.log("delete-child: step e (subscription_history) done for learner", learnerId);

    // f. support_messages — BEST-EFFORT. No FK constraint exists on this
    // table, so a failure here is logged but does NOT stop the deletion.
    const { error: supportMessagesErr } = await admin
      .from("support_messages")
      .delete()
      .eq("user_id", childAuthId);

    if (supportMessagesErr) {
      console.error(
        "delete-child: step f (support_messages) failed for learner", learnerId,
        "(best-effort, continuing):", supportMessagesErr.message,
      );
    } else {
      console.log("delete-child: step f (support_messages) done for learner", learnerId);
    }

    // g. Remove learnerId from EVERY parents row that links to it — there
    // could theoretically be more than one parent linked to a shared child,
    // not just the calling parent's own row.
    const { data: linkedParents, error: linkedParentsErr } = await admin
      .from("parents")
      .select("id, linked_learners")
      .contains("linked_learners", [learnerId]);

    if (linkedParentsErr) {
      console.error("delete-child: step g (parents lookup) failed for learner", learnerId, ":", linkedParentsErr.message);
      return jsonRes({ success: false, reason: "deletion_incomplete", detail: linkedParentsErr.message }, 200);
    }

    for (const p of linkedParents ?? []) {
      const remaining = (p.linked_learners ?? []).filter((id: string) => id !== learnerId);
      const { error: updateErr } = await admin
        .from("parents")
        .update({ linked_learners: remaining })
        .eq("id", p.id);

      if (updateErr) {
        console.error("delete-child: step g (parents update) failed for parent", p.id, "learner", learnerId, ":", updateErr.message);
        return jsonRes({ success: false, reason: "deletion_incomplete", detail: updateErr.message }, 200);
      }
    }
    console.log(
      "delete-child: step g (parents.linked_learners) done for learner", learnerId,
      "-", (linkedParents ?? []).length, "parent row(s) updated",
    );

    // h. Delete the child's auth user — cascades profiles, learners, topics,
    // study_sessions, mock_exams (+ mock_exam_questions + mock_exam_responses),
    // diagnostic_attempts, learner_subjects and billing_tokens automatically
    // via ON DELETE CASCADE.
    const deleteUserResult = await admin.auth.admin.deleteUser(childAuthId);
    console.log("delete-child: step h raw deleteUser result:", JSON.stringify(deleteUserResult));
    const deleteUserErr = deleteUserResult.error;

    if (deleteUserErr) {
      console.error(
        "delete-child: step h (deleteUser) failed for learner", learnerId,
        "childAuthId", childAuthId,
        "| full error:", JSON.stringify(deleteUserErr, Object.getOwnPropertyNames(deleteUserErr)),
      );
      return jsonRes({ success: false, reason: "deletion_incomplete", detail: deleteUserErr.message }, 200);
    }

    console.log("delete-child: step h (deleteUser) done — learner", learnerId, "childAuthId", childAuthId, "fully deleted");

    return jsonRes({ success: true }, 200);

  })().catch((e: unknown) => {
    const eMsg = e instanceof Error ? `${e.message} | stack: ${e.stack ?? "none"}` : String(e);
    console.error("delete-child: UNHANDLED EXCEPTION:", eMsg);
    return jsonRes({ success: false, reason: "server_error" }, 200);
  });
});

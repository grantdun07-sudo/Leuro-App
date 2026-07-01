// Supabase Edge Function: delete-parent-account
// (self-contained, no _shared imports)
// DEPLOY: paste via Supabase dashboard — Verify JWT must be ON (this function
// relies on auth.getUser() to identify the calling parent; do NOT disable JWT
// verification for this function).
// SECRETS: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//
// *** NOT YET TESTED / NOT YET RUN — prepared for review next session. ***
// This function has not been executed against a real database. Read it
// carefully, especially the DESIGN DECISION note in step 4 below, before
// deploying or invoking it against real data.
//
// Parent-triggered PERMANENT deletion of the parent's OWN account, cascading
// to every linked child. For each linked child, runs the exact same
// explicit cleanup sequence proven working in delete-child/index.ts (steps
// a-f), but does NOT call deleteUser() per child from within that shared
// step — deleteUser() is called separately per child below so a failure on
// one child can be tracked without blocking the others.
//
// SAFETY CHECK (guards against a real corruption found and cleaned up this
// session): before touching any child, confirms that learner.user_id is NOT
// equal to the calling parent's own auth id. A learner row whose user_id
// accidentally equals the parent's own id would otherwise cause the parent's
// OWN auth user to be deleted mid-loop while processing what looks like "a
// child". Any learner failing this check is skipped entirely (no cleanup,
// no deleteUser) and reported in the results — never risk the parent's own
// login for a corrupted row.
//
// Per-child processing order (independent per child — one child's failure
// at any stage does NOT stop processing of the other children):
//   1. Safety check (learner.user_id !== callerId) — skip child if it fails.
//   2. Cleanup steps a-f (content_flags, parent_alerts, referral_redemptions,
//      saved_guides, subscription_history, support_messages[best-effort]).
//      If a-f fails for THIS child, skip this child's deleteUser call —
//      move on to the next child.
//   3. admin.auth.admin.deleteUser(childAuthId) for this child only, if step
//      2 succeeded. A failure here is recorded and does not stop the loop.
//
// *** DESIGN DECISION — FLAGGED FOR REVIEW, NOT SILENTLY DECIDED: ***
// After ALL children have been processed (regardless of how many of them
// failed at any stage — cleanup failure, deleteUser failure, or the safety
// check), this function ALWAYS proceeds to clean up the parent's own
// non-cascading rows and ALWAYS calls deleteUser on the parent's own auth
// id. It does NOT abort/block the parent's own deletion because one or more
// children could not be fully deleted. Rationale: the parent explicitly
// requested their own account be deleted; leaving their login active
// indefinitely because a single child's data proved awkward to clean up
// seemed like a worse default than a small number of orphaned child rows
// that can be identified afterward via childrenFailed and cleaned up
// manually. If the intended behaviour is instead "block parent deletion
// entirely if any child fails," step 4 (search for this comment block) is
// exactly where that gate would need to be added.
//
// Expected request:
//   POST /functions/v1/delete-parent-account
//   Authorization: Bearer <parent JWT>
//   (no body needed — the caller's own JWT identifies the account)
//
// Responses (all 200 unless noted):
//   { success: true, childrenDeleted: N, childrenFailed: [{ learnerId, status, reason }] }
//   { success: false, reason: "parent_delete_failed", detail, childrenDeleted, childrenFailed }
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

type ChildStatus = "deleted" | "cleanup_failed" | "delete_user_failed" | "skipped_corrupted_user_id" | "lookup_failed";

type ChildResult = {
  learnerId: string;
  status: ChildStatus;
  reason?: string;
};

// Same steps a-f proven in delete-child/index.ts, factored into a function
// here since this file loops over every linked child rather than handling
// just one. Returns which step failed (if any) so the caller can log and
// decide whether to proceed to deleteUser for this specific child.
async function cleanupChildData(
  admin: ReturnType<typeof createClient>,
  learnerId: string,
  childAuthId: string,
): Promise<{ ok: true } | { ok: false; step: string; detail: string }> {
  // a. content_flags
  const { error: contentFlagsErr } = await admin
    .from("content_flags")
    .delete()
    .or(`learner_id.eq.${learnerId},user_id.eq.${childAuthId}`);
  if (contentFlagsErr) {
    console.error("delete-parent-account: step a (content_flags) failed for learner", learnerId, ":", contentFlagsErr.message);
    return { ok: false, step: "a", detail: contentFlagsErr.message };
  }
  console.log("delete-parent-account: step a (content_flags) done for learner", learnerId);

  // b. parent_alerts (learner-keyed)
  const { error: parentAlertsErr } = await admin
    .from("parent_alerts")
    .delete()
    .eq("learner_id", learnerId);
  if (parentAlertsErr) {
    console.error("delete-parent-account: step b (parent_alerts) failed for learner", learnerId, ":", parentAlertsErr.message);
    return { ok: false, step: "b", detail: parentAlertsErr.message };
  }
  console.log("delete-parent-account: step b (parent_alerts) done for learner", learnerId);

  // c. referral_redemptions
  const { error: referralRedemptionsErr } = await admin
    .from("referral_redemptions")
    .delete()
    .or(`referrer_id.eq.${learnerId},referee_id.eq.${learnerId}`);
  if (referralRedemptionsErr) {
    console.error("delete-parent-account: step c (referral_redemptions) failed for learner", learnerId, ":", referralRedemptionsErr.message);
    return { ok: false, step: "c", detail: referralRedemptionsErr.message };
  }
  console.log("delete-parent-account: step c (referral_redemptions) done for learner", learnerId);

  // d. saved_guides
  const { error: savedGuidesErr } = await admin
    .from("saved_guides")
    .delete()
    .eq("learner_id", learnerId);
  if (savedGuidesErr) {
    console.error("delete-parent-account: step d (saved_guides) failed for learner", learnerId, ":", savedGuidesErr.message);
    return { ok: false, step: "d", detail: savedGuidesErr.message };
  }
  console.log("delete-parent-account: step d (saved_guides) done for learner", learnerId);

  // e. subscription_history
  const { error: subscriptionHistoryErr } = await admin
    .from("subscription_history")
    .delete()
    .eq("learner_id", learnerId);
  if (subscriptionHistoryErr) {
    console.error("delete-parent-account: step e (subscription_history) failed for learner", learnerId, ":", subscriptionHistoryErr.message);
    return { ok: false, step: "e", detail: subscriptionHistoryErr.message };
  }
  console.log("delete-parent-account: step e (subscription_history) done for learner", learnerId);

  // f. support_messages — BEST-EFFORT. No FK constraint exists on this
  // table, so a failure here is logged but does NOT fail the cleanup.
  const { error: supportMessagesErr } = await admin
    .from("support_messages")
    .delete()
    .eq("user_id", childAuthId);
  if (supportMessagesErr) {
    console.error(
      "delete-parent-account: step f (support_messages) failed for learner", learnerId,
      "(best-effort, continuing):", supportMessagesErr.message,
    );
  } else {
    console.log("delete-parent-account: step f (support_messages) done for learner", learnerId);
  }

  return { ok: true };
}

// Deletes an auth user and logs the FULL raw result (not just .message) —
// the same fix applied to delete-child/index.ts after its error logging
// was found to produce an empty {} in production, hiding the real failure.
async function deleteAuthUser(
  admin: ReturnType<typeof createClient>,
  authId: string,
  label: string,
): Promise<{ ok: true } | { ok: false; detail: string }> {
  const result = await admin.auth.admin.deleteUser(authId);
  console.log(`delete-parent-account: raw deleteUser result for ${label} (${authId}):`, JSON.stringify(result));

  if (result.error) {
    console.error(
      `delete-parent-account: deleteUser FAILED for ${label} (${authId}) | full error:`,
      JSON.stringify(result.error, Object.getOwnPropertyNames(result.error)),
    );
    return { ok: false, detail: result.error.message };
  }
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonRes({ success: false, reason: "method_not_allowed" }, 405);

  return await (async () => {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error("delete-parent-account: missing required env vars");
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
      console.warn("delete-parent-account: invalid JWT:", jwtErr?.message);
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
      console.error("delete-parent-account: profile lookup failed for caller", callerId, profileErr?.message);
      return jsonRes({ success: false, reason: "unauthorized" }, 401);
    }

    if (callerProfile.role !== "parent") {
      console.warn("delete-parent-account: caller is not a parent:", callerId, "role:", callerProfile.role);
      return jsonRes({ success: false, reason: "forbidden" }, 403);
    }

    // 2. Fetch the parent's own record.
    const { data: parentRecord, error: parentErr } = await admin
      .from("parents")
      .select("id, linked_learners")
      .eq("user_id", callerId)
      .single();

    if (parentErr || !parentRecord) {
      console.error("delete-parent-account: parent record not found for user", callerId, parentErr?.message);
      return jsonRes({ success: false, reason: "forbidden" }, 403);
    }

    const learnerIds: string[] = parentRecord.linked_learners ?? [];
    console.log("delete-parent-account: caller", callerId, "has", learnerIds.length, "linked learner(s):", learnerIds);

    const childResults: ChildResult[] = [];

    // 3. Process every linked child independently, sequentially. A failure
    // or corruption on ONE child never aborts processing of the others —
    // each entry in childResults records exactly what happened for that
    // child, so the caller gets full visibility rather than a single
    // all-or-nothing outcome.
    for (const learnerId of learnerIds) {
      const { data: learner, error: learnerErr } = await admin
        .from("learners")
        .select("id, user_id")
        .eq("id", learnerId)
        .maybeSingle();

      if (learnerErr || !learner) {
        console.error("delete-parent-account: learner lookup failed for", learnerId, ":", learnerErr?.message ?? "not found");
        childResults.push({ learnerId, status: "lookup_failed", reason: learnerErr?.message ?? "learner_not_found" });
        continue;
      }

      const childAuthId = learner.user_id;

      // SAFETY CHECK — guards against the exact corruption found and cleaned
      // up this session: a learner row whose user_id accidentally equals
      // the calling PARENT's own auth id. Deleting that auth user would
      // delete the parent's own login mid-operation. Skip this child
      // entirely rather than risk it.
      if (childAuthId === callerId) {
        console.warn(
          "delete-parent-account: SAFETY CHECK FAILED — learner", learnerId,
          "has user_id equal to the calling parent's own id", callerId, "— skipping this child's deletion entirely.",
        );
        childResults.push({
          learnerId,
          status: "skipped_corrupted_user_id",
          reason: "learner.user_id matches the calling parent's own id — skipped to avoid deleting the parent's own login",
        });
        continue;
      }

      const cleanup = await cleanupChildData(admin, learnerId, childAuthId);
      if (!cleanup.ok) {
        console.error(
          "delete-parent-account: cleanup failed for learner", learnerId,
          "at step", cleanup.step, "— skipping this child's deleteUser call:", cleanup.detail,
        );
        childResults.push({ learnerId, status: "cleanup_failed", reason: `step ${cleanup.step}: ${cleanup.detail}` });
        continue;
      }

      const deleted = await deleteAuthUser(admin, childAuthId, `child learner ${learnerId}`);
      if (!deleted.ok) {
        childResults.push({ learnerId, status: "delete_user_failed", reason: deleted.detail });
        continue;
      }

      console.log("delete-parent-account: learner", learnerId, "fully deleted");
      childResults.push({ learnerId, status: "deleted" });
    }

    const childrenDeleted = childResults.filter((r) => r.status === "deleted").length;
    const childrenFailed = childResults.filter((r) => r.status !== "deleted");

    console.log(
      "delete-parent-account: child processing complete —", childrenDeleted, "deleted,",
      childrenFailed.length, "not deleted (see childrenFailed for reasons)",
    );

    // *** DESIGN DECISION — see the header comment block above for full
    // rationale. Everything from this point on ALWAYS runs, regardless of
    // how many children failed above. If parent deletion should instead be
    // BLOCKED when any child fails, this is the exact point to add that
    // gate (e.g. `if (childrenFailed.length > 0) return jsonRes({...})`). ***

    // 4. Clean up the parent's OWN non-cascading rows (keyed to the parent,
    // not to any child) before deleting the parent's auth user.
    // parent_alerts.parent_id has no ON DELETE CASCADE from parents.
    const { error: parentAlertsOwnErr } = await admin
      .from("parent_alerts")
      .delete()
      .eq("parent_id", parentRecord.id);
    if (parentAlertsOwnErr) {
      console.error("delete-parent-account: parent's own parent_alerts cleanup failed (continuing):", parentAlertsOwnErr.message);
    } else {
      console.log("delete-parent-account: parent's own parent_alerts cleaned up");
    }

    // subscription_discounts.user_id -> profiles.id has no ON DELETE CASCADE,
    // and is keyed to the PARENT's own profile (discount codes are applied
    // at the parent/billing level, not per-child).
    const { error: subscriptionDiscountsErr } = await admin
      .from("subscription_discounts")
      .delete()
      .eq("user_id", callerId);
    if (subscriptionDiscountsErr) {
      console.error("delete-parent-account: parent's own subscription_discounts cleanup failed (continuing):", subscriptionDiscountsErr.message);
    } else {
      console.log("delete-parent-account: parent's own subscription_discounts cleaned up");
    }

    // support_messages.user_id can be either role's own id — clean up any
    // the parent submitted themselves (separate from the per-child cleanup
    // in step f above, which only targets each child's own user_id).
    const { error: supportMessagesOwnErr } = await admin
      .from("support_messages")
      .delete()
      .eq("user_id", callerId);
    if (supportMessagesOwnErr) {
      console.error("delete-parent-account: parent's own support_messages cleanup failed (continuing):", supportMessagesOwnErr.message);
    } else {
      console.log("delete-parent-account: parent's own support_messages cleaned up");
    }

    // 5. Delete the parent's own auth user — cascades their profiles and
    // parents rows automatically.
    const parentDeleted = await deleteAuthUser(admin, callerId, "parent (self)");
    if (!parentDeleted.ok) {
      console.error("delete-parent-account: FINAL STEP FAILED — parent's own deleteUser call failed for", callerId, ":", parentDeleted.detail);
      return jsonRes({
        success: false,
        reason: "parent_delete_failed",
        detail: parentDeleted.detail,
        childrenDeleted,
        childrenFailed,
      }, 200);
    }

    console.log(
      "delete-parent-account: parent", callerId, "fully deleted —",
      childrenDeleted, "of", learnerIds.length, "children deleted",
    );

    return jsonRes({ success: true, childrenDeleted, childrenFailed }, 200);

  })().catch((e: unknown) => {
    const eMsg = e instanceof Error ? `${e.message} | stack: ${e.stack ?? "none"}` : String(e);
    console.error("delete-parent-account: UNHANDLED EXCEPTION:", eMsg);
    return jsonRes({ success: false, reason: "server_error" }, 200);
  });
});

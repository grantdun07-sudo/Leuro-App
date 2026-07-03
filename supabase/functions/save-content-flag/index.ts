// Supabase Edge Function: save-content-flag
// POST { learner_id?, severity, flagged_text, context }
//
// Records a content-safety flag. The browser can't INSERT into content_flags
// directly (RLS returns 403), so this function performs the write with the
// service role key.
//
// STANDALONE: no shared imports - everything is inlined so this file can be
// pasted directly into the Supabase dashboard editor.
//
// *** SECURITY FIX (July 2026 audit) ***
// This endpoint used to be fully unauthenticated and trusted user_id and
// account_frozen straight from the request body - anyone who knew (or
// obtained) any user's UUID could POST severity 1 with that user_id and
// FREEZE an arbitrary account, or spam junk rows into content_flags. Now:
//   1. A valid JWT is required; the flagged user's identity is derived
//      from the token (auth.getUser()), never from the body.
//   2. learner_id from the body is verified to belong to the caller
//      before being stored; a mismatched learner_id is nulled, not trusted.
//   3. account_frozen is decided server-side from severity, never read
//      from the body.
//   4. The tier-2 "3 flags in 7 days" freeze threshold moved here from
//      app.js's flagContent() - the client can no longer be trusted to
//      apply its own escalation (and the profiles.account_frozen column
//      grant was revoked from the authenticated role, so the client-side
//      freeze write would fail now anyway).
// The gateway may have Verify JWT ON or OFF for this function - the
// in-function auth check above is authoritative either way.
//
// server-to-server caller: submit-support-message forwards the SUPPORT
// SUBMITTER's own JWT when it relays a flagged message here, so the same
// auth path covers it.
//
// SECURITY: this function's response must NEVER include the flag's own id.
// It used to return { id: flag.id }, and since the CALLER of this function
// is the flagged learner's own browser, that id was directly observable in
// their own network response / console log - which let a flagged learner
// read their own content_flags.id and self-reactivate their own frozen
// account via the old public acknowledge-flag endpoint, completely
// bypassing the parent review the freeze exists to require. Only
// { success, frozen } is returned now. acknowledge-flag (parent-JWT-gated
// and ownership-checked) resolves which flag to act on server-side.
//
// RESPONSE SHAPE: { success: boolean, frozen: boolean }. `success` reflects
// whether the content_flags row was saved; `frozen` reflects whether
// profiles.account_frozen was actually persisted (severity-1 always, or a
// severity-2 flag that crossed the 3-in-7-days threshold). The client's
// tier-1 safety check treats the freeze as confirmed ONLY when
// success === true AND frozen === true - it must not show a frozen/paused
// state the DB doesn't actually reflect.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Severity-2 escalation: freeze after this many tier-2 flags inside the
// window (counting the flag being saved right now).
const TIER2_FREEZE_THRESHOLD = 3;
const TIER2_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      console.error("save-content-flag: bad method:", req.method);
      return jsonResponse({ success: false, frozen: false, error: "Method not allowed" }, 405);
    }

    // 1. Authenticate the caller - the flagged user's identity comes from
    // the JWT, never from the request body.
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) {
      console.warn("save-content-flag: missing Authorization header");
      return jsonResponse({ success: false, frozen: false, error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user: caller }, error: jwtErr } = await userClient.auth.getUser();
    if (jwtErr || !caller) {
      console.warn("save-content-flag: invalid JWT:", jwtErr?.message);
      return jsonResponse({ success: false, frozen: false, error: "Unauthorized" }, 401);
    }

    const userId = caller.id;

    const body = await req.json();
    // Deliberately NOT logging flagged_text - it is sensitive learner
    // content (potentially self-harm related); ids and severity are enough
    // for debugging.
    console.log("save-content-flag: request", {
      caller: userId,
      severity: body?.severity,
      context: body?.context,
      learner_id: body?.learner_id ?? null,
    });

    const { learner_id, severity, flagged_text, context } = body as {
      learner_id?: string | null;
      severity?: number;
      flagged_text?: string;
      context?: string;
    };

    if (severity !== 1 && severity !== 2) {
      console.error("save-content-flag: invalid severity:", severity);
      return jsonResponse({ success: false, frozen: false, error: "severity (1 or 2) is required" }, 400);
    }
    if (!flagged_text) {
      console.error("save-content-flag: missing flagged_text");
      return jsonResponse({ success: false, frozen: false, error: "flagged_text is required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Verify the supplied learner_id actually belongs to the caller -
    // a mismatched/forged learner_id is nulled rather than stored, so a
    // flag can never be pinned on someone else's child.
    let verifiedLearnerId: string | null = null;
    if (learner_id) {
      const { data: learnerRow, error: learnerErr } = await supabase
        .from("learners")
        .select("id")
        .eq("id", learner_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (learnerErr) {
        console.error("save-content-flag: learner verification failed:", learnerErr.message);
      }
      if (learnerRow) {
        verifiedLearnerId = learnerRow.id;
      } else {
        console.warn("save-content-flag: learner_id", learner_id, "does not belong to caller", userId, "- storing flag against user_id only");
      }
    }

    // 3. Decide the freeze server-side. Severity 1 always freezes.
    // Severity 2 freezes once the caller has TIER2_FREEZE_THRESHOLD
    // tier-2 flags inside the window, counting this one (the count query
    // runs after the insert below).
    const freezeForSeverity1 = severity === 1;

    const insertPayload = {
      user_id: userId,
      learner_id: verifiedLearnerId,
      severity,
      flagged_text,
      context: context || null,
      account_frozen: freezeForSeverity1,
    };

    const { data: flag, error: insertErr } = await supabase
      .from("content_flags")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertErr || !flag) {
      console.error("save-content-flag: insert failed:", JSON.stringify(insertErr));
      return jsonResponse({ success: false, frozen: false, error: "Failed to save content flag" }, 500);
    }

    console.log("save-content-flag: inserted flag id:", flag.id, "(not returned to caller)");

    // 4. Apply the freeze. The content_flags insert and the profiles
    // freeze update are two separate writes that can fail independently -
    // `frozen` tells the caller definitively whether the freeze was
    // actually persisted, so the client can fail closed.
    let shouldFreeze = freezeForSeverity1;
    let freezeReason = "Self-harm content detected";

    if (!shouldFreeze && severity === 2) {
      const windowStart = new Date(Date.now() - TIER2_WINDOW_MS).toISOString();
      let countQuery = supabase
        .from("content_flags")
        .select("id", { count: "exact", head: true })
        .eq("severity", 2)
        .gte("created_at", windowStart);
      countQuery = verifiedLearnerId
        ? countQuery.or(`user_id.eq.${userId},learner_id.eq.${verifiedLearnerId}`)
        : countQuery.eq("user_id", userId);

      const { count, error: countErr } = await countQuery;
      if (countErr) {
        // Fail open on the ESCALATION only - the flag itself is already
        // saved; a miscount must not freeze (or spare) anyone silently.
        console.error("save-content-flag: tier-2 count failed:", countErr.message);
      } else if ((count ?? 0) >= TIER2_FREEZE_THRESHOLD) {
        shouldFreeze = true;
        freezeReason = "Repeated inappropriate language";
        console.log("save-content-flag: tier-2 threshold reached for", userId, "- count:", count);
      }
    }

    let frozen = false;
    if (shouldFreeze) {
      const { error: freezeErr } = await supabase
        .from("profiles")
        .update({ account_frozen: true, freeze_reason: freezeReason })
        .eq("id", userId);
      if (freezeErr) {
        console.error("save-content-flag: failed to freeze profile:", JSON.stringify(freezeErr));
      } else {
        frozen = true;
        console.log("save-content-flag: froze profile:", userId, "reason:", freezeReason);
      }
    }

    return jsonResponse({ success: true, frozen });
  } catch (err) {
    console.error("save-content-flag error:", err);
    return jsonResponse({ success: false, frozen: false, error: "Internal server error" }, 500);
  }
});

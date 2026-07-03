// Supabase Edge Function: notify-parent
// POST { learnerId, severity, flaggedText, context, flagId }
//
// Rebuilt to merge two divergent versions that had drifted apart: the repo
// version (which correctly raised an in-app parent_alerts row via the
// create_parent_alert RPC, but sent no email) and the version actually
// deployed on the Supabase dashboard (which sent a well-styled email but
// never touched parent_alerts at all). The deployed version also had real
// bugs beyond the missing alert row:
//
//   1. Never created a parent_alerts row — no RPC call, no insert. The
//      in-app alert list has always been empty for safety flags.
//   2. Hardcoded grantdun07@gmail.com as both the fallback "to" AND an
//      unconditional "cc" on every alert email, for every real family —
//      a privacy/scope leak, not a test artifact.
//   3. Looked the parent up via profiles.parent_email — fragile, bypasses
//      the parents/linked_learners relationship used everywhere else in
//      this codebase.
//   4. Built an /acknowledge?token= link/button that is now permanently
//      broken, since acknowledge-flag was hardened this session to
//      require an authenticated, ownership-verified parent JWT — a bare
//      token in a public link can no longer reactivate anything.
//   5. (found during this rebuild) Looked the learner up via
//      profiles.id = learnerId — but learnerId is learners.id (the
//      learners table's own primary key) everywhere else in this
//      codebase, including the client that calls this function. That
//      lookup would essentially never match a real profiles row, and its
//      own error was never checked (only `{ data: learner }` was
//      destructured), so it silently fell straight through to
//      "A learner" / the hardcoded fallback email — which is almost
//      certainly why the hardcoded fallback is what actually fired in
//      production, not a genuinely resolved parent address.
//
// STANDALONE: no shared imports - everything is inlined so this file can
// be pasted directly into the Supabase dashboard editor.
//
// DB access runs with the SERVICE ROLE key (the caller's JWT is used for
// authentication only — see the SECURITY FIX note below). The parent_alerts
// insert and the email send are independent operations: each is attempted
// and logged on its own, and a failure in one must never hide a failure
// (or a success) in the other.
//
// *** SECURITY FIX (July 2026 audit) ***
// This function used to have no caller-authentication at all — anyone who
// could reach this URL could POST an arbitrary learnerId/flaggedText and
// trigger a real "your child may be in crisis" email + in-app alert to a
// real family. On top of that, flaggedText and the learner's name were
// interpolated RAW into the email HTML, so the endpoint doubled as "send
// arbitrary HTML from alerts@leuroai.co.za to this child's parents".
// Now:
//   1. A valid JWT is required, and the caller must BE the learner that
//      learnerId refers to (learners.user_id = caller id). Every real
//      caller already satisfies this: app.js's notifyParentOfFlag() sends
//      the learner's own session token, and submit-support-message
//      forwards the submitting learner's own JWT.
//   2. flaggedText and learnerName are HTML-escaped before being placed
//      in the email body, and flaggedText is capped in length.
// The gateway may have Verify JWT ON or OFF — the in-function check is
// authoritative either way.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Keep the quoted excerpt in the email short — the parent needs the gist,
// not a payload-sized blob.
const FLAGGED_TEXT_MAX_LENGTH = 300;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { learnerId, severity, flaggedText, context, flagId } = await req.json();
    console.log("notify-parent: called with", { learnerId, severity, context, flagId });

    if (!learnerId || (severity !== 1 && severity !== 2)) {
      return jsonResponse({ error: "learnerId and severity (1 or 2) are required" }, 400);
    }

    // 0. Authenticate the caller — must be the learner learnerId refers to.
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) {
      console.warn("notify-parent: missing Authorization header");
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );

    const { data: { user: caller }, error: jwtErr } = await userClient.auth.getUser();
    if (jwtErr || !caller) {
      console.warn("notify-parent: invalid JWT:", jwtErr?.message);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Learner's own name for the email body — and the ownership check.
    // learnerId is learners.id, NOT profiles.id — see bug #5 above for why
    // the old lookup never matched.
    const { data: learner, error: learnerErr } = await supabase
      .from("learners")
      .select("id, user_id, full_name")
      .eq("id", learnerId)
      .maybeSingle();

    if (learnerErr) {
      console.error("notify-parent: learner lookup failed:", learnerErr.message, "learnerId:", learnerId);
    }
    if (!learner) {
      console.warn("notify-parent: learner not found:", learnerId);
      return jsonResponse({ error: "Learner not found" }, 404);
    }
    if (learner.user_id !== caller.id) {
      console.warn("notify-parent: caller", caller.id, "is not learner", learnerId, "— refusing");
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    // Raw name for the plain-text subject line; HTML-escaped for the body.
    const learnerNameRaw = learner.full_name ?? "A learner";
    const learnerName = escapeHtml(learnerNameRaw);
    const flaggedExcerpt = escapeHtml(String(flaggedText ?? "").slice(0, FLAGGED_TEXT_MAX_LENGTH));

    // -------------------------------------------------------------------
    // 1. Resolve every parent linked to this learner — same pattern as
    //    notifyParentsDirectly() in paystack-webhook: parents whose
    //    linked_learners array contains this learner's id.
    // -------------------------------------------------------------------
    const { data: parents, error: parentsErr } = await supabase
      .from("parents")
      .select("id, user_id")
      .contains("linked_learners", [learnerId]);

    if (parentsErr) {
      console.error("notify-parent: parents lookup failed:", parentsErr.message, "learnerId:", learnerId);
    }

    const parentList = parents ?? [];
    console.log("notify-parent: resolved", parentList.length, "linked parent(s) for learner", learnerId);

    // -------------------------------------------------------------------
    // 2. Insert a parent_alerts row for EACH linked parent — a direct
    //    service-role insert (more reliable here than the RPC, which
    //    requires a real end-user JWT for its auth.uid() ownership check
    //    that this function, running purely on service-role creds, does
    //    not have). This is the step the deployed version skipped
    //    entirely. Logged loudly on failure, never silently swallowed.
    // -------------------------------------------------------------------
    const alertType = severity === 1 ? "safety_flag_crisis" : "safety_flag_language";
    const contextLabel = context ? ` (${context})` : "";
    const alertMessage =
      severity === 1
        ? `Leuro detected language that may indicate your child is in crisis${contextLabel}. ` +
          "Their account has been paused and they have been shown SADAG helpline information. " +
          "Please check in with them as soon as possible."
        : `Leuro detected inappropriate language from your child${contextLabel}. ` +
          "Please check in with them about appropriate language use on the platform.";

    if (parentList.length === 0) {
      console.error(
        "notify-parent: NO linked parents found for learner", learnerId,
        "— no parent_alerts row can be created. Check parents.linked_learners for this learner.",
      );
    } else {
      const { error: insertErr } = await supabase.from("parent_alerts").insert(
        parentList.map((p) => ({
          parent_id: p.id,
          learner_id: learnerId,
          alert_type: alertType,
          message: alertMessage,
        })),
      );
      if (insertErr) {
        console.error(
          "notify-parent: parent_alerts insert FAILED for learner", learnerId,
          ":", JSON.stringify(insertErr),
        );
      } else {
        console.log(
          "notify-parent: parent_alerts row(s) inserted for", parentList.length,
          "parent(s), learner", learnerId,
        );
      }
    }

    // -------------------------------------------------------------------
    // 3. Resolve real parent email addresses via auth.users (service-role
    //    admin API) — profiles.parent_email is fragile and unused
    //    elsewhere in this codebase.
    // -------------------------------------------------------------------
    const parentEmails: string[] = [];
    for (const p of parentList) {
      const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(p.user_id);
      if (authErr || !authUser?.user?.email) {
        console.error(
          "notify-parent: could not resolve email for parent", p.id,
          "user_id", p.user_id, ":", authErr?.message,
        );
        continue;
      }
      parentEmails.push(authUser.user.email);
    }

    // -------------------------------------------------------------------
    // 4. Send the email — same template/styling as the deployed version
    //    (it was good), minus the broken acknowledge link and the
    //    hardcoded personal address. Sent ONLY to real resolved parent
    //    emails; never falls back to an arbitrary address.
    // -------------------------------------------------------------------
    if (parentEmails.length === 0) {
      console.error(
        "notify-parent: NO parent email could be resolved for learner", learnerId,
        "— skipping email send. This should never happen for a properly linked learner — check parents.linked_learners and the parent's auth.users row.",
      );
    } else {
      const isTier1 = severity === 1;
      const subject = isTier1
        ? `⚠️ URGENT — Leuro™ Safety Alert for ${learnerNameRaw}`
        : `Leuro™ Content Notice for ${learnerNameRaw}`;

      const htmlBody = isTier1
        ? `
<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
  <div style="background:#5A3E76;padding:16px 24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#E6B347;margin:0;font-size:22px;">Leuro™ Safety Alert</h1>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #eee;border-radius:0 0 8px 8px;">
    <p>Dear Parent/Guardian,</p>
    <p>During a Leuro™ session on <strong>${new Date().toLocaleDateString("en-ZA")}</strong>, the following content was detected on <strong>${learnerName}</strong>'s account:</p>
    <div style="background:#fff3f3;border-left:4px solid #e53e3e;padding:12px 16px;margin:16px 0;border-radius:4px;">
      <p style="margin:0;color:#c53030;font-style:italic;">"${flaggedExcerpt}"</p>
    </div>
    <p>Your child's account has been <strong>temporarily paused</strong> as a precaution.</p>
    <p>Please speak with your child and ensure they are safe. The <strong>SADAG helpline</strong> is available 24 hours, free of charge: <strong>0800 21 22 23</strong>.</p>
    <p>Log in to your Leuro™ account to review and acknowledge this alert — your child's account will remain paused until you do.</p>
    <p style="margin-top:24px;color:#666;font-size:13px;">The Leuro™ Team<br/>leuroai.co.za</p>
  </div>
</div>`
        : `
<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
  <div style="background:#5A3E76;padding:16px 24px;border-radius:8px 8px 0 0;">
    <h1 style="color:#E6B347;margin:0;font-size:22px;">Leuro™ Content Notice</h1>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #eee;border-radius:0 0 8px 8px;">
    <p>Dear Parent/Guardian,</p>
    <p>Inappropriate language was detected on <strong>${learnerName}</strong>'s Leuro™ account on <strong>${new Date().toLocaleDateString("en-ZA")}</strong>.</p>
    <div style="background:#fffbea;border-left:4px solid #E6B347;padding:12px 16px;margin:16px 0;border-radius:4px;">
      <p style="margin:0;color:#744210;font-style:italic;">"${flaggedExcerpt}"</p>
    </div>
    <p>Your child's account remains active. Three flags in 7 days will pause the account automatically.</p>
    <p>Log in to your Leuro™ account to review this alert.</p>
    <p style="margin-top:24px;color:#666;font-size:13px;">The Leuro™ Team<br/>leuroai.co.za</p>
  </div>
</div>`;

      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          },
          body: JSON.stringify({
            from: "Leuro™ <alerts@leuroai.co.za>",
            to: parentEmails,
            subject,
            html: htmlBody,
          }),
        });
        const resendData = await resendRes.json();
        if (!resendRes.ok) {
          console.error(
            "notify-parent: Resend send FAILED for learner", learnerId,
            ":", JSON.stringify(resendData),
          );
        } else {
          console.log(
            "notify-parent: email sent to", parentEmails.length, "parent(s), learner", learnerId,
            "Resend response:", JSON.stringify(resendData),
          );
        }
      } catch (emailErr) {
        console.error("notify-parent: Resend fetch threw for learner", learnerId, ":", emailErr);
      }
    }

    // -------------------------------------------------------------------
    // 5. Mark the flag as parent_notified — kept from the deployed
    //    version. Only meaningful when flagId is actually sent; under the
    //    current app.js, save-content-flag no longer returns the flag id
    //    to the caller (a deliberate security fix from earlier this
    //    session), so flagId will typically be absent here. Logged so
    //    that gap stays visible instead of silently no-op'ing forever.
    // -------------------------------------------------------------------
    if (flagId) {
      const { error: flagUpdateErr } = await supabase
        .from("content_flags")
        .update({ parent_notified: true })
        .eq("id", flagId);
      if (flagUpdateErr) {
        console.error("notify-parent: failed to set parent_notified for flag", flagId, ":", flagUpdateErr.message);
      }
    } else {
      console.log("notify-parent: no flagId provided — skipping content_flags.parent_notified update");
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("notify-parent error:", err instanceof Error ? err.message : String(err));
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});

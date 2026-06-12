// Supabase Edge Function: notify-parent
// POST { learnerId, severity, flaggedText, context, flagId }
//
// Called by the client's checkContent()/flagContent() content-safety screen
// after a tier 1 (self-harm) or tier 2 (profanity/slurs/sexual/
// discriminatory) flag has already been written to content_flags (via the
// save-content-flag function, which returns the flag's UUID as flagId).
// This function raises a parent_alerts row for every parent linked to the
// learner via the existing create_parent_alert() RPC, including a public
// acknowledgment link built from flagId that reactivates the account.
//
// STANDALONE: no shared imports - everything is inlined so this file can be
// pasted directly into the Supabase dashboard editor.
//
// Auth: caller must be the learner identified by learnerId (enforced by
// create_parent_alert, which checks learners.user_id = auth.uid()).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const body = await req.json();
    console.log("notify-parent: received body:", JSON.stringify(body));
    const { learnerId, severity, context, flagId } = body as {
      learnerId?: string;
      severity?: number;
      flaggedText?: string;
      context?: string;
      flagId?: string | null;
    };

    if (!learnerId || (severity !== 1 && severity !== 2)) {
      return jsonResponse({ error: "learnerId and severity (1 or 2) are required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    // Public acknowledgment link - flagId is the content_flags row UUID
    // returned by save-content-flag. Opening it marks the flag acknowledged
    // and reactivates the learner's account (acknowledge-flag function).
    const ackUrl = flagId
      ? `https://leuro-app.vercel.app/acknowledge?token=${flagId}`
      : null;
    console.log("notify-parent: flagId:", flagId, "ackUrl:", ackUrl);

    const alertType = severity === 1 ? "safety_flag_crisis" : "safety_flag_language";
    const contextLabel = context ? ` (${context})` : "";
    let message =
      severity === 1
        ? `Leuro detected language that may indicate your child is in crisis${contextLabel}. ` +
          "Their account has been paused and they have been shown SADAG helpline information. " +
          "Please check in with them as soon as possible."
        : `Leuro detected inappropriate language from your child${contextLabel}. ` +
          "Please check in with them about appropriate language use on the platform.";

    if (ackUrl) {
      message += ` Confirm you have seen this and reactivate their account: ${ackUrl}`;
    }

    const { error: rpcErr } = await supabase.rpc("create_parent_alert", {
      p_learner_id: learnerId,
      p_alert_type: alertType,
      p_message: message,
    });

    if (rpcErr) {
      console.error("notify-parent: create_parent_alert failed:", rpcErr);
      return jsonResponse({ error: "Failed to notify parent" }, 500);
    }

    console.log("notify-parent: alert created for learner:", learnerId);
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("notify-parent error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

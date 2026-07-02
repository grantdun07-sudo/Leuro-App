// Supabase Edge Function: save-content-flag
// POST { user_id, learner_id, severity, flagged_text, context, account_frozen }
//
// Records a content-safety flag. The browser can't INSERT into content_flags
// directly (RLS returns 403), so this function performs the write with the
// service role key, which bypasses RLS entirely.
//
// STANDALONE: no shared imports - everything is inlined so this file can be
// pasted directly into the Supabase dashboard editor.
//
// JWT verification is OFF for this function and there is no auth check here -
// the service role key is what authorizes the write. user_id is taken from
// the request body so the flag stays linked to the learner's profile (used
// later by acknowledge-flag to reactivate the account).
//
// On a tier 1 (self-harm) flag the learner's profile is frozen as well.
//
// SECURITY: this function's response must NEVER include the flag's own id.
// It used to return { id: flag.id }, and since the CALLER of this function
// is the flagged learner's own browser, that id was directly observable in
// their own network response / console log — which let a flagged learner
// read their own content_flags.id and self-reactivate their own frozen
// account via the old public acknowledge-flag endpoint, completely
// bypassing the parent review the freeze exists to require. Only a generic
// { success: true } is returned now. acknowledge-flag (now parent-JWT-gated
// and ownership-checked) resolves which flag to act on server-side instead
// of trusting an id handed back to the client.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    console.log("save-content-flag: received body:", JSON.stringify(body));

    const { user_id, learner_id, severity, flagged_text, context, account_frozen } =
      body as {
        user_id?: string | null;
        learner_id?: string | null;
        severity?: number;
        flagged_text?: string;
        context?: string;
        account_frozen?: boolean;
      };

    if (severity !== 1 && severity !== 2) {
      console.error("save-content-flag: invalid severity:", severity);
      return jsonResponse({ error: "severity (1 or 2) is required" }, 400);
    }
    if (!flagged_text) {
      console.error("save-content-flag: missing flagged_text");
      return jsonResponse({ error: "flagged_text is required" }, 400);
    }

    console.log("save-content-flag: creating service-role client");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const insertPayload = {
      user_id: user_id || null,
      learner_id: learner_id || null,
      severity,
      flagged_text,
      context: context || null,
      account_frozen: account_frozen ?? severity === 1,
    };
    console.log("save-content-flag: inserting:", JSON.stringify(insertPayload));

    const { data: flag, error: insertErr } = await supabase
      .from("content_flags")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertErr || !flag) {
      console.error("save-content-flag: insert failed:", JSON.stringify(insertErr));
      return jsonResponse(
        { error: "Failed to save content flag", details: insertErr?.message },
        500,
      );
    }

    console.log("save-content-flag: inserted flag id:", flag.id);

    if (severity === 1 && user_id) {
      const { error: freezeErr } = await supabase
        .from("profiles")
        .update({
          account_frozen: true,
          freeze_reason: "Self-harm content detected",
        })
        .eq("id", user_id);
      if (freezeErr) {
        console.error("save-content-flag: failed to freeze profile:", JSON.stringify(freezeErr));
      } else {
        console.log("save-content-flag: froze profile:", user_id);
      }
    }

    console.log("save-content-flag: success, flag id:", flag.id, "(not returned to caller)");
    return jsonResponse({ success: true });
  } catch (err) {
    console.error("save-content-flag error:", err);
    return jsonResponse({ error: "Internal server error", details: String(err) }, 500);
  }
});

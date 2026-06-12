// Supabase Edge Function: save-content-flag
// POST { learner_id, severity, flagged_text, context, account_frozen }
//
// Records a content-safety flag. The browser's flagContent() can't INSERT
// into content_flags directly because RLS blocks it (403), so this function
// performs the write with the service role key (which bypasses RLS).
//
// The caller's session token is verified to derive user_id server-side -
// we never trust a client-supplied user_id, so a flag (and any account
// freeze) can only ever be attributed to the authenticated user.
//
// On a tier 1 (self-harm) flag the learner's profile is frozen as well.
// Returns the inserted content_flags row id (used downstream as the
// acknowledgment token passed to notify-parent).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const { learner_id, severity, flagged_text, context, account_frozen } =
      body as {
        learner_id?: string | null;
        severity?: number;
        flagged_text?: string;
        context?: string;
        account_frozen?: boolean;
      };

    if (severity !== 1 && severity !== 2) {
      return jsonResponse({ error: "severity (1 or 2) is required" }, 400);
    }
    if (!flagged_text) {
      return jsonResponse({ error: "flagged_text is required" }, 400);
    }

    // Verify the caller's session to derive a trusted user_id.
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }
    const userId = userData.user.id;

    // Service-role client bypasses RLS for the actual writes.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: flag, error: insertErr } = await admin
      .from("content_flags")
      .insert({
        learner_id: learner_id || null,
        user_id: userId,
        severity,
        flagged_text,
        context: context || null,
        account_frozen: account_frozen ?? severity === 1,
      })
      .select("id")
      .single();

    if (insertErr || !flag) {
      console.error("save-content-flag: insert failed:", insertErr);
      return jsonResponse({ error: "Failed to save content flag" }, 500);
    }

    if (severity === 1) {
      const { error: freezeErr } = await admin
        .from("profiles")
        .update({
          account_frozen: true,
          freeze_reason: "Self-harm content detected",
        })
        .eq("id", userId);
      if (freezeErr) {
        console.error("save-content-flag: failed to freeze profile:", freezeErr);
      }
    }

    return jsonResponse({ id: flag.id });
  } catch (err) {
    console.error("save-content-flag error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

// Supabase Edge Function: acknowledge-flag
// POST { token }
//   token: the content_flags.id (uuid) from a /acknowledge?token=... link
//
// Public endpoint - no auth required. A parent/guardian opens the
// acknowledgment link (sent after a content safety flag froze their
// child's account), which calls this function to:
//   1. Mark the content_flags row as acknowledged.
//   2. Reactivate the learner's account (clear profiles.account_frozen /
//      freeze_reason).
//
// Uses the service role key since the caller has no Supabase session.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    const { token } = body as { token?: string };

    if (!token) {
      return jsonResponse({ error: "token is required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // content_flags.user_id is the learner's profiles.id (set at flag time
    // from the caller's auth uid), so it's used directly to reactivate the
    // matching profile - content_flags.learner_id points at learners.id,
    // a different table's primary key.
    const { data: flag, error: flagErr } = await supabase
      .from("content_flags")
      .select("id, user_id")
      .eq("id", token)
      .single();

    if (flagErr || !flag) {
      return jsonResponse({ error: "Invalid or unknown token" }, 404);
    }

    const { error: updateFlagErr } = await supabase
      .from("content_flags")
      .update({ parent_acknowledged: true })
      .eq("id", token);

    if (updateFlagErr) {
      console.error("acknowledge-flag: failed to update content_flags:", updateFlagErr);
      return jsonResponse({ error: "Failed to acknowledge flag" }, 500);
    }

    if (flag.user_id) {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ account_frozen: false, freeze_reason: null })
        .eq("id", flag.user_id);

      if (profileErr) {
        console.error("acknowledge-flag: failed to reactivate profile:", profileErr);
        return jsonResponse({ error: "Failed to reactivate account" }, 500);
      }
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("acknowledge-flag error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

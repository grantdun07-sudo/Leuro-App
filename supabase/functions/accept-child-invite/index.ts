// Supabase Edge Function: accept-child-invite
//
// Called when a child clicks the invite link and sets their own password.
// The child is NOT logged in yet, so no parent JWT is required. Security
// is enforced by the invite_token — a single-use random token stored on
// the learners row that is cleared (set null) after successful use.
//
// Flow:
//   1. Look up the learners row by invite_token.
//   2. Validate: row must exist, invite_status must be "pending".
//   3. Validate the new password (min 8 chars).
//   4. Set the child's real password via auth.admin.updateUserById().
//   5. Mark the invite consumed: invite_status = "active", invite_token = null.
//   6. Return { ok: true }.
//
// DEPLOY:
//   supabase functions deploy accept-child-invite --no-verify-jwt
//
// SECRETS (Supabase auto-provides in the edge function env):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Expected request:
//   POST /functions/v1/accept-child-invite
//   Content-Type: application/json
//   { "token": "...", "password": "..." }
//
// Responses:
//   200  { ok: true }
//   400  { error: "..." }  — invalid/expired token, weak password
//   405  { error: "Method not allowed" }
//   500  { error: "..." }  — server errors (safe message, never raw details)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Helpers (inlined — no _shared imports, self-contained for dashboard paste)
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonOk(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonErr(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonErr("Method not allowed", 405);
  }

  // --- Environment ---
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("accept-child-invite: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    return jsonErr("Server configuration error", 500);
  }

  // Service role client — both Authorization AND apikey set explicitly so
  // PostgREST always resolves service_role and bypasses RLS for all DB ops.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // -------------------------------------------------------------------------
  // 1. Parse inputs
  // -------------------------------------------------------------------------

  let body: { token?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonErr("Request body must be valid JSON");
  }

  const token = String(body.token ?? "").trim();
  const password = String(body.password ?? "").trim();

  if (!token) {
    return jsonErr("Invite token is required");
  }
  if (password.length < 8) {
    return jsonErr("Password must be at least 8 characters");
  }

  // -------------------------------------------------------------------------
  // 2. Look up the learners row by invite_token
  // -------------------------------------------------------------------------

  const { data: learner, error: lookupErr } = await admin
    .from("learners")
    .select("id, user_id, invite_status")
    .eq("invite_token", token)
    .maybeSingle();

  if (lookupErr) {
    console.error("accept-child-invite: learners lookup failed:", lookupErr.message);
    return jsonErr("Could not process invite. Please try again.", 500);
  }

  if (!learner) {
    // Token not found — could be invalid, already used (cleared to null), or
    // a URL typo. Return a generic message; don't confirm whether token exists.
    console.warn("accept-child-invite: invite_token not found");
    return jsonErr("This invite link is invalid or has already been used.");
  }

  if (learner.invite_status !== "pending") {
    console.warn(
      "accept-child-invite: invite_status is", learner.invite_status,
      "for learner", learner.id, "— already accepted or inactive",
    );
    return jsonErr("This invite has already been accepted. You can log in with your email and password.");
  }

  const childUserId: string = learner.user_id;

  // -------------------------------------------------------------------------
  // 3. Set the child's real password via the Auth Admin API
  // -------------------------------------------------------------------------

  const { error: updateAuthErr } = await admin.auth.admin.updateUserById(childUserId, {
    password,
  });

  if (updateAuthErr) {
    console.error("accept-child-invite: updateUserById failed for", childUserId, ":", updateAuthErr.message);
    return jsonErr("Could not set password. Please try again.", 500);
  }

  // -------------------------------------------------------------------------
  // 4. Mark invite consumed: invite_status = "active", invite_token = null
  // -------------------------------------------------------------------------

  const { error: consumeErr } = await admin
    .from("learners")
    .update({ invite_status: "active", invite_token: null })
    .eq("id", learner.id);

  if (consumeErr) {
    // Password was set successfully — the child can log in. This update is
    // a bookkeeping step; failure is non-fatal but log it loudly.
    console.error(
      "accept-child-invite: failed to clear invite_token for learner", learner.id,
      ":", consumeErr.message,
      "— password was set; child can log in but token remains reusable until fixed.",
    );
  }

  console.log("accept-child-invite: success — learner_id:", learner.id, "child_auth_id:", childUserId);

  return jsonOk({ ok: true });
});

// Supabase Edge Function: create-child-auth
//
// Creates a child Supabase Auth user. Supports two modes:
//
//   mode "direct" (default) — parent sets the password immediately.
//     Body: { email, password, full_name, grade }
//     Response: { ok: true, learner_id, child_auth_id }
//
//   mode "invite" — parent sends an invite link; child sets their own password.
//     Body: { email, full_name, grade, mode: "invite" }
//     Response: { ok: true, learner_id, child_auth_id, invite_token }
//     A secure random temp password is generated internally so the auth user
//     exists immediately. The invite_token is stored on the learners row and
//     consumed by accept-child-invite when the child sets their real password.
//
// In both modes the child gets a real auth.users entry (email_confirm: true)
// so they can log in after password setup. The live handle_new_user trigger
// only creates a profiles row; this function inserts the learners row directly.
// A pre-check guard handles the case where the trigger is later updated to
// also create learners rows (upsert-safe).
//
// DEPLOY:
//   supabase functions deploy create-child-auth --no-verify-jwt
//
// SECRETS (Supabase auto-provides in the edge function env):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_ANON_KEY
//
// Expected request:
//   POST /functions/v1/create-child-auth
//   Authorization: Bearer <parent JWT>
//   Content-Type: application/json
//   { "email": "...", "password": "...", "full_name": "...", "grade": 10 }
//   { "email": "...", "full_name": "...", "grade": 10, "mode": "invite" }
//
// Responses:
//   200  { ok: true, learner_id, child_auth_id [, invite_token] }
//   400  { error: "..." }  — validation / already-registered / not a parent
//   401  { error: "Unauthorized" }
//   403  { error: "Forbidden" }
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

function jsonErr(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Cryptographically random hex string using the Web Crypto API (available in Deno).
function randomHex(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
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
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error("create-child-auth: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY not set");
    return jsonErr("Server configuration error", 500);
  }

  // Service role client — both Authorization AND apikey set explicitly to the
  // service role key so PostgREST always resolves service_role and bypasses RLS.
  // Used for ALL database operations.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // -------------------------------------------------------------------------
  // 1. Authenticate & authorise the caller
  // -------------------------------------------------------------------------

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!jwt) {
    return jsonErr("Unauthorized", 401);
  }

  // User-scoped client — ONLY used for auth.getUser() to verify the caller's
  // JWT and obtain their user id. Never used for database queries.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user: caller }, error: jwtErr } = await userClient.auth.getUser();
  if (jwtErr || !caller) {
    console.warn("create-child-auth: invalid JWT:", jwtErr?.message);
    return jsonErr("Unauthorized", 401);
  }

  const callerId = caller.id;

  // Confirm the caller's profile role is 'parent'.
  const { data: callerProfile, error: profileErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", callerId)
    .single();

  if (profileErr || !callerProfile) {
    console.error("create-child-auth: profile lookup failed for caller", callerId, profileErr?.message);
    return jsonErr("Unauthorized", 401);
  }

  if (callerProfile.role !== "parent") {
    console.warn("create-child-auth: caller is not a parent:", callerId, "role:", callerProfile.role);
    return jsonErr("Forbidden — only parent accounts can add children", 403);
  }

  // Fetch the parent record — need id and linked_learners for step 5.
  const { data: parentRecord, error: parentErr } = await admin
    .from("parents")
    .select("id, linked_learners")
    .eq("user_id", callerId)
    .single();

  if (parentErr || !parentRecord) {
    console.error("create-child-auth: parent record not found for user", callerId, parentErr?.message);
    return jsonErr("Parent account record not found", 400);
  }

  // -------------------------------------------------------------------------
  // 2. Parse and validate inputs
  // -------------------------------------------------------------------------

  let body: { email?: unknown; password?: unknown; full_name?: unknown; grade?: unknown; mode?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonErr("Request body must be valid JSON");
  }

  const mode = String(body.mode ?? "direct").trim().toLowerCase();
  if (mode !== "direct" && mode !== "invite") {
    return jsonErr('mode must be "direct" or "invite"');
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const fullName = String(body.full_name ?? "").trim();
  const grade = Number(body.grade);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonErr("Invalid email address");
  }
  if (!fullName) {
    return jsonErr("Child's name is required");
  }
  if (!Number.isInteger(grade) || grade < 4 || grade > 12) {
    return jsonErr("Grade must be a whole number between 4 and 12");
  }

  // Direct mode requires a parent-supplied password; invite mode generates one.
  let authPassword: string;
  if (mode === "direct") {
    const rawPassword = String(body.password ?? "").trim();
    if (rawPassword.length < 8) {
      return jsonErr("Password must be at least 8 characters");
    }
    authPassword = rawPassword;
  } else {
    // Unguessable internal temp password — child will replace it via accept-child-invite.
    authPassword = randomHex(48);
  }

  // invite_token is generated for invite mode and stored on the learners row.
  const inviteToken: string | null = mode === "invite" ? randomHex(32) : null;

  // -------------------------------------------------------------------------
  // 3. Create the child's Supabase Auth user
  //
  //    email_confirm: true — no confirmation email needed (parent is acting on
  //    the child's behalf). user_metadata.role and .grade are read by the
  //    handle_new_user trigger.
  // -------------------------------------------------------------------------

  const { data: createData, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: authPassword,
    email_confirm: true,
    user_metadata: { role: "learner", full_name: fullName, grade },
  });

  if (createErr) {
    const msg = createErr.message ?? "";
    const isAlreadyRegistered =
      msg.toLowerCase().includes("already registered") ||
      msg.toLowerCase().includes("already exists") ||
      msg.toLowerCase().includes("duplicate") ||
      msg.toLowerCase().includes("unique");

    if (isAlreadyRegistered) {
      return jsonErr(
        "That email address is already registered. The child may already have a Leuro account.",
        400,
      );
    }
    console.error("create-child-auth: admin.createUser failed:", msg);
    return jsonErr("Could not create child account. Please try again.", 500);
  }

  const childAuthId = createData.user.id;
  console.log("create-child-auth: created auth user", childAuthId, "mode:", mode, "parent:", callerId);

  // -------------------------------------------------------------------------
  // 4. Upsert the learners row
  //
  //    The LIVE handle_new_user trigger only creates a profiles row — it does
  //    NOT create a learners row. We INSERT here. The pre-check guard handles
  //    the case where the trigger is later re-enabled with learners support:
  //    if a row already exists for this user_id, UPDATE it instead so we
  //    never error or leave a duplicate.
  //
  //    direct mode: invite_status = "active",  invite_token = null
  //    invite mode: invite_status = "pending", invite_token = <token>
  // -------------------------------------------------------------------------

  const inviteStatus = mode === "invite" ? "pending" : "active";

  // Pre-check: does a learners row already exist for this child?
  const { data: existingLearner, error: checkErr } = await admin
    .from("learners")
    .select("id")
    .eq("user_id", childAuthId)
    .maybeSingle();

  if (checkErr) {
    console.error("create-child-auth: learners pre-check failed:", checkErr.message, "— cleaning up", childAuthId);
    await admin.auth.admin.deleteUser(childAuthId).catch((e: unknown) =>
      console.error("create-child-auth: cleanup deleteUser failed:", e)
    );
    return jsonErr("Account created but setup failed. Please try again.", 500);
  }

  let learnerId: string;

  if (existingLearner) {
    // Row already exists (trigger re-enabled) — update the extra fields only.
    console.log("create-child-auth: learners row already exists for", childAuthId, "— updating");
    const updatePayload: Record<string, unknown> = { full_name: fullName, email, invite_status: inviteStatus };
    if (inviteToken !== null) updatePayload.invite_token = inviteToken;

    const { data: updatedRow, error: updateErr } = await admin
      .from("learners")
      .update(updatePayload)
      .eq("user_id", childAuthId)
      .select("id")
      .single();

    if (updateErr || !updatedRow) {
      console.error("create-child-auth: learners UPDATE failed:", updateErr?.message, "— cleaning up", childAuthId);
      await admin.auth.admin.deleteUser(childAuthId).catch((e: unknown) =>
        console.error("create-child-auth: cleanup deleteUser failed:", e)
      );
      return jsonErr("Account created but setup failed. Please try again.", 500);
    }
    learnerId = updatedRow.id;
  } else {
    // Normal live path — no learners row exists, insert it.
    const insertPayload: Record<string, unknown> = {
      user_id: childAuthId,
      grade,
      full_name: fullName,
      email,
      invite_status: inviteStatus,
    };
    if (inviteToken !== null) insertPayload.invite_token = inviteToken;

    const { data: insertedRow, error: insertErr } = await admin
      .from("learners")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertErr || !insertedRow) {
      console.error("create-child-auth: learners INSERT failed:", insertErr?.message, "— cleaning up", childAuthId);
      await admin.auth.admin.deleteUser(childAuthId).catch((e: unknown) =>
        console.error("create-child-auth: cleanup deleteUser failed:", e)
      );
      return jsonErr("Account created but setup failed. Please try again.", 500);
    }
    learnerId = insertedRow.id;
  }

  // -------------------------------------------------------------------------
  // 5. Append the new learner id to the parent's linked_learners array
  // -------------------------------------------------------------------------
  return await linkAndRespond(admin, parentRecord, learnerId, childAuthId, callerId, inviteToken);
});

// ---------------------------------------------------------------------------
// linkAndRespond — appends learner to parent and returns the success response.
// ---------------------------------------------------------------------------

async function linkAndRespond(
  admin: ReturnType<typeof createClient>,
  parentRecord: { id: string; linked_learners: string[] | null },
  learnerId: string,
  childAuthId: string,
  callerId: string,
  inviteToken: string | null,
): Promise<Response> {
  const currentLinked: string[] = parentRecord.linked_learners ?? [];

  if (!currentLinked.includes(learnerId)) {
    const { error: linkErr } = await admin
      .from("parents")
      .update({ linked_learners: [...currentLinked, learnerId] })
      .eq("id", parentRecord.id);

    if (linkErr) {
      // Non-fatal: the child account and learner row exist. Log loudly but
      // don't fail the request — parent can refresh or re-link later.
      console.error(
        "create-child-auth: failed to link learner", learnerId,
        "to parent", callerId, ":", linkErr.message,
        "— account exists but may not appear in parent dashboard until re-linked.",
      );
    }
  }

  console.log(
    "create-child-auth: success — learner_id:", learnerId,
    "child_auth_id:", childAuthId,
    "parent:", callerId,
  );

  const responseBody: Record<string, unknown> = {
    ok: true,
    learner_id: learnerId,
    child_auth_id: childAuthId,
  };
  if (inviteToken !== null) responseBody.invite_token = inviteToken;

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}


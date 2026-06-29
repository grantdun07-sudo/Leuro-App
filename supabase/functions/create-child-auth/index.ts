// Supabase Edge Function: create-child-auth
//
// Creates a child Supabase Auth user for the DIRECT path
// ("I'll set the password" in the Add Child modal).
//
// The live handle_new_user trigger auto-creates a profiles row on auth.users
// INSERT but does NOT create a learners row. This function inserts the
// learners row directly, then links the child to the calling parent's
// linked_learners array. A pre-check guard handles the case where the
// trigger is later updated to also create learners rows (upsert-safe).
//
// DEPLOY:
//   supabase functions deploy create-child-auth --no-verify-jwt
//
// SECRETS REQUIRED (Supabase auto-provides these in the edge function env):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Expected request:
//   POST /functions/v1/create-child-auth
//   Authorization: Bearer <parent JWT>
//   Content-Type: application/json
//   { "email": "...", "password": "...", "full_name": "...", "grade": 10 }
//
// Responses:
//   200  { ok: true, learner_id: "...", child_auth_id: "..." }
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
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error("create-child-auth: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY not set");
    return jsonErr("Server configuration error", 500);
  }

  // Service role client — bypasses RLS for all admin DB operations.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
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

  // User-scoped client for JWT verification — standard Supabase edge function
  // pattern. The service role client's auth.getUser(jwt) does not forward the
  // JWT as the bearer token to GoTrue; it uses the service role key instead,
  // which can return a wrong caller ID and cause the parents lookup to fail
  // even when the row exists.
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

  let body: { email?: unknown; password?: unknown; full_name?: unknown; grade?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonErr("Request body must be valid JSON");
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "").trim();
  const fullName = String(body.full_name ?? "").trim();
  const grade = Number(body.grade);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonErr("Invalid email address");
  }
  if (password.length < 8) {
    return jsonErr("Password must be at least 8 characters");
  }
  if (!fullName) {
    return jsonErr("Child's name is required");
  }
  if (!Number.isInteger(grade) || grade < 4 || grade > 12) {
    return jsonErr("Grade must be a whole number between 4 and 12");
  }

  // -------------------------------------------------------------------------
  // 3. Create the child's Supabase Auth user
  //
  //    - email_confirm: true  →  no confirmation email needed (parent is
  //      setting the password on the child's behalf).
  //    - user_metadata.role   →  handle_new_user trigger reads this to
  //      decide whether to create a learners or parents row.
  //    - user_metadata.grade  →  handle_new_user reads this for the initial
  //      learners INSERT (grade NOT NULL).
  // -------------------------------------------------------------------------

  const { data: createData, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
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
  console.log("create-child-auth: created auth user", childAuthId, "for parent", callerId);

  // -------------------------------------------------------------------------
  // 4. Upsert the learners row
  //
  //    The LIVE handle_new_user trigger only creates a profiles row — it does
  //    NOT create a learners row. We INSERT here. The pre-check guard handles
  //    the case where the trigger is later re-enabled with learners support:
  //    if a row already exists for this user_id, UPDATE it instead so we
  //    never error or leave a duplicate.
  // -------------------------------------------------------------------------

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
    const { data: updatedRow, error: updateErr } = await admin
      .from("learners")
      .update({ full_name: fullName, email, invite_status: "active" })
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
    const { data: insertedRow, error: insertErr } = await admin
      .from("learners")
      .insert({
        user_id: childAuthId,
        grade,
        full_name: fullName,
        email,
        invite_status: "active",
      })
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
  return await linkAndRespond(admin, parentRecord, learnerId, childAuthId, callerId);
});

// ---------------------------------------------------------------------------
// linkAndRespond — appends learner to parent and returns the success response.
// Extracted to avoid duplicating the logic in the trigger-slow fallback path.
// ---------------------------------------------------------------------------

async function linkAndRespond(
  admin: ReturnType<typeof createClient>,
  parentRecord: { id: string; linked_learners: string[] | null },
  learnerId: string,
  childAuthId: string,
  callerId: string,
): Promise<Response> {
  const currentLinked: string[] = parentRecord.linked_learners ?? [];

  if (!currentLinked.includes(learnerId)) {
    const { error: linkErr } = await admin
      .from("parents")
      .update({ linked_learners: [...currentLinked, learnerId] })
      .eq("id", parentRecord.id);

    if (linkErr) {
      // Non-fatal: the child account and learner row exist. The parent can
      // refresh or re-link later. Log loudly but don't fail the request.
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

  return new Response(
    JSON.stringify({ ok: true, learner_id: learnerId, child_auth_id: childAuthId }),
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json",
      },
    },
  );
}

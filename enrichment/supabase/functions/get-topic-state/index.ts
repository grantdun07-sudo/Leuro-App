// Supabase Edge Function: get-topic-state
// POST { topic_name, grade, term }
//
// Returns a topic's sub-levels along with which of them THIS learner has
// unlocked, so the map can render lock state without the browser being
// trusted to decide it.
//
// STANDALONE: no shared imports - everything is inlined so this file can be
// pasted directly into the Supabase dashboard editor.
//
// SECURITY: the learner is resolved from the JWT (auth.getUser()), never
// from the request body. A learner_id in the body is ignored entirely -
// otherwise any learner could read (and later play) another learner's
// progress by passing their id.
//
// The learner_progress row is created here on first contact, seeded to the
// first sub-level in the topic, so a brand-new learner starts with exactly
// 1.1 unlocked rather than nothing.
//
// RESPONSE SHAPE:
//   { topic: { id, name },
//     furthest_unlocked_sublevel_id,
//     sublevels: [{ id, code, is_boss, sort_order, unlocked }] }
// Never includes question content or correct answers.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
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
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    // 1. Authenticate - identity comes from the token, never the body.
    const jwt = (req.headers.get("Authorization") ?? "")
      .replace(/^Bearer\s+/i, "")
      .trim();
    if (!jwt) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user: caller }, error: jwtErr } = await userClient.auth
      .getUser();
    if (jwtErr || !caller) {
      console.warn("get-topic-state: invalid JWT:", jwtErr?.message);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const topicName = String(body?.topic_name ?? "");
    const grade = Number(body?.grade);
    const term = Number(body?.term);
    if (!topicName || !Number.isFinite(grade) || !Number.isFinite(term)) {
      return jsonResponse(
        { error: "topic_name, grade and term are required" },
        400,
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Resolve the caller's learner row.
    const { data: learner, error: learnerErr } = await supabase
      .from("learners")
      .select("id")
      .eq("auth_user_id", caller.id)
      .maybeSingle();
    if (learnerErr) {
      console.error("get-topic-state: learner lookup failed:", learnerErr.message);
      return jsonResponse({ error: "Could not load learner" }, 500);
    }
    if (!learner) {
      return jsonResponse({ error: "No learner is linked to this account" }, 403);
    }

    // 3. Topic + its sub-levels.
    const { data: topic, error: topicErr } = await supabase
      .from("topics")
      .select("id, name")
      .eq("name", topicName)
      .eq("grade", grade)
      .eq("term", term)
      .maybeSingle();
    if (topicErr) {
      console.error("get-topic-state: topic lookup failed:", topicErr.message);
      return jsonResponse({ error: "Could not load topic" }, 500);
    }
    if (!topic) {
      return jsonResponse(
        { error: `Topic "${topicName}" (Grade ${grade}, Term ${term}) not found` },
        404,
      );
    }

    const { data: sublevels, error: slErr } = await supabase
      .from("sublevels")
      .select("id, code, is_boss, sort_order")
      .eq("topic_id", topic.id)
      .order("sort_order", { ascending: true });
    if (slErr) {
      console.error("get-topic-state: sublevel lookup failed:", slErr.message);
      return jsonResponse({ error: "Could not load sub-levels" }, 500);
    }
    if (!sublevels || sublevels.length === 0) {
      return jsonResponse({ error: `Topic "${topicName}" has no sub-levels` }, 404);
    }

    // 4. Progress row, created on first contact at the first sub-level.
    const { data: progress, error: progErr } = await supabase
      .from("learner_progress")
      .select("furthest_unlocked_sublevel_id")
      .eq("learner_id", learner.id)
      .eq("topic_id", topic.id)
      .maybeSingle();
    if (progErr) {
      console.error("get-topic-state: progress lookup failed:", progErr.message);
      return jsonResponse({ error: "Could not load progress" }, 500);
    }

    let furthestId = progress?.furthest_unlocked_sublevel_id ?? null;
    if (!furthestId) {
      furthestId = sublevels[0].id;
      const { error: upsertErr } = await supabase
        .from("learner_progress")
        .upsert({
          learner_id: learner.id,
          topic_id: topic.id,
          furthest_unlocked_sublevel_id: furthestId,
          updated_at: new Date().toISOString(),
        }, { onConflict: "learner_id,topic_id" });
      if (upsertErr) {
        console.error("get-topic-state: progress seed failed:", upsertErr.message);
        return jsonResponse({ error: "Could not start progress" }, 500);
      }
    }

    // 5. Unlocked = at or before the furthest unlocked sub-level in sequence.
    const furthest = sublevels.find((s) => s.id === furthestId) ?? sublevels[0];

    return jsonResponse({
      topic: { id: topic.id, name: topic.name },
      furthest_unlocked_sublevel_id: furthest.id,
      sublevels: sublevels.map((s) => ({
        id: s.id,
        code: s.code,
        is_boss: s.is_boss,
        sort_order: s.sort_order,
        unlocked: s.sort_order <= furthest.sort_order,
      })),
    });
  } catch (err) {
    console.error("get-topic-state: unexpected error:", err);
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});

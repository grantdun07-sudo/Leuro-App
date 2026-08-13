// Supabase Edge Function: start-attempt
// POST { sublevel_id }
//
// Opens an attempt at a sub-level and returns the questions for it.
//
// STANDALONE: no shared imports - everything is inlined so this file can be
// pasted directly into the Supabase dashboard editor.
//
// *** THIS IS THE FUNCTION THAT KEEPS THE ANSWER KEY OFF THE CLIENT ***
// The questions it returns carry id, question_text and options ONLY -
// correct_index is never even read here. Do not add it "for convenience":
// the entire point of grading in submit-attempt is that the browser never
// sees which option is right. RLS on `questions` (see rls-content.sql)
// closes the other route: without it the client could skip this function
// and read the table directly.
//
// SECURITY: the learner is resolved from the JWT, never from the body, and
// the sequential-unlock rule is enforced HERE rather than in the UI - a
// learner who forges a later sublevel_id gets 403 instead of a round.
//
// RESPONSE SHAPE:
//   { attempt_id, sublevel: { id, code, is_boss },
//     questions: [{ id, question_text, options }] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Locked by the product spec: 10 questions per round, drawn at random from
// the sub-level's pool. A short pool yields a short round rather than an error.
const ROUND_SIZE = 10;

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

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

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
      console.warn("start-attempt: invalid JWT:", jwtErr?.message);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const sublevelId = String(body?.sublevel_id ?? "");
    if (!sublevelId) {
      return jsonResponse({ error: "sublevel_id is required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: learner, error: learnerErr } = await supabase
      .from("learners")
      .select("id")
      .eq("auth_user_id", caller.id)
      .maybeSingle();
    if (learnerErr) {
      console.error("start-attempt: learner lookup failed:", learnerErr.message);
      return jsonResponse({ error: "Could not load learner" }, 500);
    }
    if (!learner) {
      return jsonResponse({ error: "No learner is linked to this account" }, 403);
    }

    // 1. The requested sub-level, and the topic it belongs to.
    const { data: sublevel, error: slErr } = await supabase
      .from("sublevels")
      .select("id, topic_id, code, is_boss, sort_order")
      .eq("id", sublevelId)
      .maybeSingle();
    if (slErr) {
      console.error("start-attempt: sublevel lookup failed:", slErr.message);
      return jsonResponse({ error: "Could not load sub-level" }, 500);
    }
    if (!sublevel) {
      return jsonResponse({ error: "Sub-level not found" }, 404);
    }

    // 2. SEQUENTIAL UNLOCK CHECK - authoritative, server-side.
    // A missing progress row means the learner has never played this topic,
    // so only the first sub-level is playable.
    const { data: progress, error: progErr } = await supabase
      .from("learner_progress")
      .select("furthest_unlocked_sublevel_id")
      .eq("learner_id", learner.id)
      .eq("topic_id", sublevel.topic_id)
      .maybeSingle();
    if (progErr) {
      console.error("start-attempt: progress lookup failed:", progErr.message);
      return jsonResponse({ error: "Could not load progress" }, 500);
    }

    let furthestOrder: number;
    if (progress?.furthest_unlocked_sublevel_id) {
      const { data: furthest, error: fErr } = await supabase
        .from("sublevels")
        .select("sort_order")
        .eq("id", progress.furthest_unlocked_sublevel_id)
        .maybeSingle();
      if (fErr || !furthest) {
        console.error("start-attempt: furthest lookup failed:", fErr?.message);
        return jsonResponse({ error: "Could not load progress" }, 500);
      }
      furthestOrder = furthest.sort_order;
    } else {
      const { data: first, error: firstErr } = await supabase
        .from("sublevels")
        .select("sort_order")
        .eq("topic_id", sublevel.topic_id)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (firstErr || !first) {
        console.error("start-attempt: first sublevel lookup failed:", firstErr?.message);
        return jsonResponse({ error: "Could not load progress" }, 500);
      }
      furthestOrder = first.sort_order;
    }

    if (sublevel.sort_order > furthestOrder) {
      console.warn("start-attempt: locked sub-level requested", {
        learner: learner.id,
        sublevel: sublevel.id,
        requested_order: sublevel.sort_order,
        furthest_order: furthestOrder,
      });
      return jsonResponse({ error: "This sub-level is still locked", locked: true }, 403);
    }

    // 3. Draw a random round from the pool. correct_index is deliberately NOT
    //    selected - it is never loaded here, so it cannot leak into the
    //    response by accident. submit-attempt reads the key when grading.
    const { data: pool, error: poolErr } = await supabase
      .from("questions")
      .select("id, question_text, options")
      .eq("sublevel_id", sublevel.id)
      .eq("active", true);
    if (poolErr) {
      console.error("start-attempt: question lookup failed:", poolErr.message);
      return jsonResponse({ error: "Could not load questions" }, 500);
    }
    if (!pool || pool.length === 0) {
      return jsonResponse(
        { error: `No active questions for sub-level ${sublevel.code}` },
        404,
      );
    }

    const drawn = shuffle(pool).slice(0, ROUND_SIZE);

    // 4. Open the attempt. correct_count starts at 0 and is authoritative
    //    only once submit-attempt sets completed_at.
    const { data: attempt, error: attemptErr } = await supabase
      .from("attempts")
      .insert({
        learner_id: learner.id,
        sublevel_id: sublevel.id,
        question_ids: drawn.map((q) => q.id),
        correct_count: 0,
        total_count: drawn.length,
      })
      .select("id")
      .single();
    if (attemptErr || !attempt) {
      console.error("start-attempt: attempt insert failed:", attemptErr?.message);
      return jsonResponse({ error: "Could not start attempt" }, 500);
    }

    return jsonResponse({
      attempt_id: attempt.id,
      sublevel: { id: sublevel.id, code: sublevel.code, is_boss: sublevel.is_boss },
      questions: drawn.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options,
      })),
    });
  } catch (err) {
    console.error("start-attempt: unexpected error:", err);
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});

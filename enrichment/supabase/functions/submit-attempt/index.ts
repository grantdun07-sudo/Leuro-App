// Supabase Edge Function: submit-attempt
// POST { attempt_id, answers: [{ question_id, chosen_index }] }
//
// Grades a completed round against the stored answer key and, on a pass,
// advances the learner's sequential unlock.
//
// STANDALONE: no shared imports - everything is inlined so this file can be
// pasted directly into the Supabase dashboard editor.
//
// WHY THE WHOLE ROUND IS GRADED IN ONE CALL:
// `attempts` stores question_ids, correct_count and total_count - there is
// no per-answer table. Grading question-by-question would therefore need
// either a schema change or a stateless "is this right?" endpoint, and a
// stateless one is just the answer key behind a slower door: a learner
// could query all four options per question and read the key straight off.
// Grading once, over the whole submitted set, is what the existing schema
// actually supports and is the only version that leaks nothing.
//
// SECURITY:
//   - The learner comes from the JWT; the attempt is verified to belong to
//     them, so nobody can submit answers into someone else's attempt.
//   - Only questions actually drawn for this attempt are counted, and only
//     the first answer per question - a padded or repeated answers array
//     cannot inflate the score above total_count.
//   - An attempt that already has completed_at set is rejected, so a round
//     cannot be re-submitted until it passes.
//   - The response carries the score and pass flag only. It must NEVER
//     include per-question correctness or correct_index: that would hand
//     back the answer key one round at a time, which is exactly what
//     keeping it out of start-attempt was for.
//
// RESPONSE SHAPE:
//   { score_pct, passed, correct_count, total_count,
//     furthest_unlocked_sublevel_id, unlocked_sublevel_id | null }

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
      console.warn("submit-attempt: invalid JWT:", jwtErr?.message);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const attemptId = String(body?.attempt_id ?? "");
    const answers = Array.isArray(body?.answers) ? body.answers : null;
    if (!attemptId || !answers) {
      return jsonResponse({ error: "attempt_id and answers are required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: learner, error: learnerErr } = await supabase
      .from("learners")
      .select("id")
      .eq("auth_user_id", caller.id)
      .maybeSingle();
    if (learnerErr) {
      console.error("submit-attempt: learner lookup failed:", learnerErr.message);
      return jsonResponse({ error: "Could not load learner" }, 500);
    }
    if (!learner) {
      return jsonResponse({ error: "No learner is linked to this account" }, 403);
    }

    // 1. Load the attempt and confirm it is this learner's, and still open.
    const { data: attempt, error: attemptErr } = await supabase
      .from("attempts")
      .select("id, learner_id, sublevel_id, question_ids, total_count, completed_at")
      .eq("id", attemptId)
      .maybeSingle();
    if (attemptErr) {
      console.error("submit-attempt: attempt lookup failed:", attemptErr.message);
      return jsonResponse({ error: "Could not load attempt" }, 500);
    }
    if (!attempt || attempt.learner_id !== learner.id) {
      // Same response either way - do not confirm that someone else's
      // attempt id exists.
      return jsonResponse({ error: "Attempt not found" }, 404);
    }
    if (attempt.completed_at) {
      return jsonResponse({ error: "This attempt has already been submitted" }, 409);
    }

    // 2. Grade against the stored key. Only questions drawn for this attempt
    //    count, and only the first answer given for each.
    const drawn: string[] = attempt.question_ids ?? [];
    const firstAnswer = new Map<string, number>();
    for (const a of answers) {
      const qid = String(a?.question_id ?? "");
      const choice = Number(a?.chosen_index);
      if (!qid || !Number.isInteger(choice)) continue;
      if (!drawn.includes(qid)) continue;
      if (!firstAnswer.has(qid)) firstAnswer.set(qid, choice);
    }

    const { data: keyRows, error: keyErr } = await supabase
      .from("questions")
      .select("id, correct_index")
      .in("id", drawn);
    if (keyErr) {
      console.error("submit-attempt: key lookup failed:", keyErr.message);
      return jsonResponse({ error: "Could not grade attempt" }, 500);
    }

    let correctCount = 0;
    for (const row of keyRows ?? []) {
      if (firstAnswer.get(row.id) === row.correct_index) correctCount++;
    }

    // 3. Persist the grade. score_pct and passed are generated columns, so
    //    they are read back rather than written.
    const { data: graded, error: updErr } = await supabase
      .from("attempts")
      .update({ correct_count: correctCount, completed_at: new Date().toISOString() })
      .eq("id", attempt.id)
      .is("completed_at", null)
      .select("score_pct, passed, correct_count, total_count")
      .maybeSingle();
    if (updErr) {
      console.error("submit-attempt: grade write failed:", updErr.message);
      return jsonResponse({ error: "Could not save attempt" }, 500);
    }
    if (!graded) {
      // completed_at was set between the read and the write.
      return jsonResponse({ error: "This attempt has already been submitted" }, 409);
    }

    // 4. Sub-level and topic for the unlock step.
    const { data: sublevel, error: slErr } = await supabase
      .from("sublevels")
      .select("id, topic_id, sort_order")
      .eq("id", attempt.sublevel_id)
      .maybeSingle();
    if (slErr || !sublevel) {
      console.error("submit-attempt: sublevel lookup failed:", slErr?.message);
      return jsonResponse({ error: "Could not load sub-level" }, 500);
    }

    const { data: progress } = await supabase
      .from("learner_progress")
      .select("furthest_unlocked_sublevel_id")
      .eq("learner_id", learner.id)
      .eq("topic_id", sublevel.topic_id)
      .maybeSingle();

    let furthestId: string | null = progress?.furthest_unlocked_sublevel_id ?? null;
    let furthestOrder = sublevel.sort_order;
    if (furthestId) {
      const { data: f } = await supabase
        .from("sublevels")
        .select("sort_order")
        .eq("id", furthestId)
        .maybeSingle();
      if (f) furthestOrder = f.sort_order;
    }

    // 5. Advance only when the learner passed AND was playing at their
    //    frontier. Replaying an earlier sub-level must not push the
    //    frontier backwards or forwards.
    let unlockedSublevelId: string | null = null;
    if (graded.passed && sublevel.sort_order >= furthestOrder) {
      const { data: next } = await supabase
        .from("sublevels")
        .select("id")
        .eq("topic_id", sublevel.topic_id)
        .gt("sort_order", sublevel.sort_order)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (next) {
        const { error: upErr } = await supabase
          .from("learner_progress")
          .upsert({
            learner_id: learner.id,
            topic_id: sublevel.topic_id,
            furthest_unlocked_sublevel_id: next.id,
            updated_at: new Date().toISOString(),
          }, { onConflict: "learner_id,topic_id" });
        if (upErr) {
          console.error("submit-attempt: unlock write failed:", upErr.message);
        } else {
          unlockedSublevelId = next.id;
          furthestId = next.id;
        }
      } else {
        // Topic finished - the boss was the last sub-level.
        furthestId = furthestId ?? sublevel.id;
      }
    }

    return jsonResponse({
      score_pct: graded.score_pct,
      passed: graded.passed,
      correct_count: graded.correct_count,
      total_count: graded.total_count,
      furthest_unlocked_sublevel_id: furthestId,
      unlocked_sublevel_id: unlockedSublevelId,
    });
  } catch (err) {
    console.error("submit-attempt: unexpected error:", err);
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});

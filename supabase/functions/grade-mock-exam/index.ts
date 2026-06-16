// Supabase Edge Function: grade-mock-exam
// POST { examId, responses: [{ questionId, answer }], lang? }
//   responses: one entry per question — answer is "A"|"B"|"C"|"D"
//   lang: optional override ("en"|"af"); falls back to profile lang
//
// Deterministic MCQ grader — NO AI call.
// For each question: compare the submitted answer letter to the stored
// correct_answer in the answer key. Binary scoring only:
//   match   → marks_awarded = question.marks, is_correct = true
//   no match → marks_awarded = 0,             is_correct = false
//
// Persists: INSERT mock_exam_responses (learner_response, marks_awarded,
// feedback). UPDATE mock_exams (learner_score, completed_at).
//
// Returns: { totalAwarded, totalMarks, percentage,
//   results: [{ question_id, learner_answer, correct_answer, is_correct,
//               marks_awarded, explanation }] }
//
// Auth: caller must be the learner who owns the exam.
// Writes use service-role (mock_exams / mock_exam_responses have no
// client-facing INSERT/UPDATE RLS policy).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AnswerKeyEntry {
  answer?: string;
  explanation?: string;
}

function parseAnswerKey(raw: string | null): AnswerKeyEntry {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return { answer: raw };
  }
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
    const { examId, responses, lang: clientLang } = body as {
      examId?: string;
      responses?: { questionId: string; answer: string }[];
      lang?: string;
    };

    if (!examId || !Array.isArray(responses) || responses.length === 0) {
      return jsonResponse({ error: "examId and responses are required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service-role client for writes — mock_exams and mock_exam_responses
    // have no client-facing INSERT/UPDATE policy.
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    const [{ data: learner }, { data: profile }] = await Promise.all([
      supabase.from("learners").select("id").eq("user_id", userData.user.id).single(),
      supabase.from("profiles").select("lang").eq("id", userData.user.id).single(),
    ]);

    if (!learner) {
      return jsonResponse({ error: "Learner not found" }, 404);
    }

    const lang = clientLang ?? profile?.lang ?? "en";
    const isAf = lang === "af";

    // Verify the exam belongs to this learner.
    const { data: exam, error: examErr } = await supabase
      .from("mock_exams")
      .select("id, learner_id, total_marks")
      .eq("id", examId)
      .eq("learner_id", learner.id)
      .single();

    if (examErr || !exam) {
      return jsonResponse({ error: "Exam not found" }, 404);
    }

    // Load stored answer keys — questions are readable by the learner via JWT.
    const { data: questions, error: questionsErr } = await supabase
      .from("mock_exam_questions")
      .select("id, question_order, marks, correct_answer")
      .eq("exam_id", examId)
      .order("question_order", { ascending: true });

    if (questionsErr || !questions || questions.length === 0) {
      return jsonResponse({ error: "Exam questions not found" }, 404);
    }

    // Build answer lookup: questionId → submitted letter (uppercase).
    const answerMap = new Map(
      responses.map((r) => [r.questionId, String(r.answer ?? "").trim().toUpperCase()]),
    );

    // Grade deterministically — no AI call.
    const gradedResults = questions.map((q) => {
      const key = parseAnswerKey(q.correct_answer);
      const correctLetter = String(key.answer ?? "").trim().toUpperCase();
      const givenLetter = answerMap.get(q.id) ?? "";
      const isCorrect = correctLetter.length > 0 && givenLetter === correctLetter;
      const marksAwarded = isCorrect ? (q.marks ?? 0) : 0;

      return {
        question_id: q.id,
        learner_answer: givenLetter || null,
        correct_answer: correctLetter,
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
        explanation: key.explanation ?? "",
      };
    });

    const totalAwarded = gradedResults.reduce((sum, r) => sum + r.marks_awarded, 0);
    const totalMarks = (exam.total_marks ?? 0) ||
      questions.reduce((sum, q) => sum + (q.marks ?? 0), 0);
    const percentage = totalMarks > 0 ? Math.round((totalAwarded / totalMarks) * 100) : 0;

    // Persist responses using existing schema columns.
    // NOTE: When you add `correct_answer` (text) and `is_correct` (bool) columns
    // to mock_exam_responses, include them in this INSERT and the .select() below.
    const responseRows = gradedResults.map((r) => ({
      question_id: r.question_id,
      learner_response: r.learner_answer ?? "",
      marks_awarded: r.marks_awarded,
      feedback: r.is_correct
        ? (isAf ? "Korrek!" : "Correct!")
        : isAf
          ? `Verkeerd. Die korrekte antwoord was: ${r.correct_answer}.`
          : `Incorrect. The correct answer was: ${r.correct_answer}.`,
    }));

    const { error: insertErr } = await supabaseAdmin
      .from("mock_exam_responses")
      .insert(responseRows);

    if (insertErr) {
      console.error("Failed to insert exam responses:", insertErr);
      return jsonResponse({ error: "Failed to save exam results" }, 500);
    }

    const { error: updateErr } = await supabaseAdmin
      .from("mock_exams")
      .update({ learner_score: totalAwarded, completed_at: new Date().toISOString() })
      .eq("id", examId);

    if (updateErr) {
      console.error("Failed to update exam record:", updateErr);
      // Non-fatal — grading data is already inserted; return results anyway.
    }

    // Alert parents when performance is below 50%.
    if (totalMarks > 0 && totalAwarded / totalMarks < 0.5) {
      await supabaseAdmin.rpc("create_parent_alert", {
        p_learner_id: learner.id,
        p_alert_type: "low_performance",
        p_message: `A mock exam was completed with a low score: ${totalAwarded}/${totalMarks}.`,
      });
    }

    return jsonResponse({ totalAwarded, totalMarks, percentage, results: gradedResults });
  } catch (err) {
    console.error("grade-mock-exam error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

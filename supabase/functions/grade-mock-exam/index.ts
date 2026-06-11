// Supabase Edge Function: grade-mock-exam
// POST { examId, responses: [{ questionId, answer }] }
//
// Returns: {
//   totalAwarded: number, totalMarks: number,
//   results: [{ question_id, marks_awarded, feedback }]
// }
//
// Auth: caller must be the learner who owns the exam. MCQ questions are
// graded by exact match against the stored answer key (no AI call needed).
// Short-answer/extended questions are auto-graded in a single Claude Haiku
// call (with prompt caching), using the stored model answer / mark scheme
// as additional grading context.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { callClaude, ClaudeTimeoutError } from "../_shared/anthropic.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SYSTEM_PROMPT = `You are Leuro™, an exam marker for South African school learners following
the CAPS curriculum. You will be given a list of short-answer/extended exam
questions, each with its mark allocation, a model answer / mark scheme, and
the learner's written answer. Mark each answer fairly against the mark
scheme: award full marks for fully correct answers, partial marks for
partially correct reasoning/working, and zero for incorrect or blank
answers. Provide brief, constructive feedback (1-2 sentences) per question.

You MUST respond with ONLY a valid JSON array, no markdown fences, no
commentary. Each element must be: { "question_order": number,
"marks_awarded": number, "feedback": string }. marks_awarded must be an
integer between 0 and the question's max marks (inclusive).`;

interface AnswerKeyEntry {
  answer?: string;
  explanation?: string;
}

function parseAnswerKey(raw: string | null): AnswerKeyEntry | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : null;
  } catch {
    return { answer: raw };
  }
}

function extractJsonArray(text: string): unknown[] {
  let candidate = text.trim();
  const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) candidate = fenceMatch[1].trim();

  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    candidate = candidate.slice(start, end + 1);
  }

  const parsed = JSON.parse(candidate);
  if (!Array.isArray(parsed)) throw new Error("Response is not a JSON array");
  return parsed;
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
    const { examId, responses } = body as {
      examId?: string;
      responses?: { questionId: string; answer: string }[];
    };

    if (!examId || !Array.isArray(responses) || responses.length === 0) {
      return jsonResponse({ error: "examId and responses are required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    const { data: learner } = await supabase
      .from("learners")
      .select("id")
      .eq("user_id", userData.user.id)
      .single();

    if (!learner) {
      return jsonResponse({ error: "Learner not found" }, 404);
    }

    const { data: exam, error: examErr } = await supabase
      .from("mock_exams")
      .select("id, learner_id, subject_id, total_marks")
      .eq("id", examId)
      .eq("learner_id", learner.id)
      .single();

    if (examErr || !exam) {
      return jsonResponse({ error: "Exam not found" }, 404);
    }

    const { data: questions, error: questionsErr } = await supabase
      .from("mock_exam_questions")
      .select("id, question_text, question_type, marks, question_order, correct_answer")
      .eq("exam_id", examId)
      .order("question_order", { ascending: true });

    if (questionsErr || !questions || questions.length === 0) {
      return jsonResponse({ error: "Exam questions not found" }, 404);
    }

    const answerMap = new Map(responses.map((r) => [r.questionId, r.answer ?? ""]));

    // MCQ questions are graded by exact match against the stored answer key.
    const mcqResults = new Map<string, { marks_awarded: number; feedback: string }>();
    const aiQuestions = [];

    for (const q of questions) {
      const learnerAnswer = answerMap.get(q.id) ?? "";
      const key = parseAnswerKey(q.correct_answer);

      if (q.question_type === "mcq") {
        const correct = (key?.answer ?? "").trim().toLowerCase();
        const given = learnerAnswer.trim().toLowerCase();
        const isCorrect = correct.length > 0 && given === correct;
        mcqResults.set(q.id, {
          marks_awarded: isCorrect ? q.marks : 0,
          feedback: isCorrect
            ? `Correct! ${key?.explanation ?? ""}`.trim()
            : `Incorrect. The correct answer was: ${key?.answer ?? "(unknown)"}. ${key?.explanation ?? ""}`.trim(),
        });
      } else {
        aiQuestions.push({
          question_order: q.question_order,
          question_text: q.question_text,
          max_marks: q.marks,
          model_answer: key?.answer ?? "(no model answer available)",
          mark_scheme_notes: key?.explanation ?? "",
          learner_answer: learnerAnswer || "(no answer provided)",
        });
      }
    }

    let aiGrades: { question_order: number; marks_awarded: number; feedback: string }[] = [];

    if (aiQuestions.length > 0) {
      const userPrompt = `Mark the following exam responses against their model answers:\n\n${JSON.stringify(aiQuestions, null, 2)}`;

      let responseText: string;
      try {
        const result = await callClaude(SYSTEM_PROMPT, userPrompt, 2048);
        responseText = result.text;
      } catch (err) {
        if (err instanceof ClaudeTimeoutError) {
          console.error("Anthropic request timed out:", err);
          return jsonResponse({ error: "AI grading timed out. Please try again." }, 500);
        }
        console.error("Anthropic API error:", err);
        return jsonResponse({ error: "Failed to grade exam" }, 500);
      }

      try {
        const parsed = extractJsonArray(responseText) as Array<{
          question_order?: number;
          marks_awarded?: number;
          feedback?: string;
        }>;
        aiGrades = parsed.map((g) => ({
          question_order: Number(g.question_order ?? 0),
          marks_awarded: Math.max(0, Math.round(Number(g.marks_awarded ?? 0))),
          feedback: String(g.feedback ?? ""),
        }));
      } catch (parseErr) {
        console.error("Failed to parse grading result:", parseErr, responseText);
        return jsonResponse({ error: "Failed to grade exam. Please try again." }, 500);
      }
    }

    const aiGradeByOrder = new Map(aiGrades.map((g) => [g.question_order, g]));

    const responseRows = questions.map((q) => {
      const learnerAnswer = answerMap.get(q.id) ?? "";
      const mcq = mcqResults.get(q.id);
      if (mcq) {
        return {
          question_id: q.id,
          learner_response: learnerAnswer,
          marks_awarded: mcq.marks_awarded,
          feedback: mcq.feedback,
        };
      }
      const grade = aiGradeByOrder.get(q.question_order ?? -1);
      const marksAwarded = Math.min(grade?.marks_awarded ?? 0, q.marks);
      return {
        question_id: q.id,
        learner_response: learnerAnswer,
        marks_awarded: marksAwarded,
        feedback: grade?.feedback || "No feedback available.",
      };
    });

    const { data: insertedResponses, error: insertErr } = await supabase
      .from("mock_exam_responses")
      .insert(responseRows)
      .select("question_id, marks_awarded, feedback");

    if (insertErr || !insertedResponses) {
      console.error("Failed to insert exam responses:", insertErr);
      return jsonResponse({ error: "Failed to save exam results" }, 500);
    }

    const totalAwarded = responseRows.reduce((sum, r) => sum + r.marks_awarded, 0);

    await supabase
      .from("mock_exams")
      .update({ learner_score: totalAwarded, completed_at: new Date().toISOString() })
      .eq("id", examId);

    // Notify parents if performance is low (< 50%)
    if (exam.total_marks > 0 && totalAwarded / exam.total_marks < 0.5) {
      await supabase.rpc("create_parent_alert", {
        p_learner_id: learner.id,
        p_alert_type: "low_performance",
        p_message: `A mock exam was completed with a low score: ${totalAwarded}/${exam.total_marks}.`,
      });
    }

    return jsonResponse({
      totalAwarded,
      totalMarks: exam.total_marks,
      results: insertedResponses,
    });
  } catch (err) {
    console.error("grade-mock-exam error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

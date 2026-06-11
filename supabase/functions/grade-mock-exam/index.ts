// Supabase Edge Function: grade-mock-exam
// POST { examId, responses: [{ questionId, answer }] }
//
// Returns: {
//   totalAwarded: number, totalMarks: number,
//   results: [{ questionId, marksAwarded, feedback }]
// }
//
// Auth: caller must be the learner who owns the exam. Auto-grades all
// questions in a single Claude Haiku call (with prompt caching) and
// records the outcome.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are Leuro, an exam marker for South African school learners following
the CAPS curriculum. You will be given a list of exam questions, each with
its mark allocation and the learner's written answer. Mark each answer
fairly: award full marks for fully correct answers, partial marks for
partially correct reasoning/working, and zero for incorrect or blank
answers. Provide brief, constructive feedback (1-2 sentences) per question.

You MUST respond with ONLY a valid JSON array, no markdown fences, no
commentary. Each element must be: { "question_order": number,
"marks_awarded": number, "feedback": string }. marks_awarded must be an
integer between 0 and the question's max marks (inclusive).`;

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
      .select("id, question_text, marks, question_order")
      .eq("exam_id", examId)
      .order("question_order", { ascending: true });

    if (questionsErr || !questions || questions.length === 0) {
      return jsonResponse({ error: "Exam questions not found" }, 404);
    }

    const answerMap = new Map(responses.map((r) => [r.questionId, r.answer ?? ""]));

    const gradingInput = questions.map((q) => ({
      question_order: q.question_order,
      question_text: q.question_text,
      max_marks: q.marks,
      learner_answer: answerMap.get(q.id) ?? "(no answer provided)",
    }));

    const userPrompt = `Mark the following exam responses:\n\n${JSON.stringify(gradingInput, null, 2)}`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", errText);
      return jsonResponse({ error: "Failed to grade exam" }, 502);
    }

    const data = await anthropicRes.json();
    const responseText = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n");

    let grades: { question_order: number; marks_awarded: number; feedback: string }[];
    try {
      const parsed = extractJsonArray(responseText) as Array<{
        question_order?: number;
        marks_awarded?: number;
        feedback?: string;
      }>;
      grades = parsed.map((g) => ({
        question_order: Number(g.question_order ?? 0),
        marks_awarded: Math.max(0, Math.round(Number(g.marks_awarded ?? 0))),
        feedback: String(g.feedback ?? ""),
      }));
    } catch (parseErr) {
      console.error("Failed to parse grading result:", parseErr, responseText);
      return jsonResponse({ error: "Failed to grade exam. Please try again." }, 502);
    }

    const gradeByOrder = new Map(grades.map((g) => [g.question_order, g]));

    const responseRows = questions.map((q) => {
      const grade = gradeByOrder.get(q.question_order ?? -1);
      const marksAwarded = Math.min(grade?.marks_awarded ?? 0, q.marks);
      return {
        question_id: q.id,
        learner_response: answerMap.get(q.id) ?? "",
        marks_awarded: marksAwarded,
        feedback: grade?.feedback ?? "No feedback available.",
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

// Supabase Edge Function: generate-mock-exam
// POST { learnerId, subjectId, difficulty }
//   difficulty: 'low' | 'medium' | 'high'
//
// Returns: { examId, questions: [{ id, question_text, question_type, marks,
//             question_order, options?, blooms_level }], totalMarks, difficulty }
//
// Auth: caller must be the learner identified by learnerId. "low" difficulty
// is available on all tiers; "medium"/"high" are Premium-only. The model's
// answer key is stored server-side (for grading) but never returned to the
// client.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { callClaude, ClaudeTimeoutError } from "../_shared/anthropic.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const TOTAL_MARKS = 30;

const SYSTEM_PROMPT = `You are Leuro™, a CAPS expert exam-setter for South African school
learners (Grades 4-12).

QUALITY RULES:
- Every question must be ORIGINAL - never reproduce or closely paraphrase
  DBE/IEB past paper questions.
- Questions must follow CAPS cognitive complexity standards for the
  specified grade and apply Bloom's Taxonomy. For "high" difficulty
  questions, also apply Barrett's critical-thinking taxonomy (analysis,
  evaluation, problem-solving, original creation).
- For "mcq" questions: provide exactly 4 plausible options with exactly 1
  correct answer.
- For "shortanswer" and "extended" questions: provide a clear, original
  model answer / mark scheme in the answer key.
- Use South African context, examples, names and data where relevant.
- Keep language age-appropriate for the grade.
- If asked to respond in Afrikaans, write all question and option text in
  Afrikaans (the JSON keys themselves stay in English).

You MUST respond with ONLY valid JSON, no markdown fences, no commentary,
matching this exact shape:
{
  "questions": [
    {
      "number": 1,
      "text": "question text",
      "type": "mcq" | "shortanswer" | "extended",
      "marks": 5,
      "options": ["option A", "option B", "option C", "option D"],
      "bloomsLevel": "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create"
    }
  ],
  "answerKey": {
    "1": { "answer": "model answer or correct option text", "explanation": "brief explanation of the mark scheme" }
  }
}
Omit "options" for non-mcq questions. The "answerKey" must have one entry
per question, keyed by its "number" as a string.`;

interface DifficultySpec {
  count: number;
  marksEach: number;
  bloomsRange: string;
  questionMix: string;
  cognitiveLoad: string;
}

const DIFFICULTY_SPECS: Record<string, DifficultySpec> = {
  low: {
    count: 6,
    marksEach: 5,
    bloomsRange: "Remember -> Understand",
    questionMix:
      "a mix of multiple-choice ('mcq', 4 options) and short-answer ('shortanswer', 1-2 sentence) questions: " +
      "definitions, simple recall, and basic application",
    cognitiveLoad: "Easy",
  },
  medium: {
    count: 5,
    marksEach: 6,
    bloomsRange: "Understand -> Apply -> Analyze",
    questionMix:
      "a mix of multiple-choice ('mcq', 4 options), short-answer ('shortanswer', 2-3 sentence), and " +
      "calculation questions (use 'shortanswer' type for calculations): application, simple analysis, and interpretation",
    cognitiveLoad: "Moderate",
  },
  high: {
    count: 3,
    marksEach: 10,
    bloomsRange: "Analyze -> Evaluate -> Create",
    questionMix:
      "extended-response ('extended') questions only: analysis, evaluation, problem-solving, case-study " +
      "analysis, and design/critical-thinking tasks",
    cognitiveLoad: "High",
  },
};

interface RawQuestion {
  number?: number;
  text?: string;
  type?: string;
  marks?: number;
  options?: string[];
  bloomsLevel?: string;
}

interface RawAnswer {
  answer?: string;
  explanation?: string;
}

interface ParsedExam {
  questions: RawQuestion[];
  answerKey: Record<string, RawAnswer | string>;
}

const QUESTION_TYPES = new Set(["mcq", "shortanswer", "extended"]);

function extractJsonObject(text: string): ParsedExam {
  let candidate = text.trim();
  const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) candidate = fenceMatch[1].trim();

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    candidate = candidate.slice(start, end + 1);
  }

  const parsed = JSON.parse(candidate);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.questions)) {
    throw new Error("Response is missing a 'questions' array");
  }
  return {
    questions: parsed.questions,
    answerKey: parsed.answerKey && typeof parsed.answerKey === "object" ? parsed.answerKey : {},
  };
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
    const { learnerId, subjectId, difficulty } = body as {
      learnerId?: string;
      subjectId?: string;
      difficulty?: string;
    };

    if (!learnerId || !subjectId || !difficulty) {
      return jsonResponse({ error: "learnerId, subjectId and difficulty are required" }, 400);
    }

    const spec = DIFFICULTY_SPECS[difficulty];
    if (!spec) {
      return jsonResponse({ error: "difficulty must be 'low', 'medium' or 'high'" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    const [{ data: learner, error: learnerErr }, { data: profile }] = await Promise.all([
      supabase
        .from("learners")
        .select("id, grade, diagnostic_level")
        .eq("id", learnerId)
        .eq("user_id", userData.user.id)
        .single(),
      supabase.from("profiles").select("subscription_tier, lang").eq("id", userData.user.id).single(),
    ]);

    if (learnerErr || !learner) {
      return jsonResponse({ error: "Learner not found" }, 404);
    }

    const tier = profile?.subscription_tier ?? "free";
    const lang = profile?.lang ?? "en";

    // "low" difficulty is available on every tier; "medium"/"high" are Premium-only.
    if (difficulty !== "low" && tier !== "premium") {
      return jsonResponse(
        {
          error: "premium_required",
          message:
            lang === "af"
              ? "Medium- en hoë-moeilikheidsgraad-toetseksamens is 'n Premium-funksie. Gradeer op om toegang te kry."
              : "Medium and high difficulty mock exams are a Premium feature. Upgrade to unlock them.",
        },
        403,
      );
    }

    const { data: subject, error: subjectErr } = await supabase
      .from("subjects")
      .select("name, grade")
      .eq("id", subjectId)
      .single();

    if (subjectErr || !subject) {
      return jsonResponse({ error: "Subject not found" }, 404);
    }

    const { data: topics } = await supabase
      .from("topics")
      .select("title")
      .eq("learner_id", learner.id)
      .eq("subject_id", subjectId);

    const topicList = (topics ?? []).map((t) => t.title).join(", ") || "general curriculum topics";
    const level = learner.diagnostic_level || 1;

    const userPrompt = `Generate a ${difficulty}-difficulty CAPS mock exam for ${subject.name}, Grade ${subject.grade}.
Bloom's level range for this difficulty: ${spec.bloomsRange} (cognitive load: ${spec.cognitiveLoad}).
Question mix: ${spec.questionMix}.
Learner diagnostic level: ${level}/5.
Learner's recent study topics: ${topicList}.
Language: ${lang === "af" ? "Afrikaans" : "English"}.

Produce exactly ${spec.count} questions, numbered 1 to ${spec.count}, each
worth exactly ${spec.marksEach} marks (total ${spec.count * spec.marksEach}
marks). Respond with ONLY the JSON object described in the system prompt.`;

    let responseText: string;
    try {
      const result = await callClaude(SYSTEM_PROMPT, userPrompt, 3072);
      responseText = result.text;
    } catch (err) {
      if (err instanceof ClaudeTimeoutError) {
        console.error("Anthropic request timed out:", err);
        return jsonResponse({ error: "AI generation timed out. Please try again." }, 500);
      }
      console.error("Anthropic API error:", err);
      return jsonResponse({ error: "Failed to generate mock exam" }, 500);
    }

    let questions: {
      number: number;
      text: string;
      type: string;
      marks: number;
      options: string[] | null;
      bloomsLevel: string | null;
      correctAnswer: string | null;
    }[];
    try {
      const parsed = extractJsonObject(responseText);
      questions = parsed.questions.map((q, i) => {
        const number = Number(q.number ?? i + 1);
        const type = QUESTION_TYPES.has(String(q.type)) ? String(q.type) : "shortanswer";
        const rawAnswer = parsed.answerKey[String(number)];
        const answerObj =
          typeof rawAnswer === "string" ? { answer: rawAnswer, explanation: "" } : rawAnswer ?? null;

        return {
          number,
          text: String(q.text ?? `Question ${number}`),
          type,
          marks: Number(q.marks ?? spec.marksEach),
          options: type === "mcq" && Array.isArray(q.options) ? q.options.map((o) => String(o)) : null,
          bloomsLevel: q.bloomsLevel ? String(q.bloomsLevel) : null,
          correctAnswer: answerObj ? JSON.stringify(answerObj) : null,
        };
      });
      if (questions.length === 0) throw new Error("No questions returned");
    } catch (parseErr) {
      console.error("Failed to parse exam questions:", parseErr, responseText);
      return jsonResponse({ error: "Failed to generate a valid exam. Please try again." }, 500);
    }

    const { data: exam, error: examErr } = await supabase
      .from("mock_exams")
      .insert({
        learner_id: learner.id,
        subject_id: subjectId,
        difficulty,
        total_marks: TOTAL_MARKS,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (examErr || !exam) {
      console.error("Failed to create exam:", examErr);
      return jsonResponse({ error: "Failed to create exam" }, 500);
    }

    const rows = questions.map((q) => ({
      exam_id: exam.id,
      question_text: q.text,
      question_type: q.type,
      options: q.options,
      blooms_level: q.bloomsLevel,
      correct_answer: q.correctAnswer,
      marks: q.marks,
      question_order: q.number,
    }));

    // Select only learner-facing columns - correct_answer is kept server-side for grading.
    const { data: insertedQuestions, error: insertErr } = await supabase
      .from("mock_exam_questions")
      .insert(rows)
      .select("id, question_text, question_type, options, blooms_level, marks, question_order");

    if (insertErr || !insertedQuestions) {
      console.error("Failed to insert exam questions:", insertErr);
      return jsonResponse({ error: "Failed to save exam questions" }, 500);
    }

    return jsonResponse({
      examId: exam.id,
      questions: insertedQuestions.sort((a, b) => (a.question_order ?? 0) - (b.question_order ?? 0)),
      totalMarks: TOTAL_MARKS,
      difficulty,
    });
  } catch (err) {
    console.error("generate-mock-exam error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

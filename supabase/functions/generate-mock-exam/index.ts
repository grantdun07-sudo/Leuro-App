// Supabase Edge Function: generate-mock-exam
// POST { learnerId, subjectId, difficulty, term?, topics? }
//   difficulty: 'low' | 'medium' | 'high'
//   term: 1 | 2 | 3 | 4 (CAPS term, optional)
//   topics: string[] - learner-specified topics to examine (optional)
//
// Returns: { examId, questions: [{ id, question_text, question_type, marks,
//             question_order, options, blooms_level, correct_answer,
//             explanation }], totalMarks, difficulty }
//
// All questions are multiple-choice (MCQ). Difficulty controls cognitive
// complexity (Bloom's level / distractor subtlety), not question type.
// Because grading is now done client-side, the correct option letter
// ("A"-"D") and a short explanation are returned to the client (this is a
// low-stakes practice tool). The answer key is also stored server-side.
//
// Auth: caller must be the learner identified by learnerId. Mock exams
// (every difficulty) are Premium-only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { callClaude, ClaudeTimeoutError } from "../_shared/anthropic.ts";
import { langInstruction, JSON_KEYS_ENGLISH_NOTE } from "../_shared/prompts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Rate limiting.
const RATE_LIMIT_HOURLY_CAP = 10;
const RATE_LIMIT_DAILY_CAP = 30;

const SYSTEM_PROMPT = `You are Leuro™, a CAPS expert exam-setter for South African school
learners (Grades 4-12).

QUALITY RULES:
- Every question must be ORIGINAL - never reproduce or closely paraphrase
  DBE/IEB past paper questions.
- ALL questions are multiple-choice (MCQ). Each question must have EXACTLY 4
  options with EXACTLY 1 correct answer. Difficulty controls the cognitive
  complexity of the questions (Bloom's level), NOT the question format.
- Questions must follow CAPS cognitive complexity standards for the
  specified grade and apply Bloom's Taxonomy. For "high" difficulty
  questions, also apply Barrett's critical-thinking taxonomy (analysis,
  evaluation, problem-solving, original creation).
- The 3 distractors (incorrect options) must be plausible and
  pedagogically meaningful - built on common misconceptions or typical
  errors, never obviously wrong or filler.
- For "high" difficulty, the distractors must require multi-step reasoning
  to eliminate, and each question must genuinely test analysis, evaluation
  or creation rather than simple recall.
- Use South African context, examples, names and data where relevant.
- Keep language age-appropriate for the grade.
- If asked to respond in Afrikaans, write all question text, option text, and
  answer key explanations in Afrikaans. The explanation field in the answerKey
  must also be in Afrikaans. JSON keys themselves stay in English.

You MUST respond with ONLY valid JSON, no markdown fences, no commentary,
matching this exact shape:
{
  "questions": [
    {
      "number": 1,
      "text": "question text",
      "options": ["option A", "option B", "option C", "option D"],
      "bloomsLevel": "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create",
      "marks": 3
    }
  ],
  "answerKey": {
    "1": { "answer": "A", "explanation": "brief explanation of why this option is correct" }
  }
}
Every question must have exactly 4 options. The "answerKey" must have one
entry per question, keyed by its "number" as a string, and "answer" must be
exactly one of "A", "B", "C" or "D" indicating the correct option.`;

interface DifficultySpec {
  count: number;
  marksEach: number;
  bloomsRange: string;
  cognitiveLoad: string;
}

const DIFFICULTY_SPECS: Record<string, DifficultySpec> = {
  low: { count: 10, marksEach: 3, bloomsRange: "Remember -> Understand", cognitiveLoad: "Easy" },
  medium: { count: 6, marksEach: 5, bloomsRange: "Understand -> Apply -> Analyze", cognitiveLoad: "Moderate" },
  high: { count: 5, marksEach: 6, bloomsRange: "Analyze -> Evaluate -> Create", cognitiveLoad: "High" },
};

interface RawQuestion {
  number?: number;
  text?: string;
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

const VALID_LETTERS = new Set(["A", "B", "C", "D"]);

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
    const { learnerId, subjectId, difficulty, term, topics } = body as {
      learnerId?: string;
      subjectId?: string;
      difficulty?: string;
      term?: number;
      topics?: string[];
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

    // Service-role client, used only for the mock_exams / mock_exam_questions
    // inserts below - those tables have no client-facing INSERT policy, so
    // the anon+JWT client gets 42501 (RLS) on write.
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    // --- Rate limit check: generate-mock-exam ---
    // Runs before any Claude call so we never bill for a call we're about
    // to reject. Fail-closed: if the check itself errors, block the
    // request rather than silently letting it through as unlimited.
    const rateLimitUserId = userData.user.id;

    const { count: hourlyCount, error: hourlyErr } = await supabaseAdmin
      .from("api_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", rateLimitUserId)
      .eq("function_name", "generate-mock-exam")
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    const { count: dailyCount, error: dailyErr } = await supabaseAdmin
      .from("api_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", rateLimitUserId)
      .eq("function_name", "generate-mock-exam")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (hourlyErr || dailyErr) {
      console.error("generate-mock-exam: rate limit check failed:", hourlyErr ?? dailyErr);
      return jsonResponse({ error: "Rate limit check failed, please try again" }, 503);
    }

    if ((hourlyCount ?? 0) >= RATE_LIMIT_HOURLY_CAP || (dailyCount ?? 0) >= RATE_LIMIT_DAILY_CAP) {
      return jsonResponse(
        { error: "rate_limit_exceeded", message: "You've reached your usage limit. Please try again later." },
        429,
      );
    }

    // Log this call before the Claude API call - worst case we log a call
    // that then fails downstream, which just makes the limit slightly more
    // conservative, which is safe.
    await supabaseAdmin.from("api_rate_limits").insert({
      user_id: rateLimitUserId,
      function_name: "generate-mock-exam",
    });
    // --- End rate limit check ---

    const [{ data: learner, error: learnerErr }, { data: profile }] = await Promise.all([
      supabase
        .from("learners")
        .select("id, grade, diagnostic_level, subscription_status")
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

    // A failed/cancelled renewal (learners.subscription_status) overrides
    // subscription_tier: the tier column can lag briefly before the webhook
    // clears it, so status is the authoritative signal for whether premium
    // access should still apply.
    const isPastDueOrCancelled = learner.subscription_status === "past_due" || learner.subscription_status === "cancelled";
    const effectivelyPremium = tier === "premium" && !isPastDueOrCancelled;

    // Mock Exam (every difficulty) is Premium-only.
    if (!effectivelyPremium) {
      return jsonResponse(
        {
          error: "premium_required",
          message:
            lang === "af"
              ? "Toetseksamens is 'n Premium-funksie. Gradeer op om toegang te kry."
              : "Mock exams are a Premium feature. Upgrade to unlock them.",
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

    const requestedTopics = Array.isArray(topics)
      ? topics.map((tp) => String(tp).trim()).filter(Boolean)
      : [];

    let topicList: string;
    if (requestedTopics.length > 0) {
      topicList = requestedTopics.join(", ");
    } else {
      const { data: recentTopics } = await supabase
        .from("topics")
        .select("title")
        .eq("learner_id", learner.id)
        .eq("subject_id", subjectId);

      topicList = (recentTopics ?? []).map((t) => t.title).join(", ") || "general curriculum topics";
    }

    const level = learner.diagnostic_level || 1;
    const termNum = Number(term);
    const termLine = termNum >= 1 && termNum <= 4 ? `\nCAPS Term: Term ${termNum}.` : "";

    const userPrompt = `Generate a ${difficulty}-difficulty CAPS mock exam for ${subject.name}, Grade ${subject.grade}.${termLine}
All questions are multiple-choice (MCQ) with exactly 4 options each and exactly one correct answer.
Bloom's level range for this difficulty: ${spec.bloomsRange} (cognitive load: ${spec.cognitiveLoad}).
Difficulty controls the cognitive complexity of the questions and the subtlety of the distractors, not the question format.
Learner diagnostic level: ${level}/5.
${requestedTopics.length > 0 ? "Focus the exam specifically and only on these topics" : "Learner's recent study topics"}: ${topicList}.
${langInstruction(lang)}
${JSON_KEYS_ENGLISH_NOTE}

Produce exactly ${spec.count} questions, numbered 1 to ${spec.count}, each
worth exactly ${spec.marksEach} marks (total ${spec.count * spec.marksEach}
marks).${requestedTopics.length > 0 ? " Every question must relate directly to the topics listed above." : ""} Respond with ONLY the JSON object described in the system prompt.`;

    let responseText: string;
    try {
      const result = await callClaude(SYSTEM_PROMPT, userPrompt, 4096, "generate-mock-exam");
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
      marks: number;
      options: string[];
      bloomsLevel: string | null;
      correctLetter: string;
      explanation: string;
    }[];
    try {
      const parsed = extractJsonObject(responseText);
      questions = parsed.questions
        .map((q, i) => {
          const number = Number(q.number ?? i + 1);
          const rawAnswer = parsed.answerKey[String(number)];
          const answerObj: RawAnswer = typeof rawAnswer === "string" ? { answer: rawAnswer } : rawAnswer ?? {};
          const letter = String(answerObj.answer ?? "").trim().toUpperCase();

          return {
            number,
            text: String(q.text ?? `Question ${number}`),
            marks: Number(q.marks ?? spec.marksEach),
            options: Array.isArray(q.options) ? q.options.map((o) => String(o)) : [],
            bloomsLevel: q.bloomsLevel ? String(q.bloomsLevel) : null,
            correctLetter: VALID_LETTERS.has(letter) ? letter : "A",
            explanation: answerObj.explanation ? String(answerObj.explanation) : "",
          };
        })
        // All questions are MCQ - every question must have exactly 4 options.
        .filter((q) => q.options.length === 4);
      if (questions.length === 0) throw new Error("No valid MCQ questions returned");
    } catch (parseErr) {
      console.error("Failed to parse exam questions:", parseErr, responseText);
      return jsonResponse({ error: "Failed to generate a valid exam. Please try again." }, 500);
    }

    // Total marks come from the questions that actually survived
    // validation, not a hardcoded 30 — the .filter() above can drop a
    // malformed question, and grading against a fixed 30 would mean the
    // learner literally could not score 100%.
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    const { data: exam, error: examErr } = await supabaseAdmin
      .from("mock_exams")
      .insert({
        learner_id: learner.id,
        subject_id: subjectId,
        difficulty,
        total_marks: totalMarks,
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
      question_type: "mcq",
      options: q.options,
      blooms_level: q.bloomsLevel,
      // Stored as JSON ({ answer, explanation }) to stay compatible with the
      // legacy grade-mock-exam answer-key parser.
      correct_answer: JSON.stringify({ answer: q.correctLetter, explanation: q.explanation }),
      marks: q.marks,
      question_order: q.number,
    }));

    const { data: insertedQuestions, error: insertErr } = await supabaseAdmin
      .from("mock_exam_questions")
      .insert(rows)
      .select("id, question_text, question_type, options, blooms_level, marks, question_order");

    if (insertErr || !insertedQuestions) {
      console.error("Failed to insert exam questions:", insertErr);
      return jsonResponse({ error: "Failed to save exam questions" }, 500);
    }

    // Grading is client-side, so attach the correct option letter and a short
    // explanation to each returned question (matched by question_order).
    const answerByOrder = new Map(
      questions.map((q) => [q.number, { correct_answer: q.correctLetter, explanation: q.explanation }]),
    );
    const returnedQuestions = insertedQuestions
      .sort((a, b) => (a.question_order ?? 0) - (b.question_order ?? 0))
      .map((q) => {
        const ans = answerByOrder.get(q.question_order ?? -1);
        return {
          ...q,
          correct_answer: ans?.correct_answer ?? "A",
          explanation: ans?.explanation ?? "",
        };
      });

    return jsonResponse({
      examId: exam.id,
      questions: returnedQuestions,
      totalMarks,
      difficulty,
    });
  } catch (err) {
    console.error("generate-mock-exam error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

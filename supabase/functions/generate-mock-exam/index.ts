// Supabase Edge Function: generate-mock-exam
// POST { learnerId, subjectId, difficulty }
//   difficulty: 'low' | 'medium' | 'high'
//
// Returns: { questions: [{ id, question_text, marks, question_order }], examId }
//
// Auth: caller must be the learner identified by learnerId. Mock exams are
// a Premium-tier feature.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are Leuro, an exam-setter for South African school learners following
the CAPS curriculum (Grades 4-12). You generate mock exam questions that
are realistic, curriculum-aligned, and appropriately scaled in difficulty
to the learner's diagnostic level (1 = foundational, 5 = advanced/exam
standard).

You MUST respond with ONLY a valid JSON array, no markdown fences, no
commentary. Each element must be an object: { "question_text": string,
"marks": number }. The number of elements and marks per element must
exactly match what is requested.`;

interface DifficultySpec {
  count: number;
  marksEach: number;
}

const DIFFICULTY_SPECS: Record<string, DifficultySpec> = {
  low: { count: 6, marksEach: 5 },
  medium: { count: 5, marksEach: 6 },
  high: { count: 3, marksEach: 10 },
};

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

    if (tier !== "premium") {
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

    const { data: topics } = await supabase
      .from("topics")
      .select("title")
      .eq("learner_id", learner.id)
      .eq("subject_id", subjectId);

    const topicList = (topics ?? []).map((t) => t.title).join(", ") || "general curriculum topics";
    const level = learner.diagnostic_level || 1;

    const userPrompt = `Generate a ${difficulty}-difficulty mock exam for ${subject.name}, Grade ${subject.grade}.
Learner diagnostic level: ${level}/5.
Learner's recent study topics: ${topicList}.

Produce exactly ${spec.count} questions, each worth exactly ${spec.marksEach} marks
(total ${spec.count * spec.marksEach} marks). Vary question types (short answer,
calculation, short explanation) as appropriate for the subject. Base
difficulty on the learner's level and, where relevant, draw on their study
topics. Respond with ONLY the JSON array described in the system prompt.`;

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
      return jsonResponse({ error: "Failed to generate mock exam" }, 502);
    }

    const data = await anthropicRes.json();
    const responseText = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n");

    let questions: { question_text: string; marks: number }[];
    try {
      const parsed = extractJsonArray(responseText) as Array<{ question_text?: string; marks?: number }>;
      questions = parsed.map((q, i) => ({
        question_text: String(q.question_text ?? `Question ${i + 1}`),
        marks: Number(q.marks ?? spec.marksEach),
      }));
    } catch (parseErr) {
      console.error("Failed to parse exam questions:", parseErr, responseText);
      return jsonResponse({ error: "Failed to generate a valid exam. Please try again." }, 502);
    }

    const { data: exam, error: examErr } = await supabase
      .from("mock_exams")
      .insert({
        learner_id: learner.id,
        subject_id: subjectId,
        difficulty,
        total_marks: spec.count * spec.marksEach,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (examErr || !exam) {
      console.error("Failed to create exam:", examErr);
      return jsonResponse({ error: "Failed to create exam" }, 500);
    }

    const rows = questions.map((q, i) => ({
      exam_id: exam.id,
      question_text: q.question_text,
      marks: q.marks,
      question_order: i + 1,
    }));

    const { data: insertedQuestions, error: insertErr } = await supabase
      .from("mock_exam_questions")
      .insert(rows)
      .select("id, question_text, marks, question_order");

    if (insertErr || !insertedQuestions) {
      console.error("Failed to insert exam questions:", insertErr);
      return jsonResponse({ error: "Failed to save exam questions" }, 500);
    }

    return jsonResponse({
      examId: exam.id,
      questions: insertedQuestions.sort((a, b) => (a.question_order ?? 0) - (b.question_order ?? 0)),
    });
  } catch (err) {
    console.error("generate-mock-exam error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

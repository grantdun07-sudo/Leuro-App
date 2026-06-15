// Supabase Edge Function: run-diagnostic
// POST { grade, language, learner_id }
//   language: 'en' | 'af'
//
// Returns a JSON array of 10 CAPS-aligned multiple-choice questions spread
// across a mix of subjects appropriate for the learner's grade:
//   [{ question, options: { A, B, C, D }, correct_answer }]
//
// Auth: caller must be the learner identified by learner_id. The diagnostic
// is a low-stakes placement quiz, so the correct answers are returned to the
// client (grading happens client-side).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { callClaude, ClaudeTimeoutError } from "../_shared/anthropic.ts";
import { langInstruction, JSON_KEYS_ENGLISH_NOTE } from "../_shared/prompts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const QUESTION_COUNT = 10;

const SYSTEM_PROMPT =
  "You are a CAPS-aligned South African education assessment tool. Return ONLY valid JSON, no markdown fences.";

interface RawQuestion {
  question?: string;
  options?: { A?: string; B?: string; C?: string; D?: string };
  correct_answer?: string;
}

// Pulls a JSON array out of the model response, tolerating stray prose or
// accidental ```json fences.
function extractJsonArray(text: string): RawQuestion[] {
  let candidate = text.trim();
  const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) candidate = fenceMatch[1].trim();

  // If the model wrapped the array in an object, unwrap common keys first.
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    candidate = candidate.slice(start, end + 1);
  }

  const parsed = JSON.parse(candidate);
  if (!Array.isArray(parsed)) {
    throw new Error("Response is not a JSON array");
  }
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
    const { grade, language, learner_id } = body as {
      grade?: number;
      language?: string;
      learner_id?: string;
    };

    if (grade == null || !learner_id) {
      return jsonResponse({ error: "grade and learner_id are required" }, 400);
    }

    const lang = language === "af" ? "af" : "en";

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    // Confirm the learner belongs to the authenticated user.
    const { data: learner, error: learnerErr } = await supabase
      .from("learners")
      .select("id, grade")
      .eq("id", learner_id)
      .eq("user_id", userData.user.id)
      .single();

    if (learnerErr || !learner) {
      return jsonResponse({ error: "Learner not found" }, 404);
    }

    const userPrompt = `Generate exactly ${QUESTION_COUNT} CAPS-aligned multiple-choice diagnostic questions for a South African Grade ${grade} learner.

Requirements:
- Spread the questions across a MIX of different subjects appropriate for Grade ${grade} (for example Mathematics, Natural Sciences / Life Sciences, English, History, Geography). Do not make them all from one subject.
- Each question must have exactly four options labelled A, B, C and D, with exactly one correct answer.
- Vary the difficulty so the quiz can place the learner at a level from 1 (beginner) to 5 (advanced).
- Keep the language clear and age-appropriate for Grade ${grade}.
- Use South African context and examples where relevant.
${langInstruction(lang)}
${JSON_KEYS_ENGLISH_NOTE}

Respond with ONLY a JSON array of ${QUESTION_COUNT} objects, no markdown fences, matching this exact shape:
[
  {
    "question": "the question text",
    "options": { "A": "option A", "B": "option B", "C": "option C", "D": "option D" },
    "correct_answer": "A"
  }
]
The "correct_answer" value must be exactly one of "A", "B", "C" or "D".`;

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
      return jsonResponse({ error: "Failed to generate diagnostic" }, 500);
    }

    let questions: { question: string; options: { A: string; B: string; C: string; D: string }; correct_answer: string }[];
    try {
      const raw = extractJsonArray(responseText);
      const validLetters = new Set(["A", "B", "C", "D"]);
      questions = raw
        .filter((q) => q && q.question && q.options)
        .map((q) => {
          const opts = q.options ?? {};
          const correct = String(q.correct_answer ?? "").trim().toUpperCase();
          return {
            question: String(q.question),
            options: {
              A: String(opts.A ?? ""),
              B: String(opts.B ?? ""),
              C: String(opts.C ?? ""),
              D: String(opts.D ?? ""),
            },
            correct_answer: validLetters.has(correct) ? correct : "A",
          };
        });
      if (questions.length === 0) throw new Error("No valid questions returned");
    } catch (parseErr) {
      console.error("Failed to parse diagnostic questions:", parseErr, responseText);
      return jsonResponse({ error: "Failed to generate a valid diagnostic. Please try again." }, 500);
    }

    return jsonResponse(questions);
  } catch (err) {
    console.error("run-diagnostic error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

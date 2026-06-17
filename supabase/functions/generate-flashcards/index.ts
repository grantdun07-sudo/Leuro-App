// Supabase Edge Function: generate-flashcards
// POST { subjectId, topicTitle, cardCount }
//   subjectId   - UUID of the subject record
//   topicTitle  - free-text topic name (max 120 chars)
//   cardCount   - number of cards to generate: 10 | 15 | 20
//
// Returns: { cards: Array<{ concept: string; definition: string }>, tokensUsed: number }
//
// Auth: caller must be a registered learner (JWT enforced via RLS).
// No persistence — cards are ephemeral and never written to the database.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { callClaude, ClaudeTimeoutError } from "../_shared/anthropic.ts";
import { langInstruction, JSON_KEYS_ENGLISH_NOTE } from "../_shared/prompts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SYSTEM_PROMPT =
  `You are a CAPS-aligned academic tutor for South African learners Grade 4-12. ` +
  `Your task is to generate flashcard sets for self-study. ` +
  `Each flashcard has a concise concept (term, rule, or question) on the front ` +
  `and a clear, accurate definition or answer on the back. ` +
  `Respond ONLY with the requested JSON — no extra text, no markdown.`;

interface RequestBody {
  subjectId: string;
  topicTitle: string;
  cardCount: number;
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

    const body: RequestBody = await req.json();
    if (!body.subjectId || !body.topicTitle) {
      return jsonResponse({ error: "subjectId and topicTitle are required" }, 400);
    }
    const cardCount = Math.min(20, Math.max(5, Number(body.cardCount) || 10));

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    const [{ data: learner, error: learnerErr }, { data: profile }] = await Promise.all([
      supabase.from("learners").select("grade, diagnostic_level").eq("user_id", userData.user.id).single(),
      supabase.from("profiles").select("lang").eq("id", userData.user.id).single(),
    ]);

    if (learnerErr || !learner) {
      return jsonResponse({ error: "Learner profile not found" }, 404);
    }

    const lang = profile?.lang ?? "en";

    const { data: subject } = await supabase
      .from("subjects")
      .select("name")
      .eq("id", body.subjectId)
      .single();
    const subjectName = subject?.name ?? "General";

    const userPrompt =
      `Subject: ${subjectName} | Grade: ${learner.grade} | Topic: "${body.topicTitle.slice(0, 120)}"\n` +
      `${langInstruction(lang)}\n${JSON_KEYS_ENGLISH_NOTE}\n\n` +
      `Create exactly ${cardCount} flashcards for this CAPS topic.\n` +
      `Rules:\n` +
      `- Each card: concept (front, ≤25 words) and definition (back, ≤35 words).\n` +
      `- Cover the most important vocabulary, formulas, rules, and key facts.\n` +
      `- Vary card types: definitions, formulas, examples, cause-and-effect.\n` +
      `- Grade-appropriate difficulty. Never reproduce copyrighted exam content.\n` +
      `- Human-readable text values in ${lang === "af" ? "Afrikaans" : "English"}.\n\n` +
      `Respond with ONLY a raw JSON object (no markdown, no code fences):\n` +
      `{"cards": [{"concept": string, "definition": string}]}`;

    try {
      const result = await callClaude(SYSTEM_PROMPT, userPrompt, 2048);
      const cleaned = result.text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed.cards)) {
        throw new Error("Invalid response shape from AI");
      }
      return jsonResponse({ cards: parsed.cards, tokensUsed: result.tokensUsed });
    } catch (err) {
      if (err instanceof ClaudeTimeoutError) {
        console.error("Anthropic request timed out:", err);
        return jsonResponse({ error: "AI generation timed out. Please try again." }, 500);
      }
      console.error("generate-flashcards AI error:", err);
      return jsonResponse({ error: "Failed to generate flashcards" }, 500);
    }
  } catch (err) {
    console.error("generate-flashcards error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

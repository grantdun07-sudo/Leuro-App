import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const MODEL = "claude-haiku-4-5-20251001";

function langInstruction(lang: string): string {
  return lang === "af"
    ? "Generate ALL content in Afrikaans (questions, options, and explanations)."
    : "Generate all content in English.";
}

function systemPrompt(lang: string): string {
  const base =
    "You are a CAPS-aligned academic tutor for South African learners Grade 4-12. " +
    "You generate multiple-choice flashcards for self-study. " +
    "Respond ONLY with the requested JSON — no extra text, no markdown.";
  const afRule =
    lang === "af"
      ? " The learner's language is Afrikaans. Write ALL question text, all four option texts, " +
        "and every explanation in Afrikaans. The JSON keys themselves (question, options, A, B, C, D, " +
        "correct, explanation) stay in English, but every human-readable value must be in Afrikaans."
      : "";
  return base + afRule;
}

async function callClaude(system: string, prompt: string, maxTokens: number): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const { data: user } = await supabase.auth.getUser(token);
    if (!user?.user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { subjectId, topicTitle, cardCount } = await req.json();

    const { data: profile } = await supabase
      .from("profiles")
      .select("lang")
      .eq("id", user.user.id)
      .single();

    const lang = profile?.lang || "en";

    const { data: subject } = await supabase
      .from("subjects")
      .select("name, name_af")
      .eq("id", subjectId)
      .single();

    const subjectName = lang === "af" ? subject?.name_af : subject?.name;

    const prompt = `Generate exactly ${cardCount} multiple-choice flashcards for Grade 7-12 CAPS curriculum learning.
Subject: ${subjectName}
Topic: ${topicTitle}

${langInstruction(lang)}

Each card: a question, 4 options (one correct), the correct option letter, and a short explanation.

Return ONLY a valid JSON array with no markdown fences:
[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correct":"A","explanation":"..."},...]

Make distractors plausible. Vary the correct letter across cards.`;

    const response = await callClaude(systemPrompt(lang), prompt, 2048);
    const cleaned = response.replace(/```json|```/g, "").trim();
    const cards = JSON.parse(cleaned);

    return new Response(JSON.stringify({ cards }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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

// Rate limiting.
const RATE_LIMIT_HOURLY_CAP = 15;
const RATE_LIMIT_DAILY_CAP = 50;

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

    // --- Rate limit check: generate-flashcards ---
    // Runs before any Claude call so we never bill for a call we're about
    // to reject. `supabase` here is already the service-role client (see
    // top of file), which is what api_rate_limits grants access to.
    // Fail-closed: if the check itself errors, block the request rather
    // than silently letting it through as unlimited.
    const rateLimitUserId = user.user.id;

    const { count: hourlyCount, error: hourlyErr } = await supabase
      .from("api_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", rateLimitUserId)
      .eq("function_name", "generate-flashcards")
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    const { count: dailyCount, error: dailyErr } = await supabase
      .from("api_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", rateLimitUserId)
      .eq("function_name", "generate-flashcards")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (hourlyErr || dailyErr) {
      console.error("generate-flashcards: rate limit check failed:", hourlyErr ?? dailyErr);
      return new Response(JSON.stringify({ error: "Rate limit check failed, please try again" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((hourlyCount ?? 0) >= RATE_LIMIT_HOURLY_CAP || (dailyCount ?? 0) >= RATE_LIMIT_DAILY_CAP) {
      return new Response(
        JSON.stringify({
          error: "rate_limit_exceeded",
          message: "You've reached your usage limit. Please try again later.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Log this call before the Claude API call - worst case we log a call
    // that then fails downstream, which just makes the limit slightly more
    // conservative, which is safe.
    await supabase.from("api_rate_limits").insert({
      user_id: rateLimitUserId,
      function_name: "generate-flashcards",
    });
    // --- End rate limit check ---

    const { subjectId, topicTitle, cardCount } = await req.json();

    const { data: profile } = await supabase
      .from("profiles")
      .select("lang, subscription_tier")
      .eq("id", user.user.id)
      .single();

    const lang = profile?.lang || "en";

    // Flashcards is Premium-only. A failed/cancelled renewal
    // (learners.subscription_status) overrides subscription_tier: the
    // tier column can lag briefly before the webhook clears it, so status
    // is the authoritative signal for whether premium access still applies
    // (same pattern as generate-mock-exam / generate-study-guide).
    const { data: learner } = await supabase
      .from("learners")
      .select("subscription_status")
      .eq("user_id", user.user.id)
      .single();

    const tier = profile?.subscription_tier || "free";
    const isPastDueOrCancelled = learner?.subscription_status === "past_due" || learner?.subscription_status === "cancelled";
    const effectivelyPremium = tier === "premium" && !isPastDueOrCancelled;

    if (!effectivelyPremium) {
      return new Response(
        JSON.stringify({
          error: "premium_required",
          message:
            lang === "af"
              ? "Flitskaarte is 'n Premium-funksie. Gradeer op om toegang te kry."
              : "Flashcards are a Premium feature. Upgrade to unlock them.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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

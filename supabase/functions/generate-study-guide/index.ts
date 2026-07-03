// Supabase Edge Function: generate-study-guide
// POST { topicId, phase, learnerInput?, context? }
//   phase: 'explain' | 'example' | 'attempt' | 'complete' | 'chat' | 'studyguide'
//          | 'refresher' | 'refresher-feedback'
//   context: { explainText?, exampleText?, history?, refresherQuestion?,
//              retryCount?, previousQuestion?, previousExplanation? }
//
// 'explain'/'example' - unchanged free-text tutor steps. Auto-chained by the
//                 client: explain -> example -> attempt.
//                 Returns: { response: string, phase, tokensUsed }
//
// 'attempt'    - generates ONE multiple-choice practice question (mastery
//                 loop). Grading is client-side (same pattern as
//                 generate-mock-exam/generate-flashcards) - "correct" and
//                 "explanation" are returned directly. Called again after a
//                 wrong answer, with context.retryCount/previousQuestion so
//                 Claude varies the question instead of repeating it.
//                 Returns: { phase: 'attempt', question, options: {A,B,C,D},
//                 correct: 'A'|'B'|'C'|'D', explanation, tokensUsed }
//
// 'complete'   - explicit "Finish topic" signal, sent once the learner
//                 answers correctly and chooses not to try another
//                 question. No Claude call - pure bookkeeping
//                 (sessions_completed/times_studied increment here, and
//                 only here now). Logs the sole study_sessions row for the
//                 whole mastery loop.
//                 Returns: { phase: 'complete' }
//
// 'chat'       - free-form follow-up question within an existing topic chat.
//                 Requires topicId. context.history is the recent
//                 conversation (array of { role: 'ai' | 'learner', text }).
//                 Returns: { response: string, phase: 'chat', tokensUsed }
//
// 'studyguide' - standalone study guide generation for the Exams tab.
//                 Requires subjectId + topicTitle instead of topicId.
//                 Returns: { studyGuide: { topicTitle, keyConcepts, example,
//                 selfCheckQuestion }, tokensUsed }
//
// 'refresher'  - Exam Refresher session content for the Study tab. Topics
//                 come from the learner's saved Study Guides, so they are
//                 passed as free-text titles rather than topic ids.
//                 Requires subjectId + topics (array of topic titles) +
//                 level ('confident'|'revising'|'rescue') + duration
//                 (20|30|40 minutes) instead of topicId.
//                 Returns: { refresher: { sections: [{ topicTitle, summary,
//                 definitions, workedExample, questions }] }, tokensUsed }
//
// 'refresher-feedback' - instant feedback on one Exam Refresher practice
//                 question. Requires subjectId + topicTitle + learnerInput
//                 (the learner's answer) + context.refresherQuestion (the
//                 question text). Untouched by the mastery-loop rebuild -
//                 fully separate free-text flow, no MC, no study_sessions row.
//                 Returns: { feedback: { correct: boolean, feedback: string },
//                 tokensUsed }
//
// Auth: caller must be the learner who owns the topic (enforced via RLS
// using the caller's JWT for all reads/writes). Subject, grade, diagnostic
// level and language are looked up server-side rather than trusted from the
// request body.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { containsCrisisLanguage, SADAG_CRISIS_MESSAGE } from "../_shared/safety.ts";
import { callClaude, ClaudeTimeoutError } from "../_shared/anthropic.ts";
import { langInstruction, JSON_KEYS_ENGLISH_NOTE } from "../_shared/prompts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Rate limiting - api_rate_limits only grants access to service_role, so
// this needs its own admin client (generate-study-guide otherwise only
// uses the caller-scoped anon+JWT client). This cap applies to EVERY
// phase (explain/example/attempt/feedback/chat/studyguide/refresher/
// refresher-feedback) - the pre-existing 3/day free-tier check further
// below only ever covered the "explain" phase, leaving chat and the other
// phases completely unbounded; this cap closes that gap for all phases
// and all tiers. Left the old 3/day check in place as-is (an additional,
// tighter restriction specifically for free-tier explain-phase starts) —
// whether to remove/supersede it is a product-UX call, flagged separately
// rather than decided here.
const RATE_LIMIT_HOURLY_CAP = 40;
const RATE_LIMIT_DAILY_CAP = 150;

const SYSTEM_PROMPT = `You are a CAPS-aligned academic tutor for South African learners Grade 4-12.
You ONLY discuss school subjects and CAPS academic content. If the learner
says ANYTHING not related to schoolwork — including personal feelings,
emotions, social situations, or off-topic questions — respond ONLY with:
'I am here to help with your schoolwork. What subject or topic can I help
you with?' Do not acknowledge emotions. Do not offer support or counselling.
Do not engage with any non-academic content. No exceptions.

When discussing academic content, you are Leuro™, an expert South African
CAPS tutor for Grades 4-12. You help learners with one study topic at a
time, working through four steps: explanation, worked example, practice
attempt, and feedback.

Apply Bloom's Taxonomy to match each step's cognitive level:
- Explain = Remember + Understand
- Example = Understand + Apply
- Attempt = Apply + Analyze
- Feedback = Analyze + Evaluate (use Barrett's critical-thinking taxonomy
  when evaluating the learner's reasoning, not just the final answer)

Rules:
- Be age-appropriate, clear, and concise.
- Follow CAPS cognitive complexity standards for the learner's grade.
- Use South African context and examples where relevant.
- Never reproduce copyrighted exam content (e.g. DBE/IEB past papers) -
  create original explanations, examples and questions only.
- Plain text only - no markdown headers (#). Simple numbered/bulleted lists
  are fine.
- If asked to respond in Afrikaans, respond entirely in Afrikaans.
- Adjust difficulty to the learner's diagnostic level (1 = needs lots of
  support and basics, 5 = ready for advanced, exam-style challenge).`;

// "feedback" is intentionally gone from the request-side phase list - the
// mastery loop grades multiple-choice answers client-side (same pattern as
// generate-mock-exam/generate-flashcards), so there is no server call for
// it anymore. It's still a valid *stored* value in study_sessions.phase for
// historical rows (see the DB migration), just never sent as a request.
type Phase = "explain" | "example" | "attempt" | "complete" | "chat" | "studyguide" | "refresher" | "refresher-feedback";

interface RequestBody {
  topicId?: string;
  subjectId?: string;
  topicTitle?: string;
  topics?: string[]; // Exam Refresher: topic titles (from saved study guides)
  level?: "confident" | "revising" | "rescue";
  duration?: number;
  phase: Phase;
  learnerInput?: string;
  previousResponse?: string;
  context?: {
    explainText?: string;
    exampleText?: string;
    history?: { role: "ai" | "learner"; text: string }[];
    refresherQuestion?: string;
    // Retry context for the mastery loop - set only when regenerating an
    // "attempt" question after a wrong answer, so Claude varies the
    // question instead of repeating it.
    retryCount?: number;
    previousQuestion?: string;
    previousExplanation?: string;
  };
}

const VALID_LETTERS = new Set(["A", "B", "C", "D"]);

// South Africa Standard Time is a fixed UTC+2 offset with no DST - this app
// only operates in SA, so a hardcoded offset is correct (no per-user
// timezone/DST logic needed). Returns the SAST calendar date as "YYYY-MM-DD"
// for a given instant, used by the streak counter to define what "a day" is.
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;
function sastDateString(instant: Date): string {
  return new Date(instant.getTime() + SAST_OFFSET_MS).toISOString().slice(0, 10);
}

function buildUserPrompt(
  body: RequestBody,
  topicTitle: string,
  subjectName: string,
  grade: number,
  level: number,
  lang: string,
): string {
  const levelText = level > 0 ? `${level}/5` : "1/5 (not yet diagnosed, assume a beginner)";
  const header = `Subject: ${subjectName} | Grade: ${grade} | Topic: "${topicTitle}" | Learner level: ${levelText}\n${langInstruction(lang)}\n\n`;

  switch (body.phase) {
    case "explain":
      return (
        header +
        `Explain this topic to the learner (Bloom's: Remember + Understand). ` +
        `In 150-200 words, cover: a clear definition, the key concept(s) the ` +
        `learner needs to know, and a real-world (ideally South African) ` +
        `connection. Use age-appropriate language and explain any jargon.`
      );
    case "example":
      return (
        header +
        (body.context?.explainText
          ? `You previously explained: """${body.context.explainText}"""\n\n`
          : "") +
        `Now give ONE fully worked example for this topic (Bloom's: Understand ` +
        `+ Apply), in 200-300 words. Structure it as problem -> working -> ` +
        `answer, showing each step of the method clearly so the learner can ` +
        `follow along. Use a realistic South African context where possible.`
      );
    case "chat": {
      const history = body.context?.history ?? [];
      const historyText = history
        .map((m) => `${m.role === "learner" ? "Learner" : "Leuro"}: ${m.text}`)
        .join("\n");
      return (
        header +
        (historyText ? `Conversation so far:\n${historyText}\n\n` : "") +
        `The learner just said: """${body.learnerInput ?? ""}"""\n\n` +
        `Continue the conversation naturally as their tutor. Answer their ` +
        `question or respond to their message, staying focused on this topic ` +
        `where relevant. Keep it conversational and concise (under 150 words).`
      );
    }
    default:
      return header;
  }
}

// Multiple-choice practice question for the Learn tab's mastery loop.
// retryContext is present only when regenerating the question after a wrong
// answer - it tells Claude to vary the question (not repeat it) and, after
// several misses, ease the difficulty. previousExplanation isn't referenced
// in the prompt text itself but is accepted for symmetry with what the
// client sends; the retry signal that actually matters to Claude is
// previousQuestion + retryCount.
function buildAttemptPrompt(
  topicTitle: string,
  subjectName: string,
  grade: number,
  level: number,
  lang: string,
  context?: {
    exampleText?: string;
    retryCount?: number;
    previousQuestion?: string;
    previousExplanation?: string;
  },
): string {
  const levelText = level > 0 ? `${level}/5` : "1/5 (not yet diagnosed, assume a beginner)";
  const header = `Subject: ${subjectName} | Grade: ${grade} | Topic: "${topicTitle}" | Learner level: ${levelText}\n${langInstruction(lang)}\n${JSON_KEYS_ENGLISH_NOTE}\n\n`;

  // Retry (after a wrong answer) takes priority over the first-call
  // grounding below - a retry is never the first question of the topic.
  const retryNote = context?.previousQuestion
    ? `The learner previously answered this question incorrectly: """${context.previousQuestion}"""\n` +
      `Generate a NEW, DIFFERENT question testing the SAME underlying concept - vary the wording, ` +
      `numbers, or context. Do not repeat the same question.` +
      ((context.retryCount ?? 0) >= 3
        ? ` The learner has struggled across multiple attempts on this concept - use a simpler framing ` +
          `to help them succeed this time.\n\n`
        : `\n\n`)
    : context?.exampleText
      ? `You previously gave this worked example: """${context.exampleText}"""\n\n`
      : "";

  return (
    header +
    retryNote +
    `Generate ONE original multiple-choice practice question on this topic (Bloom's: Apply + Analyze), ` +
    `appropriate for the learner's level. Exactly 4 options, exactly 1 correct answer. Distractors must ` +
    `be plausible, built on common misconceptions - never obviously wrong or filler. Never reproduce ` +
    `copyrighted exam content - create an original question only.\n\n` +
    `Respond with ONLY a raw JSON object (no markdown, no code fences, no extra text) with exactly ` +
    `these keys:\n` +
    `{"question": string, "options": {"A": string, "B": string, "C": string, "D": string}, ` +
    `"correct": "A" | "B" | "C" | "D", "explanation": string (brief explanation of why the correct ` +
    `answer is right - this is shown to the learner as a hint if they answer incorrectly)}`
  );
}

function buildStudyGuidePrompt(
  topicTitle: string,
  subjectName: string,
  grade: number,
  level: number,
  lang: string,
): string {
  const levelText = level > 0 ? `${level}/5` : "1/5 (not yet diagnosed, assume a beginner)";
  return (
    `Subject: ${subjectName} | Grade: ${grade} | Topic: "${topicTitle}" | Learner level: ${levelText}\n${langInstruction(lang)}\n${JSON_KEYS_ENGLISH_NOTE}\n\n` +
    `Create a concise study guide for this topic. Respond with ONLY a raw ` +
    `JSON object (no markdown, no code fences, no extra text) with exactly ` +
    `these keys:\n` +
    `{"topicTitle": string, "keyConcepts": string[] (3-5 short bullet points), ` +
    `"example": string (one short worked example, 100-150 words), ` +
    `"selfCheckQuestion": string (one practice question to check understanding)}`
  );
}

// Exam Refresher: per-preparation-level depth and practice-question counts.
const REFRESHER_LEVEL_INFO: Record<string, { questionCount: number; depth: string }> = {
  confident: {
    questionCount: 3,
    depth:
      `Provide a short bulleted summary (3-5 bullets) of only the most important ` +
      `points - the learner mainly needs a quick recall refresher and exam ` +
      `technique tips. Leave "definitions" as an empty array and "workedExample" ` +
      `as an empty string.`,
  },
  revising: {
    questionCount: 5,
    depth:
      `Provide a fuller summary (5-7 bullets) covering the topic, plus a ` +
      `"definitions" array of 3-5 key terms each formatted as "Term: short ` +
      `definition". Leave "workedExample" as an empty string.`,
  },
  rescue: {
    questionCount: 7,
    depth:
      `Provide a thorough summary that explains the topic from the basics ` +
      `(6-10 bullets), a "definitions" array of 4-6 key terms each formatted as ` +
      `"Term: short definition", and a "workedExample" (one fully worked ` +
      `example, 150-250 words, structured as problem -> working -> answer).`,
  },
};

function buildRefresherPrompt(
  topicTitles: string[],
  level: "confident" | "revising" | "rescue",
  duration: number,
  subjectName: string,
  grade: number,
  learnerLevel: number,
  lang: string,
): string {
  const levelText = learnerLevel > 0 ? `${learnerLevel}/5` : "1/5 (not yet diagnosed, assume a beginner)";
  const info = REFRESHER_LEVEL_INFO[level] ?? REFRESHER_LEVEL_INFO.revising;
  const topicList = topicTitles.map((title) => `- "${title}"`).join("\n");

  return (
    `Subject: ${subjectName} | Grade: ${grade} | Learner level: ${levelText}\n${langInstruction(lang)}\n${JSON_KEYS_ENGLISH_NOTE}\n\n` +
    `The learner is doing a ${duration}-minute Exam Refresher session at ` +
    `preparation level "${level}". ${info.depth}\n\n` +
    `Create refresher content for EACH of the following topics:\n${topicList}\n\n` +
    `For each topic, also write exactly ${info.questionCount} original, ` +
    `exam-style practice questions appropriate for Grade ${grade} CAPS, each ` +
    `with a mark allocation (e.g. 2-4 marks), increasing roughly in difficulty. ` +
    `Never reproduce copyrighted exam content - create original questions only.\n\n` +
    `Respond with ONLY a raw JSON object (no markdown, no code fences, no extra ` +
    `text) with exactly this shape:\n` +
    `{"sections": [{"topicTitle": string, "summary": string[], ` +
    `"definitions": string[], "workedExample": string, "questions": [{"question": ` +
    `string, "marks": number}]}]}\n` +
    `Use the exact topic titles given above, and return one section per topic ` +
    `in the same order.`
  );
}

function buildRefresherFeedbackPrompt(
  question: string,
  answer: string,
  topicTitle: string,
  subjectName: string,
  grade: number,
  level: string,
  lang: string,
): string {
  return (
    `Subject: ${subjectName} | Grade: ${grade} | Topic: "${topicTitle}" | ` +
    `Exam Refresher preparation level: ${level}\n${langInstruction(lang)}\n${JSON_KEYS_ENGLISH_NOTE}\n\n` +
    `The exam-refresher practice question was: """${question}"""\n` +
    `The learner's answer was: """${answer}"""\n\n` +
    `Evaluate the learner's answer. Respond with ONLY a raw JSON object (no ` +
    `markdown, no code fences, no extra text) with exactly these keys:\n` +
    `{"correct": boolean (true if the answer is substantially correct), ` +
    `"feedback": string (2-4 encouraging sentences explaining what was right or ` +
    `wrong, and the correct approach/answer if needed)}`
  );
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
    if (!body.phase) {
      return jsonResponse({ error: "phase is required" }, 400);
    }
    if (!["explain", "example", "attempt", "complete", "chat", "studyguide", "refresher", "refresher-feedback"].includes(body.phase)) {
      return jsonResponse({ error: "invalid phase" }, 400);
    }
    if (!["studyguide", "refresher", "refresher-feedback"].includes(body.phase) && !body.topicId) {
      return jsonResponse({ error: "topicId is required" }, 400);
    }

    // User-scoped client - all reads/writes respect RLS for this learner.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    // --- Rate limit check: generate-study-guide ---
    // Runs before any Claude call, for EVERY phase - placed here, before
    // the phase branches below, so it covers all four callClaude() call
    // sites in this file (studyguide / refresher / refresher-feedback /
    // the default explain-example-attempt-feedback-chat path). Fail-
    // closed: if the check itself errors, block the request rather than
    // silently letting it through as unlimited.
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const rateLimitUserId = userData.user.id;

    const { count: hourlyCount, error: hourlyErr } = await supabaseAdmin
      .from("api_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", rateLimitUserId)
      .eq("function_name", "generate-study-guide")
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    const { count: dailyCount, error: dailyErr } = await supabaseAdmin
      .from("api_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", rateLimitUserId)
      .eq("function_name", "generate-study-guide")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (hourlyErr || dailyErr) {
      console.error("generate-study-guide: rate limit check failed:", hourlyErr ?? dailyErr);
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
      function_name: "generate-study-guide",
    });
    // --- End rate limit check ---

    const [{ data: learner, error: learnerErr }, { data: profile }] = await Promise.all([
      supabase
        .from("learners")
        .select("id, grade, diagnostic_level, subscription_status, streak_days, streak_last_active_date")
        .eq("user_id", userData.user.id)
        .single(),
      supabase.from("profiles").select("subscription_tier, lang").eq("id", userData.user.id).single(),
    ]);

    if (learnerErr || !learner) {
      return jsonResponse({ error: "Learner profile not found" }, 404);
    }

    const lang = profile?.lang ?? "en";
    const tier = profile?.subscription_tier ?? "free";

    // A failed/cancelled renewal (learners.subscription_status) overrides
    // subscription_tier: the tier column can lag briefly before the webhook
    // clears it, so status is the authoritative signal for whether premium
    // access should still apply.
    const isPastDueOrCancelled = learner.subscription_status === "past_due" || learner.subscription_status === "cancelled";
    const effectivelyPremium = tier === "premium" && !isPastDueOrCancelled;

    // Study Guide and Exam Refresher (all phases) are Premium-only features.
    // Gate them server-side so the limit cannot be bypassed by calling the
    // function directly, mirroring the premium check in generate-mock-exam.
    if (["studyguide", "refresher", "refresher-feedback"].includes(body.phase) && !effectivelyPremium) {
      return jsonResponse(
        {
          error: "premium_required",
          message:
            lang === "af"
              ? "Hierdie is 'n Premium-funksie. Gradeer op om toegang te kry."
              : "This is a Premium feature. Upgrade to unlock it.",
        },
        403,
      );
    }

    // Standalone study guide generation (Exams tab) - no topic record needed.
    if (body.phase === "studyguide") {
      if (!body.subjectId || !body.topicTitle) {
        return jsonResponse({ error: "subjectId and topicTitle are required" }, 400);
      }

      const { data: subject } = await supabase
        .from("subjects")
        .select("name")
        .eq("id", body.subjectId)
        .single();

      const userPrompt = buildStudyGuidePrompt(
        body.topicTitle,
        subject?.name ?? "General",
        learner.grade,
        learner.diagnostic_level ?? 0,
        lang,
      );

      try {
        const result = await callClaude(SYSTEM_PROMPT, userPrompt, 1024);
        const cleaned = result.text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
        const studyGuide = JSON.parse(cleaned);
        return jsonResponse({ studyGuide, tokensUsed: result.tokensUsed });
      } catch (err) {
        if (err instanceof ClaudeTimeoutError) {
          console.error("Anthropic request timed out:", err);
          return jsonResponse({ error: "AI generation timed out. Please try again." }, 500);
        }
        console.error("generate-study-guide (studyguide) error:", err);
        return jsonResponse({ error: "Failed to generate study guide" }, 500);
      }
    }

    // Standalone Exam Refresher generation (Study tab). Topics come from the
    // learner's saved Study Guides and are passed as free-text titles, so no
    // topics-table record is required.
    if (body.phase === "refresher") {
      if (
        !body.subjectId ||
        !Array.isArray(body.topics) ||
        body.topics.length === 0 ||
        !body.level ||
        !body.duration
      ) {
        return jsonResponse({ error: "subjectId, topics, level and duration are required" }, 400);
      }
      if (!["confident", "revising", "rescue"].includes(body.level)) {
        return jsonResponse({ error: "invalid level" }, 400);
      }

      const topicTitles = body.topics.map((s) => String(s).trim()).filter(Boolean).slice(0, 8);
      if (topicTitles.length === 0) {
        return jsonResponse({ error: "No valid topics provided" }, 400);
      }

      const { data: subject } = await supabase
        .from("subjects")
        .select("name")
        .eq("id", body.subjectId)
        .single();

      const userPrompt = buildRefresherPrompt(
        topicTitles,
        body.level,
        body.duration,
        subject?.name ?? "General",
        learner.grade,
        learner.diagnostic_level ?? 0,
        lang,
      );

      const maxTokens = Math.min(8192, 1024 + topicTitles.length * 1200);

      try {
        const result = await callClaude(SYSTEM_PROMPT, userPrompt, maxTokens);
        const cleaned = result.text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
        const refresher = JSON.parse(cleaned);
        return jsonResponse({ refresher, tokensUsed: result.tokensUsed });
      } catch (err) {
        if (err instanceof ClaudeTimeoutError) {
          console.error("Anthropic request timed out:", err);
          return jsonResponse({ error: "AI generation timed out. Please try again." }, 500);
        }
        console.error("generate-study-guide (refresher) error:", err);
        return jsonResponse({ error: "Failed to generate refresher" }, 500);
      }
    }

    // Exam Refresher per-question feedback (Study tab). Like 'refresher', the
    // topic is a free-text title from a saved guide, so there is no topics
    // record - feedback is returned as structured JSON and not logged to
    // study_sessions (which requires a topic_id).
    if (body.phase === "refresher-feedback") {
      const question = body.context?.refresherQuestion ?? "";
      const answer = body.learnerInput ?? "";
      if (!body.subjectId || !body.topicTitle || !question || !answer) {
        return jsonResponse(
          { error: "subjectId, topicTitle, learnerInput and context.refresherQuestion are required" },
          400,
        );
      }

      // Child-safety screen on the learner's submitted answer.
      if (containsCrisisLanguage(answer)) {
        const safeResponse = SADAG_CRISIS_MESSAGE[lang as "en" | "af"] ?? SADAG_CRISIS_MESSAGE.en;
        await supabase.rpc("create_parent_alert", {
          p_learner_id: learner.id,
          p_alert_type: "safety_flag",
          p_message:
            "Leuro detected language in a study session that may indicate your child is " +
            "struggling emotionally. Please check in with them.",
        });
        return jsonResponse({ feedback: { correct: false, feedback: safeResponse }, tokensUsed: 0, safety_flag: true });
      }

      const { data: subject } = await supabase
        .from("subjects")
        .select("name")
        .eq("id", body.subjectId)
        .single();

      const userPrompt = buildRefresherFeedbackPrompt(
        question,
        answer,
        body.topicTitle,
        subject?.name ?? "General",
        learner.grade,
        body.level ?? "revising",
        lang,
      );

      try {
        const result = await callClaude(SYSTEM_PROMPT, userPrompt, 512);
        const cleaned = result.text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
        const feedback = JSON.parse(cleaned);
        return jsonResponse({ feedback, tokensUsed: result.tokensUsed });
      } catch (err) {
        if (err instanceof ClaudeTimeoutError) {
          console.error("Anthropic request timed out:", err);
          return jsonResponse({ error: "AI generation timed out. Please try again." }, 500);
        }
        console.error("generate-study-guide (refresher-feedback) error:", err);
        return jsonResponse({ error: "Failed to generate feedback" }, 500);
      }
    }

    const { data: topic, error: topicErr } = await supabase
      .from("topics")
      .select("id, title, subject_id, learner_id")
      .eq("id", body.topicId)
      .eq("learner_id", learner.id)
      .single();

    if (topicErr || !topic) {
      return jsonResponse({ error: "Topic not found" }, 404);
    }

    const { data: subject } = await supabase
      .from("subjects")
      .select("name")
      .eq("id", topic.subject_id)
      .single();

    // Free tier: max 3 study sessions per day. A "session" starts at the
    // explain phase, so gate new sessions there.
    if (body.phase === "explain" && tier === "free") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("study_sessions")
        .select("id", { count: "exact", head: true })
        .eq("learner_id", learner.id)
        .eq("phase", "explain")
        .gte("created_at", startOfDay.toISOString());

      if ((count ?? 0) >= 3) {
        return jsonResponse(
          {
            error: "daily_limit_reached",
            message:
              lang === "af"
                ? "Jy het jou 3 gratis sessies vir vandag gebruik. Gradeer op vir onbeperkte toegang."
                : "You've used your 3 free sessions for today. Upgrade for unlimited access.",
          },
          403,
        );
      }
    }

    // --- Streak counter ---
    // Same trigger as the free-tier daily limit above (explain-phase
    // session starts), but tier-agnostic - runs for every tier, and only
    // for requests that actually reach this point (a free-tier request
    // rejected by the 403 above never gets streak credit, since it never
    // reaches here). A "day" is a fixed SAST calendar date. Only the
    // FIRST qualifying explain-phase start on a new SAST day moves the
    // streak; a second (or fifth) session the same day is a no-op, since
    // streak_last_active_date already equals today.
    if (body.phase === "explain") {
      const todaySAST = sastDateString(new Date());
      const yesterdaySAST = sastDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
      const lastActive = learner.streak_last_active_date as string | null;

      if (lastActive !== todaySAST) {
        // Consecutive with yesterday -> extend the streak. Anything else -
        // no prior activity (first-ever session) or a gap of a full missed
        // day (streak was broken) - both start a fresh streak at 1, since
        // today's session itself is a qualifying day.
        const isConsecutive = lastActive === yesterdaySAST;
        const newStreak = isConsecutive ? (learner.streak_days ?? 0) + 1 : 1;

        const { error: streakErr } = await supabase
          .from("learners")
          .update({ streak_days: newStreak, streak_last_active_date: todaySAST })
          .eq("id", learner.id);

        if (streakErr) {
          console.error("generate-study-guide: failed to update streak for learner", learner.id, ":", streakErr.message);
        }
      }
    }
    // --- End streak counter ---

    // Multiple-choice practice question (Learn tab mastery loop). Returns
    // structured {question, options, correct, explanation} - not free text -
    // so it gets its own dedicated block, like studyguide/refresher, rather
    // than the generic buildUserPrompt()/plain-text path below (which still
    // handles explain/example/chat only). Grading is client-side (same
    // pattern as generate-mock-exam/generate-flashcards - "correct" and
    // "explanation" are returned directly since this is a low-stakes
    // practice tool), so there is no server-side "feedback" phase anymore -
    // retiring it removes an entire AI round-trip per question. No
    // study_sessions row is logged here either - only "complete" logs one,
    // to keep the parent-facing session history to one entry per finished
    // topic rather than one per attempt/retry.
    if (body.phase === "attempt") {
      const userPrompt = buildAttemptPrompt(
        topic.title,
        subject?.name ?? "General",
        learner.grade,
        learner.diagnostic_level ?? 0,
        lang,
        body.context,
      );

      try {
        const result = await callClaude(SYSTEM_PROMPT, userPrompt, 512);
        const cleaned = result.text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
        const parsed = JSON.parse(cleaned);

        const options = parsed.options ?? {};
        const correct = String(parsed.correct ?? "").trim().toUpperCase();
        if (!parsed.question || !options.A || !options.B || !options.C || !options.D || !VALID_LETTERS.has(correct)) {
          throw new Error("Response missing required MC fields");
        }

        return jsonResponse({
          phase: "attempt",
          question: String(parsed.question),
          options: { A: String(options.A), B: String(options.B), C: String(options.C), D: String(options.D) },
          correct,
          explanation: parsed.explanation ? String(parsed.explanation) : "",
          tokensUsed: result.tokensUsed,
        });
      } catch (err) {
        if (err instanceof ClaudeTimeoutError) {
          console.error("Anthropic request timed out:", err);
          return jsonResponse({ error: "AI generation timed out. Please try again." }, 500);
        }
        console.error("generate-study-guide (attempt) error:", err);
        return jsonResponse({ error: "Failed to generate practice question" }, 500);
      }
    }

    // Explicit topic-completion signal (learner chose "Finish" after a
    // correct MC answer, whether on the first try or the Nth retry). No
    // Claude call - pure bookkeeping. sessions_completed/times_studied
    // increment here, and ONLY here, now - moved off the old "feedback"
    // phase, which fired (and incremented) on every submission, including
    // retries, before this rebuild.
    if (body.phase === "complete") {
      const { data: topicRow } = await supabase
        .from("topics")
        .select("times_studied")
        .eq("id", topic.id)
        .single();
      await supabase
        .from("topics")
        .update({
          times_studied: (topicRow?.times_studied ?? 0) + 1,
          last_studied: new Date().toISOString(),
        })
        .eq("id", topic.id);

      const { data: learnerRow } = await supabase
        .from("learners")
        .select("sessions_completed")
        .eq("id", learner.id)
        .single();
      await supabase
        .from("learners")
        .update({
          sessions_completed: (learnerRow?.sessions_completed ?? 0) + 1,
          last_session: new Date().toISOString(),
        })
        .eq("id", learner.id);

      // One warm, human-readable summary row - not per-question noise. This
      // is what the parent dashboard's "recent activity" reads (phase =
      // "complete" now, not the old "feedback").
      await supabase.from("study_sessions").insert({
        learner_id: learner.id,
        topic_id: topic.id,
        phase: "complete",
        learner_input: null,
        ai_response: "Practiced until they got it right.",
        completed_at: new Date().toISOString(),
      });

      return jsonResponse({ phase: "complete" });
    }

    // Child-safety screen on learner-submitted free text. Only "chat" still
    // carries free-form learner text in this file - the mastery loop is
    // pure multiple-choice now, so "attempt"/"feedback" never have learner-
    // authored text to screen (refresher-feedback has its own separate
    // check above, untouched).
    if (body.phase === "chat" && containsCrisisLanguage(body.learnerInput)) {
      const safeResponse = SADAG_CRISIS_MESSAGE[lang as "en" | "af"] ?? SADAG_CRISIS_MESSAGE.en;

      await supabase.from("study_sessions").insert({
        learner_id: learner.id,
        topic_id: topic.id,
        phase: body.phase,
        learner_input: body.learnerInput ?? null,
        ai_response: safeResponse,
        completed_at: new Date().toISOString(),
      });

      await supabase.rpc("create_parent_alert", {
        p_learner_id: learner.id,
        p_alert_type: "safety_flag",
        p_message:
          "Leuro detected language in a study session that may indicate your child is " +
          "struggling emotionally. Please check in with them.",
      });

      return jsonResponse({ response: safeResponse, phase: body.phase, tokensUsed: 0, safety_flag: true });
    }

    const userPrompt = buildUserPrompt(
      body,
      topic.title,
      subject?.name ?? "General",
      learner.grade,
      learner.diagnostic_level ?? 0,
      lang,
    );

    let responseText: string;
    let tokensUsed: number;
    try {
      const result = await callClaude(SYSTEM_PROMPT, userPrompt, 1024);
      responseText = result.text;
      tokensUsed = result.tokensUsed;
    } catch (err) {
      if (err instanceof ClaudeTimeoutError) {
        console.error("Anthropic request timed out:", err);
        return jsonResponse({ error: "AI generation timed out. Please try again." }, 500);
      }
      console.error("Anthropic API error:", err);
      return jsonResponse({ error: "Failed to generate study content" }, 500);
    }

    await supabase.from("study_sessions").insert({
      learner_id: learner.id,
      topic_id: topic.id,
      phase: body.phase,
      learner_input: body.learnerInput ?? null,
      ai_response: responseText,
      completed_at: new Date().toISOString(),
    });

    return jsonResponse({ response: responseText, phase: body.phase, tokensUsed });
  } catch (err) {
    console.error("generate-study-guide error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

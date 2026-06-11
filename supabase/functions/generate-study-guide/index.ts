// Supabase Edge Function: generate-study-guide
// POST { topicId, phase, learnerInput?, context? }
//   phase: 'explain' | 'example' | 'attempt' | 'feedback' | 'chat' | 'studyguide'
//   context: { explainText?, exampleText?, attemptQuestion?, history? }
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
// All other phases return: { response: string, phase: string, tokensUsed: number }
//
// Auth: caller must be the learner who owns the topic (enforced via RLS
// using the caller's JWT for all reads/writes). Subject, grade, diagnostic
// level and language are looked up server-side rather than trusted from the
// request body.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { containsCrisisLanguage, SADAG_CRISIS_MESSAGE } from "../_shared/safety.ts";
import { callClaude, ClaudeTimeoutError } from "../_shared/anthropic.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SYSTEM_PROMPT = `You are Leuro™, an expert South African CAPS tutor for Grades 4-12.
You help learners with one study topic at a time, working through four
steps: explanation, worked example, practice attempt, and feedback.

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

type Phase = "explain" | "example" | "attempt" | "feedback" | "chat" | "studyguide";

interface RequestBody {
  topicId?: string;
  subjectId?: string;
  topicTitle?: string;
  phase: Phase;
  learnerInput?: string;
  previousResponse?: string;
  context?: {
    explainText?: string;
    exampleText?: string;
    attemptQuestion?: string;
    history?: { role: "ai" | "learner"; text: string }[];
  };
}

function buildUserPrompt(
  body: RequestBody,
  topicTitle: string,
  subjectName: string,
  grade: number,
  level: number,
  lang: string,
): string {
  const langLine =
    lang === "af" ? "Respond in Afrikaans." : "Respond in English.";
  const levelText = level > 0 ? `${level}/5` : "1/5 (not yet diagnosed, assume a beginner)";
  const header = `Subject: ${subjectName} | Grade: ${grade} | Topic: "${topicTitle}" | Learner level: ${levelText}\n${langLine}\n\n`;

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
    case "attempt":
      return (
        header +
        (body.context?.exampleText
          ? `You previously gave this worked example: """${body.context.exampleText}"""\n\n`
          : "") +
        `Now write ONE new, original practice question on this topic (Bloom's: ` +
        `Apply + Analyze) for the learner to attempt themselves. Make it about ` +
        `50% harder than the worked example - similar style but with different ` +
        `numbers/details. Include a mark allocation if applicable (e.g. "(4 marks)") ` +
        `and give clear instructions for how the learner should respond. Output ` +
        `ONLY the question text - do not include the answer or any hints.`
      );
    case "feedback": {
      const question = body.context?.attemptQuestion ?? "(question not available)";
      const answer = body.learnerInput ?? "(no answer provided)";
      return (
        header +
        `The practice question was: """${question}"""\n` +
        `The learner's answer was: """${answer}"""\n\n` +
        `Evaluate the learner's answer (Bloom's: Analyze + Evaluate, applying ` +
        `Barrett's critical-thinking taxonomy to their reasoning, not just the ` +
        `final answer). Identify what they did well and any gaps or ` +
        `misconceptions, provide constructive corrections (show the correct ` +
        `approach/answer if needed), and suggest a next step. Keep the tone ` +
        `encouraging throughout.`
      );
    }
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

function buildStudyGuidePrompt(
  topicTitle: string,
  subjectName: string,
  grade: number,
  level: number,
  lang: string,
): string {
  const langLine = lang === "af" ? "Respond in Afrikaans." : "Respond in English.";
  const levelText = level > 0 ? `${level}/5` : "1/5 (not yet diagnosed, assume a beginner)";
  return (
    `Subject: ${subjectName} | Grade: ${grade} | Topic: "${topicTitle}" | Learner level: ${levelText}\n${langLine}\n\n` +
    `Create a concise study guide for this topic. Respond with ONLY a raw ` +
    `JSON object (no markdown, no code fences, no extra text) with exactly ` +
    `these keys:\n` +
    `{"topicTitle": string, "keyConcepts": string[] (3-5 short bullet points), ` +
    `"example": string (one short worked example, 100-150 words), ` +
    `"selfCheckQuestion": string (one practice question to check understanding)}`
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
    if (!["explain", "example", "attempt", "feedback", "chat", "studyguide"].includes(body.phase)) {
      return jsonResponse({ error: "invalid phase" }, 400);
    }
    if (body.phase !== "studyguide" && !body.topicId) {
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

    const [{ data: learner, error: learnerErr }, { data: profile }] = await Promise.all([
      supabase.from("learners").select("id, grade, diagnostic_level").eq("user_id", userData.user.id).single(),
      supabase.from("profiles").select("subscription_tier, lang").eq("id", userData.user.id).single(),
    ]);

    if (learnerErr || !learner) {
      return jsonResponse({ error: "Learner profile not found" }, 404);
    }

    const lang = profile?.lang ?? "en";

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

    const tier = profile?.subscription_tier ?? "free";

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

    // Child-safety screen on learner-submitted text (attempt answers / feedback / chat)
    if (
      (body.phase === "feedback" || body.phase === "attempt" || body.phase === "chat") &&
      containsCrisisLanguage(body.learnerInput)
    ) {
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

    if (body.phase === "feedback") {
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
    }

    return jsonResponse({ response: responseText, phase: body.phase, tokensUsed });
  } catch (err) {
    console.error("generate-study-guide error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

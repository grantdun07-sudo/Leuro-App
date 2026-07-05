// Shared helper for calling the Anthropic Messages API with prompt caching
// and a request timeout. Used by generate-study-guide, generate-mock-exam,
// and run-diagnostic (grade-mock-exam is a deterministic grader with no AI
// call; generate-flashcards has its own separate local copy of this
// function, not this shared one).

export const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
export const MODEL = "claude-haiku-4-5-20251001";
export const ANTHROPIC_TIMEOUT_MS = 60000;

export interface ClaudeResult {
  text: string;
  tokensUsed: number;
}

export class ClaudeTimeoutError extends Error {}
export class ClaudeApiError extends Error {}

// Calls Claude with the given system prompt cached as an ephemeral block,
// and the given user prompt as the only message. Throws ClaudeTimeoutError
// if the request takes longer than ANTHROPIC_TIMEOUT_MS, or ClaudeApiError
// for any other non-2xx response.
//
// callerLabel identifies the calling edge function in the usage log line
// below (e.g. "generate-study-guide") - this helper is shared across
// multiple functions, so a bare "Anthropic usage:" log wouldn't say which
// one it came from. Purely a logging label; does not affect the request.
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  callerLabel: string,
): Promise<ClaudeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ClaudeTimeoutError("Anthropic request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new ClaudeApiError(`Anthropic API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  // Logged so cache behaviour can be verified from real Supabase Edge
  // Function logs: cache_creation_input_tokens > 0 on a cache-writing call,
  // cache_read_input_tokens > 0 on a cache-hit call. Same pattern as
  // generate-flashcards' own local callClaude() - this is the real
  // evidence, not a code-review assumption. Note: the system prompts
  // calling into this shared helper are well under Haiku 4.5's 4,096-token
  // minimum for a cache block to activate at all (largest is ~600 est.
  // tokens), so 0/absent on both fields here is the expected result today,
  // not a bug - logging it is what turns that from an assumption into
  // confirmed evidence.
  console.log(`${callerLabel}: Anthropic usage:`, JSON.stringify(data.usage));
  const text = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n")
    .trim();
  const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

  return { text, tokensUsed };
}

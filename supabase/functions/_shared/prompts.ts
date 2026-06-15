// Shared language-instruction helper for all Leuro edge functions that
// generate learner-facing AI content (generate-study-guide,
// generate-mock-exam, grade-mock-exam, run-diagnostic).

// Returns the language instruction block to append to a Claude prompt.
// For Afrikaans, this goes beyond "respond in Afrikaans" with explicit
// rules so the model produces correct, natural, CAPS-appropriate Afrikaans
// rather than anglicised or word-for-word translated text.
export function langInstruction(lang: string): string {
  if (lang !== "af") return "Respond entirely in English.";
  return [
    "Respond ENTIRELY in pure, natural, academic Afrikaans.",
    "Strict rules for correct Afrikaans:",
    "- Apply V2 (verb-second) word order: in main clauses the finite verb is the second element.",
    "- Use no anglicisms: never translate English idioms or sentence structure word-for-word.",
    "- Never use an English term when a correct Afrikaans equivalent exists.",
    "- Use official CAPS/KABV subject terminology (e.g. 'assessering', 'kurrikulum', 'breuke', 'werkwoord').",
    "- Match vocabulary complexity to the learner's grade: simpler for lower grades, more sophisticated for Grade 12.",
    "- Spelling and grammar must be correct enough that a first-language Afrikaans teacher would accept it.",
  ].join("\n");
}

// Appended after langInstruction() for prompts whose response is a JSON
// object/array, so the language rules apply only to human-readable text
// values and not to the JSON structure itself.
export const JSON_KEYS_ENGLISH_NOTE =
  "Keep all JSON keys in English; only the human-readable text values are in the chosen language.";

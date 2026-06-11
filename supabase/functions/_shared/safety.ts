// Lightweight intent-based safety screening for learner-submitted text.
// This is a first-pass keyword screen; it intentionally errs on the side
// of caution (false positives are acceptable, false negatives are not).

const CRISIS_PATTERNS: RegExp[] = [
  /\bkill myself\b/i,
  /\bsuicid\w*/i,
  /\bend my life\b/i,
  /\bwant to die\b/i,
  /\bdon'?t want to (be alive|live)\b/i,
  /\bself[\s-]?harm\w*/i,
  /\bcutting myself\b/i,
  /\bhurt myself\b/i,
  /\bno reason to live\b/i,
  /\bbetter off dead\b/i,
];

export function containsCrisisLanguage(text: string | null | undefined): boolean {
  if (!text) return false;
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

export const SADAG_CRISIS_MESSAGE = {
  en:
    "It sounds like you might be going through something really tough right now. " +
    "You don't have to face this alone. Please reach out for support:\n\n" +
    "SADAG Suicide Crisis Line: 0800 567 567 (24/7)\n" +
    "SADAG WhatsApp: 087 163 2030\n" +
    "SMS 31393 and a counsellor will call you back\n\n" +
    "If you are in immediate danger, please call 10111 (police) or go to your nearest hospital. " +
    "Please also tell a trusted adult, like a parent, guardian or teacher, how you're feeling.",
  af:
    "Dit klink asof jy tans iets baie moeiliks ervaar. Jy hoef nie alleen hierdeur te gaan nie. " +
    "Kry asseblief ondersteuning:\n\n" +
    "SADAG Selfdoodkrisislyn: 0800 567 567 (24/7)\n" +
    "SADAG WhatsApp: 087 163 2030\n" +
    "Stuur 'n SMS na 31393 en 'n berader sal jou terugskakel\n\n" +
    "As jy in onmiddellike gevaar is, skakel asseblief 10111 (polisie) of gaan na jou naaste hospitaal. " +
    "Praat asseblief ook met 'n volwasse persoon wat jy vertrou, soos 'n ouer, voog of onderwyser.",
};

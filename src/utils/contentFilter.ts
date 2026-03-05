const BLOCKED_PATTERNS: RegExp[] = [
  /\b(sex|sexy|nude|naked|porn|hentai|xxx|nsfw)\b/i,
  /\b(fuck|shit|ass|bitch|dick|cock|pussy|cunt|whore|slut)\b/i,
  /\b(kill|murder|suicide|rape|molest|stab|shoot)\b/i,
  /\b(drug|weed|cocaine|heroin|meth)\b/i,
  /\b(racist|nazi|kkk|n[i1]gg)/i,
  /\b(bomb|terror|explo(?:de|sion)s?\s+(?:people|school|building))/i,
  /\b(boob|tit|penis|vagina|genital|butt\s*hole)\b/i,
  /\b(gore|bloody\s+murder|dismember)\b/i,
];

export function checkPrompt(text: string): { ok: boolean; reason?: string } {
  const cleaned = text.trim().toLowerCase();
  if (!cleaned) return { ok: true };

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(cleaned)) {
      return {
        ok: false,
        reason: "Whoa there — the lab can't synthesize that kind of energy. Try something else!",
      };
    }
  }

  return { ok: true };
}

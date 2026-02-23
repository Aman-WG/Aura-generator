import type { AuraParams, ParticleStyle, ParticleDrift } from './types';
import { VALID_SHAPE_IDS } from './particle-shapes';

// ─────────────────────────────────────────────────────────────
// AI Provider Support: Gemini (free) | OpenAI (paid)
// ─────────────────────────────────────────────────────────────

export type AIProvider = 'gemini' | 'openai' | 'portkey';

const SHAPE_LIST = VALID_SHAPE_IDS.join(', ');

const SYSTEM_PROMPT = `You are an Aura Visualizer for a kids' game. You create anime-style energy auras like Dragon Ball Z Super Saiyan transformations, Jujutsu Kaisen cursed energy, or Demon Slayer breathing techniques.

ABSOLUTE RULE — THE PROMPT CONTROLS EVERYTHING:
The student's text prompt is the SOLE driver of the aura. Build 100% of the aura from the prompt. IGNORE the element and energy fields entirely — they exist only as a fallback if the prompt is empty or meaningless. The prompt decides ALL colors, particle shapes, name, contour style, and energy type.

COLOR IDENTITY IS CRITICAL:
When the prompt references a well-known character, franchise, animal, or object, you MUST use that thing's REAL signature/iconic colors. This is the most important visual decision:
- Wolverine → blue (#1E3A8A) + yellow (#FFD700), claws
- Pikachu → bright yellow (#FFD700) + red (#FF0000) accents, electric
- Naruto → orange (#FF6B00) + black, spiraling energy
- Goku Super Saiyan → golden yellow (#FFD700) + white hot core
- Batman → dark blue (#1a1a3e) + black + yellow (#FFD700) accents
- Spider-Man → red (#CC0000) + blue (#003399) + web patterns
- Hulk → gamma green (#33CC33) + purple (#6600CC)
- Sasuke → purple (#7B2D8E) + dark blue + lightning
- Demon Slayer → match the breathing style colors (water=blue, flame=red/orange, thunder=yellow)
- Dragon → deep red/orange, scales, fire
- Ocean/water → deep blue (#0066CC) + teal (#00CED1) + white foam
- Fire → orange (#FF4500) + red (#FF0000) + yellow tips
- Ice → cyan (#00DDFF) + white (#F0F8FF) + crystal blue
- Flowers/nature → soft greens + pinks/purples
- Wolverine claws → metallic silver (#C0C0C0) streaks with blue/yellow base
If you know the character/thing, use its REAL colors. Do NOT default to generic orange/white/grey.

HOW TO INTERPRET ANY PROMPT:
- Named characters → their EXACT iconic colors, signature weapons/features in particles, personality-matched energy
- Objects/food (waffle, sword, diamond) → extract the object's real colors and texture
- Abstract concepts (chaos, peace, rage) → energy mood with vivid fitting colors
- Styles (cyberpunk, medieval, cosmic) → aesthetic palette and motion language
- Animals (dragon, wolf, phoenix) → creature's real-world or mythical associated colors
- ANYTHING else → be creative, pick vivid and dramatic colors, make it epic

The aura should ALWAYS look powerful, dramatic, and COLOR-RICH. Never return white, grey, or desaturated auras unless the prompt explicitly asks for it (e.g. "ghost", "silver phantom").

AURA NAME:
Generate a 2-4 word name that sounds like an anime ultimate move or transformation. Make it drip with swagger and rizz. Examples: "Thunderclap Sovereign", "Abyssal Tide Unleashed", "Golden Gridlock Inferno", "Nocturnal Apex Protocol", "Eclipse of the Forsaken".

AURA SHAPE & MOOD (VERY IMPORTANT — read the prompt's emotional energy):
The aura's contour shape must match the PERSONALITY of the prompt. Not every aura is aggressive. Read the prompt and decide:

AGGRESSIVE / INTENSE prompts (war, villain, rage, explosion, demon, dragon, combat, thunder, wolverine claws):
→ smoothness: 0.0-0.15, jaggedness: 0.7-1.0, speed: 1.2-2.0, height: 1.0-1.5
→ particles: drift "burst" or "rise", style "debris" or "ember", speed 1.3-2.0
→ Sharp spikes, fast-moving, tall, violent energy. Lightning enabled.

POWERFUL / HEROIC prompts (superhero, warrior, champion, king, goku, naruto, action):
→ smoothness: 0.2-0.4, jaggedness: 0.5-0.8, speed: 0.8-1.5, height: 0.8-1.3
→ particles: drift "rise" or "burst", style "ember" or "sparkle", speed 0.8-1.5
→ Strong jagged contours but with some flow, dynamic

COOL / SLEEK prompts (cyberpunk, batman, stealth, ninja, assassin, shadow, ice):
→ smoothness: 0.35-0.55, jaggedness: 0.35-0.55, speed: 0.6-1.0, height: 0.7-1.0
→ particles: drift "float" or "spiral", style "orb" or "sparkle", speed 0.5-0.9
→ Controlled, sharp but refined edges, steady pulse

ELEGANT / FLOWING prompts (water, ocean, wind, music, dance, silk, angel, mermaid):
→ smoothness: 0.65-0.9, jaggedness: 0.15-0.35, speed: 0.4-0.8, height: 0.6-1.0
→ particles: drift "float" or "spiral", style "bubble" or "sparkle", speed 0.3-0.7
→ Smooth organic curves, gentle undulation, graceful

GENTLE / SOFT prompts (flowers, love, peace, healing, cloud, dream, baby, puppy, butterfly):
→ smoothness: 0.85-1.0, jaggedness: 0.1-0.2, speed: 0.3-0.5, height: 0.5-0.8
→ particles: drift "float", style "bubble" or "orb", speed 0.2-0.5
→ Very smooth rounded contour, slow pulse, small and cozy. No lightning.

PLAYFUL / FUN prompts (pikachu, candy, party, carnival, cartoon, pizza, gaming):
→ smoothness: 0.5-0.7, jaggedness: 0.25-0.45, speed: 0.7-1.2, height: 0.7-1.0
→ particles: drift "spiral" or "float", style "sparkle" or "bubble", speed 0.6-1.0
→ Bouncy, rounded but lively, medium energy

DARK / MYSTERIOUS prompts (void, ghost, shadow, curse, death, abyss, cosmic horror):
→ smoothness: 0.4-0.6, jaggedness: 0.35-0.6, speed: 0.3-0.6, height: 0.8-1.2
→ particles: drift "float" or "spiral", style "orb" or "debris", speed 0.3-0.6
→ Organic but unsettling wavy curves, slow ominous pulse

CRITICAL RULE: Read the prompt and FEEL its personality. Many prompts will blend moods — use your judgment to interpolate.
The aura's shape should FEEL like the prompt when you look at it:
- A flower aura → soft, round, gentle edges, slow float
- A wolverine aura → sharp, violent spikes, fast burst
- A ghost aura → wispy, eerie organic waves, slow drift
- A party aura → bouncy, rounded, lively
- An ocean aura → flowing, smooth, rhythmic
DO NOT default to aggressive sharp angles for every prompt. Match the mood.

GENERIC PARTICLE FALLBACK SHAPES:
If your custom paths below fail, these library IDs are used as fallback. Pick 2-3 that vaguely relate: ${SHAPE_LIST}

CUSTOM PARTICLE ILLUSTRATIONS (THIS IS THE MOST IMPORTANT PART):
You must generate exactly 3 custom SVG path "d" strings. These are the SOUL of the aura — they float as glowing particles and must be INSTANTLY recognizable objects that relate to the student's prompt.

YOUR CREATIVE PROCESS:
1. Read the prompt carefully
2. Think: what real-world objects, pop culture symbols, or iconic items does this prompt evoke?
3. For EACH of the 3 paths, draw a DIFFERENT recognizable object as a filled silhouette

The student could type ANYTHING. Your job is to think creatively about what objects belong in that world:
- A character name → draw their iconic gear, weapons, logos, or features
- A movie/show → draw recognizable props, symbols, or characters from it
- A food → draw the food item itself, utensils, or related objects
- A sport → draw the ball, equipment, or trophy
- An animal → draw the animal silhouette, paw prints, or habitat elements
- A holiday → draw the holiday's iconic decorations or symbols
- An abstract concept → draw metaphorical objects that represent it
- ANYTHING else → use your world knowledge to pick 3 objects that a viewer would associate with the topic

SVG PATH FORMAT (48x48 coordinate space, 0,0 = top-left, 48,48 = bottom-right):
- Use M (moveTo), L (lineTo), C (cubic bezier), Q (quadratic bezier), A (arc), Z (close) commands
- Use CURVES (C, Q) for organic/round forms — straight lines only for angular objects
- Fill the full 48x48 space — bigger shapes are more visible as particles
- Multiple sub-paths OK: "M...Z M...Z" for shapes with holes or separate parts
- Max 800 chars per path

TECHNIQUE EXAMPLES (showing how to draw different types of objects):
- Round face with features (head + ears + eyes): "M24 4 C16 4 6 10 6 20 C6 30 12 40 18 44 L24 42 L30 44 C36 40 42 30 42 20 C42 10 32 4 24 4 Z M10 8 L6 0 L14 10 Z M38 8 L42 0 L34 10 Z M17 22 C17 20 20 18 20 22 C20 24 17 24 17 22 Z M28 22 C28 20 31 18 31 22 C31 24 28 24 28 22 Z"
- Circular object with inner detail (sphere + band + center): "M24 2 C36 2 46 12 46 24 C46 36 36 46 24 46 C12 46 2 36 2 24 C2 12 12 2 24 2 Z M2 22 L46 22 L46 26 L2 26 Z M24 18 C27 18 30 21 30 24 C30 27 27 30 24 30 C21 30 18 27 18 24 C18 21 21 18 24 18 Z"
- Mechanical object (body + round parts): "M8 30 L12 28 L14 20 L18 18 L22 18 C26 18 28 16 30 14 L34 14 L38 16 L42 20 L44 24 L44 30 L40 30 C40 26 36 26 36 30 L20 30 C20 26 16 26 16 30 Z"
- Organic curved shape (flowing brim + tapered body): "M10 40 C10 36 6 36 4 38 L4 42 L44 42 L44 38 C42 36 38 36 38 40 L36 30 L30 16 C28 10 26 6 24 4 Z"
- Spread wing shape (curved spans): "M24 24 C18 20 4 8 2 4 C6 8 14 12 20 18 L24 24 L28 18 C34 12 42 8 46 4 C44 8 30 20 24 24 Z"
These examples demonstrate TECHNIQUE only — your paths must depict objects uniquely tied to the student's prompt. Never copy these examples.

Every prompt gets unique particles. A "pizza" aura should have a pizza slice, a chef hat, and a pepperoni. A "space" aura should have a rocket, a planet, and a star constellation. Think creatively.

SAFETY:
- NEVER include violent, sexual, drug-related, or inappropriate themes
- If the prompt is inappropriate, return a neutral white/silver aura named "Null Aura"
- All color values must be 6-digit hex strings with # prefix (e.g. "#FF4500")
- Response must be ONLY valid JSON, no markdown, no explanation

OUTPUT THIS EXACT JSON:
{
  "auraName": "2-4 word anime power-up name with maximum drip",
  "innerGlow": { "color": "#hex", "intensity": 0.3-1.0, "radius": 0.3-0.6 },
  "outerGlow": { "color": "#hex", "intensity": 0.2-0.8, "radius": 0.6-1.0 },
  "flameContour": {
    "baseColor": "#hex",
    "tipColor": "#hex",
    "speed": 0.5-2.0,
    "jaggedness": 0.1-1.0,
    "smoothness": 0.0-1.0,
    "height": 0.5-1.5,
    "thickness": 0.3-1.0,
    "dualLayer": true/false,
    "dualColor": "#hex or null"
  },
  "particles": {
    "color": "#hex",
    "secondaryColor": "#hex or null",
    "count": 15-50,
    "size": 1-5,
    "speed": 0.5-2.0,
    "style": "ember"|"sparkle"|"debris"|"lightning"|"bubble"|"orb",
    "drift": "rise"|"spiral"|"burst"|"float",
    "shapes": ["shape_id_1", "shape_id_2", "shape_id_3"],
    "customPaths": [
      { "name": "descriptive_name", "path": "M... SVG path d string" },
      { "name": "descriptive_name_2", "path": "M... SVG path d string" }
    ]
  },
  "lightning": { "enabled": true/false, "color": "#hex", "frequency": 0.1-0.5 },
  "intensity": 0.5-1.5
}`;

/**
 * Extract a JSON object from a string that may contain surrounding text,
 * markdown fences, or preamble like "Here is the JSON:".
 * Finds the first `{` and last `}` and returns the substring.
 */
function extractJSON(raw: string): string {
  let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `No valid JSON in response (len=${s.length}, firstBrace=${start}, lastBrace=${end}): "${s.slice(0, 400)}"`,
    );
  }

  return s.slice(start, end + 1);
}

function buildUserMessage(element: string, energy: string, prompt: string): string {
  return `Generate an aura for: "${prompt}"

Use the EXACT signature colors and visual identity of whatever "${prompt}" refers to. Pick particle shapes that represent objects/symbols associated with it. Make it vivid and instantly recognizable.`;
}

const VALID_STYLES: ParticleStyle[] = ['ember', 'sparkle', 'debris', 'lightning', 'bubble', 'orb'];
const VALID_DRIFTS: ParticleDrift[] = ['rise', 'spiral', 'burst', 'float'];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function numOr(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeShapes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(String)
    .filter((id) => VALID_SHAPE_IDS.includes(id))
    .slice(0, 5);
}

const SVG_PATH_CHARS = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s\-]+$/;

function sanitizeCustomPaths(
  raw: unknown,
): Array<{ name: string; path: string }> {
  if (!Array.isArray(raw)) return [];
  const result: Array<{ name: string; path: string }> = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const name = String((entry as any).name || 'shape').slice(0, 40);
    const path = String((entry as any).path || '');
    if (!path || path.length > 1200) continue;
    if (!/^[Mm]/.test(path)) continue;
    if (!SVG_PATH_CHARS.test(path)) continue;
    try {
      new Path2D(path);
      result.push({ name, path });
    } catch {
      continue;
    }
    if (result.length >= 3) break;
  }
  return result;
}

function sanitizeParams(raw: Record<string, unknown>): AuraParams {
  const r = raw as Record<string, any>;
  return {
    auraName: String(r.auraName || 'Unknown Aura'),
    innerGlow: {
      color: String(r.innerGlow?.color || '#FFFFFF'),
      intensity: clamp(Number(r.innerGlow?.intensity) || 0.6, 0.1, 1.0),
      radius: clamp(Number(r.innerGlow?.radius) || 0.4, 0.1, 0.8),
    },
    outerGlow: {
      color: String(r.outerGlow?.color || '#AAAAFF'),
      intensity: clamp(Number(r.outerGlow?.intensity) || 0.4, 0.1, 1.0),
      radius: clamp(Number(r.outerGlow?.radius) || 0.8, 0.3, 1.0),
    },
    flameContour: {
      baseColor: String(r.flameContour?.baseColor || '#FF6600'),
      tipColor: String(r.flameContour?.tipColor || '#FFDD00'),
      speed: clamp(Number(r.flameContour?.speed) || 1.0, 0.2, 3.0),
      jaggedness: clamp(numOr(r.flameContour?.jaggedness, 0.5), 0.1, 1.0),
      smoothness: clamp(numOr(r.flameContour?.smoothness, 0.3), 0, 1.0),
      height: clamp(Number(r.flameContour?.height) || 1.0, 0.3, 2.0),
      thickness: clamp(Number(r.flameContour?.thickness) || 0.6, 0.2, 1.0),
      dualLayer: Boolean(r.flameContour?.dualLayer),
      dualColor: r.flameContour?.dualColor ? String(r.flameContour.dualColor) : undefined,
    },
    particles: {
      color: String(r.particles?.color || '#FFAA00'),
      secondaryColor: r.particles?.secondaryColor ? String(r.particles.secondaryColor) : undefined,
      count: clamp(Math.round(Number(r.particles?.count) || 30), 10, 50),
      size: clamp(Number(r.particles?.size) || 2, 0.5, 6),
      speed: clamp(Number(r.particles?.speed) || 1.0, 0.2, 3.0),
      style: VALID_STYLES.includes(r.particles?.style) ? r.particles.style : 'ember',
      drift: VALID_DRIFTS.includes(r.particles?.drift) ? r.particles.drift : 'rise',
      shapes: sanitizeShapes(r.particles?.shapes),
      customPaths: sanitizeCustomPaths(r.particles?.customPaths),
    },
    lightning: {
      enabled: Boolean(r.lightning?.enabled),
      color: String(r.lightning?.color || '#FFFFFF'),
      frequency: clamp(Number(r.lightning?.frequency) || 0.2, 0.05, 0.6),
    },
    intensity: clamp(Number(r.intensity) || 1.0, 0.3, 2.0),
  };
}

/** Element-based fallback when AI call fails */
export function getFallbackParams(element: string): AuraParams {
  const presets: Record<string, Partial<AuraParams>> = {
    fire: {
      auraName: 'Inferno Ascension',
      innerGlow: { color: '#FF6600', intensity: 0.8, radius: 0.4 },
      outerGlow: { color: '#FF2200', intensity: 0.5, radius: 0.85 },
      flameContour: { baseColor: '#FF4500', tipColor: '#FFD700', speed: 1.2, jaggedness: 0.7, smoothness: 0.25, height: 1.2, thickness: 0.7, dualLayer: false },
      particles: { color: '#FF6600', secondaryColor: '#FFD700', count: 35, size: 2.5, speed: 1.3, style: 'ember', drift: 'rise', shapes: ['flame', 'star'] },
      lightning: { enabled: false, color: '#FFFFFF', frequency: 0.2 },
      intensity: 1.1,
    },
    ice: {
      auraName: 'Glacier Sovereignty',
      innerGlow: { color: '#FFFFFF', intensity: 0.7, radius: 0.35 },
      outerGlow: { color: '#00D4FF', intensity: 0.5, radius: 0.9 },
      flameContour: { baseColor: '#00BFFF', tipColor: '#E0F8FF', speed: 0.7, jaggedness: 0.4, smoothness: 0.6, height: 0.9, thickness: 0.6, dualLayer: false },
      particles: { color: '#B0E0FF', secondaryColor: '#FFFFFF', count: 30, size: 2, speed: 0.6, style: 'sparkle', drift: 'float', shapes: ['snowflake', 'diamond'] },
      lightning: { enabled: false, color: '#FFFFFF', frequency: 0.2 },
      intensity: 0.9,
    },
    void: {
      auraName: 'Eclipse Requiem',
      innerGlow: { color: '#9B00FF', intensity: 0.8, radius: 0.45 },
      outerGlow: { color: '#4B0082', intensity: 0.6, radius: 0.9 },
      flameContour: { baseColor: '#8B00FF', tipColor: '#FF00FF', speed: 1.0, jaggedness: 0.8, smoothness: 0.15, height: 1.3, thickness: 0.8, dualLayer: true, dualColor: '#1A0030' },
      particles: { color: '#CC66FF', secondaryColor: '#FF00FF', count: 40, size: 2, speed: 0.8, style: 'orb', drift: 'spiral', shapes: ['eye', 'spiral'] },
      lightning: { enabled: true, color: '#CC00FF', frequency: 0.15 },
      intensity: 1.2,
    },
    thunder: {
      auraName: 'Thunderclap Sovereign',
      innerGlow: { color: '#FFFFFF', intensity: 0.9, radius: 0.35 },
      outerGlow: { color: '#FFD700', intensity: 0.6, radius: 0.85 },
      flameContour: { baseColor: '#FFD700', tipColor: '#FFFFFF', speed: 1.5, jaggedness: 0.9, smoothness: 0.1, height: 1.1, thickness: 0.6, dualLayer: false },
      particles: { color: '#FFD700', secondaryColor: '#FFFFFF', count: 25, size: 2, speed: 1.5, style: 'lightning', drift: 'burst', shapes: ['lightning_bolt', 'bolt'] },
      lightning: { enabled: true, color: '#FFD700', frequency: 0.35 },
      intensity: 1.3,
    },
    nature: {
      auraName: 'Verdant Awakening',
      innerGlow: { color: '#88FF88', intensity: 0.6, radius: 0.4 },
      outerGlow: { color: '#00AA44', intensity: 0.4, radius: 0.85 },
      flameContour: { baseColor: '#00FF88', tipColor: '#CCFF66', speed: 0.8, jaggedness: 0.35, smoothness: 0.7, height: 0.8, thickness: 0.7, dualLayer: false },
      particles: { color: '#66FF66', secondaryColor: '#FFFF00', count: 30, size: 3, speed: 0.7, style: 'sparkle', drift: 'float', shapes: ['leaf', 'droplet'] },
      lightning: { enabled: false, color: '#FFFFFF', frequency: 0.2 },
      intensity: 0.85,
    },
  };

  const base = presets[element] || presets.fire;
  return sanitizeParams(base as Record<string, unknown>);
}

// ─── Gemini (Google AI) — FREE tier ─────────────────────────

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
] as const;

async function callGeminiWithModel(
  model: string,
  apiKey: string,
  element: string,
  energy: string,
  prompt: string,
): Promise<{ res: Response; model: string }> {
  const trimmedKey = apiKey.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`;
  console.log(`[AuraAI v4] Trying model: ${model} | Key: ${trimmedKey.slice(0, 10)}...${trimmedKey.slice(-4)} (${trimmedKey.length} chars)`);

  const body: Record<string, unknown> = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: buildUserMessage(element, energy, prompt) }],
      },
    ],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 4096,
    },
  };

  if (model.includes('2.5')) {
    body.thinkingConfig = { thinkingBudget: 0 };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return { res, model };
}

async function callGemini(apiKey: string, element: string, energy: string, prompt: string): Promise<AuraParams> {
  const failures: string[] = [];

  for (const model of GEMINI_MODELS) {
    let res: Response;
    try {
      ({ res } = await callGeminiWithModel(model, apiKey, element, energy, prompt));
    } catch (fetchErr) {
      const msg = `${model} fetch error: ${(fetchErr as Error).message}`;
      console.warn(`[AuraAI v3] ${msg}`);
      failures.push(msg);
      continue;
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      const shortBody = errBody.slice(0, 500);
      console.error(`[AuraAI v4] ${model} HTTP ${res.status} response body:`, shortBody);
      const reason = res.status === 429 ? 'quota/rate-limit' : `error ${res.status}`;
      failures.push(`${model} ${reason}: ${shortBody.slice(0, 120)}`);
      continue;
    }

    console.log(`[AuraAI v4] ${model} responded OK`);
    const data = await res.json();

    const candidate = data.candidates?.[0];
    if (!candidate) {
      const blockReason = data.promptFeedback?.blockReason;
      throw new Error(blockReason ? `Prompt blocked: ${blockReason}` : 'No response from Gemini');
    }

    const text: string = candidate.content?.parts?.[0]?.text ?? '';
    console.log('[AuraAI v3] Raw response:', text.slice(0, 200));
    console.log('[AuraAI v3] Finish reason:', candidate.finishReason);

    if (!text) {
      throw new Error(`Empty Gemini response. Finish reason: ${candidate.finishReason}`);
    }

    const jsonStr = extractJSON(text);
    return sanitizeParams(JSON.parse(jsonStr));
  }

  throw new Error(`All Gemini models failed: ${failures.join(' → ')}`);
}

// ─── OpenAI — paid alternative ──────────────────────────────

async function callOpenAI(apiKey: string, element: string, energy: string, prompt: string): Promise<AuraParams> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      max_tokens: 3000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(element, energy, prompt) },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error ${res.status}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  return sanitizeParams(JSON.parse(extractJSON(content)));
}

// ─── Portkey (Gemini via Vertex AI gateway) ─────────────────

const PORTKEY_MODEL = '@vertex-global-region/gemini-3-flash-preview';
const PORTKEY_URL = 'https://api.portkey.ai/v1/chat/completions';

async function callPortkey(apiKey: string, element: string, energy: string, prompt: string): Promise<AuraParams> {
  const trimmedKey = apiKey.trim();
  console.log(`[AuraAI v4] Portkey call | Model: ${PORTKEY_MODEL} | Key: ${trimmedKey.slice(0, 8)}...${trimmedKey.slice(-4)}`);

  const res = await fetch(PORTKEY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-portkey-api-key': trimmedKey,
    },
    body: JSON.stringify({
      model: PORTKEY_MODEL,
      temperature: 0.9,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(element, energy, prompt) },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error(`[AuraAI v4] Portkey HTTP ${res.status}:`, errBody.slice(0, 500));
    throw new Error(`Portkey API error ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  console.log('[AuraAI v4] Portkey response received');
  const content: string = data.choices?.[0]?.message?.content ?? '';
  if (!content) {
    throw new Error('Empty response from Portkey');
  }
  console.log('[AuraAI v4] Portkey raw:', content.slice(0, 200));
  return sanitizeParams(JSON.parse(extractJSON(content)));
}

// ─── Public API ─────────────────────────────────────────────

export interface AuraGenerationResult {
  params: AuraParams;
  source: 'ai' | 'fallback';
  error?: string;
  rawResponse?: string;
}

export async function generateAuraParams(
  element: string,
  energy: string,
  prompt: string,
  apiKey: string,
  provider: AIProvider = 'gemini',
): Promise<AuraGenerationResult> {
  if (!apiKey) {
    return {
      params: getFallbackParams(element),
      source: 'fallback',
      error: 'No API key provided',
    };
  }

  try {
    let params: AuraParams;
    if (provider === 'portkey') {
      params = await callPortkey(apiKey, element, energy, prompt);
    } else if (provider === 'openai') {
      params = await callOpenAI(apiKey, element, energy, prompt);
    } else {
      params = await callGemini(apiKey, element, energy, prompt);
    }

    return { params, source: 'ai' };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`Aura AI failed (${provider}):`, errorMsg);
    return {
      params: getFallbackParams(element),
      source: 'fallback',
      error: errorMsg,
    };
  }
}

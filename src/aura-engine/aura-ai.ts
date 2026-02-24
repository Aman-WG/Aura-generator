import type { AuraParams, ParticleStyle, ParticleDrift, EnergyFlowPattern } from './types';
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
The aura's contour shape must match the PERSONALITY of the prompt. Not every aura is aggressive.

You have TWO independent controls that you MUST set thoughtfully:
- "smoothness" (0.0 to 1.0): How curved/organic the path drawing is. 0 = angular line segments, 1 = fully curved splines.
- "jaggedness" (0.1 to 1.0): How much the contour spikes in and out. 0.1 = nearly circular, 1.0 = wild spikes.

These are INDEPENDENT. You can combine them in many ways:
- Low smoothness + high jaggedness = sharp violent spikes (rage, combat, destruction)
- High smoothness + low jaggedness = soft round glow (love, flowers, dreams)
- High smoothness + medium jaggedness = ethereal flowing tendrils (angels, spirits, magic, positive heroes)
- Medium smoothness + medium jaggedness = balanced dynamic energy (most characters, action, adventure)
- Low smoothness + low jaggedness = geometric, crystalline (tech, cyber, ice, precision)
- Medium smoothness + high jaggedness = wild but organic (storms, chaos, nature's fury)

THINK about what the prompt's energy FEELS like, then pick the right combination. Most prompts are NOT at the extremes — they live somewhere in the middle. A beloved character is heroic but not violent. A magical creature is ethereal, not jagged. A funny topic is bouncy, not sharp.

Speed and height also matter:
- speed (0.3-2.0): How fast the contour animates. Calm = 0.3-0.6, normal = 0.6-1.2, intense = 1.2-2.0
- height (0.5-1.5): How tall the aura extends above. Keep between 0.7-1.2 for most prompts. Only go to extremes for truly extreme moods.

Particle drift and style should match mood:
- Calm/gentle → drift "float", style "bubble" or "orb", slow speed
- Dynamic/heroic → drift "rise" or "spiral", style "sparkle" or "ember", medium speed
- Aggressive/chaotic → drift "burst", style "debris" or "ember", fast speed
- Mysterious/dark → drift "spiral" or "float", style "orb", slow speed

DO NOT default to aggressive sharp angles. Most prompts deserve a balanced or flowing contour.

ENERGY FLOW (how color/light moves THROUGH the aura):
This controls the animated movement of the glow inside the aura body. Choose a pattern that matches how the prompt's energy would naturally move:
- "radial-out": Energy expands outward from the character's core. Use for power bursts, explosions, energy releases, activation moments.
- "radial-in": Energy pulls inward toward the character. Use for absorption, concentration, void, black holes, meditation, charging up.
- "rise": Energy sweeps upward from feet to head repeatedly. Use for fire, ascending power, heroic auras, levitation, heat.
- "spiral": Energy rotates around the character. Use for magic, vortex, cosmic, cyclones, mystical, tornado, spiritual.
- "pulse": Rhythmic breathing waves expand and contract. Use for heartbeat, calm power, steady energy, life force, music, rhythm.
- "cascade": Energy flows downward like a waterfall. Use for water, rain, gravity, melancholy, descending, ice, cooling.

Speed (0.3-2.0): How fast the flow animates. Match to the aura's overall energy.
Intensity (0.3-1.0): How visible/prominent the flow effect is. Subtle for gentle prompts, strong for dramatic ones.

Think about the prompt's PHYSICS — how would this energy actually move? Fire rises. Water cascades. Magic spirals. Power pulses. Use your intuition.

THEMATIC PARTICLE SHAPES (background ambient variety):
Pick 2-3 shapes from this library that relate to the prompt subject for small ambient background particles.
Available shape IDs: ${SHAPE_LIST}

ELEMENTAL PARTICLE SHAPES (energy texture):
Pick 1-2 shapes from these categories that match the aura's energy mood. These render as tiny ambient sparks/effects.
- FIRE: flame, burning_splinter, fire_spark
- ELECTRIC: lightning_bolt, electric_spark, plasma_orb
- WATER/ICE: droplet, water_splash, ice_shard
- DARK/SHADOW: shadow_wisp, crescent
- NATURE: petal, vine_curl
- LIGHT/HOLY: star, light_ray

★★★ CUSTOM SVG HERO PARTICLES — THE MOST IMPORTANT PART ★★★
You MUST generate EXACTLY 2 SVG path "d" strings. These are the HERO particles — large glowing silhouettes that make the aura instantly recognizable.

YOUR THINKING PROCESS (follow this chain exactly):
1. "What real-world thing does this prompt refer to?" → character, object, concept, animal, brand, etc.
2. "What is the #1 SYMBOL everyone associates with it?" → the logo, weapon, signature object, body part, item
3. "What SIMPLE GEOMETRIC OUTLINE captures that symbol?" → reduce it to the fewest lines/arcs possible
4. "Which recipe below is closest?" → adapt that recipe to your shape

For Captain America → shield (circle with inner star) + star (5-pointed)
For Spider-Man → spider silhouette (8 legs radiating from oval body) + web (concentric arcs with radial lines = too complex, use mask/face outline instead)
For a Cat → pointed-ear head silhouette + paw print
For a Race Car → side profile (low rectangle with wheel arcs) + checkered flag (simple grid)
For a Wizard → pointed hat (triangle with brim) + wand with star tip
For the Ocean → wave crest (wavy line with curl) + shell (spiral)
For Pizza → slice (triangle with wavy top edge) + circular pie (circle with lines)

GEOMETRIC PRIMITIVES for 64×64 canvas:
- LINES: M x,y L x,y — straight edges, good for stars, bolts, shields, triangles
- ARCS: A rx,ry 0 large-flag sweep-flag x,y — circles, crescents, shields, wheels
- CURVES: Q cx,cy ex,ey — organic bends: hearts, flames, waves, ears
- CLOSE: Z — always end each closed sub-path with Z

PROVEN RECIPES (copy and adapt — change coordinates to morph into your shape):
STAR (5-pt):   M32,2 L39,22 L62,22 L43,36 L50,58 L32,44 L14,58 L21,36 L2,22 L25,22 Z
BOLT:          M28,2 L36,24 L28,24 L38,62 L30,38 L36,38 Z
SHIELD/CIRCLE: M32,4 A28,28,0,1,1,32,60 A28,28,0,1,1,32,4 Z
CRESCENT:      M44,8 A24,24,0,1,0,44,56 A18,18,0,1,1,44,8 Z
HEART:         M32,56 Q2,32,32,12 Q62,32,32,56 Z
DIAMOND:       M32,4 L56,32 L32,60 L8,32 Z
TRIANGLE:      M32,4 L58,56 L6,56 Z
WING PAIR:     M32,32 L8,8 L2,28 L20,32 L2,36 L8,56 L32,32 L56,8 L62,28 L44,32 L62,36 L56,56 Z
CROWN:         M8,48 L8,20 L20,32 L32,16 L44,32 L56,20 L56,48 Z
PAW:           M32,38 A12,10,0,1,1,32,58 A12,10,0,1,1,32,38 Z M16,28 A6,6,0,1,1,16,40 A6,6,0,1,1,16,28 Z M48,28 A6,6,0,1,1,48,40 A6,6,0,1,1,48,28 Z M26,18 A5,5,0,1,1,26,28 A5,5,0,1,1,26,18 Z M38,18 A5,5,0,1,1,38,28 A5,5,0,1,1,38,18 Z

CRITICAL RULES:
- Shape must fill most of the 64×64 area — use coordinates from 4 to 60
- Keep it SIMPLE: 40-200 chars per path string
- Each path MUST start with M and end with Z
- These render as SOLID COLORED SILHOUETTES with glow — only the OUTLINE matters
- A 5-year-old should be able to identify the shape — if not, simplify more
- Do NOT generate complex multi-hundred-char paths — they break and look like blobs

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
    "thickness": 0.5-1.0,
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
    "shapes": ["thematic_id_1", "thematic_id_2"],
    "elementalShapes": ["elemental_id_1"],
    "customPaths": [
      { "name": "shape_name_1", "path": "M... simple recognizable SVG path in 64x64 ...Z" },
      { "name": "shape_name_2", "path": "M... simple recognizable SVG path in 64x64 ...Z" }
    ]
  },
  "lightning": { "enabled": true/false, "color": "#hex", "frequency": 0.1-0.5 },
  "energyFlow": { "pattern": "radial-out"|"radial-in"|"rise"|"spiral"|"pulse"|"cascade", "speed": 0.3-2.0, "intensity": 0.3-1.0 },
  "intensity": 0.7-1.5
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

IMPORTANT — before generating JSON, think:
1. What are the SIGNATURE COLORS of "${prompt}"? Use those exact colors.
2. What is the #1 most iconic SYMBOL of "${prompt}"? Draw that as customPaths[0].
3. What is the #2 associated object/symbol? Draw that as customPaths[1].
4. Both SVG shapes must be SIMPLE silhouettes using the recipe patterns from your instructions.

Make it vivid, instantly recognizable, and true to "${prompt}".`;
}

const VALID_STYLES: ParticleStyle[] = ['ember', 'sparkle', 'debris', 'lightning', 'bubble', 'orb'];
const VALID_DRIFTS: ParticleDrift[] = ['rise', 'spiral', 'burst', 'float'];
const VALID_FLOWS: EnergyFlowPattern[] = ['radial-out', 'radial-in', 'rise', 'spiral', 'pulse', 'cascade', 'zigzag', 'wave'];

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
    .slice(0, 3);
}

const SVG_PATH_CHARS = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s\-]+$/;

function sanitizeCustomPaths(
  raw: unknown,
): Array<{ name: string; path: string }> {
  if (!Array.isArray(raw)) return [];
  const result: Array<{ name: string; path: string }> = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const name = String((entry as any).name || 'shape').slice(0, 60);
    const path = String((entry as any).path || '');
    if (!path || path.length > 2000) continue;
    if (!/^[Mm]/.test(path)) continue;
    if (!SVG_PATH_CHARS.test(path)) continue;
    try {
      new Path2D(path);
      result.push({ name, path });
      console.log(`[AuraAI] Custom path OK: "${name}" (${path.length} chars)`);
    } catch (e) {
      console.warn(`[AuraAI] Custom path FAILED: "${name}"`, e);
      continue;
    }
    if (result.length >= 2) break;
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
      thickness: clamp(Number(r.flameContour?.thickness) || 0.7, 0.5, 1.0),
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
      elementalShapes: sanitizeShapes(r.particles?.elementalShapes),
      customPaths: sanitizeCustomPaths(r.particles?.customPaths),
    },
    lightning: {
      enabled: Boolean(r.lightning?.enabled),
      color: String(r.lightning?.color || '#FFFFFF'),
      frequency: clamp(Number(r.lightning?.frequency) || 0.2, 0.05, 0.6),
    },
    energyFlow: {
      pattern: VALID_FLOWS.includes(r.energyFlow?.pattern) ? r.energyFlow.pattern : 'radial-out',
      speed: clamp(numOr(r.energyFlow?.speed, 0.8), 0.3, 2.0),
      intensity: clamp(numOr(r.energyFlow?.intensity, 0.6), 0.3, 1.0),
    },
    intensity: clamp(Number(r.intensity) || 1.0, 0.7, 1.5),
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
      particles: { color: '#FF6600', secondaryColor: '#FFD700', count: 35, size: 2.5, speed: 1.3, style: 'ember', drift: 'rise', shapes: ['flame', 'fire_breath'], elementalShapes: ['burning_splinter', 'fire_spark'] },
      lightning: { enabled: false, color: '#FFFFFF', frequency: 0.2 },
      energyFlow: { pattern: 'rise', speed: 1.2, intensity: 0.7 },
      intensity: 1.1,
    },
    ice: {
      auraName: 'Glacier Sovereignty',
      innerGlow: { color: '#FFFFFF', intensity: 0.7, radius: 0.35 },
      outerGlow: { color: '#00D4FF', intensity: 0.5, radius: 0.9 },
      flameContour: { baseColor: '#00BFFF', tipColor: '#E0F8FF', speed: 0.7, jaggedness: 0.4, smoothness: 0.6, height: 0.9, thickness: 0.6, dualLayer: false },
      particles: { color: '#B0E0FF', secondaryColor: '#FFFFFF', count: 30, size: 2, speed: 0.6, style: 'sparkle', drift: 'float', shapes: ['snowflake', 'diamond'], elementalShapes: ['ice_shard'] },
      lightning: { enabled: false, color: '#FFFFFF', frequency: 0.2 },
      energyFlow: { pattern: 'cascade', speed: 0.6, intensity: 0.5 },
      intensity: 0.9,
    },
    void: {
      auraName: 'Eclipse Requiem',
      innerGlow: { color: '#9B00FF', intensity: 0.8, radius: 0.45 },
      outerGlow: { color: '#4B0082', intensity: 0.6, radius: 0.9 },
      flameContour: { baseColor: '#8B00FF', tipColor: '#FF00FF', speed: 1.0, jaggedness: 0.8, smoothness: 0.15, height: 1.3, thickness: 0.8, dualLayer: true, dualColor: '#1A0030' },
      particles: { color: '#CC66FF', secondaryColor: '#FF00FF', count: 40, size: 2, speed: 0.8, style: 'orb', drift: 'spiral', shapes: ['eye', 'skull'], elementalShapes: ['shadow_wisp'] },
      lightning: { enabled: true, color: '#CC00FF', frequency: 0.15 },
      energyFlow: { pattern: 'radial-in', speed: 0.7, intensity: 0.8 },
      intensity: 1.2,
    },
    thunder: {
      auraName: 'Thunderclap Sovereign',
      innerGlow: { color: '#FFFFFF', intensity: 0.9, radius: 0.35 },
      outerGlow: { color: '#FFD700', intensity: 0.6, radius: 0.85 },
      flameContour: { baseColor: '#FFD700', tipColor: '#FFFFFF', speed: 1.5, jaggedness: 0.9, smoothness: 0.1, height: 1.1, thickness: 0.6, dualLayer: false },
      particles: { color: '#FFD700', secondaryColor: '#FFFFFF', count: 25, size: 2, speed: 1.5, style: 'lightning', drift: 'burst', shapes: ['lightning_bolt', 'bolt'], elementalShapes: ['electric_spark'] },
      lightning: { enabled: true, color: '#FFD700', frequency: 0.35 },
      energyFlow: { pattern: 'radial-out', speed: 1.5, intensity: 0.8 },
      intensity: 1.3,
    },
    nature: {
      auraName: 'Verdant Awakening',
      innerGlow: { color: '#88FF88', intensity: 0.6, radius: 0.4 },
      outerGlow: { color: '#00AA44', intensity: 0.4, radius: 0.85 },
      flameContour: { baseColor: '#00FF88', tipColor: '#CCFF66', speed: 0.8, jaggedness: 0.35, smoothness: 0.7, height: 0.8, thickness: 0.7, dualLayer: false },
      particles: { color: '#66FF66', secondaryColor: '#FFFF00', count: 30, size: 3, speed: 0.7, style: 'sparkle', drift: 'float', shapes: ['leaf', 'cherry_blossom'], elementalShapes: ['petal'] },
      lightning: { enabled: false, color: '#FFFFFF', frequency: 0.2 },
      energyFlow: { pattern: 'pulse', speed: 0.6, intensity: 0.5 },
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
      maxOutputTokens: 8192,
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
      max_tokens: 8000,
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
      max_tokens: 8192,
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

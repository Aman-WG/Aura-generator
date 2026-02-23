import type { AuraParams, ParticleStyle, ParticleDrift } from './types';
import { VALID_SHAPE_IDS } from './particle-shapes';

// ─────────────────────────────────────────────────────────────
// AI Provider Support: Gemini (free) | OpenAI (paid)
// ─────────────────────────────────────────────────────────────

export type AIProvider = 'gemini' | 'openai';

const SHAPE_LIST = VALID_SHAPE_IDS.join(', ');

const SYSTEM_PROMPT = `You are an Aura Visualizer for a kids' game. You create anime-style energy auras like Dragon Ball Z Super Saiyan transformations, Jujutsu Kaisen cursed energy, or Demon Slayer breathing techniques.

PRIORITY RULE — THE PROMPT IS KING:
The student's text prompt is the PRIMARY driver of the aura's visual identity. The element and energy selections are secondary hints only. If the prompt contradicts or has nothing in common with the element/energy, IGNORE the element/energy entirely and build the aura 100% from the prompt.

Examples:
- Element=fire but prompt="ocean tsunami king" → blue/teal water aura, NOT fire
- Element=void but prompt="golden waffle" → warm golden/brown aura, NOT purple void
- Element=ice but prompt="Pikachu" → yellow electric aura, NOT ice blue
- Element=fire and prompt="volcano demon" → fire fits, use it as reinforcement

The element/energy only matter when they ALIGN with the prompt or when the prompt is vague.

HOW TO INTERPRET ANY PROMPT:
- Characters (Pikachu, Goku, Naruto, Batman) → signature colors, energy style, personality
- Objects/food (waffle, sword, diamond) → extract colors, texture, "vibe"
- Abstract concepts (chaos, peace, rage) → energy mood with fitting colors and motion
- Styles (cyberpunk, medieval, cosmic) → aesthetic palette and motion language
- Animals (dragon, wolf, phoenix) → creature's associated colors and elemental energy
- ANYTHING else → be creative, make it epic and Super Saiyan-level dramatic

The aura should ALWAYS look powerful and dramatic. Even "waffle" gets a badass golden-brown aura — not a joke.

AURA NAME:
Generate a 2-4 word name that sounds like an anime ultimate move or transformation. Make it drip with swagger and rizz. Examples: "Thunderclap Sovereign", "Abyssal Tide Unleashed", "Golden Gridlock Inferno", "Nocturnal Apex Protocol", "Eclipse of the Forsaken".

CONTOUR SMOOTHNESS:
Set flameContour.smoothness (0.0 to 1.0) based on the prompt's aggression/energy:
- 0.0-0.2 = very sharp jagged spikes: war, rage, combat, explosions, villains, electricity, dragon, demon
- 0.3-0.5 = moderately jagged: fire, power, speed, storm, action heroes, animals
- 0.6-0.8 = flowing/smooth: water, wind, flowers, music, peace, love, healing, elegance, cloud
- 0.9-1.0 = very smooth organic: gentle nature, bubbles, silk, dreams, soft magic
Use your judgment — aggressive/intense prompts get sharper contours, gentle/beautiful prompts get smoother ones.

THEMED PARTICLE SHAPES:
Pick 1-2 shape IDs from this list that visually relate to the prompt concept. For Pikachu pick lightning_bolt. For Batman pick bat. For ocean pick droplet. For royalty pick crown. Be creative connecting prompt to shapes.
Available shapes: ${SHAPE_LIST}

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
    "jaggedness": 0.3-1.0,
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
    "shapes": ["shape_id_1", "shape_id_2"]
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
  return [
    `Student's aura vision: "${prompt}"`,
    `(Secondary hints — only use if they fit the prompt: element=${element}, energy=${energy})`,
  ].join('\n');
}

const VALID_STYLES: ParticleStyle[] = ['ember', 'sparkle', 'debris', 'lightning', 'bubble', 'orb'];
const VALID_DRIFTS: ParticleDrift[] = ['rise', 'spiral', 'burst', 'float'];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function sanitizeShapes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(String)
    .filter((id) => VALID_SHAPE_IDS.includes(id))
    .slice(0, 2);
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
      jaggedness: clamp(Number(r.flameContour?.jaggedness) || 0.5, 0.1, 1.0),
      smoothness: clamp(Number(r.flameContour?.smoothness) ?? 0.2, 0, 1.0),
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

const GEMINI_MODEL = 'gemini-2.5-flash';

async function callGemini(apiKey: string, element: string, energy: string, prompt: string): Promise<AuraParams> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
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
        temperature: 0.8,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();

  // Check for blocked content or empty response
  const candidate = data.candidates?.[0];
  if (!candidate) {
    const blockReason = data.promptFeedback?.blockReason;
    throw new Error(blockReason ? `Prompt blocked: ${blockReason}` : 'No response from Gemini');
  }

  const text: string = candidate.content?.parts?.[0]?.text ?? '';
  console.log('[AuraAI] Gemini raw response:', text);
  console.log('[AuraAI] Finish reason:', candidate.finishReason);

  if (!text) {
    throw new Error(`Empty Gemini response. Finish reason: ${candidate.finishReason}`);
  }

  const jsonStr = extractJSON(text);
  console.log('[AuraAI] Extracted JSON:', jsonStr);

  return sanitizeParams(JSON.parse(jsonStr));
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
      max_tokens: 600,
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
    const params = provider === 'gemini'
      ? await callGemini(apiKey, element, energy, prompt)
      : await callOpenAI(apiKey, element, energy, prompt);

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

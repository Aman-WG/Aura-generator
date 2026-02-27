// Ported from AruaTest-sainath 3-layer prompt system (AuraStudio.jsx lines 479-1474)
// KEPT IN EXACT SYNC with Sainath's original — do not modify prompts without diffing

import type { SainathConfig } from './types';

const PORTKEY_MODEL = '@vertex-global-region/gemini-3-flash-preview';
const PORTKEY_URL = 'https://api.portkey.ai/v1/chat/completions';

async function callLLMText(promptText: string, apiKey: string): Promise<string> {
  const response = await fetch(PORTKEY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-portkey-api-key': apiKey,
      'x-portkey-provider': 'openai',
    },
    body: JSON.stringify({
      model: PORTKEY_MODEL,
      max_tokens: 32384,
      temperature: 0,
      messages: [{ role: 'user', content: promptText }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[SainathAI] Portkey API Error:', response.status, errorBody);
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ---------------------------------------------------------------------------
// SYSTEM PROMPT - LAYER 1: GLOW CONFIGURATION
// Verbatim from AuraStudio.jsx lines 1233-1277
// ---------------------------------------------------------------------------
const PROMPT_LAYER_GLOW = `You are a JSON-only generator for the GLOW layer of a Canvas 2D aura engine. Output valid JSON only. No markdown, no backticks, no extra text, no commentary.

Goal:
Generate a stylized anime aura glow setup that supports a grounded (feet-up) upward aura, with a clear intentional void in the center for compositing a character later. The result must not look like a blurry background blob. It must feel like an aura silhouette + controlled glow, not background VFX.

Non-negotiable constraints:

Always output exactly this JSON schema and nothing else:
{
  "glowColor": "#hex",
  "background": "clear" | "dark-fade" | "black-fade",
  "renderMode": "discrete" | "fluid",
  "density": number
}

Default renderMode must be "discrete". Only use "fluid" when the prompt explicitly requests fog/mist/smoke/cloud.

Density must be low-to-medium to avoid clutter:
- discrete: 55 to 95
- fluid: 60 to 80

background:
- Use "dark-fade" for energy/fire/electric/wind (subtle trails)
- Use "black-fade" only for cosmic/space/magic (stronger trails)
- Use "clear" for cute/clean/minimal or when prompt says "no trails / clean"

glowColor must be theme-accurate and saturated (no gray/white as primary).

This layer is not allowed to create the silhouette itself. It only supports it. Avoid overpowering glows.

Theme mapping rules (not just color swaps; pick correct family):
- super saiyan / power-up / golden / aura: #FFD700 or #FFC400
- fire / flame / inferno: #FF4D1A or #FF5A00
- electric / lightning / shock: #FFE600 or #6EE7FF (choose yellow as primary if unspecified)
- wind / air / storm / gust: #64D2FF or #22D3EE
- cosmic / space / galaxy: #7C3AED or #4F46E5
- ice / frost: #60A5FA or #38BDF8
- sakura / petals: #FB7185 or #F472B6
- dark / shadow: #6D28D9 or #111827 (prefer purple-black, still saturated)

Safety / moderation:
If the user prompt includes NSFW sexual content, drugs, weapons, gore, self-harm, or hate terms: output a safe neutral glow:
{"glowColor":"#60A5FA","background":"clear","renderMode":"discrete","density":60}

Output only the JSON object.`;

// ---------------------------------------------------------------------------
// SYSTEM PROMPT - LAYER 2: PARTICLE CONFIGURATION
// Verbatim from AuraStudio.jsx lines 1283-1342
// ---------------------------------------------------------------------------
const PROMPT_LAYER_PARTICLE = `=== PARTICLE LAYER SPEC ===

Coordinates: center=(0,0), range -0.5 to 0.5 relative to particle size. Negative vy = UP, positive vy = DOWN.

Shapes (layered bottom-to-top in each entity):
- circle: {type,cx,cy,r,fill}
- ellipse: {type,cx,cy,rx,ry,fill}
- rect: {type,x,y,w,h,fill}
- triangle: {type,points:[x1,y1,x2,y2,x3,y3],fill}
- line: {type,x1,y1,x2,y2,stroke,width}
- arc: {type,cx,cy,r,startAngle,endAngle,fill?,stroke?}
- polygon: {type,points:[...],fill}
All shapes support optional stroke/strokeWidth.

Styles:
- "solid": Opaque particles (characters, objects, icons)
- "smoke": Wispy multi-layer effect (fire, fog, mist)
- "glow": Bright halo with additive blending (energy, magic, stars)

Movement Presets: "float"|"zigzag"|"orbit"|"rise"|"wander"|"spiral"|"rain"|"explode"|"swarm"|"bounce"|"pulse"|"vortex"|"levitate"|"fountain"|"wave"|"tornado"|"drift"|"flutter"|"whirlpool"|"magnetic"|"gravity"|"hover"

Movement Custom Object:
{
  gravity: -0.1 to 0.1,
  friction: 0.9-1.0,
  wave: {axis:"x"|"y"|"both", amp:0.1-5, freq:0.1-5},
  attract: -0.005 to 0.005,
  spin: -2 to 2,
  jitter: 0-0.3,
  bounce: {floor:0.5-0.9, elasticity:0.1-0.9},
  scale: 0.97-1.03
}

Fluid Mode Rules (when renderMode="fluid"):
- style must be "smoke"
- density 60-80
- size [20,35]
- vy [-1.8,-0.5]
- one circle shape per entity

Entity Schema:
{
  "weight": number (spawn probability relative to others),
  "size": [min, max],
  "speed": {"vx": [min, max], "vy": [min, max]},
  "style": "solid" | "smoke" | "glow",
  "movement": string_preset | custom_object,
  "shapes": [shape_objects...]
}

Particle Examples:

Fire flames entity:
{"weight":2,"size":[20,35],"speed":{"vx":[-0.5,0.5],"vy":[-3.5,-1.5]},"style":"smoke","movement":"rise","shapes":[{"type":"ellipse","cx":0,"cy":0.1,"rx":0.3,"ry":0.45,"fill":"#ff4400"},{"type":"ellipse","cx":0,"cy":-0.05,"rx":0.22,"ry":0.38,"fill":"#ff6600"},{"type":"ellipse","cx":0,"cy":-0.2,"rx":0.12,"ry":0.22,"fill":"#ffaa00"}]}

Cat face entity:
{"weight":1,"size":[26,34],"speed":{"vx":[-0.6,0.6],"vy":[-1.8,-0.4]},"style":"solid","movement":"float","shapes":[{"type":"circle","cx":0,"cy":0,"r":0.4,"fill":"#FFA07A"},{"type":"triangle","points":[-0.35,-0.25,-0.2,-0.45,-0.05,-0.25],"fill":"#FFA07A"},{"type":"triangle","points":[0.05,-0.25,0.2,-0.45,0.35,-0.25],"fill":"#FFA07A"},{"type":"circle","cx":-0.15,"cy":-0.05,"r":0.06,"fill":"#333"},{"type":"circle","cx":0.15,"cy":-0.05,"r":0.06,"fill":"#333"},{"type":"ellipse","cx":0,"cy":0.1,"rx":0.05,"ry":0.03,"fill":"#FF69B4"}]}

Lightning bolt entity:
{"weight":1,"size":[18,24],"speed":{"vx":[-2,2],"vy":[-2,1]},"style":"solid","movement":"zigzag","shapes":[{"type":"line","x1":-0.3,"y1":0.2,"x2":0,"y2":-0.1,"stroke":"#FFFF00","width":0.06},{"type":"line","x1":0,"y1":-0.1,"x2":0.2,"y2":0.15,"stroke":"#FFD700","width":0.06},{"type":"line","x1":0.2,"y1":0.15,"x2":0.4,"y2":-0.2,"stroke":"#FFA500","width":0.04}]}`;

// ---------------------------------------------------------------------------
// SYSTEM PROMPT - LAYER 3: OUTER SHAPE CONFIGURATION
// Verbatim from AuraStudio.jsx lines 1348-1405
// ---------------------------------------------------------------------------
const PROMPT_LAYER_OUTERSHAPE = `=== OUTER SHAPE (FLAME CONTOUR) LAYER SPEC ===

You generate the FLAME CONTOUR layer for a Canvas 2D aura engine. Output valid JSON only. No markdown, no backticks, no commentary.

The flame contour is a dynamic jagged silhouette rendered around a character — like Dragon Ball Z Super Saiyan aura or Jujutsu Kaisen cursed energy. It consists of:
1. An elliptical flame shape with jagged spikes that animate upward
2. A glowing band between outer and inner borders
3. A hollow center where the character stands
4. Optional dual-layer effect for depth

Output schema:
{
  "baseColor": "#hex",
  "tipColor": "#hex",
  "speed": 0.5-2.0,
  "jaggedness": 0.1-1.0,
  "smoothness": 0.0-1.0,
  "height": 0.5-1.5,
  "thickness": 0.3-1.0,
  "dualLayer": true/false,
  "dualColor": "#hex or null",
  "intensity": 0.5-1.5
}

Parameter guide:
- baseColor: The primary flame body color (dominant hue of the aura)
- tipColor: The flame tips / bright edge color (usually lighter or hotter version)
- speed: Animation speed of the flame oscillation (0.5=slow ethereal, 2.0=aggressive rapid)
- jaggedness: How spiky/sharp the flame contour is (0.1=nearly smooth, 1.0=very sharp jagged spikes). This controls alternating spike amplitude on the contour points.
- smoothness: Path interpolation style (0.0=sharp jagged lineTo spikes, 0.5=mixed sharp/smooth, 1.0=fully smooth quadratic curves). Controls visual sharpness of the rendered path.
- height: Vertical upward extension multiplier (0.5=short compact, 1.5=tall dramatic flames). Top hemisphere extends more than bottom.
- thickness: Horizontal spread/width of the flame ellipse (0.3=narrow, 1.0=wide)
- dualLayer: Whether to render a secondary scaled-up layer behind the main flame for depth
- dualColor: Color for the dual layer (usually darker or contrasting). Only used if dualLayer=true
- intensity: Overall scale and glow intensity multiplier (0.5=subtle, 1.5=overwhelming)

Theme mapping rules:
- Fire / energy / power / super saiyan: jaggedness 0.6-0.8, smoothness 0.2-0.4, height 1.0-1.3, speed 1.0-1.5, thickness 0.6-0.8
- Electric / lightning / shock: jaggedness 0.8-1.0, smoothness 0.0-0.15, height 1.0-1.2, speed 1.3-2.0
- Wind / nature / calm / healing: jaggedness 0.2-0.4, smoothness 0.6-0.9, height 0.6-0.9, speed 0.5-0.8
- Cosmic / void / dark / shadow: jaggedness 0.7-0.9, smoothness 0.1-0.2, height 1.2-1.5, dualLayer=true, dualColor=dark
- Ice / frost / water: jaggedness 0.3-0.5, smoothness 0.5-0.7, height 0.8-1.0, speed 0.5-0.8
- Cute / sakura / soft / gentle: jaggedness 0.2-0.35, smoothness 0.7-1.0, height 0.5-0.8, speed 0.4-0.7

Color rules — match the theme:
- super saiyan / golden: baseColor "#FFD700", tipColor "#FFFFFF"
- fire / flame: baseColor "#FF4500", tipColor "#FFD700"
- electric / thunder: baseColor "#FFD700", tipColor "#FFFFFF"
- wind / nature: baseColor "#22D3EE", tipColor "#A5F3FC"
- cosmic / void: baseColor "#8B00FF", tipColor "#FF00FF"
- sakura / soft: baseColor "#FB7185", tipColor "#FECDD3"
- ice / frost: baseColor "#00BFFF", tipColor "#E0F8FF"
- dark / shadow: baseColor "#6D28D9", tipColor "#A855F7"

Safety: If NSFW/harmful content detected, output a safe neutral shape:
{"baseColor":"#60A5FA","tipColor":"#E0F8FF","speed":0.8,"jaggedness":0.4,"smoothness":0.6,"height":0.9,"thickness":0.6,"dualLayer":false,"intensity":0.9}

Return only the JSON object.`;

// ---------------------------------------------------------------------------
// COMBINED EXAMPLES — verbatim from AuraStudio.jsx lines 1410-1425
// ---------------------------------------------------------------------------
const PROMPT_EXAMPLES = `=== FULL EXAMPLES ===

User: "fire"
{"name":"Inferno","description":"Blazing flames and hot embers","glowColor":"#ff5500","density":180,"background":"dark-fade","renderMode":"discrete","outerShape":{"baseColor":"#FF4500","tipColor":"#FFD700","speed":1.2,"jaggedness":0.7,"smoothness":0.25,"height":1.2,"thickness":0.7,"dualLayer":false,"intensity":1.1},"entities":[{"weight":2,"size":[20,35],"speed":{"vx":[-0.5,0.5],"vy":[-3.5,-1.5]},"style":"smoke","movement":"rise","shapes":[{"type":"ellipse","cx":0,"cy":0.1,"rx":0.3,"ry":0.45,"fill":"#ff4400"},{"type":"ellipse","cx":0,"cy":-0.05,"rx":0.22,"ry":0.38,"fill":"#ff6600"},{"type":"ellipse","cx":0,"cy":-0.2,"rx":0.12,"ry":0.22,"fill":"#ffaa00"}]},{"weight":1,"size":[18,26],"speed":{"vx":[-0.8,0.8],"vy":[-2.5,-1]},"style":"smoke","movement":"float","shapes":[{"type":"circle","cx":0,"cy":0,"r":0.35,"fill":"#ff3300"},{"type":"circle","cx":0,"cy":0,"r":0.2,"fill":"#ff8800"},{"type":"circle","cx":0,"cy":0,"r":0.1,"fill":"#ffcc00"}]},{"weight":1,"size":[18,24],"speed":{"vx":[-1.5,1.5],"vy":[-2,0]},"style":"glow","movement":"wander","shapes":[{"type":"circle","cx":0,"cy":0,"r":0.25,"fill":"#ff6600"},{"type":"circle","cx":0,"cy":0,"r":0.15,"fill":"#ffaa00"},{"type":"circle","cx":0,"cy":0,"r":0.08,"fill":"#ffdd44"}]}]}

User: "super saiyan"
{"name":"Super Saiyan","description":"Golden flames and electric sparks","glowColor":"#FFD700","density":180,"background":"dark-fade","renderMode":"discrete","outerShape":{"baseColor":"#FFD700","tipColor":"#FFFFFF","speed":1.5,"jaggedness":0.7,"smoothness":0.25,"height":1.2,"thickness":0.7,"dualLayer":false,"intensity":1.3},"entities":[{"weight":2,"size":[18,25],"speed":{"vx":[-0.5,0.5],"vy":[-3,-1.5]},"style":"smoke","movement":"rise","shapes":[{"type":"ellipse","cx":0,"cy":0.1,"rx":0.3,"ry":0.45,"fill":"#FFD700"},{"type":"ellipse","cx":0,"cy":-0.1,"rx":0.2,"ry":0.35,"fill":"#FFA500"},{"type":"ellipse","cx":0,"cy":-0.2,"rx":0.1,"ry":0.2,"fill":"#FFCC00"}]},{"weight":1,"size":[18,24],"speed":{"vx":[-1,1],"vy":[-2,-0.5]},"style":"glow","movement":"float","shapes":[{"type":"circle","cx":0,"cy":0,"r":0.4,"fill":"#FFD700"},{"type":"circle","cx":0,"cy":0,"r":0.25,"fill":"#FFA500"},{"type":"circle","cx":0,"cy":0,"r":0.12,"fill":"#FFCC00"}]},{"weight":1,"size":[18,24],"speed":{"vx":[-2,2],"vy":[-2,1]},"style":"solid","movement":"zigzag","shapes":[{"type":"line","x1":-0.3,"y1":0.2,"x2":0,"y2":-0.1,"stroke":"#FFFF00","width":0.06},{"type":"line","x1":0,"y1":-0.1,"x2":0.2,"y2":0.15,"stroke":"#FFD700","width":0.06},{"type":"line","x1":0.2,"y1":0.15,"x2":0.4,"y2":-0.2,"stroke":"#FFA500","width":0.04}]}]}

User: "mystic fog"
{"name":"Mystic Smoke","description":"Rising ethereal smoke wisps","glowColor":"#9ca3af","density":70,"background":"clear","renderMode":"fluid","outerShape":{"baseColor":"#6b7280","tipColor":"#d1d5db","speed":0.6,"jaggedness":0.25,"smoothness":0.8,"height":0.7,"thickness":0.6,"dualLayer":false,"intensity":0.7},"entities":[{"weight":1,"size":[20,35],"speed":{"vx":[-0.15,0.15],"vy":[-1.8,-0.6]},"style":"smoke","movement":{"gravity":-0.01,"wave":{"axis":"x","amp":1,"freq":0.5},"friction":0.99},"shapes":[{"type":"circle","cx":0,"cy":0,"r":0.5,"fill":"#6b7280"}]}]}

User: "floating cat faces"
{"name":"Neko Parade","description":"Cute floating cat face particles","glowColor":"#f9a8d4","density":50,"background":"clear","renderMode":"discrete","outerShape":{"baseColor":"#f9a8d4","tipColor":"#fecdd3","speed":0.5,"jaggedness":0.2,"smoothness":0.9,"height":0.6,"thickness":0.5,"dualLayer":false,"intensity":0.7},"entities":[{"weight":1,"size":[26,34],"speed":{"vx":[-0.6,0.6],"vy":[-1.8,-0.4]},"style":"solid","movement":"float","shapes":[{"type":"circle","cx":0,"cy":0,"r":0.4,"fill":"#FFA07A"},{"type":"triangle","points":[-0.35,-0.25,-0.2,-0.45,-0.05,-0.25],"fill":"#FFA07A"},{"type":"triangle","points":[0.05,-0.25,0.2,-0.45,0.35,-0.25],"fill":"#FFA07A"},{"type":"circle","cx":-0.15,"cy":-0.05,"r":0.06,"fill":"#333"},{"type":"circle","cx":0.15,"cy":-0.05,"r":0.06,"fill":"#333"},{"type":"ellipse","cx":0,"cy":0.1,"rx":0.05,"ry":0.03,"fill":"#FF69B4"}]}]}

User: "pokemon aura"
{"name":"Pokemon Aura","description":"Floating Pokeball and Pikachu particles","glowColor":"#EF4444","density":60,"background":"dark-fade","renderMode":"discrete","outerShape":{"baseColor":"#EF4444","tipColor":"#FBBF24","speed":0.8,"jaggedness":0.5,"smoothness":0.4,"height":0.9,"thickness":0.6,"dualLayer":false,"intensity":0.9},"entities":[{"weight":1,"size":[26,34],"speed":{"vx":[-0.7,0.7],"vy":[-2,-0.5]},"style":"solid","movement":"float","shapes":[{"type":"circle","cx":0,"cy":0.05,"r":0.4,"fill":"#fff"},{"type":"rect","x":-0.4,"y":-0.4,"w":0.8,"h":0.43,"fill":"#EF4444"},{"type":"rect","x":-0.4,"y":-0.03,"w":0.8,"h":0.06,"fill":"#1a1a1a"},{"type":"circle","cx":0,"cy":0,"r":0.12,"fill":"#fff","stroke":"#1a1a1a","strokeWidth":0.04}]},{"weight":1,"size":[26,34],"speed":{"vx":[-0.6,0.6],"vy":[-1.8,-0.4]},"style":"solid","movement":"float","shapes":[{"type":"circle","cx":0,"cy":0.05,"r":0.38,"fill":"#FBBF24"},{"type":"circle","cx":-0.12,"cy":-0.05,"r":0.05,"fill":"#1a1a1a"},{"type":"circle","cx":0.12,"cy":-0.05,"r":0.05,"fill":"#1a1a1a"},{"type":"ellipse","cx":0,"cy":0.1,"rx":0.08,"ry":0.04,"fill":"#1a1a1a"},{"type":"circle","cx":-0.2,"cy":0.08,"r":0.08,"fill":"#EF4444"},{"type":"circle","cx":0.2,"cy":0.08,"r":0.08,"fill":"#EF4444"},{"type":"triangle","points":[-0.2,-0.35,-0.35,-0.15,-0.05,-0.25],"fill":"#FBBF24"},{"type":"triangle","points":[0.2,-0.35,0.35,-0.15,0.05,-0.25],"fill":"#FBBF24"}]}]}`;

// ---------------------------------------------------------------------------
// TASK INSTRUCTIONS — verbatim from AuraStudio.jsx lines 1430-1453
// ---------------------------------------------------------------------------
const PROMPT_TASK_INSTRUCTIONS = `=== TASK INSTRUCTIONS ===

How to interpret the request:
- Power/energy/effect words ("super saiyan", "fire aura", "ice storm") → visual aura effect with themed particles. Use 2-3 entities with mixed styles. ALL entities must use colors that match the theme — e.g. fire = reds/oranges/yellows only, ice = blues/whites/cyans only. NEVER add white, gray, or off-theme colored smoke/glow/orbs to an effect aura.
- Request describes a specific shape or character ("Pikachu", "stars") → generate ONLY that shape/character. One entity. Nothing else.
- Request names a group or franchise without one specific thing ("Paw Patrol", "pokemon aura", "floating animals") → generate 2-3 different characters from that group. Each entity is a different character. All style:"solid", size [24,34].
- Ambiguous → default to effect aura.

Critical rules:
1. NEVER add generic glow orbs, smoke puffs, or abstract accent particles alongside character/shape particles. If the user asks for "bomb", every particle must be a bomb. If they ask for "creeper aura", every particle must be a creeper face. No filler entities.
2. For effect auras: every entity must stay on-theme. No white smoke, no gray puffs, no colorless filler. If user says "fire", ALL entities must be warm-colored (red, orange, yellow, amber). If user says "ice", ALL entities must be cool-colored (blue, cyan, white). Every entity must visually reinforce the same theme.

Constraints:
- vy is usually negative (upward). Positive vy only for rain/bounce/falling.
- density: 50-200 discrete, 60-80 fluid.
- Use bold filled shapes. Avoid outline-only shapes.
- Minimum entity size is [18,24]. Anything smaller is unreadable.
- Every entity must have at least 3 shapes so it looks like something recognizable.
- Valid JSON with commas between all array elements.
- Shape fill colors must NEVER be white (#ffffff), gray (#888, #aaa, #ccc, etc.), or any neutral color unless the theme specifically calls for it (e.g. "snow", "ghost"). Always use saturated, theme-appropriate colors.
- ALWAYS include an "outerShape" object with flame contour parameters. The outer shape MUST match the aura theme visually. Use jaggedness and smoothness to control the flame contour style. Fire/energy: jaggedness 0.6-0.8, smoothness 0.2-0.4, height 1.0-1.3. Electric: jaggedness 0.8-1.0, smoothness 0.0-0.15. Wind/calm: jaggedness 0.2-0.4, smoothness 0.6-0.9. Cute/soft: jaggedness 0.2-0.35, smoothness 0.7-1.0. Dark/cosmic: dualLayer=true with dark dualColor, jaggedness 0.7-0.9. Colors (baseColor/tipColor) must match glowColor theme.

Output Schema:
{"name":"string","description":"string (max 10 words)","glowColor":"#hex","density":number,"background":"clear"|"dark-fade"|"black-fade","renderMode":"discrete"|"fluid","outerShape":{...},"entities":[...]}`;

// ---------------------------------------------------------------------------
// Prompt builder — matches AuraStudio.jsx buildSystemPrompt (line 1458)
// ---------------------------------------------------------------------------
function buildFullPrompt(userPrompt: string): string {
  return `You are a JSON-only particle configuration generator for a Canvas 2D aura engine. Output valid JSON only — no markdown, no backticks, no commentary.

${PROMPT_LAYER_GLOW}

${PROMPT_LAYER_PARTICLE}

${PROMPT_LAYER_OUTERSHAPE}

${PROMPT_EXAMPLES}

${PROMPT_TASK_INSTRUCTIONS}

=== GENERATE FOR ===

"${userPrompt}"`;
}

// ---------------------------------------------------------------------------
// JSON extraction — matches AuraStudio.jsx generateAura (line 1532-1539)
// No sanitization: raw AI output is used directly, matching Sainath's original
// ---------------------------------------------------------------------------
function extractJSON(raw: string): string {
  let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  s = s.replace(/\}\s*\n\s*\{/g, '},\n{');
  s = s.replace(/\]\s*\n\s*\[/g, '],\n[');

  const jsonMatch = s.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No valid JSON in response (len=${s.length}): "${s.slice(0, 300)}"`);
  }
  return jsonMatch[0];
}

const FALLBACK_CONFIG: SainathConfig = {
  name: 'Energy Burst',
  description: 'Golden energy aura',
  glowColor: '#FFD700',
  density: 80,
  background: 'dark-fade',
  renderMode: 'discrete',
  outerShape: {
    baseColor: '#FFD700',
    tipColor: '#FFFFFF',
    speed: 1.2,
    jaggedness: 0.6,
    smoothness: 0.3,
    height: 1.1,
    thickness: 0.7,
    dualLayer: false,
    dualColor: null,
    intensity: 1.0,
  },
  entities: [
    {
      weight: 2,
      size: [18, 25],
      speed: { vx: [-0.5, 0.5], vy: [-3, -1.5] },
      style: 'smoke',
      movement: 'rise',
      shapes: [
        { type: 'ellipse', cx: 0, cy: 0.1, rx: 0.3, ry: 0.45, fill: '#FFD700' },
        { type: 'ellipse', cx: 0, cy: -0.1, rx: 0.2, ry: 0.35, fill: '#FFA500' },
        { type: 'ellipse', cx: 0, cy: -0.2, rx: 0.1, ry: 0.2, fill: '#FFCC00' },
      ],
    },
    {
      weight: 1,
      size: [18, 24],
      speed: { vx: [-1, 1], vy: [-2, -0.5] },
      style: 'glow',
      movement: 'float',
      shapes: [
        { type: 'circle', cx: 0, cy: 0, r: 0.4, fill: '#FFD700' },
        { type: 'circle', cx: 0, cy: 0, r: 0.25, fill: '#FFA500' },
        { type: 'circle', cx: 0, cy: 0, r: 0.12, fill: '#FFCC00' },
      ],
    },
  ],
};

export interface SainathGenerationResult {
  config: SainathConfig;
  source: 'ai' | 'fallback';
  error?: string;
}

export async function generateSainathAura(
  prompt: string,
  apiKey: string,
): Promise<SainathGenerationResult> {
  if (!apiKey) {
    console.warn('[SainathAI] No API key, using fallback');
    return { config: FALLBACK_CONFIG, source: 'fallback', error: 'No API key' };
  }

  try {
    const fullPrompt = buildFullPrompt(prompt);
    console.log('[SainathAI] Calling Portkey with prompt length:', fullPrompt.length);

    const text = await callLLMText(fullPrompt, apiKey);
    if (!text) throw new Error('Empty response from API');

    const jsonStr = extractJSON(text);
    const config = JSON.parse(jsonStr) as SainathConfig;

    console.log('[SainathAI] Generated:', config.name, '-', config.description);
    console.log('[SainathAI] Entities:', config.entities?.length, 'Density:', config.density);

    return { config, source: 'ai' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[SainathAI] Generation failed:', msg);
    return { config: FALLBACK_CONFIG, source: 'fallback', error: msg };
  }
}

export { FALLBACK_CONFIG };

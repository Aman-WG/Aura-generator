/**
 * Visual config for every aura type.
 * Drives both the grid card gradients AND the canvas particle renderer.
 *
 * Preset auras use their id directly.
 * Custom auras (from the Aura Lab) are resolved via ELEMENT_PALETTE + ENERGY_MOTION.
 */

export const PRESET_VISUALS = {
  'aura-fire': {
    colors: ['#ff4500', '#ff8c00', '#ffd700', '#ff6347'],
    gradient: 'linear-gradient(135deg, #ff4500, #ff8c00, #ffd700)',
    particleCount: 40,
    speed: 1.8,
    direction: 'rise',
    glow: '#ff4500',
    sizeRange: [2, 6],
  },
  'aura-electric': {
    colors: ['#00d4ff', '#7b2ff7', '#ffffff', '#00d4ff'],
    gradient: 'linear-gradient(135deg, #00d4ff, #7b2ff7, #00d4ff)',
    particleCount: 35,
    speed: 2.5,
    direction: 'erratic',
    glow: '#00d4ff',
    sizeRange: [1, 4],
  },
  'aura-sakura': {
    colors: ['#ffb7c5', '#ff69b4', '#fff0f5', '#ffb7c5'],
    gradient: 'linear-gradient(135deg, #ffb7c5, #ff69b4, #fff0f5)',
    particleCount: 30,
    speed: 0.8,
    direction: 'float',
    glow: '#ff69b4',
    sizeRange: [3, 7],
  },
  'aura-storm': {
    colors: ['#4a00e0', '#8e2de2', '#1a1a2e', '#6a0dad'],
    gradient: 'linear-gradient(135deg, #1a1a2e, #4a00e0, #8e2de2)',
    particleCount: 45,
    speed: 2.2,
    direction: 'swirl',
    glow: '#8e2de2',
    sizeRange: [1, 5],
  },
  'aura-aqua': {
    colors: ['#00c9ff', '#92fe9d', '#00c9ff', '#48d1cc'],
    gradient: 'linear-gradient(135deg, #00c9ff, #92fe9d, #00c9ff)',
    particleCount: 35,
    speed: 1.0,
    direction: 'float',
    glow: '#00c9ff',
    sizeRange: [2, 6],
  },
};

// Maps Aura Lab element IDs → color palettes
const ELEMENT_PALETTE = {
  fire:  { colors: ['#ff4500', '#ff8c00', '#ffd700', '#ff6347'], glow: '#ff4500' },
  water: { colors: ['#0077be', '#00bfff', '#87ceeb', '#4682b4'], glow: '#00bfff' },
  ice:   { colors: ['#00d4ff', '#e0f7fa', '#b3e5fc', '#ffffff'], glow: '#00d4ff' },
  slime: { colors: ['#39ff14', '#00ff00', '#7fff00', '#adff2f'], glow: '#39ff14' },
  void:  { colors: ['#8b00ff', '#4a0080', '#1a0033', '#6a0dad'], glow: '#8b00ff' },
};

// Maps Aura Lab energy IDs → motion style
const ENERGY_MOTION = {
  vortex:  { direction: 'swirl',   speed: 2.0, particleCount: 45 },
  sonic:   { direction: 'pulse',   speed: 1.6, particleCount: 35 },
  explode: { direction: 'burst',   speed: 2.8, particleCount: 50 },
  pulse:   { direction: 'rise',    speed: 1.2, particleCount: 30 },
  glitch:  { direction: 'erratic', speed: 2.5, particleCount: 40 },
};

const ELEMENT_EMOJI = {
  fire: '🔥', water: '💧', ice: '❄️', slime: '🟢', void: '🌀',
};

const ENERGY_EMOJI = {
  vortex: '🌪️', sonic: '🔊', explode: '💥', pulse: '💫', glitch: '⚡',
};

/**
 * Resolve visuals for any aura — preset or custom.
 */
export function getAuraVisuals(aura) {
  if (!aura) return null;

  if (PRESET_VISUALS[aura.id]) {
    return PRESET_VISUALS[aura.id];
  }

  // Custom aura from the lab — derive from element + energy
  const elPalette = ELEMENT_PALETTE[aura.element] || ELEMENT_PALETTE.fire;
  const enMotion = ENERGY_MOTION[aura.energy] || ENERGY_MOTION.pulse;

  return {
    colors: elPalette.colors,
    gradient: `linear-gradient(135deg, ${elPalette.colors[0]}, ${elPalette.colors[1]}, ${elPalette.colors[2]})`,
    glow: elPalette.glow,
    sizeRange: [2, 5],
    ...enMotion,
  };
}

/**
 * Build a display item for a custom aura returned from the lab.
 */
export function buildCustomAuraItem(auraConfig, index) {
  const elementEmoji = ELEMENT_EMOJI[auraConfig.element] || '✨';
  const energyEmoji = ENERGY_EMOJI[auraConfig.energy] || '⚡';
  const visuals = getAuraVisuals({ ...auraConfig, id: '__tmp' });
  const shortChaos = auraConfig.chaosPrompt
    ? auraConfig.chaosPrompt.split(' ').slice(0, 3).join(' ')
    : '';

  return {
    id: `custom-aura-${Date.now()}-${index ?? 0}`,
    name: shortChaos || `${auraConfig.element?.replace(/\s.*/, '')} ${auraConfig.energy?.replace(/\s.*/, '')}`,
    price: 2000,
    isAura: true,
    isCustomCreated: true,
    element: auraConfig.element,
    energy: auraConfig.energy,
    chaosPrompt: auraConfig.chaosPrompt,
    gradient: visuals.gradient,
    emoji: `${elementEmoji}${energyEmoji}`,
  };
}

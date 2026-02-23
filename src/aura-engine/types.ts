// ─────────────────────────────────────────────────────────────
// Aura Engine — Type Definitions
// ─────────────────────────────────────────────────────────────

/** Structured output from the AI model — drives all visual layers */
export interface AuraParams {
  auraName: string;
  innerGlow: {
    color: string;
    intensity: number;
    radius: number;
  };
  outerGlow: {
    color: string;
    intensity: number;
    radius: number;
  };
  flameContour: {
    baseColor: string;
    tipColor: string;
    speed: number;
    jaggedness: number;
    smoothness: number;
    height: number;
    thickness: number;
    dualLayer: boolean;
    dualColor?: string;
  };
  particles: {
    color: string;
    secondaryColor?: string;
    count: number;
    size: number;
    speed: number;
    style: ParticleStyle;
    drift: ParticleDrift;
    shapes?: string[];
    /** AI-generated SVG path `d` strings for detailed contextual particles (48x48 viewBox) */
    customPaths?: Array<{ name: string; path: string }>;
  };
  lightning: {
    enabled: boolean;
    color: string;
    frequency: number;
  };
  energyFlow: {
    pattern: EnergyFlowPattern;
    speed: number;
    intensity: number;
  };
  intensity: number;
}

export type EnergyFlowPattern = 'radial-out' | 'radial-in' | 'rise' | 'spiral' | 'pulse' | 'cascade' | 'zigzag' | 'wave';
export type ParticleStyle = 'ember' | 'sparkle' | 'debris' | 'lightning' | 'bubble' | 'orb';
export type ParticleDrift = 'rise' | 'spiral' | 'burst' | 'float';

/** Internal particle state — pooled, never allocated in hot loop */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
  useSecondary: boolean;
  /** Index into library shapes array (-1 = none) */
  shapeIdx: number;
  /** Index into customPaths array (-1 = none) */
  customPathIdx: number;
}

/** A point on the flame contour perimeter */
export interface FlamePoint {
  angle: number;
  baseRadius: number;
  noiseOffset: number;
}

/** A single lightning bolt segment chain */
export interface LightningBolt {
  segments: Array<{ x: number; y: number }>;
  alpha: number;
  life: number;
}

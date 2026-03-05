// Sainath Engine — Type Definitions
// Ported from AuraTest-sainath/aura-studio/src/AuraStudio.jsx

export type ShapeType = 'circle' | 'ellipse' | 'rect' | 'triangle' | 'line' | 'arc' | 'polygon';

export interface ShapeConfig {
  type: ShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  // circle / arc
  cx?: number;
  cy?: number;
  r?: number;
  startAngle?: number;
  endAngle?: number;
  counterClockwise?: boolean;
  // ellipse
  rx?: number;
  ry?: number;
  // rect
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  // triangle / polygon
  points?: number[];
  // line
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export type MovementPreset =
  | 'float' | 'zigzag' | 'orbit' | 'rise' | 'wander' | 'spiral'
  | 'rain' | 'explode' | 'swarm' | 'bounce' | 'pulse' | 'vortex'
  | 'levitate' | 'fountain' | 'wave' | 'tornado' | 'drift'
  | 'flutter' | 'whirlpool' | 'magnetic' | 'gravity' | 'hover';

export interface MovementObject {
  gravity?: number;
  friction?: number;
  wave?: { axis: 'x' | 'y' | 'both'; amp: number; freq: number };
  attract?: number;
  spin?: number;
  jitter?: number;
  bounce?: { floor: number; elasticity: number };
  scale?: number;
}

export type Movement = MovementPreset | MovementObject;

export type ParticleStyle = 'solid' | 'smoke' | 'glow';
export type RenderMode = 'discrete' | 'fluid';
export type Background = 'clear' | 'dark-fade' | 'black-fade';

export interface EntityConfig {
  weight: number;
  size: [number, number];
  speed: { vx: [number, number]; vy: [number, number] };
  style: ParticleStyle;
  movement: Movement;
  shapes: ShapeConfig[];
}

export interface OuterShapeConfig {
  baseColor: string;
  tipColor: string;
  speed: number;
  jaggedness: number;
  smoothness: number;
  height: number;
  thickness: number;
  dualLayer: boolean;
  dualColor?: string | null;
  intensity: number;
}

export interface SainathConfig {
  name: string;
  description: string;
  glowColor: string;
  density: number;
  background: Background;
  renderMode: RenderMode;
  outerShape: OuterShapeConfig;
  entities: EntityConfig[];
}

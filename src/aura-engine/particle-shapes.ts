// ─────────────────────────────────────────────────────────────
// Themed Particle Shapes — Canvas 2D path draw functions
//
// Each function draws a filled shape centered at (0,0),
// scaled by `s` (half-size). Caller handles translate/rotate.
// ─────────────────────────────────────────────────────────────

type ShapeFn = (ctx: CanvasRenderingContext2D, s: number) => void;

const lightning_bolt: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, -s);
  ctx.lineTo(s * 0.15, -s * 0.15);
  ctx.lineTo(-s * 0.1, -s * 0.15);
  ctx.lineTo(s * 0.3, s);
  ctx.lineTo(-s * 0.15, s * 0.15);
  ctx.lineTo(s * 0.1, s * 0.15);
  ctx.closePath();
  ctx.fill();
};

const flame: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.5, -s * 0.6, s * 0.7, -s * 0.1, s * 0.4, s * 0.4);
  ctx.quadraticCurveTo(s * 0.2, s * 0.8, 0, s);
  ctx.quadraticCurveTo(-s * 0.2, s * 0.8, -s * 0.4, s * 0.4);
  ctx.bezierCurveTo(-s * 0.7, -s * 0.1, -s * 0.5, -s * 0.6, 0, -s);
  ctx.closePath();
  ctx.fill();
};

const crescent: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(s * 0.4, -s * 0.15, s * 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const bat: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.3);
  ctx.lineTo(-s * 0.3, -s * 0.7);
  ctx.quadraticCurveTo(-s, -s * 0.8, -s, -s * 0.1);
  ctx.quadraticCurveTo(-s * 0.8, s * 0.2, -s * 0.5, s * 0.1);
  ctx.lineTo(-s * 0.3, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.15, s * 0.3, 0, s * 0.5);
  ctx.quadraticCurveTo(s * 0.15, s * 0.3, s * 0.3, s * 0.5);
  ctx.lineTo(s * 0.5, s * 0.1);
  ctx.quadraticCurveTo(s * 0.8, s * 0.2, s, -s * 0.1);
  ctx.quadraticCurveTo(s, -s * 0.8, s * 0.3, -s * 0.7);
  ctx.closePath();
  ctx.fill();
};

const star: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * (Math.PI / 180);
    const ai = ((i * 72 + 36) - 90) * (Math.PI / 180);
    ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
    ctx.lineTo(Math.cos(ai) * s * 0.4, Math.sin(ai) * s * 0.4);
  }
  ctx.closePath();
  ctx.fill();
};

const heart: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.4);
  ctx.bezierCurveTo(-s * 0.1, s * 0.1, -s, -s * 0.3, 0, -s * 0.8);
  ctx.bezierCurveTo(s, -s * 0.3, s * 0.1, s * 0.1, 0, s * 0.4);
  ctx.closePath();
  ctx.fill();
};

const diamond: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.6, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(-s * 0.6, 0);
  ctx.closePath();
  ctx.fill();
};

const crown: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(-s, s * 0.5);
  ctx.lineTo(-s, -s * 0.2);
  ctx.lineTo(-s * 0.5, s * 0.1);
  ctx.lineTo(0, -s);
  ctx.lineTo(s * 0.5, s * 0.1);
  ctx.lineTo(s, -s * 0.2);
  ctx.lineTo(s, s * 0.5);
  ctx.closePath();
  ctx.fill();
};

const skull: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.arc(0, -s * 0.15, s * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-s * 0.3, s * 0.2, s * 0.6, s * 0.5);
  // Eye holes
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(-s * 0.25, -s * 0.2, s * 0.18, 0, Math.PI * 2);
  ctx.arc(s * 0.25, -s * 0.2, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const leaf: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.8, -s * 0.3, 0, s);
  ctx.quadraticCurveTo(-s * 0.8, -s * 0.3, 0, -s);
  ctx.closePath();
  ctx.fill();
};

const snowflake: ShapeFn = (ctx, s) => {
  ctx.lineWidth = s * 0.15;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i * 60) * (Math.PI / 180);
    const cos = Math.cos(a), sin = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cos * s, sin * s);
    ctx.stroke();
    // Branch tips
    const bx = cos * s * 0.6, by = sin * s * 0.6;
    const pa = a + 0.5, pb = a - 0.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(pa) * s * 0.3, by + Math.sin(pa) * s * 0.3);
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(pb) * s * 0.3, by + Math.sin(pb) * s * 0.3);
    ctx.stroke();
  }
};

const droplet: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.8, s * 0.2, 0, s);
  ctx.quadraticCurveTo(-s * 0.8, s * 0.2, 0, -s);
  ctx.closePath();
  ctx.fill();
};

const music_note: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.arc(-s * 0.15, s * 0.5, s * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(s * 0.15, -s, s * 0.12, s * 1.55);
  ctx.fillRect(s * 0.15, -s, s * 0.5, s * 0.15);
};

const fist: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-s * 0.55, -s * 0.15, s * 1.1, s * 0.5);
  ctx.fillRect(-s * 0.1, -s * 0.6, s * 0.55, s * 0.5);
};

const eye: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.quadraticCurveTo(0, -s, s, 0);
  ctx.quadraticCurveTo(0, s, -s, 0);
  ctx.closePath();
  ctx.fill();
  // Pupil
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const spiral: ShapeFn = (ctx, s) => {
  ctx.lineWidth = s * 0.15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 720; i += 10) {
    const a = (i * Math.PI) / 180;
    const r = (i / 720) * s;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
};

const arrow: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.6, s * 0.1);
  ctx.lineTo(s * 0.2, s * 0.1);
  ctx.lineTo(s * 0.2, s);
  ctx.lineTo(-s * 0.2, s);
  ctx.lineTo(-s * 0.2, s * 0.1);
  ctx.lineTo(-s * 0.6, s * 0.1);
  ctx.closePath();
  ctx.fill();
};

const shield: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.8, -s * 0.5);
  ctx.lineTo(s * 0.7, s * 0.3);
  ctx.quadraticCurveTo(0, s * 1.1, 0, s);
  ctx.quadraticCurveTo(0, s * 1.1, -s * 0.7, s * 0.3);
  ctx.lineTo(-s * 0.8, -s * 0.5);
  ctx.closePath();
  ctx.fill();
};

const wing: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.2, -s * 0.3, -s * 0.8, -s);
  ctx.quadraticCurveTo(-s * 0.4, -s * 0.4, -s * 0.3, -s * 0.6);
  ctx.quadraticCurveTo(-s * 0.1, -s * 0.2, 0, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.1, -s * 0.2, s * 0.3, -s * 0.6);
  ctx.quadraticCurveTo(s * 0.4, -s * 0.4, s * 0.8, -s);
  ctx.quadraticCurveTo(s * 0.2, -s * 0.3, 0, s * 0.5);
  ctx.closePath();
  ctx.fill();
};

const sword: ShapeFn = (ctx, s) => {
  // Blade
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.15, s * 0.2);
  ctx.lineTo(-s * 0.15, s * 0.2);
  ctx.closePath();
  ctx.fill();
  // Guard
  ctx.fillRect(-s * 0.4, s * 0.2, s * 0.8, s * 0.12);
  // Grip
  ctx.fillRect(-s * 0.07, s * 0.32, s * 0.14, s * 0.5);
  // Pommel
  ctx.beginPath();
  ctx.arc(0, s * 0.9, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
};

const paw: ShapeFn = (ctx, s) => {
  // Palm
  ctx.beginPath();
  ctx.ellipse(0, s * 0.15, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Toe beans
  const toes = [[-s * 0.35, -s * 0.35], [0, -s * 0.5], [s * 0.35, -s * 0.35]];
  for (const [tx, ty] of toes) {
    ctx.beginPath();
    ctx.arc(tx, ty, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
};

const bolt: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, -s);
  ctx.lineTo(s * 0.1, -s * 0.1);
  ctx.lineTo(-s * 0.2, -s * 0.1);
  ctx.lineTo(s * 0.4, s);
  ctx.lineTo(-s * 0.1, s * 0.1);
  ctx.lineTo(s * 0.2, s * 0.1);
  ctx.closePath();
  ctx.fill();
};

const circle: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();
};

const cross: ShapeFn = (ctx, s) => {
  const w = s * 0.3;
  ctx.fillRect(-w, -s, w * 2, s * 2);
  ctx.fillRect(-s, -w, s * 2, w * 2);
};

const snake: ShapeFn = (ctx, s) => {
  ctx.lineWidth = s * 0.25;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.6, s * 0.6);
  ctx.quadraticCurveTo(-s * 0.6, 0, 0, 0);
  ctx.quadraticCurveTo(s * 0.6, 0, s * 0.6, -s * 0.5);
  ctx.quadraticCurveTo(s * 0.6, -s * 0.8, s * 0.3, -s);
  ctx.stroke();
  // Head
  ctx.beginPath();
  ctx.arc(s * 0.3, -s, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
};

export const SHAPE_REGISTRY: Record<string, ShapeFn> = {
  lightning_bolt,
  flame,
  crescent,
  bat,
  star,
  heart,
  diamond,
  crown,
  skull,
  leaf,
  snowflake,
  droplet,
  music_note,
  fist,
  eye,
  spiral,
  arrow,
  shield,
  wing,
  sword,
  paw,
  bolt,
  circle,
  cross,
  snake,
};

export const VALID_SHAPE_IDS = Object.keys(SHAPE_REGISTRY);

export function drawThemedShape(
  ctx: CanvasRenderingContext2D,
  shapeId: string,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
): void {
  const fn = SHAPE_REGISTRY[shapeId];
  if (!fn) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  // Double-draw with strong glow for visibility
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 4;
  fn(ctx, size);

  // Second pass: brighter core
  ctx.shadowBlur = size * 1.5;
  ctx.shadowColor = '#FFFFFF';
  ctx.globalAlpha *= 0.5;
  fn(ctx, size * 0.7);

  ctx.shadowBlur = 0;
  ctx.restore();
}

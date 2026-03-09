// ─────────────────────────────────────────────────────────────
// Themed Particle Shapes — Canvas 2D path draw functions
//
// Each function draws a filled shape centered at (0,0),
// scaled by `s` (half-size). Caller handles translate/rotate.
// ─────────────────────────────────────────────────────────────

const TAU = Math.PI * 2;

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

// ── Additional themed shapes ─────────────────────────────────

const claw_marks: ShapeFn = (ctx, s) => {
  ctx.lineWidth = s * 0.2;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * s * 0.35, -s);
    ctx.lineTo(i * s * 0.35 + s * 0.15, s);
    ctx.stroke();
  }
};

const batarang: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.3);
  ctx.lineTo(-s * 0.4, -s);
  ctx.quadraticCurveTo(-s, -s * 0.5, -s, 0);
  ctx.quadraticCurveTo(-s, s * 0.3, -s * 0.5, s * 0.2);
  ctx.lineTo(0, s * 0.5);
  ctx.lineTo(s * 0.5, s * 0.2);
  ctx.quadraticCurveTo(s, s * 0.3, s, 0);
  ctx.quadraticCurveTo(s, -s * 0.5, s * 0.4, -s);
  ctx.closePath();
  ctx.fill();
};

const kunai: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.3, -s * 0.1);
  ctx.lineTo(s * 0.1, 0);
  ctx.lineTo(s * 0.1, s * 0.5);
  ctx.lineTo(s * 0.25, s * 0.5);
  ctx.lineTo(s * 0.25, s * 0.6);
  ctx.lineTo(-s * 0.25, s * 0.6);
  ctx.lineTo(-s * 0.25, s * 0.5);
  ctx.lineTo(-s * 0.1, s * 0.5);
  ctx.lineTo(-s * 0.1, 0);
  ctx.lineTo(-s * 0.3, -s * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, s * 0.85, s * 0.18, 0, Math.PI * 2);
  ctx.stroke();
};

const shuriken: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * 90 - 45) * (Math.PI / 180);
    const na = ((i * 90 + 45) - 45) * (Math.PI / 180);
    ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
    ctx.lineTo(Math.cos(na) * s * 0.3, Math.sin(na) * s * 0.3);
  }
  ctx.closePath();
  ctx.fill();
};

const rocket: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.35, -s * 0.5, s * 0.3, s * 0.2);
  ctx.lineTo(s * 0.6, s * 0.7);
  ctx.lineTo(s * 0.2, s * 0.5);
  ctx.lineTo(0, s);
  ctx.lineTo(-s * 0.2, s * 0.5);
  ctx.lineTo(-s * 0.6, s * 0.7);
  ctx.lineTo(-s * 0.3, s * 0.2);
  ctx.quadraticCurveTo(-s * 0.35, -s * 0.5, 0, -s);
  ctx.closePath();
  ctx.fill();
};

const planet: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.25, -0.3, 0, Math.PI * 2);
  ctx.stroke();
};

const car: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(-s, s * 0.2);
  ctx.lineTo(-s * 0.7, s * 0.2);
  ctx.lineTo(-s * 0.5, -s * 0.3);
  ctx.lineTo(s * 0.2, -s * 0.3);
  ctx.lineTo(s * 0.5, s * 0.2);
  ctx.lineTo(s, s * 0.2);
  ctx.lineTo(s, s * 0.5);
  ctx.lineTo(-s, s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-s * 0.55, s * 0.55, s * 0.2, 0, Math.PI * 2);
  ctx.arc(s * 0.55, s * 0.55, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
};

const football: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.6, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = s * 0.08;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, s * 0.4);
  ctx.lineTo(s * 0.4, -s * 0.4);
  ctx.stroke();
  ctx.restore();
};

const trophy: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, -s);
  ctx.lineTo(s * 0.4, -s);
  ctx.lineTo(s * 0.35, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.3, s * 0.1, 0, s * 0.2);
  ctx.quadraticCurveTo(-s * 0.3, s * 0.1, -s * 0.35, -s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-s * 0.08, s * 0.2, s * 0.16, s * 0.4);
  ctx.fillRect(-s * 0.3, s * 0.6, s * 0.6, s * 0.15);
  ctx.beginPath();
  ctx.moveTo(-s * 0.7, -s * 0.8);
  ctx.quadraticCurveTo(-s * 0.8, -s * 0.2, -s * 0.4, -s * 0.2);
  ctx.moveTo(s * 0.7, -s * 0.8);
  ctx.quadraticCurveTo(s * 0.8, -s * 0.2, s * 0.4, -s * 0.2);
  ctx.lineWidth = s * 0.08;
  ctx.stroke();
};

const guitar: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.ellipse(0, s * 0.3, s * 0.45, s * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-s * 0.06, -s, s * 0.12, s * 1.3);
  ctx.fillRect(-s * 0.25, -s, s * 0.5, s * 0.1);
};

const tree: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.5, -s * 0.2);
  ctx.lineTo(s * 0.3, -s * 0.2);
  ctx.lineTo(s * 0.6, s * 0.3);
  ctx.lineTo(s * 0.35, s * 0.3);
  ctx.lineTo(s * 0.7, s * 0.7);
  ctx.lineTo(-s * 0.7, s * 0.7);
  ctx.lineTo(-s * 0.35, s * 0.3);
  ctx.lineTo(-s * 0.6, s * 0.3);
  ctx.lineTo(-s * 0.3, -s * 0.2);
  ctx.lineTo(-s * 0.5, -s * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-s * 0.1, s * 0.7, s * 0.2, s * 0.3);
};

const moon: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(s * 0.35, -s * 0.2, s * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const candy_cane: ShapeFn = (ctx, s) => {
  ctx.lineWidth = s * 0.25;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(s * 0.15, -s * 0.5, s * 0.35, Math.PI, 0);
  ctx.lineTo(s * 0.5, s);
  ctx.stroke();
};

const cowl: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(-s * 0.6, s * 0.7);
  ctx.lineTo(-s * 0.55, 0);
  ctx.lineTo(-s * 0.7, -s * 0.5);
  ctx.lineTo(-s * 0.3, -s);
  ctx.lineTo(-s * 0.2, -s * 0.4);
  ctx.lineTo(0, -s * 0.55);
  ctx.lineTo(s * 0.2, -s * 0.4);
  ctx.lineTo(s * 0.3, -s);
  ctx.lineTo(s * 0.7, -s * 0.5);
  ctx.lineTo(s * 0.55, 0);
  ctx.lineTo(s * 0.6, s * 0.7);
  ctx.quadraticCurveTo(0, s * 0.9, -s * 0.6, s * 0.7);
  ctx.closePath();
  ctx.fill();
};

const wave: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(-s, s * 0.3);
  ctx.quadraticCurveTo(-s * 0.5, -s * 0.8, 0, 0);
  ctx.quadraticCurveTo(s * 0.3, s * 0.3, s * 0.5, -s * 0.2);
  ctx.quadraticCurveTo(s * 0.7, -s * 0.5, s, -s);
  ctx.lineTo(s, s);
  ctx.lineTo(-s, s);
  ctx.closePath();
  ctx.fill();
};

const anchor: ShapeFn = (ctx, s) => {
  ctx.lineWidth = s * 0.15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, -s * 0.65, s * 0.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.4);
  ctx.lineTo(0, s * 0.6);
  ctx.moveTo(-s * 0.5, -s * 0.4);
  ctx.lineTo(s * 0.5, -s * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-s * 0.5, s * 0.6, s * 0.35, -Math.PI * 0.5, Math.PI * 0.3);
  ctx.moveTo(s * 0.5, s * 0.25);
  ctx.arc(s * 0.5, s * 0.6, s * 0.35, -Math.PI * 0.5, Math.PI, true);
  ctx.stroke();
};

const feather: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.7, -s * 0.3, s * 0.3, s * 0.5);
  ctx.quadraticCurveTo(s * 0.1, s * 0.8, 0, s);
  ctx.quadraticCurveTo(-s * 0.05, s * 0.7, 0, s * 0.4);
  ctx.quadraticCurveTo(-s * 0.1, -s * 0.3, 0, -s);
  ctx.closePath();
  ctx.fill();
};

const gear: ShapeFn = (ctx, s) => {
  const teeth = 8;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a1 = (i / teeth) * TAU;
    const a2 = ((i + 0.3) / teeth) * TAU;
    const a3 = ((i + 0.5) / teeth) * TAU;
    const a4 = ((i + 0.8) / teeth) * TAU;
    ctx.lineTo(Math.cos(a1) * s * 0.7, Math.sin(a1) * s * 0.7);
    ctx.lineTo(Math.cos(a2) * s, Math.sin(a2) * s);
    ctx.lineTo(Math.cos(a3) * s, Math.sin(a3) * s);
    ctx.lineTo(Math.cos(a4) * s * 0.7, Math.sin(a4) * s * 0.7);
  }
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const potion: ShapeFn = (ctx, s) => {
  ctx.fillRect(-s * 0.15, -s, s * 0.3, s * 0.4);
  ctx.beginPath();
  ctx.moveTo(-s * 0.15, -s * 0.6);
  ctx.lineTo(-s * 0.5, s * 0.1);
  ctx.quadraticCurveTo(-s * 0.55, s, 0, s);
  ctx.quadraticCurveTo(s * 0.55, s, s * 0.5, s * 0.1);
  ctx.lineTo(s * 0.15, -s * 0.6);
  ctx.closePath();
  ctx.fill();
};

const fire_breath: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.1, 0, -s * 0.6, -s * 0.3);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.5, 0, -s);
  ctx.quadraticCurveTo(s * 0.3, -s * 0.5, s * 0.6, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.1, 0, s * 0.2, s * 0.5);
  ctx.quadraticCurveTo(0, s * 0.2, -s * 0.2, s * 0.5);
  ctx.closePath();
  ctx.fill();
};

const mask: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.7);
  ctx.quadraticCurveTo(s * 0.8, -s * 0.7, s * 0.7, 0);
  ctx.quadraticCurveTo(s * 0.6, s * 0.5, 0, s * 0.7);
  ctx.quadraticCurveTo(-s * 0.6, s * 0.5, -s * 0.7, 0);
  ctx.quadraticCurveTo(-s * 0.8, -s * 0.7, 0, -s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.ellipse(-s * 0.28, -s * 0.1, s * 0.2, s * 0.12, -0.2, 0, Math.PI * 2);
  ctx.ellipse(s * 0.28, -s * 0.1, s * 0.2, s * 0.12, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const cherry_blossom: ShapeFn = (ctx, s) => {
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * (Math.PI / 180);
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.55, s * 0.28, s * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
};

const dragon_head: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.6, s * 0.2, -s * 0.5, -s * 0.3);
  ctx.lineTo(-s * 0.7, -s);
  ctx.lineTo(-s * 0.3, -s * 0.5);
  ctx.quadraticCurveTo(0, -s * 0.7, s * 0.3, -s * 0.4);
  ctx.lineTo(s, -s * 0.1);
  ctx.lineTo(s * 0.7, s * 0.1);
  ctx.quadraticCurveTo(s * 0.3, s * 0.3, s * 0.2, s * 0.6);
  ctx.quadraticCurveTo(0, s * 0.8, -s * 0.3, s * 0.5);
  ctx.closePath();
  ctx.fill();
};

// ── Elemental effect shapes ──────────────────────────────────

const burning_splinter: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.18, -s * 0.2);
  ctx.lineTo(s * 0.12, s * 0.5);
  ctx.quadraticCurveTo(s * 0.06, s * 0.9, 0, s);
  ctx.quadraticCurveTo(-s * 0.06, s * 0.9, -s * 0.12, s * 0.5);
  ctx.lineTo(-s * 0.18, -s * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.1);
  ctx.quadraticCurveTo(s * 0.15, -s * 0.7, s * 0.08, -s * 0.5);
  ctx.quadraticCurveTo(-s * 0.1, -s * 0.7, 0, -s * 1.1);
  ctx.closePath();
  ctx.fill();
};

const fire_spark: ShapeFn = (ctx, s) => {
  const rays = 6;
  ctx.beginPath();
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * TAU;
    const aMid = ((i + 0.5) / rays) * TAU;
    const outerR = (i % 2 === 0) ? s : s * 0.7;
    ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
    ctx.lineTo(Math.cos(aMid) * s * 0.25, Math.sin(aMid) * s * 0.25);
  }
  ctx.closePath();
  ctx.fill();
};

const smoke_puff: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.arc(-s * 0.3, s * 0.15, s * 0.45, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.25, s * 0.1, s * 0.4, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -s * 0.25, s * 0.5, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.05, s * 0.35, s * 0.3, 0, TAU);
  ctx.fill();
};

const electric_spark: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.25, -s * 0.35);
  ctx.lineTo(s * 0.7, -s * 0.4);
  ctx.lineTo(s * 0.2, 0);
  ctx.lineTo(s * 0.5, s * 0.1);
  ctx.lineTo(0, s);
  ctx.lineTo(-s * 0.15, s * 0.2);
  ctx.lineTo(-s * 0.6, s * 0.3);
  ctx.lineTo(-s * 0.15, -s * 0.1);
  ctx.lineTo(-s * 0.55, -s * 0.25);
  ctx.lineTo(-s * 0.1, -s * 0.4);
  ctx.closePath();
  ctx.fill();
};

const plasma_orb: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.5, 0, TAU);
  ctx.fill();
  ctx.lineWidth = s * 0.1;
  ctx.lineCap = 'round';
  const arcs = 5;
  for (let i = 0; i < arcs; i++) {
    const a = (i / arcs) * TAU;
    const r = s * 0.5;
    const ox = Math.cos(a) * r;
    const oy = Math.sin(a) * r;
    const ex = Math.cos(a) * s;
    const ey = Math.sin(a) * s;
    const jx = (Math.random() - 0.5) * s * 0.3;
    const jy = (Math.random() - 0.5) * s * 0.3;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo(ox + jx, oy + jy, ex, ey);
    ctx.stroke();
  }
};

const water_splash: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(-s * 0.7, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.5, s * 0.1, -s * 0.6, -s * 0.3);
  ctx.quadraticCurveTo(-s * 0.55, -s * 0.6, -s * 0.35, -s * 0.5);
  ctx.quadraticCurveTo(-s * 0.2, -s * 0.2, -s * 0.15, -s * 0.8);
  ctx.quadraticCurveTo(-s * 0.05, -s * 0.4, 0, -s);
  ctx.quadraticCurveTo(s * 0.05, -s * 0.4, s * 0.15, -s * 0.8);
  ctx.quadraticCurveTo(s * 0.2, -s * 0.2, s * 0.35, -s * 0.5);
  ctx.quadraticCurveTo(s * 0.55, -s * 0.6, s * 0.6, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.5, s * 0.1, s * 0.7, s * 0.5);
  ctx.quadraticCurveTo(0, s * 0.2, -s * 0.7, s * 0.5);
  ctx.closePath();
  ctx.fill();
};

const ice_shard: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.35, -s * 0.3);
  ctx.lineTo(s * 0.25, s * 0.2);
  ctx.lineTo(s * 0.4, s * 0.6);
  ctx.lineTo(0, s);
  ctx.lineTo(-s * 0.4, s * 0.6);
  ctx.lineTo(-s * 0.25, s * 0.2);
  ctx.lineTo(-s * 0.35, -s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.7);
  ctx.lineTo(s * 0.12, s * 0.1);
  ctx.lineTo(-s * 0.12, s * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const wind_streak: ShapeFn = (ctx, s) => {
  ctx.lineWidth = s * 0.18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s, s * 0.3);
  ctx.quadraticCurveTo(-s * 0.3, s * 0.3, 0, 0);
  ctx.quadraticCurveTo(s * 0.3, -s * 0.3, s, -s * 0.3);
  ctx.stroke();
  ctx.lineWidth = s * 0.12;
  ctx.beginPath();
  ctx.moveTo(-s * 0.7, s * 0.6);
  ctx.quadraticCurveTo(-s * 0.1, s * 0.6, s * 0.3, s * 0.3);
  ctx.stroke();
  ctx.lineWidth = s * 0.09;
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.4);
  ctx.quadraticCurveTo(0, -s * 0.5, s * 0.6, -s * 0.7);
  ctx.stroke();
};

const petal: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.6, -s * 0.7, s * 0.8, -s * 0.1, s * 0.5, s * 0.4);
  ctx.quadraticCurveTo(s * 0.2, s * 0.8, 0, s);
  ctx.quadraticCurveTo(-s * 0.2, s * 0.8, -s * 0.5, s * 0.4);
  ctx.bezierCurveTo(-s * 0.8, -s * 0.1, -s * 0.6, -s * 0.7, 0, -s);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.6);
  ctx.quadraticCurveTo(s * 0.05, 0, 0, s * 0.7);
  ctx.stroke();
};

const vine_curl: ShapeFn = (ctx, s) => {
  ctx.lineWidth = s * 0.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, s);
  ctx.quadraticCurveTo(-s * 0.4, s * 0.3, 0, 0);
  ctx.quadraticCurveTo(s * 0.5, -s * 0.4, s * 0.3, -s * 0.7);
  ctx.quadraticCurveTo(s * 0.1, -s * 0.9, -s * 0.1, -s * 0.7);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.5, -s * 0.15, -s * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(s * 0.15, -s * 0.85, s * 0.15, s * 0.1, -0.5, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-s * 0.05, -s * 0.55, s * 0.12, s * 0.08, 0.4, 0, TAU);
  ctx.fill();
};

const shadow_wisp: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.4, -s * 0.7, s * 0.3, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.6, -s * 0.1, s * 0.5, s * 0.2);
  ctx.quadraticCurveTo(s * 0.3, s * 0.5, s * 0.4, s * 0.8);
  ctx.quadraticCurveTo(s * 0.2, s * 0.6, 0, s * 0.7);
  ctx.quadraticCurveTo(-s * 0.2, s * 0.8, -s * 0.35, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.5, s * 0.2, -s * 0.4, -s * 0.1);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.4, -s * 0.15, -s * 0.6);
  ctx.quadraticCurveTo(-s * 0.05, -s * 0.8, 0, -s);
  ctx.closePath();
  ctx.fill();
};

const light_ray: ShapeFn = (ctx, s) => {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.2, -s * 0.3);
  ctx.lineTo(s * 0.08, -s * 0.3);
  ctx.lineTo(s * 0.15, s * 0.4);
  ctx.lineTo(s * 0.05, s * 0.4);
  ctx.lineTo(s * 0.1, s);
  ctx.lineTo(-s * 0.1, s);
  ctx.lineTo(-s * 0.05, s * 0.4);
  ctx.lineTo(-s * 0.15, s * 0.4);
  ctx.lineTo(-s * 0.08, -s * 0.3);
  ctx.lineTo(-s * 0.2, -s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -s * 0.15, s * 0.25, 0, TAU);
  ctx.fill();
};

export const SHAPE_REGISTRY: Record<string, ShapeFn> = {
  lightning_bolt, flame, crescent, bat, star, heart, diamond, crown, skull,
  leaf, snowflake, droplet, music_note, fist, eye, spiral, arrow, shield,
  wing, sword, paw, bolt, circle, cross, snake,
  claw_marks, batarang, kunai, shuriken, rocket, planet, car, football,
  trophy, guitar, tree, moon, candy_cane, cowl, wave, anchor, feather,
  gear, potion, fire_breath, mask, cherry_blossom, dragon_head,
  burning_splinter, fire_spark, smoke_puff, electric_spark, plasma_orb,
  water_splash, ice_shard, wind_streak, petal, vine_curl, shadow_wisp, light_ray,
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

/**
 * Renders a pre-cached Path2D (from AI-generated SVG path d string).
 * Paths are authored in a 64x64 viewBox; we scale to the target size.
 * Hero particles get strong glow and a bright core for maximum visibility.
 */
export function drawCustomSVGPath(
  ctx: CanvasRenderingContext2D,
  path2d: Path2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
): void {
  const scale = size / 32;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.translate(-32, -32);

  // Outer glow pass
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 25;
  ctx.fill(path2d);

  // Second fill for intensity
  ctx.shadowBlur = 12;
  ctx.fill(path2d);

  // Bright white-hot core
  ctx.shadowBlur = 4;
  ctx.shadowColor = '#FFFFFF';
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha *= 0.3;
  ctx.fill(path2d);

  ctx.shadowBlur = 0;
  ctx.restore();
}

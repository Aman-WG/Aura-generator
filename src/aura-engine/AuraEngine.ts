import type { AuraParams, Particle, LightningBolt } from './types';
import { drawThemedShape, drawCustomSVGPath, SHAPE_REGISTRY } from './particle-shapes';

const TAU = Math.PI * 2;
const LUT_SIZE = 360;
const MAX_PARTICLES = 25;
const MAX_FLAME_POINTS = 48;
const MAX_LIGHTNING_BOLTS = 3;
const LIGHTNING_SEGMENTS = 6;

/**
 * AuraEngine — Pure JS Canvas 2D anime aura renderer.
 *
 * Draws 4 visual layers onto two canvases (back + front)
 * at a capped 30fps for Chromebook-safe performance.
 */
export class AuraEngine {
  private backCtx: CanvasRenderingContext2D;
  private frontCtx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private cx = 0;
  private cy = 0;

  private params!: AuraParams;
  private particles: Particle[] = [];
  private bolts: LightningBolt[] = [];

  // Pre-computed LUTs
  private sinLUT = new Float32Array(LUT_SIZE);
  private cosLUT = new Float32Array(LUT_SIZE);

  // Flame contour noise offsets (stable per-point randomness)
  private flameOffsets: number[] = [];
  private flameSpeeds: number[] = [];

  // Animation state
  private frame = 0;
  private time = 0;
  private rafId = 0;
  private running = false;
  private lastFrameTime = 0;

  // Cached gradients (rebuilt on param change)
  private innerGrad: CanvasGradient | null = null;
  private outerGrad: CanvasGradient | null = null;

  // AI-generated custom Path2D cache (rebuilt on setParams)
  private customPath2Ds: Path2D[] = [];

  constructor(
    private backCanvas: HTMLCanvasElement,
    private frontCanvas: HTMLCanvasElement,
  ) {
    this.backCtx = backCanvas.getContext('2d', { alpha: true })!;
    this.frontCtx = frontCanvas.getContext('2d', { alpha: true })!;

    this.buildLUT();
    this.initParticlePool();
    this.initFlamePoints();
    this.initLightning();
  }

  // ── Public API ──────────────────────────────────────────────

  setParams(params: AuraParams): void {
    this.params = params;
    this.innerGrad = null;
    this.outerGrad = null;
    this.resetParticles();
    this.buildCustomPaths();
  }

  private buildCustomPaths(): void {
    this.customPath2Ds = [];
    const raw = this.params.particles.customPaths;
    if (!raw || raw.length === 0) {
      console.log('[AuraEngine] No custom paths provided');
      return;
    }
    for (const entry of raw) {
      try {
        this.customPath2Ds.push(new Path2D(entry.path));
        console.log(`[AuraEngine] Custom path loaded: "${entry.name}" (${entry.path.length} chars)`);
      } catch {
        console.warn(`[AuraEngine] Invalid custom path: "${entry.name}"`);
      }
    }
    console.log(`[AuraEngine] ${this.customPath2Ds.length}/${raw.length} custom paths active`);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.cx = w / 2;
    this.cy = h * 0.55; // character sits slightly below center
    this.backCanvas.width = w;
    this.backCanvas.height = h;
    this.frontCanvas.width = w;
    this.frontCanvas.height = h;
    this.innerGrad = null;
    this.outerGrad = null;
  }

  // ── Init helpers ────────────────────────────────────────────

  private buildLUT(): void {
    for (let i = 0; i < LUT_SIZE; i++) {
      const a = (i / LUT_SIZE) * TAU;
      this.sinLUT[i] = Math.sin(a);
      this.cosLUT[i] = Math.cos(a);
    }
  }

  private sin(deg: number): number {
    return this.sinLUT[((deg % 360) + 360) % 360 | 0];
  }

  private cos(deg: number): number {
    return this.cosLUT[((deg % 360) + 360) % 360 | 0];
  }

  private initParticlePool(): void {
    this.particles = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        x: 0, y: 0, vx: 0, vy: 0,
        alpha: 0, size: 0, life: 0, maxLife: 0,
        rotation: 0, rotationSpeed: 0, active: false,
        useSecondary: false, shapeIdx: -1, customPathIdx: -1,
      });
    }
  }

  private initFlamePoints(): void {
    this.flameOffsets = [];
    this.flameSpeeds = [];
    for (let i = 0; i < MAX_FLAME_POINTS; i++) {
      this.flameOffsets.push(Math.random() * 1000);
      this.flameSpeeds.push(0.6 + Math.random() * 0.8);
    }
  }

  private initLightning(): void {
    this.bolts = [];
    for (let i = 0; i < MAX_LIGHTNING_BOLTS; i++) {
      this.bolts.push({
        segments: Array.from({ length: LIGHTNING_SEGMENTS }, () => ({ x: 0, y: 0 })),
        alpha: 0,
        life: 0,
      });
    }
  }

  private resetParticles(): void {
    for (const p of this.particles) {
      p.active = false;
    }
  }

  // ── Main loop ───────────────────────────────────────────────

  private tick = (): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);

    // 30fps cap: skip every other frame
    this.frame++;
    if (this.frame % 2 !== 0) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = now;
    this.time += dt;

    if (!this.params || this.w === 0) return;

    this.update(dt);
    this.draw(this.backCtx, 1.0);
    this.draw(this.frontCtx, 0.18);
  };

  // ── Update ──────────────────────────────────────────────────

  private update(dt: number): void {
    this.updateParticles(dt);
    this.updateLightning(dt);
  }

  private updateParticles(dt: number): void {
    const p = this.params.particles;
    const speed = p.speed;
    const f = this.params.flameContour;
    const intensity = this.params.intensity;

    // Approximate outer flame edge radius, accounting for smoothness size compensation
    const sm = f.smoothness;
    const sizeComp = 1.0 + sm * 0.25 * (1.0 - f.jaggedness * 0.5);
    const auraRx = this.w * 0.194 * f.thickness * intensity * sizeComp * (1 + f.jaggedness * 0.75) * (1 + f.height * 0.3);
    const auraRy = this.h * 0.219 * intensity * sizeComp * f.height * (1 + f.jaggedness * 0.75);
    // Kill distance: 1.5x the aura edge
    const killRx = auraRx * 1.5;
    const killRy = auraRy * 1.5;

    let activeCount = 0;
    for (const pt of this.particles) {
      if (pt.active) {
        activeCount++;
        pt.life -= dt;
        if (pt.life <= 0) {
          pt.active = false;
          continue;
        }

        // Life-based alpha (fade in / sustain / fade out)
        const lifeRatio = pt.life / pt.maxLife;
        let alpha = lifeRatio > 0.7 ? (1 - lifeRatio) / 0.3 : lifeRatio > 0.2 ? 1.0 : lifeRatio / 0.2;
        alpha *= 0.8;

        // Distance-based fade: full inside aura, ease-out to 0 at 1.5x edge
        const dx = pt.x - this.cx;
        const dy = pt.y - this.cy;
        const dist = Math.sqrt((dx * dx) / (killRx * killRx) + (dy * dy) / (killRy * killRy));
        if (dist > 1.0) {
          pt.active = false;
          continue;
        }
        // Fade begins at the aura edge (dist ~0.667 of kill zone = 1/1.5)
        const edgeNorm = 1 / 1.5;
        if (dist > edgeNorm) {
          const t = (dist - edgeNorm) / (1.0 - edgeNorm);
          alpha *= 1.0 - t * t; // ease-out: fast start, gentle tail
        }

        pt.alpha = alpha;

        pt.x += pt.vx * dt * speed * 20;
        pt.y += pt.vy * dt * speed * 20;
        pt.rotation += pt.rotationSpeed * dt;

        if (p.drift === 'spiral') {
          const angle = Math.atan2(pt.y - this.cy, pt.x - this.cx);
          pt.vx += Math.cos(angle + Math.PI / 2) * 0.02;
          pt.vy += Math.sin(angle + Math.PI / 2) * 0.02;
        }
      }
    }

    // Spawn new particles to reach target count
    const target = Math.min(Math.ceil(p.count * 0.5), MAX_PARTICLES);
    if (activeCount < target) {
      const toSpawn = Math.min(2, target - activeCount);
      for (let i = 0; i < toSpawn; i++) {
        this.spawnParticle();
      }
    }
  }

  private spawnParticle(): void {
    const p = this.params.particles;
    let pt: Particle | null = null;
    for (const candidate of this.particles) {
      if (!candidate.active) { pt = candidate; break; }
    }
    if (!pt) return;

    const drift = p.drift;
    const spread = this.w * 0.3;

    pt.active = true;
    pt.alpha = 0;
    pt.rotation = Math.random() * TAU;
    pt.useSecondary = Boolean(p.secondaryColor) && Math.random() > 0.5;
    pt.shapeIdx = -1;
    pt.customPathIdx = -1;

    const shapes = p.shapes;
    const hasShapes = shapes && shapes.length > 0;
    const hasCustom = this.customPath2Ds.length > 0;
    const roll = Math.random();

    if (hasCustom && roll < 0.6) {
      pt.customPathIdx = Math.floor(Math.random() * this.customPath2Ds.length);
      pt.size = p.size * (5.0 + Math.random() * 3.0);
      pt.maxLife = 3.5 + Math.random() * 2.5;
      pt.rotationSpeed = (Math.random() - 0.5) * 0.3;
    } else if (hasShapes && roll < (hasCustom ? 0.8 : 0.60)) {
      pt.shapeIdx = Math.floor(Math.random() * shapes!.length);
      pt.size = p.size * (3.5 + Math.random() * 2.5);
      pt.maxLife = 2.5 + Math.random() * 2.0;
      pt.rotationSpeed = (Math.random() - 0.5) * 0.8;
    } else {
      pt.size = p.size * (0.6 + Math.random() * 0.8);
      pt.maxLife = 1.5 + Math.random() * 2.5;
      pt.rotationSpeed = (Math.random() - 0.5) * 2;
    }
    pt.life = pt.maxLife;

    switch (drift) {
      case 'rise':
        pt.x = this.cx + (Math.random() - 0.5) * spread;
        pt.y = this.cy + Math.random() * this.h * 0.15;
        pt.vx = (Math.random() - 0.5) * 0.5;
        pt.vy = -(1.5 + Math.random() * 2.0);
        break;
      case 'spiral':
        const angle = Math.random() * TAU;
        const radius = 20 + Math.random() * spread * 0.4;
        pt.x = this.cx + Math.cos(angle) * radius;
        pt.y = this.cy + Math.sin(angle) * radius;
        pt.vx = Math.cos(angle + Math.PI / 2) * 1.0;
        pt.vy = Math.sin(angle + Math.PI / 2) * 1.0 - 0.5;
        break;
      case 'burst':
        const burstAngle = Math.random() * TAU;
        pt.x = this.cx;
        pt.y = this.cy;
        const burstSpeed = 1.5 + Math.random() * 2.5;
        pt.vx = Math.cos(burstAngle) * burstSpeed;
        pt.vy = Math.sin(burstAngle) * burstSpeed - 0.5;
        break;
      case 'float':
      default:
        pt.x = this.cx + (Math.random() - 0.5) * spread * 1.5;
        pt.y = this.cy + (Math.random() - 0.5) * this.h * 0.3;
        pt.vx = (Math.random() - 0.5) * 0.6;
        pt.vy = -(0.3 + Math.random() * 0.8);
        break;
    }
  }

  private updateLightning(dt: number): void {
    if (!this.params.lightning.enabled) return;

    for (const bolt of this.bolts) {
      if (bolt.life > 0) {
        bolt.life -= dt;
        bolt.alpha = Math.max(0, bolt.life * 4);
      } else if (Math.random() < this.params.lightning.frequency * dt * 2) {
        this.generateBolt(bolt);
      }
    }
  }

  private generateBolt(bolt: LightningBolt): void {
    bolt.life = 0.1 + Math.random() * 0.15;
    bolt.alpha = 1;

    const startAngle = Math.random() * TAU;
    let x = this.cx;
    let y = this.cy;
    const stepLen = (this.w * 0.12);

    for (let i = 0; i < bolt.segments.length; i++) {
      const jitter = (Math.random() - 0.5) * stepLen * 0.7;
      x += Math.cos(startAngle) * stepLen + jitter;
      y += Math.sin(startAngle) * stepLen * 0.6 + (Math.random() - 0.5) * stepLen * 0.5;
      bolt.segments[i].x = x;
      bolt.segments[i].y = y;
    }
  }

  // ── Draw ────────────────────────────────────────────────────

  private draw(ctx: CanvasRenderingContext2D, masterAlpha: number): void {
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalAlpha = masterAlpha;

    this.drawOuterGlow(ctx);
    this.drawFlameContour(ctx);
    this.drawInnerGlow(ctx);
    this.drawParticles(ctx);
    this.drawLightning(ctx);

    ctx.globalAlpha = 1;
    this.drawEdgeFade(ctx);
  }

  /** Soft-fade all drawn content to transparent near canvas edges using destination-in */
  private drawEdgeFade(ctx: CanvasRenderingContext2D): void {
    const rx = this.w * 0.5;
    const ry = this.h * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    const grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, Math.max(rx, ry));
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.75, 'rgba(0,0,0,1)');
    grad.addColorStop(0.92, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(this.cx, this.cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Layer 2 (outermost glow) — nearly invisible near body, concentrated at flame zone
  private drawOuterGlow(ctx: CanvasRenderingContext2D): void {
    const g = this.params.outerGlow;
    const pulse = 0.85 + 0.15 * Math.sin(this.time * 1.5);
    const r = Math.max(this.w, this.h) * g.radius * this.params.intensity;

    if (!this.outerGrad) {
      this.outerGrad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, r);
      this.outerGrad.addColorStop(0, g.color + '00');
      this.outerGrad.addColorStop(0.35, g.color + '00');
      this.outerGrad.addColorStop(0.55, g.color + '11');
      this.outerGrad.addColorStop(0.70, g.color + '55');
      this.outerGrad.addColorStop(0.82, g.color + '88');
      this.outerGrad.addColorStop(0.93, g.color + '33');
      this.outerGrad.addColorStop(1, g.color + '00');
    }

    ctx.save();
    ctx.globalAlpha *= g.intensity * pulse;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = this.outerGrad;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.restore();
  }

  // Layer 1 (inner glow) — dead zone at center, subtle ring further out
  private drawInnerGlow(ctx: CanvasRenderingContext2D): void {
    const g = this.params.innerGlow;
    const pulse = 0.8 + 0.2 * Math.sin(this.time * 2.5);
    const r = Math.min(this.w, this.h) * g.radius * this.params.intensity;

    if (!this.innerGrad) {
      this.innerGrad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, r);
      this.innerGrad.addColorStop(0, g.color + '00');
      this.innerGrad.addColorStop(0.40, g.color + '00');
      this.innerGrad.addColorStop(0.58, g.color + '22');
      this.innerGrad.addColorStop(0.72, g.color + '77');
      this.innerGrad.addColorStop(0.86, g.color + '44');
      this.innerGrad.addColorStop(1, g.color + '00');
    }

    ctx.save();
    ctx.globalAlpha *= g.intensity * pulse;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = this.innerGrad;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.restore();
  }

  // Generate jagged flame points at a given scale
  private buildFlamePoints(scaleMul: number): Array<{ x: number; y: number }> {
    const f = this.params.flameContour;
    const intensity = this.params.intensity;
    const baseW = this.w * 0.194 * f.thickness * intensity * scaleMul;
    const baseH = this.h * 0.219 * intensity * scaleMul;
    const flameH = baseH * f.height;
    const t = this.time * f.speed;
    const pointCount = MAX_FLAME_POINTS;
    const jagged = f.jaggedness;

    const sm = f.smoothness;
    // Dampen spike-valley amplitude when smoothness is high
    const spikeDampen = 1.0 - sm * 0.65;

    // Size compensation: jagged auras spike outward, smooth ones collapse inward.
    // Boost the base radius for smooth auras so the overall visual size stays consistent.
    // A jagged aura's average radius (spikes + valleys) is already large; a smooth one needs a boost.
    const sizeCompensation = 1.0 + sm * 0.25 * (1.0 - jagged * 0.5);
    const adjBaseW = baseW * sizeCompensation;
    const adjBaseH = baseH * sizeCompensation;
    const adjFlameH = flameH * sizeCompensation;

    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < pointCount; i++) {
      const frac = i / pointCount;
      const angle = frac * TAU;
      const degIdx = (frac * 360) | 0;

      const cosA = this.cos(degIdx);
      const sinA = this.sin(degIdx);

      const isTop = sinA < 0;
      const upBias = isTop ? 1.0 + Math.abs(sinA) * f.height * 1.3 : 1.0;

      const isSpike = i % 2 === 0;
      const spikeAmp = isSpike
        ? 1.0 + jagged * spikeDampen * (0.4 + 0.35 * Math.sin(t * 3.2 + this.flameOffsets[i]))
        : 1.0 - jagged * spikeDampen * (0.15 + 0.1 * Math.sin(t * 2.8 + this.flameOffsets[i] * 1.3));

      const n1 = Math.sin(t * 2.5 + this.flameOffsets[i] + angle * 4) * 0.2 * spikeDampen;
      const n2 = Math.sin(t * 5.0 + this.flameOffsets[i] * 2.1 + angle * 7) * 0.12 * jagged * spikeDampen;
      const noise = (n1 + n2) * upBias;

      const rx = adjBaseW * spikeAmp * (1 + noise * 0.5) * upBias;
      const ry = (isTop ? adjFlameH : adjBaseH * 0.65) * spikeAmp * (1 + noise * 0.3);

      points.push({
        x: this.cx + cosA * rx,
        y: this.cy + sinA * ry,
      });
    }
    return points;
  }

  // Layer 3: flame contour with dynamic glowing band between inner and outer borders
  private drawFlameContour(ctx: CanvasRenderingContext2D): void {
    const f = this.params.flameContour;

    // Outer border (the main flame shape)
    const outerPts = this.buildFlamePoints(1.0);
    // Inner border (~60% of outer, creates a thick glowing band between them)
    const innerPts = this.buildFlamePoints(0.6);

    // Dynamic glowing gradient band between the two borders
    this.drawFlameBand(ctx, outerPts, innerPts, f.baseColor, f.tipColor);

    // Dual layer if enabled
    if (f.dualLayer && f.dualColor) {
      this.drawFlameShape(ctx, outerPts, f.dualColor, f.baseColor, 1.15, 0.35);
    }

    // Main outer flame shape
    this.drawFlameShape(ctx, outerPts, f.baseColor, f.tipColor, 1.0, 0.8);

    // Inner border stroke for the "double border" look
    this.drawFlameInnerBorder(ctx, innerPts, f.baseColor, f.tipColor);
  }

  // Thick glowing band filling the space between outer and inner flame borders
  private drawFlameBand(
    ctx: CanvasRenderingContext2D,
    outerPts: Array<{ x: number; y: number }>,
    innerPts: Array<{ x: number; y: number }>,
    baseColor: string,
    tipColor: string,
  ): void {
    if (outerPts.length < 3) return;

    ctx.save();

    // Clip to outer shape
    this.buildFlamePath(ctx, outerPts);
    ctx.clip();

    // Animated gradient that pulses through the band
    const phase = this.time * 1.8;
    const bandR = Math.max(this.w, this.h) * 0.4 * this.params.intensity;
    const grad = ctx.createRadialGradient(this.cx, this.cy, bandR * 0.3, this.cx, this.cy, bandR);

    const pulseA = 0.5 + 0.45 * Math.sin(phase);
    const pulseB = 0.5 + 0.45 * Math.sin(phase + 2.1);
    const alphaA = Math.round(pulseA * 220).toString(16).padStart(2, '0');
    const alphaB = Math.round(pulseB * 200).toString(16).padStart(2, '0');

    grad.addColorStop(0, baseColor + '00');
    grad.addColorStop(0.2, baseColor + alphaA);
    grad.addColorStop(0.5, tipColor + alphaB);
    grad.addColorStop(0.75, tipColor + alphaA);
    grad.addColorStop(0.9, '#FFFFFF' + Math.round(pulseA * 100).toString(16).padStart(2, '0'));
    grad.addColorStop(1, baseColor + '44');

    ctx.globalAlpha = 0.75;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);

    // Cut out the inner region so band only shows between borders
    ctx.globalCompositeOperation = 'destination-out';
    this.buildFlamePath(ctx, innerPts);
    ctx.globalAlpha = 0.9;
    ctx.fill();

    ctx.restore();
  }

  // Glowing inner border line
  private drawFlameInnerBorder(
    ctx: CanvasRenderingContext2D,
    pts: Array<{ x: number; y: number }>,
    baseColor: string,
    tipColor: string,
  ): void {
    if (pts.length < 3) return;
    const sm = this.params.flameContour.smoothness;

    ctx.save();
    this.buildFlamePath(ctx, pts);

    const pulse = 0.5 + 0.35 * Math.sin(this.time * 2.0);
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = tipColor + 'BB';
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2;
    ctx.lineJoin = sm > 0.5 ? 'round' : 'miter';
    ctx.miterLimit = 10;
    ctx.stroke();

    // White core on the inner border
    this.buildFlamePath(ctx, pts);
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF44';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.restore();
  }

  // Build a closed flame path using smoothness to blend sharp ↔ smooth.
  // s=0: direct lineTo (jagged spikes), s=1: full cubic Catmull-Rom (flowing organic).
  // Intermediate values blend linearly between the angular and smooth paths.
  private buildFlamePath(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
  ): void {
    const len = points.length;
    const s = this.params.flameContour.smoothness;

    ctx.beginPath();

    if (s < 0.05) {
      // Fully sharp — direct line segments
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < len; i++) ctx.lineTo(points[i].x, points[i].y);
    } else if (s > 0.6) {
      // Smooth — Catmull-Rom spline through all points for organic curves
      const first = points[0], second = points[1];
      ctx.moveTo((first.x + second.x) / 2, (first.y + second.y) / 2);
      for (let i = 0; i < len; i++) {
        const curr = points[i];
        const next = points[(i + 1) % len];
        ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
      }
    } else {
      // Blend: deterministically smooth valley points, keep spike points sharp.
      // Every other point (valleys) uses quadratic curves; spikes use lineTo.
      // The smoothness value controls what fraction of points get curved treatment.
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < len; i++) {
        const curr = points[i];
        const isValley = i % 2 !== 0;
        // Deterministic: smooth valley points when s > threshold for this point
        const pointPhase = (i * 7 + 3) % len / len; // stable hash per point index
        if (isValley && pointPhase < s * 1.6) {
          const next = points[(i + 1) % len];
          ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
        } else {
          ctx.lineTo(curr.x, curr.y);
        }
      }
    }

    ctx.closePath();
  }

  private drawFlameShape(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    baseColor: string,
    tipColor: string,
    scale: number,
    baseAlpha: number,
  ): void {
    const len = points.length;
    if (len < 3) return;

    ctx.save();

    if (scale !== 1.0) {
      ctx.translate(this.cx, this.cy);
      ctx.scale(scale, scale);
      ctx.translate(-this.cx, -this.cy);
    }

    const sm = this.params.flameContour.smoothness;

    // Hollow center: fully transparent where the character stands,
    // then a hard ramp to opaque at the outer flame edges
    const flameR = Math.max(this.w, this.h) * 0.38 * this.params.intensity;
    const hollowGrad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, flameR);
    hollowGrad.addColorStop(0, baseColor + '00');
    hollowGrad.addColorStop(0.35, baseColor + '00');
    hollowGrad.addColorStop(0.50, baseColor + '15');
    hollowGrad.addColorStop(0.62, baseColor + '66');
    hollowGrad.addColorStop(0.74, baseColor + 'CC');
    hollowGrad.addColorStop(0.85, tipColor + 'FF');
    hollowGrad.addColorStop(1, tipColor + 'EE');

    ctx.globalAlpha *= baseAlpha;

    // Main fill with hollow center
    this.buildFlamePath(ctx, points);
    ctx.fillStyle = hollowGrad;
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 35 * this.params.intensity;
    ctx.fill();

    // Bright edge stroke
    this.buildFlamePath(ctx, points);
    ctx.shadowBlur = 25;
    ctx.shadowColor = tipColor;
    ctx.strokeStyle = tipColor + 'CC';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = sm > 0.5 ? 'round' : 'miter';
    ctx.miterLimit = 12;
    ctx.stroke();

    // White-hot core edge for intensity
    this.buildFlamePath(ctx, points);
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF66';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  // Layer 4: floating particles (generic + themed shapes)
  private drawParticles(ctx: CanvasRenderingContext2D): void {
    const p = this.params.particles;
    const shapes = p.shapes;

    ctx.save();
    for (const pt of this.particles) {
      if (!pt.active || pt.alpha <= 0) continue;

      ctx.globalAlpha = pt.alpha * 0.9;
      const color = (pt.useSecondary && p.secondaryColor) ? p.secondaryColor : p.color;

      // Custom AI-generated path particle (highest priority)
      if (pt.customPathIdx >= 0 && this.customPath2Ds[pt.customPathIdx]) {
        drawCustomSVGPath(ctx, this.customPath2Ds[pt.customPathIdx], pt.x, pt.y, pt.size, pt.rotation, color);
        continue;
      }

      // Library themed shape particle
      if (pt.shapeIdx >= 0 && shapes && shapes[pt.shapeIdx]) {
        const shapeId = shapes[pt.shapeIdx];
        if (SHAPE_REGISTRY[shapeId]) {
          drawThemedShape(ctx, shapeId, pt.x, pt.y, pt.size, pt.rotation, color);
          continue;
        }
      }

      // Generic particle style
      switch (p.style) {
        case 'ember':
          this.drawEmber(ctx, pt, color);
          break;
        case 'sparkle':
          this.drawSparkle(ctx, pt, color);
          break;
        case 'debris':
          this.drawDebris(ctx, pt, color);
          break;
        case 'orb':
          this.drawOrb(ctx, pt, color);
          break;
        case 'bubble':
          this.drawBubble(ctx, pt, color);
          break;
        case 'lightning':
          this.drawEmber(ctx, pt, color);
          break;
        default:
          this.drawEmber(ctx, pt, color);
      }
    }
    ctx.restore();
  }

  private drawEmber(ctx: CanvasRenderingContext2D, pt: Particle, color: string): void {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, TAU);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = pt.size * 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawSparkle(ctx: CanvasRenderingContext2D, pt: Particle, color: string): void {
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.rotation);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = pt.size * 3;
    // 4-point star: two thin crossed rects
    const s = pt.size;
    ctx.fillRect(-s * 2, -s * 0.3, s * 4, s * 0.6);
    ctx.fillRect(-s * 0.3, -s * 2, s * 0.6, s * 4);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawDebris(ctx: CanvasRenderingContext2D, pt: Particle, color: string): void {
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.rotation);
    ctx.fillStyle = color;
    ctx.fillRect(-pt.size, -pt.size * 0.6, pt.size * 2, pt.size * 1.2);
    ctx.restore();
  }

  private drawOrb(ctx: CanvasRenderingContext2D, pt: Particle, color: string): void {
    const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.size * 2);
    grad.addColorStop(0, color + 'CC');
    grad.addColorStop(0.5, color + '66');
    grad.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * 2, 0, TAU);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  private drawBubble(ctx: CanvasRenderingContext2D, pt: Particle, color: string): void {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * 1.5, 0, TAU);
    ctx.strokeStyle = color + 'AA';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Highlight dot
    ctx.beginPath();
    ctx.arc(pt.x - pt.size * 0.3, pt.y - pt.size * 0.3, pt.size * 0.3, 0, TAU);
    ctx.fillStyle = '#FFFFFF88';
    ctx.fill();
  }

  // Lightning overlay
  private drawLightning(ctx: CanvasRenderingContext2D): void {
    if (!this.params.lightning.enabled) return;

    ctx.save();
    for (const bolt of this.bolts) {
      if (bolt.alpha <= 0) continue;

      ctx.globalAlpha = bolt.alpha * 0.9;
      ctx.strokeStyle = this.params.lightning.color;
      ctx.shadowColor = this.params.lightning.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(this.cx, this.cy);
      for (const seg of bolt.segments) {
        ctx.lineTo(seg.x, seg.y);
      }
      ctx.stroke();

      // Bright core
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#FFFFFF';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(this.cx, this.cy);
      for (const seg of bolt.segments) {
        ctx.lineTo(seg.x, seg.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

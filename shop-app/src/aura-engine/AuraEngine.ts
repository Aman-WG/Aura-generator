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
    const isNewAura = !this.params ||
      params.flameContour.baseColor !== this.params.flameContour.baseColor;
    this.params = params;
    this.innerGrad = null;
    this.outerGrad = null;
    if (isNewAura) {
      this.resetParticles();
      this.buildCustomPaths();
    }
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
        useSecondary: false, shapeIdx: -1, elementalShapeIdx: -1, customPathIdx: -1, emojiIdx: -1,
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

    // Approximate outer flame edge radius — matches buildFlamePoints
    const sm = f.smoothness;
    const sizeComp = 1.0 + sm * 0.25 * (1.0 - f.jaggedness * 0.5);
    const auraRx = Math.min(this.w * 0.22 * f.thickness * intensity * sizeComp * (1 + f.jaggedness * 0.4), this.w * 0.30);
    const auraRy = Math.min(this.h * 0.24 * intensity * sizeComp * f.height * (1 + f.jaggedness * 0.4), this.h * 0.32);
    // Kill distance: at the aura edge (particles must not escape)
    const killRx = auraRx * 1.15;
    const killRy = auraRy * 1.15;

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

        // Distance-based fade: smooth fade starting at 60% of aura edge, dead at 100%
        const dx = pt.x - this.cx;
        const dy = pt.y - this.cy;
        const dist = Math.sqrt((dx * dx) / (killRx * killRx) + (dy * dy) / (killRy * killRy));
        if (dist > 1.0) {
          pt.active = false;
          continue;
        }
        // Fade begins at 60% of aura boundary → fully faded at 100%
        const fadeStart = 0.55;
        if (dist > fadeStart) {
          const t = (dist - fadeStart) / (1.0 - fadeStart);
          alpha *= 1.0 - t * t;
        }

        pt.alpha = alpha;

        // HEAVY physics-driven particle movement — exaggerated per pattern
        const ef = this.params.energyFlow;
        const pattern = ef?.pattern ?? 'radial-out';

        const pdx = pt.x - this.cx;
        const pdy = pt.y - this.cy;
        const pAngle = Math.atan2(pdy, pdx);
        const pDist = Math.sqrt(pdx * pdx + pdy * pdy) + 1;
        const normDx = pdx / pDist;
        const normDy = pdy / pDist;

        switch (pattern) {
          case 'spiral': {
            // Strong tangential + slight outward = visible vortex spin
            const tangX = Math.cos(pAngle + Math.PI * 0.5);
            const tangY = Math.sin(pAngle + Math.PI * 0.5);
            pt.vx += tangX * 0.55 + normDx * 0.08;
            pt.vy += tangY * 0.55 + normDy * 0.08;
            pt.rotation += 2.5 * dt;
            break;
          }
          case 'rise': {
            pt.vy -= 0.7;
            pt.vx += (Math.random() - 0.5) * 0.15;
            pt.vx *= 0.92;
            break;
          }
          case 'radial-out': {
            pt.vx += normDx * 0.45;
            pt.vy += normDy * 0.45;
            break;
          }
          case 'radial-in': {
            pt.vx -= normDx * 0.4;
            pt.vy -= normDy * 0.4;
            // Orbit slightly to avoid collapsing to a point
            pt.vx += Math.cos(pAngle + Math.PI * 0.5) * 0.1;
            pt.vy += Math.sin(pAngle + Math.PI * 0.5) * 0.1;
            break;
          }
          case 'cascade': {
            pt.vy += 0.6;
            pt.vx += Math.sin(this.time * 3 + pt.x * 0.02) * 0.15;
            break;
          }
          case 'pulse': {
            const breath = Math.sin(this.time * 3.0);
            const pulseF = breath * 0.6;
            pt.vx += normDx * pulseF;
            pt.vy += normDy * pulseF;
            break;
          }
          case 'zigzag': {
            const zig = Math.sin(this.time * 5 + pt.y * 0.04);
            pt.vx += zig * 0.7;
            pt.vy -= 0.35;
            break;
          }
          case 'wave': {
            const w = Math.sin(this.time * 2.5 + pt.y * 0.03);
            pt.vx += w * 0.55;
            pt.vy += Math.cos(this.time * 1.5 + pt.x * 0.02) * 0.15;
            break;
          }
        }

        // Damping — enough to keep control but not kill the motion
        pt.vx *= 0.94;
        pt.vy *= 0.94;

        pt.x += pt.vx * dt * speed * 25;
        pt.y += pt.vy * dt * speed * 25;
        pt.rotation += pt.rotationSpeed * dt;
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
    pt.elementalShapeIdx = -1;
    pt.customPathIdx = -1;
    pt.emojiIdx = -1;

    const shapes = p.shapes;
    const elemental = p.elementalShapes;
    const heroEmoji = p.heroEmoji;
    const hasEmoji = heroEmoji && heroEmoji.length >= 2;
    const hasShapes = shapes && shapes.length > 0;
    const hasElemental = elemental && elemental.length > 0;
    const hasCustom = this.customPath2Ds.length > 0;
    const roll = Math.random();

    // Emoji-first: emoji (55%) → custom SVG (10%) → elemental (15%) → thematic (10%) → generic (10%)
    const emojiEnd = hasEmoji ? 0.55 : 0;
    const customEnd = emojiEnd + (hasCustom ? 0.10 : 0);
    const elementalEnd = customEnd + (hasElemental ? 0.15 : 0);
    const thematicEnd = elementalEnd + (hasShapes ? 0.10 : 0);

    if (roll < emojiEnd) {
      pt.emojiIdx = Math.floor(Math.random() * 2);
      pt.size = p.size * (7.0 + Math.random() * 4.0);
      pt.maxLife = 4.5 + Math.random() * 3.0;
      pt.rotationSpeed = (Math.random() - 0.5) * 0.08;
    } else if (roll < customEnd) {
      pt.customPathIdx = Math.floor(Math.random() * this.customPath2Ds.length);
      pt.size = p.size * (6.0 + Math.random() * 4.0);
      pt.maxLife = 3.5 + Math.random() * 2.5;
      pt.rotationSpeed = (Math.random() - 0.5) * 0.15;
    } else if (roll < elementalEnd) {
      pt.elementalShapeIdx = Math.floor(Math.random() * elemental!.length);
      pt.size = p.size * (1.5 + Math.random() * 1.5);
      pt.maxLife = 1.5 + Math.random() * 1.5;
      pt.rotationSpeed = (Math.random() - 0.5) * 1.5;
    } else if (roll < thematicEnd) {
      pt.shapeIdx = Math.floor(Math.random() * shapes!.length);
      pt.size = p.size * (2.5 + Math.random() * 2.0);
      pt.maxLife = 2.0 + Math.random() * 2.0;
      pt.rotationSpeed = (Math.random() - 0.5) * 0.8;
    } else {
      pt.size = p.size * (0.5 + Math.random() * 0.6);
      pt.maxLife = 1.2 + Math.random() * 2.0;
      pt.rotationSpeed = (Math.random() - 0.5) * 2;
    }
    pt.life = pt.maxLife;

    // Spawn position & initial velocity driven by the PHYSICS MODE, not by AI drift
    const physPattern = this.params.energyFlow?.pattern ?? 'radial-out';

    switch (physPattern) {
      case 'spiral': {
        const a = Math.random() * TAU;
        const r = 15 + Math.random() * spread * 0.35;
        pt.x = this.cx + Math.cos(a) * r;
        pt.y = this.cy + Math.sin(a) * r;
        pt.vx = Math.cos(a + Math.PI * 0.5) * 2.0;
        pt.vy = Math.sin(a + Math.PI * 0.5) * 2.0;
        break;
      }
      case 'rise': {
        pt.x = this.cx + (Math.random() - 0.5) * spread * 0.8;
        pt.y = this.cy + spread * 0.2 + Math.random() * spread * 0.15;
        pt.vx = (Math.random() - 0.5) * 0.4;
        pt.vy = -(2.5 + Math.random() * 2.0);
        break;
      }
      case 'radial-out': {
        const a = Math.random() * TAU;
        const r = 10 + Math.random() * 20;
        pt.x = this.cx + Math.cos(a) * r;
        pt.y = this.cy + Math.sin(a) * r;
        const spd = 2.0 + Math.random() * 2.5;
        pt.vx = Math.cos(a) * spd;
        pt.vy = Math.sin(a) * spd;
        break;
      }
      case 'radial-in': {
        const a = Math.random() * TAU;
        const r = spread * 0.6 + Math.random() * spread * 0.3;
        pt.x = this.cx + Math.cos(a) * r;
        pt.y = this.cy + Math.sin(a) * r;
        const spd = 1.5 + Math.random() * 1.5;
        pt.vx = -Math.cos(a) * spd;
        pt.vy = -Math.sin(a) * spd;
        break;
      }
      case 'cascade': {
        pt.x = this.cx + (Math.random() - 0.5) * spread * 0.8;
        pt.y = this.cy - spread * 0.3 - Math.random() * spread * 0.15;
        pt.vx = (Math.random() - 0.5) * 0.5;
        pt.vy = 1.5 + Math.random() * 2.5;
        break;
      }
      case 'pulse': {
        const a = Math.random() * TAU;
        const r = 15 + Math.random() * spread * 0.3;
        pt.x = this.cx + Math.cos(a) * r;
        pt.y = this.cy + Math.sin(a) * r;
        pt.vx = 0;
        pt.vy = 0;
        break;
      }
      case 'zigzag': {
        pt.x = this.cx + (Math.random() - 0.5) * spread * 0.6;
        pt.y = this.cy + spread * 0.15 + Math.random() * spread * 0.1;
        pt.vx = (Math.random() > 0.5 ? 2.0 : -2.0) + (Math.random() - 0.5);
        pt.vy = -(1.5 + Math.random() * 1.5);
        break;
      }
      case 'wave': {
        pt.x = this.cx + (Math.random() - 0.5) * spread;
        pt.y = this.cy + (Math.random() - 0.5) * spread * 0.5;
        pt.vx = Math.sin(this.time + pt.y * 0.05) * 2.0;
        pt.vy = (Math.random() - 0.5) * 0.8;
        break;
      }
      default: {
        pt.x = this.cx + (Math.random() - 0.5) * spread;
        pt.y = this.cy + (Math.random() - 0.5) * this.h * 0.3;
        pt.vx = (Math.random() - 0.5) * 0.6;
        pt.vy = -(0.3 + Math.random() * 0.8);
        break;
      }
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
    this.drawEnergyFlow(ctx);
    this.drawInnerGlow(ctx);
    this.drawParticles(ctx);
    this.drawLightning(ctx);

    // Soft radial vignette: fade everything to zero before reaching canvas edges.
    // This eliminates any hard rectangular clip at the canvas boundary.
    this.drawVignette(ctx);
  }

  /**
   * Radial vignette using destination-in compositing.
   * Draws an elliptical alpha mask that is fully opaque in the center
   * and fades to zero at ~85% canvas radius, guaranteeing no visible
   * content touches the canvas edge.
   */
  private drawVignette(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.globalAlpha = 1.0;
    // Large enough that the flame contour (max 0.32h) is fully inside the opaque zone.
    // Fade only catches glow bleed near canvas edges, never the flame tips.
    const rx = this.w * 0.70;
    const ry = this.h * 0.70;
    const grad = ctx.createRadialGradient(
      this.cx, this.cy, 0,
      this.cx, this.cy, Math.max(rx, ry),
    );
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.72, '#FFFFFF');
    grad.addColorStop(0.86, 'rgba(255,255,255,0.5)');
    grad.addColorStop(0.95, 'rgba(255,255,255,0.1)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(this.cx, this.cy, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Animated energy flow — a moving color band inside the aura body.
   * Uses source-atop compositing so it only shows where content already exists.
   */
  private drawEnergyFlow(ctx: CanvasRenderingContext2D): void {
    const ef = this.params.energyFlow;
    if (!ef || ef.intensity <= 0) return;

    const t = this.time * ef.speed;
    const r = Math.min(this.w, this.h) * 0.35 * this.params.intensity;
    const baseColor = this.params.flameContour.baseColor;
    const tipColor = this.params.flameContour.tipColor;

    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = ef.intensity * 0.8;

    let grad: CanvasGradient;

    switch (ef.pattern) {
      case 'rise': {
        const phase = ((t * 0.8) % 1.0 + 1.0) % 1.0;
        grad = ctx.createLinearGradient(this.cx, this.cy + r, this.cx, this.cy - r);
        const bandW = 0.3;
        const lo = Math.max(0, phase - bandW);
        const hi = Math.min(1, phase + bandW);
        grad.addColorStop(0, baseColor + '00');
        if (lo > 0.01) grad.addColorStop(lo, baseColor + '00');
        grad.addColorStop(Math.min(phase, 0.99), tipColor + 'EE');
        if (hi < 0.99) grad.addColorStop(hi, baseColor + '00');
        grad.addColorStop(1, baseColor + '00');
        break;
      }

      case 'cascade': {
        const phase = ((t * 0.8) % 1.0 + 1.0) % 1.0;
        grad = ctx.createLinearGradient(this.cx, this.cy - r, this.cx, this.cy + r);
        const bandW = 0.3;
        const lo = Math.max(0, phase - bandW);
        const hi = Math.min(1, phase + bandW);
        grad.addColorStop(0, baseColor + '00');
        if (lo > 0.01) grad.addColorStop(lo, baseColor + '00');
        grad.addColorStop(Math.min(phase, 0.99), tipColor + 'EE');
        if (hi < 0.99) grad.addColorStop(hi, baseColor + '00');
        grad.addColorStop(1, baseColor + '00');
        break;
      }

      case 'radial-out': {
        const phase = ((t * 0.7) % 1.0 + 1.0) % 1.0;
        grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, r);
        const bandW = 0.25;
        const lo = Math.max(0, phase - bandW);
        const hi = Math.min(1, phase + bandW);
        grad.addColorStop(0, baseColor + '00');
        if (lo > 0.01) grad.addColorStop(lo, baseColor + '00');
        grad.addColorStop(phase, tipColor + 'EE');
        if (hi < 0.99) grad.addColorStop(hi, baseColor + '00');
        grad.addColorStop(1, baseColor + '00');
        break;
      }

      case 'radial-in': {
        const phase = 1.0 - (((t * 0.7) % 1.0 + 1.0) % 1.0);
        grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, r);
        const bandW = 0.25;
        const lo = Math.max(0, phase - bandW);
        const hi = Math.min(1, phase + bandW);
        grad.addColorStop(0, baseColor + '00');
        if (lo > 0.01) grad.addColorStop(lo, baseColor + '00');
        grad.addColorStop(Math.max(0.01, phase), tipColor + 'EE');
        if (hi < 0.99) grad.addColorStop(hi, baseColor + '00');
        grad.addColorStop(1, baseColor + '00');
        break;
      }

      case 'pulse': {
        const breath = 0.5 + 0.5 * Math.sin(t * Math.PI * 1.5);
        grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, r);
        const a = Math.round(breath * 240).toString(16).padStart(2, '0');
        grad.addColorStop(0, tipColor + '00');
        grad.addColorStop(0.25, tipColor + a);
        grad.addColorStop(0.55, baseColor + a);
        grad.addColorStop(0.80, baseColor + Math.round(breath * 120).toString(16).padStart(2, '0'));
        grad.addColorStop(1, baseColor + '00');
        break;
      }

      case 'spiral': {
        const angle = t * 2.5;
        const offset = r * 0.45;
        const ox = this.cx + Math.cos(angle) * offset;
        const oy = this.cy + Math.sin(angle) * offset;
        grad = ctx.createRadialGradient(ox, oy, 0, this.cx, this.cy, r);
        grad.addColorStop(0, tipColor + 'EE');
        grad.addColorStop(0.25, tipColor + 'AA');
        grad.addColorStop(0.5, baseColor + '55');
        grad.addColorStop(1, baseColor + '00');
        break;
      }

      case 'zigzag': {
        const cycle = (t * 0.7) % 2.0;
        const goingRight = cycle < 1.0;
        const phase = goingRight ? cycle : 2.0 - cycle;
        const xOff = (phase - 0.5) * r * 1.5;
        grad = ctx.createLinearGradient(
          this.cx + xOff - r * 0.4, this.cy + r,
          this.cx + xOff + r * 0.4, this.cy - r,
        );
        const bandW = 0.28;
        const mid = ((t * 0.8) % 1.0 + 1.0) % 1.0;
        const lo = Math.max(0, mid - bandW);
        const hi = Math.min(1, mid + bandW);
        grad.addColorStop(0, baseColor + '00');
        if (lo > 0.01) grad.addColorStop(lo, baseColor + '00');
        grad.addColorStop(Math.min(mid, 0.99), tipColor + 'EE');
        if (hi < 0.99) grad.addColorStop(hi, baseColor + '00');
        grad.addColorStop(1, baseColor + '00');
        break;
      }

      case 'wave': {
        const waveX = Math.sin(t * 2.0) * r * 0.5;
        const waveY = Math.cos(t * 1.2) * r * 0.25;
        const ox2 = this.cx + waveX;
        const oy2 = this.cy + waveY;
        grad = ctx.createRadialGradient(ox2, oy2, 0, this.cx, this.cy, r);
        grad.addColorStop(0, tipColor + 'DD');
        grad.addColorStop(0.2, tipColor + '99');
        grad.addColorStop(0.45, baseColor + '44');
        grad.addColorStop(1, baseColor + '00');
        break;
      }

      default: {
        ctx.restore();
        return;
      }
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.restore();
  }

  // Layer 2 (outermost glow) — nearly invisible near body, concentrated at flame zone
  private drawOuterGlow(ctx: CanvasRenderingContext2D): void {
    const g = this.params.outerGlow;
    const pulse = 0.85 + 0.15 * Math.sin(this.time * 1.5);
    // Cap glow radius to stay within the vignette safe zone
    const r = Math.min(Math.max(this.w, this.h) * g.radius * this.params.intensity, Math.min(this.w, this.h) * 0.42);

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
    const r = Math.min(Math.min(this.w, this.h) * g.radius * this.params.intensity, Math.min(this.w, this.h) * 0.38);

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

  // Generate jagged flame points at a given scale — elliptical base, ~200% character
  private buildFlamePoints(scaleMul: number): Array<{ x: number; y: number }> {
    const f = this.params.flameContour;
    const intensity = this.params.intensity;
    // Target: aura contour at roughly 200% of character body.
    // Character ≈ 23% of canvas width, so aura half-width ≈ 0.23 × canvas.
    // With thickness=1, intensity=1 this yields ~200% char scale.
    const baseW = this.w * 0.22 * f.thickness * intensity * scaleMul;
    const baseH = this.h * 0.24 * intensity * scaleMul;
    const flameH = baseH * f.height;
    const t = this.time * f.speed;
    const pointCount = MAX_FLAME_POINTS;
    const jagged = f.jaggedness;

    const sm = f.smoothness;
    const spikeDampen = 1.0 - sm * 0.65;

    const sizeCompensation = 1.0 + sm * 0.25 * (1.0 - jagged * 0.5);
    const adjBaseW = baseW * sizeCompensation;
    const adjBaseH = baseH * sizeCompensation;
    const adjFlameH = flameH * sizeCompensation;

    // Soft ceiling: compress points that exceed 250% of character scale
    // instead of hard-clamping (which flattens spikes at the top).
    const softCeilRx = this.w * 0.28;
    const softCeilRy = this.h * 0.30;
    const hardCeilRx = this.w * 0.36;
    const hardCeilRy = this.h * 0.38;

    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < pointCount; i++) {
      const frac = i / pointCount;
      const angle = frac * TAU;
      const degIdx = (frac * 360) | 0;

      const cosA = this.cos(degIdx);
      const sinA = this.sin(degIdx);

      // ── Conical flame shape: wide+flat at bottom, tapering to a peak at top ──
      const isTop = sinA < 0;

      // vertPos: 0 = top peak, 1 = bottom base
      const vertPos = (sinA + 1) / 2;

      // Conical taper: horizontal width narrows toward the top
      // Bottom (vertPos=1) → full width, Top (vertPos=0) → 35% width
      const conicalTaper = 0.35 + vertPos * 0.65;

      // Upward extension: top points reach much higher (gives the conical peak)
      const upBias = isTop ? 1.0 + Math.abs(sinA) * f.height * 1.1 : 1.0;

      // Bottom flattening: compress vertical extent at the bottom
      const bottomFlatten = !isTop ? 0.5 + (1.0 - sinA) * 0.25 : 1.0;

      const isSpike = i % 2 === 0;
      const spikeAmp = isSpike
        ? 1.0 + jagged * spikeDampen * (0.3 + 0.25 * Math.sin(t * 3.2 + this.flameOffsets[i]))
        : 1.0 - jagged * spikeDampen * (0.12 + 0.08 * Math.sin(t * 2.8 + this.flameOffsets[i] * 1.3));

      const n1 = Math.sin(t * 2.5 + this.flameOffsets[i] + angle * 4) * 0.15 * spikeDampen;
      const n2 = Math.sin(t * 5.0 + this.flameOffsets[i] * 2.1 + angle * 7) * 0.09 * jagged * spikeDampen;
      const noise = (n1 + n2) * upBias;

      let rx = adjBaseW * conicalTaper * spikeAmp * (1 + noise * 0.4) * upBias;
      let ry = (isTop ? adjFlameH : adjBaseH * bottomFlatten) * spikeAmp * (1 + noise * 0.25);

      // Physics-driven contour deformation — makes the aura shape visibly move
      const phys = this.params.energyFlow?.pattern ?? 'radial-out';
      switch (phys) {
        case 'spiral': {
          // Rotate the whole contour over time — visible spinning
          const rotOff = t * 1.8;
          const rotAngle = angle + rotOff;
          const rIdx = ((rotAngle / TAU * 360 + 360) % 360) | 0;
          const rCos = this.cos(rIdx);
          const rSin = this.sin(rIdx);
          rx = this.softCeil(rx, softCeilRx, hardCeilRx);
          ry = this.softCeil(ry, softCeilRy, hardCeilRy);
          points.push({ x: this.cx + rCos * rx, y: this.cy + rSin * ry });
          continue;
        }
        case 'rise': {
          const liftBias = isTop ? 1.0 + 0.25 * Math.sin(t * 2) : 0.8 - 0.15 * Math.sin(t * 2);
          ry *= liftBias;
          break;
        }
        case 'radial-out': {
          const outPulse = 1.0 + 0.12 * Math.sin(t * 3.0 + angle * 2);
          rx *= outPulse;
          ry *= outPulse;
          break;
        }
        case 'radial-in': {
          const inPulse = 1.0 - 0.15 * Math.sin(t * 3.0 + angle * 2);
          rx *= inPulse;
          ry *= inPulse;
          break;
        }
        case 'cascade': {
          const fallBias = isTop ? 0.8 - 0.12 * Math.sin(t * 2) : 1.0 + 0.3 * Math.sin(t * 2);
          ry *= fallBias;
          break;
        }
        case 'pulse': {
          const breath = 1.0 + 0.2 * Math.sin(t * 2.8);
          rx *= breath;
          ry *= breath;
          break;
        }
        case 'zigzag': {
          const wobble = Math.sin(t * 4 + sinA * 6) * 0.12;
          rx *= (1.0 + wobble);
          break;
        }
        case 'wave': {
          const wDisp = Math.sin(t * 2.0 + sinA * 5) * adjBaseW * 0.15;
          rx = this.softCeil(rx, softCeilRx, hardCeilRx);
          ry = this.softCeil(ry, softCeilRy, hardCeilRy);
          points.push({ x: this.cx + cosA * rx + wDisp, y: this.cy + sinA * ry });
          continue;
        }
      }

      // Soft compress: preserves relative spike/valley differences even past the soft limit
      rx = this.softCeil(rx, softCeilRx, hardCeilRx);
      ry = this.softCeil(ry, softCeilRy, hardCeilRy);

      points.push({
        x: this.cx + cosA * rx,
        y: this.cy + sinA * ry,
      });
    }
    return points;
  }

  /**
   * Soft ceiling: below `soft` → unchanged; above `soft` → compressed toward `hard`.
   * Preserves relative differences between spikes instead of flattening them.
   */
  private softCeil(v: number, soft: number, hard: number): number {
    if (v <= soft) return v;
    const excess = v - soft;
    const range = hard - soft;
    // Asymptotic compression: excess is squeezed logarithmically into remaining range
    return soft + range * (1 - Math.exp(-excess / range));
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
    const bandR = Math.min(this.w, this.h) * 0.35 * this.params.intensity;
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
    const flameR = Math.min(this.w, this.h) * 0.34 * this.params.intensity;
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

  // Layer 4: floating particles (thematic + elemental + custom + generic)
  private drawParticles(ctx: CanvasRenderingContext2D): void {
    const p = this.params.particles;
    const shapes = p.shapes;
    const elemental = p.elementalShapes;

    ctx.save();
    for (const pt of this.particles) {
      if (!pt.active || pt.alpha <= 0) continue;

      const color = (pt.useSecondary && p.secondaryColor) ? p.secondaryColor : p.color;
      const heroEmoji = p.heroEmoji;

      // HERO: Emoji particle — instantly recognizable, large, glowing
      if (pt.emojiIdx >= 0 && heroEmoji && heroEmoji[pt.emojiIdx]) {
        ctx.globalAlpha = pt.alpha;
        this.drawEmojiParticle(ctx, heroEmoji[pt.emojiIdx], pt.x, pt.y, pt.size, pt.rotation, color);
        continue;
      }

      // Secondary: Custom AI-generated path particle
      if (pt.customPathIdx >= 0 && this.customPath2Ds[pt.customPathIdx]) {
        ctx.globalAlpha = pt.alpha * 0.9;
        drawCustomSVGPath(ctx, this.customPath2Ds[pt.customPathIdx], pt.x, pt.y, pt.size, pt.rotation, color);
        continue;
      }

      ctx.globalAlpha = pt.alpha * 0.7;

      // Thematic library shape (small ambient icons)
      if (pt.shapeIdx >= 0 && shapes && shapes[pt.shapeIdx]) {
        const shapeId = shapes[pt.shapeIdx];
        if (SHAPE_REGISTRY[shapeId]) {
          drawThemedShape(ctx, shapeId, pt.x, pt.y, pt.size, pt.rotation, color);
          continue;
        }
      }

      // Elemental library shape (tiny ambient effects)
      if (pt.elementalShapeIdx >= 0 && elemental && elemental[pt.elementalShapeIdx]) {
        const shapeId = elemental[pt.elementalShapeIdx];
        if (SHAPE_REGISTRY[shapeId]) {
          drawThemedShape(ctx, shapeId, pt.x, pt.y, pt.size, pt.rotation, color);
          continue;
        }
      }

      // Generic particle style fallback
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

  private drawEmojiParticle(
    ctx: CanvasRenderingContext2D,
    emoji: string,
    x: number,
    y: number,
    size: number,
    rotation: number,
    glowColor: string,
  ): void {
    const fontSize = size * 2.2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Colored glow behind the emoji
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = size * 3;

    ctx.font = `${fontSize}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // First pass: glow only (draw twice for stronger glow)
    ctx.fillText(emoji, 0, 0);
    ctx.fillText(emoji, 0, 0);

    // Second pass: crisp emoji on top (reduced shadow)
    ctx.shadowBlur = size;
    ctx.fillText(emoji, 0, 0);

    ctx.shadowBlur = 0;
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

// Ported from AuraTest-sainath FlameContourRenderer (AuraStudio.jsx lines 165-477)

import type { OuterShapeConfig } from './types';

const TAU = Math.PI * 2;
const MAX_FLAME_POINTS = 48;
const LUT_SIZE = 360;

export class FlameRenderer {
  w: number;
  h: number;
  cx: number;
  cy: number;
  time = 0;
  config: OuterShapeConfig | null = null;
  outerGrad: CanvasGradient | null = null;

  private sinLUT: Float32Array;
  private cosLUT: Float32Array;
  private flameOffsets: number[] = [];
  private flameSpeeds: number[] = [];

  constructor(canvasWidth: number, canvasHeight: number) {
    this.w = canvasWidth;
    this.h = canvasHeight;
    this.cx = canvasWidth / 2;
    this.cy = canvasHeight * 0.55;

    this.sinLUT = new Float32Array(LUT_SIZE);
    this.cosLUT = new Float32Array(LUT_SIZE);
    for (let i = 0; i < LUT_SIZE; i++) {
      const a = (i / LUT_SIZE) * TAU;
      this.sinLUT[i] = Math.sin(a);
      this.cosLUT[i] = Math.cos(a);
    }

    for (let i = 0; i < MAX_FLAME_POINTS; i++) {
      this.flameOffsets.push(Math.random() * 1000);
      this.flameSpeeds.push(0.6 + Math.random() * 0.8);
    }
  }

  private sin(deg: number): number {
    return this.sinLUT[((deg % 360) + 360) % 360 | 0];
  }

  private cos(deg: number): number {
    return this.cosLUT[((deg % 360) + 360) % 360 | 0];
  }

  setConfig(config: OuterShapeConfig | null): void {
    this.config = config;
    this.outerGrad = null;
  }

  update(dt: number): void {
    if (!this.config) return;
    this.time += dt * (this.config.speed || 1);
  }

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.cx = w / 2;
    this.cy = h * 0.55;
    this.outerGrad = null;
  }

  buildFlamePoints(scaleMul: number): Array<{ x: number; y: number }> {
    const f = this.config;
    if (!f) return [];
    const intensity = f.intensity || 1.0;
    const baseW = this.w * 0.24 * (f.thickness || 0.6) * intensity * scaleMul;
    const baseH = this.h * 0.27 * intensity * scaleMul;
    const flameH = baseH * (f.height || 1.0);
    const t = this.time;
    const jagged = f.jaggedness || 0.5;

    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < MAX_FLAME_POINTS; i++) {
      const frac = i / MAX_FLAME_POINTS;
      const angle = frac * TAU;
      const degIdx = (frac * 360) | 0;

      const cosA = this.cos(degIdx);
      const sinA = this.sin(degIdx);

      const isTop = sinA < 0;
      const upBias = isTop ? 1.0 + Math.abs(sinA) * (f.height || 1.0) * 1.3 : 1.0;

      const isSpike = i % 2 === 0;
      const spikeAmp = isSpike
        ? 1.0 + jagged * (0.4 + 0.35 * Math.sin(t * 3.2 + this.flameOffsets[i]))
        : 1.0 - jagged * (0.15 + 0.1 * Math.sin(t * 2.8 + this.flameOffsets[i] * 1.3));

      const n1 = Math.sin(t * 2.5 + this.flameOffsets[i] + angle * 4) * 0.2;
      const n2 = Math.sin(t * 5.0 + this.flameOffsets[i] * 2.1 + angle * 7) * 0.12 * jagged;
      const noise = (n1 + n2) * upBias;

      const rx = baseW * spikeAmp * (1 + noise * 0.5) * upBias;
      const ry = (isTop ? flameH : baseH * 0.65) * spikeAmp * (1 + noise * 0.3);

      points.push({ x: this.cx + cosA * rx, y: this.cy + sinA * ry });
    }
    return points;
  }

  private buildFlamePath(ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>): void {
    const len = points.length;
    const s = this.config?.smoothness ?? 0.2;

    ctx.beginPath();

    if (s < 0.15) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < len; i++) ctx.lineTo(points[i].x, points[i].y);
    } else if (s > 0.85) {
      const first = points[0], second = points[1];
      ctx.moveTo((first.x + second.x) / 2, (first.y + second.y) / 2);
      for (let i = 1; i < len; i++) {
        const curr = points[i];
        const next = points[(i + 1) % len];
        ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
      }
    } else {
      const smoothThreshold = 1.0 - s;
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < len; i++) {
        const curr = points[i];
        const isValley = i % 2 !== 0;
        if (isValley && Math.random() > smoothThreshold) {
          const next = points[(i + 1) % len];
          ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
        } else {
          ctx.lineTo(curr.x, curr.y);
        }
      }
    }

    ctx.closePath();
  }

  private drawOuterGlow(ctx: CanvasRenderingContext2D): void {
    if (!this.config) return;
    const baseColor = this.config.baseColor || '#FF6600';
    const intensity = this.config.intensity || 1.0;
    const pulse = 0.85 + 0.15 * Math.sin(this.time * 1.5);
    const r = Math.max(this.w, this.h) * 0.8 * intensity;

    if (!this.outerGrad) {
      this.outerGrad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, r);
      this.outerGrad.addColorStop(0, baseColor + '00');
      this.outerGrad.addColorStop(0.35, baseColor + '00');
      this.outerGrad.addColorStop(0.55, baseColor + '11');
      this.outerGrad.addColorStop(0.70, baseColor + '55');
      this.outerGrad.addColorStop(0.82, baseColor + '88');
      this.outerGrad.addColorStop(0.93, baseColor + '33');
      this.outerGrad.addColorStop(1, baseColor + '00');
    }

    ctx.save();
    ctx.globalAlpha = 0.5 * pulse;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = this.outerGrad;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.restore();
  }

  private drawFlameBand(
    ctx: CanvasRenderingContext2D,
    outerPts: Array<{ x: number; y: number }>,
    innerPts: Array<{ x: number; y: number }>,
    baseColor: string,
    tipColor: string,
  ): void {
    if (outerPts.length < 3) return;
    const intensity = this.config?.intensity || 1.0;

    ctx.save();
    this.buildFlamePath(ctx, outerPts);
    ctx.clip();

    const phase = this.time * 1.8;
    const bandR = Math.max(this.w, this.h) * 0.4 * intensity;
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

    ctx.globalCompositeOperation = 'destination-out';
    this.buildFlamePath(ctx, innerPts);
    ctx.globalAlpha = 0.9;
    ctx.fill();

    ctx.restore();
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
    const intensity = this.config?.intensity || 1.0;
    const sm = this.config?.smoothness ?? 0.2;

    ctx.save();

    if (scale !== 1.0) {
      ctx.translate(this.cx, this.cy);
      ctx.scale(scale, scale);
      ctx.translate(-this.cx, -this.cy);
    }

    const flameR = Math.max(this.w, this.h) * 0.38 * intensity;
    const hollowGrad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, flameR);
    hollowGrad.addColorStop(0, baseColor + '00');
    hollowGrad.addColorStop(0.35, baseColor + '00');
    hollowGrad.addColorStop(0.50, baseColor + '15');
    hollowGrad.addColorStop(0.62, baseColor + '66');
    hollowGrad.addColorStop(0.74, baseColor + 'CC');
    hollowGrad.addColorStop(0.85, tipColor + 'FF');
    hollowGrad.addColorStop(1, tipColor + 'EE');

    ctx.globalAlpha *= baseAlpha;

    this.buildFlamePath(ctx, points);
    ctx.fillStyle = hollowGrad;
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 35 * intensity;
    ctx.fill();

    this.buildFlamePath(ctx, points);
    ctx.shadowBlur = 25;
    ctx.shadowColor = tipColor;
    ctx.strokeStyle = tipColor + 'CC';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = sm > 0.5 ? 'round' : 'miter';
    ctx.miterLimit = 12;
    ctx.stroke();

    this.buildFlamePath(ctx, points);
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF66';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  private drawFlameInnerBorder(
    ctx: CanvasRenderingContext2D,
    pts: Array<{ x: number; y: number }>,
    baseColor: string,
    tipColor: string,
  ): void {
    if (pts.length < 3) return;
    const sm = this.config?.smoothness ?? 0.2;

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

    this.buildFlamePath(ctx, pts);
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF44';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.restore();
  }

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

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.config) return;

    const f = this.config;
    const baseColor = f.baseColor || '#FF6600';
    const tipColor = f.tipColor || '#FFDD00';

    this.drawOuterGlow(ctx);

    const outerPts = this.buildFlamePoints(1.0);
    const innerPts = this.buildFlamePoints(0.6);

    this.drawFlameBand(ctx, outerPts, innerPts, baseColor, tipColor);

    if (f.dualLayer && f.dualColor) {
      this.drawFlameShape(ctx, outerPts, f.dualColor, baseColor, 1.15, 0.35);
    }

    this.drawFlameShape(ctx, outerPts, baseColor, tipColor, 1.0, 0.8);
    this.drawFlameInnerBorder(ctx, innerPts, baseColor, tipColor);
    this.drawEdgeFade(ctx);
  }
}

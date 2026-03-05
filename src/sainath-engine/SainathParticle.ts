// Ported from AuraTest-sainath Particle class (AuraStudio.jsx lines 517-1226)

import type { SainathConfig, EntityConfig, ShapeConfig, Movement, MovementObject } from './types';

const random = (min: number, max: number): number => Math.random() * (max - min) + min;

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

export class SainathParticle {
  type: string;
  w: number;
  h: number;
  customConfig: SainathConfig | null;
  variant: number;

  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  size = 10;
  life = 1;
  decay = 0.01;
  rotation = 0;
  rotSpeed = 0;
  movementPhase = 0;

  entity: EntityConfig | null = null;
  speedMultiplier = 1.0;
  sizeMultiplier = 1.0;

  // Preset-specific fields
  hue = 0;
  initialX = 0;
  amplitude = 0;
  frequency = 0;
  phase = 0;
  points: Array<{ x: number; y: number }> | null = null;
  isStar = false;
  spawnX = 0;
  spawnY = 0;

  constructor(type: string, canvasWidth: number, canvasHeight: number, customConfig: SainathConfig | null = null) {
    this.type = type;
    this.w = canvasWidth;
    this.h = canvasHeight;
    this.customConfig = customConfig;
    this.variant = Math.random();
    this.reset();
  }

  reset(): void {
    const centerX = this.w / 2;
    const feetY = this.h * 0.58;

    if (this.type === 'custom' && this.customConfig) {
      const entities = this.customConfig.entities;
      if (entities && entities.length > 0) {
        const totalWeight = entities.reduce((sum, e) => sum + (e.weight || 1), 0);
        let rand = Math.random() * totalWeight;
        this.entity = entities[0];
        for (const e of entities) {
          rand -= (e.weight || 1);
          if (rand <= 0) {
            this.entity = e;
            break;
          }
        }

        const sizeRange = this.entity.size || [12, 18];
        this.size = random(sizeRange[0], sizeRange[1]);

        const sp = this.entity.speed || { vx: [-1, 1], vy: [-2, -0.5] };
        const vxRange = sp.vx || [-1, 1];
        const vyRange = sp.vy || [-2, -0.5];
        this.vx = random(vxRange[0], vxRange[1]);
        this.vy = random(vyRange[0], vyRange[1]);

        const mov = this.entity.movement;
        const movType = typeof mov === 'string' ? mov : null;
        if (movType) {
          const downwardTypes = ['rain', 'bounce', 'gravity'];
          if (!downwardTypes.includes(movType) && this.vy > 0) {
            this.vy = -Math.abs(this.vy);
          }
        }

        if (movType === 'rain') {
          this.x = random(0, this.w);
          this.y = random(-40, -5);
          this.vy = Math.abs(this.vy) || random(2, 5);
          this.rotation = random(-0.1, 0.1);
          this.rotSpeed = random(-0.005, 0.005);
          this.life = 1;
          this.decay = random(0.003, 0.008);
        } else if (this.customConfig.renderMode === 'fluid') {
          this.x = centerX + random(-30, 30);
          this.y = feetY + random(30, 50);
          this.rotation = random(-0.3, 0.3);
          this.rotSpeed = random(-0.01, 0.01);
          this.life = 1;
          this.decay = random(0.004, 0.009);
        } else {
          this.x = centerX + random(-110, 110);
          this.y = feetY + random(-30, 80);
          this.rotation = random(-0.15, 0.15);
          this.rotSpeed = random(-0.02, 0.02);
          this.life = 1;
          this.decay = random(0.005, 0.013);
        }

        this.movementPhase = random(0, Math.PI * 2);
      }
    }
  }

  update(): void {
    if (this.type === 'custom' && this.customConfig) {
      const isFluidMode = this.customConfig.renderMode === 'fluid';

      const speedMult = this.speedMultiplier || 1.0;
      this.x += this.vx * speedMult;
      this.y += this.vy * speedMult;
      if (this.rotSpeed) this.rotation += this.rotSpeed;
      this.movementPhase = (this.movementPhase || 0) + 0.08;

      if (isFluidMode) {
        const initialSize = (this.entity?.size?.[1] || 45);
        const maxSize = initialSize * 4;
        if (this.size < maxSize) {
          const expansionRate = 1.012 + (1 - this.life) * 0.008;
          this.size *= expansionRate;
        }
        const driftStrength = 0.05 + (1 - this.life) * 0.12;
        this.vx += random(-driftStrength, driftStrength);
        this.vx = Math.max(-2, Math.min(2, this.vx));
        this.vy *= 0.994;
      }

      const movement = this.entity?.movement || 'float';
      const centerX = this.w / 2;
      const centerY = this.h * 0.58;

      if (typeof movement === 'object') {
        const m = movement as MovementObject;
        if (m.gravity) this.vy += clamp(m.gravity, -0.15, 0.15);
        if (m.friction) {
          const f = clamp(m.friction, 0.9, 1.0);
          this.vx *= f;
          this.vy *= f;
        }
        if (m.wave) {
          const amp = clamp(m.wave.amp || 1, 0.1, 5);
          const freq = clamp(m.wave.freq || 1, 0.1, 5);
          const waveVal = Math.sin(this.movementPhase * freq) * amp;
          if (m.wave.axis === 'y') this.y += waveVal;
          else if (m.wave.axis === 'both') {
            this.x += waveVal;
            this.y += Math.cos(this.movementPhase * freq) * amp * 0.5;
          } else this.x += waveVal;
        }
        if (m.attract) {
          const a = clamp(m.attract, -0.01, 0.01);
          this.vx += (centerX - this.x) * a;
          this.vy += (centerY - this.y) * a;
        }
        if (m.spin) {
          const sp = clamp(m.spin, -3, 3);
          this.x += Math.cos(this.movementPhase * sp) * 1.5;
          this.y += Math.sin(this.movementPhase * sp) * 1.5;
        }
        if (m.jitter) {
          const j = clamp(m.jitter, 0, 0.5);
          this.vx += random(-j, j);
          this.vy += random(-j, j);
        }
        if (m.bounce) {
          const floor = this.h * clamp(m.bounce.floor || 0.75, 0.5, 0.9);
          if (this.y > floor) {
            this.y = floor;
            this.vy *= -clamp(m.bounce.elasticity || 0.6, 0.1, 0.9);
          }
        }
        if (m.scale) {
          this.size *= clamp(m.scale, 0.95, 1.05);
        }
        this.vx = clamp(this.vx, -8, 8);
        this.vy = clamp(this.vy, -8, 8);
      } else {
        this.applyMovementPreset(movement as string, centerX, centerY);
      }

      this.life -= this.decay;
      if (this.life <= 0) this.reset();
      return;
    }
  }

  private applyMovementPreset(movement: string, centerX: number, centerY: number): void {
    switch (movement) {
      case 'float':
        this.x += Math.sin(this.movementPhase) * 0.5;
        break;
      case 'zigzag':
        this.x += Math.sin(this.movementPhase * 2.5) * 1.8;
        break;
      case 'orbit':
        this.x += Math.sin(this.movementPhase) * 2;
        this.y += Math.cos(this.movementPhase) * 0.5;
        break;
      case 'rise':
        this.vy -= 0.01;
        this.x += Math.sin(this.movementPhase * 0.8) * 0.3;
        break;
      case 'wander':
        this.vx += random(-0.1, 0.1);
        this.vy += random(-0.1, 0.1);
        break;
      case 'spiral': {
        const spiralR = (1 - this.life) * 3;
        this.x += Math.cos(this.movementPhase * 2) * spiralR;
        this.y += Math.sin(this.movementPhase * 2) * spiralR;
        break;
      }
      case 'rain':
        this.x += Math.sin(this.movementPhase * 0.5) * 0.5;
        this.vy += 0.08;
        if (this.y > this.h + 20) this.reset();
        break;
      case 'explode':
        this.vx *= 0.97;
        this.vy *= 0.97;
        break;
      case 'swarm':
        this.vx += (centerX - this.x) * 0.002;
        this.vy += (centerY - this.y) * 0.002;
        break;
      case 'bounce':
        this.vy += 0.08;
        if (this.y > this.h * 0.75) {
          this.y = this.h * 0.75;
          this.vy *= -0.6;
        }
        break;
      case 'pulse': {
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const pulseScale = Math.sin(this.movementPhase * 2) * 0.02;
        this.x += dx * pulseScale;
        this.y += dy * pulseScale;
        break;
      }
      case 'vortex': {
        const vdx = centerX - this.x;
        const vdy = centerY - this.y;
        const dist = Math.sqrt(vdx * vdx + vdy * vdy) || 1;
        this.vx += (vdy / dist) * 0.3;
        this.vy += (-vdx / dist) * 0.3;
        this.vx += vdx * 0.001;
        this.vy += vdy * 0.001;
        break;
      }
      case 'levitate':
        this.vy -= 0.015;
        this.x += Math.sin(this.movementPhase * 1.2) * 0.8;
        this.vx *= 0.95;
        break;
      case 'fountain':
        this.vy += 0.06;
        this.x += Math.sin(this.movementPhase * 0.5) * 0.2;
        if (this.y > this.h * 0.8) this.vy = random(-3, -2);
        break;
      case 'wave': {
        const waveAmplitude = Math.sin(this.movementPhase * 1.5) * 2.5;
        this.x += waveAmplitude;
        this.y += Math.sin(this.movementPhase * 2) * 0.3;
        break;
      }
      case 'tornado': {
        const tornadoRadius = (this.h * 0.6 - this.y) * 0.15;
        this.x += Math.cos(this.movementPhase * 3) * tornadoRadius * 0.2;
        this.vx = Math.cos(this.movementPhase * 3) * 1.5;
        this.vy -= 0.08;
        break;
      }
      case 'drift':
        this.vy -= 0.008;
        this.vx += random(-0.05, 0.05);
        this.x += Math.sin(this.movementPhase * 0.6) * 0.4;
        break;
      case 'flutter':
        this.vy -= random(0.01, 0.03);
        this.vx += random(-0.3, 0.3);
        this.x += Math.sin(this.movementPhase * 4) * random(0.5, 1.5);
        this.y += Math.cos(this.movementPhase * 3) * random(0.2, 0.8);
        this.vx *= 0.96;
        break;
      case 'whirlpool': {
        const wpdx = centerX - this.x;
        const wpdy = centerY - this.y;
        const wpdist = Math.sqrt(wpdx * wpdx + wpdy * wpdy) || 1;
        this.vx += (wpdy / wpdist) * 0.25;
        this.vy += (-wpdx / wpdist) * 0.25;
        this.vx += wpdx * 0.003;
        this.vy += wpdy * 0.003 + 0.02;
        break;
      }
      case 'magnetic': {
        const mdx = centerX - this.x;
        const mdy = centerY - this.y;
        const magneticForce = Math.sin(this.movementPhase) * 0.05;
        this.vx += mdx * magneticForce;
        this.vy += mdy * magneticForce;
        this.vx *= 0.98;
        this.vy *= 0.98;
        break;
      }
      case 'gravity':
        this.vy += 0.12;
        this.vx *= 0.99;
        if (this.y > this.h * 0.9) this.reset();
        break;
      case 'hover':
        if (!this.spawnX) this.spawnX = this.x;
        if (!this.spawnY) this.spawnY = this.y;
        this.vx += (this.spawnX - this.x) * 0.01;
        this.vy += (this.spawnY - this.y) * 0.01 + Math.sin(this.movementPhase * 1.5) * 0.03;
        this.vx *= 0.95;
        this.vy *= 0.95;
        break;
    }
  }

  private drawShapes(ctx: CanvasRenderingContext2D, s: number): void {
    if (!this.entity?.shapes) return;
    for (const shape of this.entity.shapes) {
      ctx.beginPath();
      if (shape.fill) ctx.fillStyle = shape.fill;
      if (shape.stroke) {
        ctx.strokeStyle = shape.stroke;
        ctx.lineWidth = (shape.strokeWidth || shape.width || 0.02) * s;
      }

      switch (shape.type) {
        case 'circle':
          ctx.beginPath();
          ctx.arc((shape.cx || 0) * s, (shape.cy || 0) * s, (shape.r || 0.1) * s, 0, Math.PI * 2);
          if (shape.fill) ctx.fill();
          if (shape.stroke) ctx.stroke();
          break;
        case 'ellipse':
          ctx.beginPath();
          ctx.ellipse((shape.cx || 0) * s, (shape.cy || 0) * s, (shape.rx || 0.1) * s, (shape.ry || 0.1) * s, 0, 0, Math.PI * 2);
          if (shape.fill) ctx.fill();
          if (shape.stroke) ctx.stroke();
          break;
        case 'rect':
          if (shape.fill) ctx.fillRect((shape.x || 0) * s, (shape.y || 0) * s, (shape.w || 0.1) * s, (shape.h || 0.1) * s);
          if (shape.stroke) ctx.strokeRect((shape.x || 0) * s, (shape.y || 0) * s, (shape.w || 0.1) * s, (shape.h || 0.1) * s);
          break;
        case 'triangle': {
          const p = shape.points || [0, -0.3, -0.3, 0.3, 0.3, 0.3];
          ctx.beginPath();
          ctx.moveTo(p[0] * s, p[1] * s);
          ctx.lineTo(p[2] * s, p[3] * s);
          ctx.lineTo(p[4] * s, p[5] * s);
          ctx.closePath();
          if (shape.fill) ctx.fill();
          if (shape.stroke) ctx.stroke();
          break;
        }
        case 'line':
          ctx.beginPath();
          ctx.strokeStyle = shape.stroke || shape.fill || '#fff';
          ctx.lineWidth = (shape.width || 0.02) * s;
          ctx.moveTo((shape.x1 || 0) * s, (shape.y1 || 0) * s);
          ctx.lineTo((shape.x2 || 0) * s, (shape.y2 || 0) * s);
          ctx.stroke();
          break;
        case 'arc':
          ctx.beginPath();
          ctx.arc(
            (shape.cx || 0) * s, (shape.cy || 0) * s,
            (shape.r || 0.2) * s,
            shape.startAngle || 0,
            shape.endAngle || Math.PI,
            shape.counterClockwise || false,
          );
          if (shape.fill) { ctx.closePath(); ctx.fill(); }
          if (shape.stroke) {
            ctx.strokeStyle = shape.stroke;
            ctx.lineWidth = (shape.strokeWidth || shape.width || 0.02) * s;
            ctx.stroke();
          }
          break;
        case 'polygon': {
          const pts = shape.points || [];
          if (pts.length >= 4) {
            ctx.beginPath();
            ctx.moveTo(pts[0] * s, pts[1] * s);
            for (let i = 2; i < pts.length; i += 2) {
              ctx.lineTo(pts[i] * s, pts[i + 1] * s);
            }
            ctx.closePath();
            if (shape.fill) ctx.fill();
            if (shape.stroke) ctx.stroke();
          }
          break;
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    if (this.type === 'custom' && this.customConfig && this.entity?.shapes) {
      const style = this.entity.style || 'solid';
      const sizeMult = this.sizeMultiplier || 1.0;
      const s = this.size * sizeMult;

      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation || 0);

      if (style === 'smoke') {
        const isFluidMode = this.customConfig?.renderMode === 'fluid';

        if (isFluidMode) {
          ctx.globalCompositeOperation = 'source-over';
          const opacity = this.life * this.life * 0.35;
          const baseColor = this.entity.shapes?.[0]?.fill || '#888888';
          const r = parseInt(baseColor.slice(1, 3), 16) || 128;
          const g = parseInt(baseColor.slice(3, 5), 16) || 128;
          const b = parseInt(baseColor.slice(5, 7), 16) || 128;

          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.2);
          grad.addColorStop(0, `rgba(${r},${g},${b},${opacity})`);
          grad.addColorStop(0.4, `rgba(${r},${g},${b},${opacity * 0.6})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, s * 1.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = this.life * 0.3;
          this.drawShapes(ctx, s * 2);
          ctx.globalAlpha = this.life * 0.45;
          this.drawShapes(ctx, s * 1.4);
          ctx.globalAlpha = this.life * 0.7;
          this.drawShapes(ctx, s);
        }
      } else if (style === 'glow') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = this.life * 0.15;
        this.drawShapes(ctx, s * 2);
        ctx.globalAlpha = this.life * 0.35;
        this.drawShapes(ctx, s * 1.3);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = this.life * 0.9;
        this.drawShapes(ctx, s);
      } else {
        const isFluidMode = this.customConfig?.renderMode === 'fluid';
        if (isFluidMode) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = this.life * 0.6;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = this.life;
        }
        this.drawShapes(ctx, s);
      }
    }

    ctx.restore();
  }
}

import { useRef, useEffect } from 'react';
import { getAuraVisuals } from '../data/auraVisuals';

export function AuraCanvas({ aura }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);

  const visuals = getAuraVisuals(aura);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visuals) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const { particleCount, speed, direction, colors, glow, sizeRange } = visuals;
    const [minS, maxS] = sizeRange;

    function spawn() {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * Math.min(w, h) * 0.38;
      return {
        x: cx + Math.cos(angle) * dist * (0.3 + Math.random() * 0.7),
        y: cy + Math.sin(angle) * dist * (0.3 + Math.random() * 0.7),
        vx: 0, vy: 0,
        size: minS + Math.random() * (maxS - minS),
        alpha: 0.4 + Math.random() * 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: Math.random(),
        angle, dist,
        phase: Math.random() * Math.PI * 2,
      };
    }

    particlesRef.current = Array.from({ length: particleCount }, spawn);
    let t = 0;

    function hexToRgba(hex, a) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      t += 0.016;

      // Radial glow behind everything
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.5);
      gr.addColorStop(0, hexToRgba(glow, 0.25));
      gr.addColorStop(0.6, hexToRgba(glow, 0.08));
      gr.addColorStop(1, hexToRgba(glow, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        p.life -= 0.003 * speed;

        switch (direction) {
          case 'rise':
            p.vy = -speed * (0.4 + Math.random() * 0.3);
            p.vx = Math.sin(t * 2 + p.phase) * 0.5;
            break;
          case 'float':
            p.vx = Math.sin(t + p.phase) * speed * 0.35;
            p.vy = Math.cos(t * 0.7 + p.phase) * speed * 0.3 - 0.15;
            break;
          case 'swirl':
            p.angle += speed * 0.018;
            p.dist += Math.sin(t + p.phase) * 0.6;
            p.x = cx + Math.cos(p.angle) * p.dist;
            p.y = cy + Math.sin(p.angle) * p.dist;
            break;
          case 'burst':
            p.x += Math.cos(p.angle) * speed * 0.6;
            p.y += Math.sin(p.angle) * speed * 0.6;
            break;
          case 'erratic':
            p.vx = (Math.random() - 0.5) * speed * 2.5;
            p.vy = (Math.random() - 0.5) * speed * 2.5;
            break;
          case 'pulse': {
            const ps = 1 + Math.sin(t * 3 + p.phase) * 0.18;
            p.x = cx + Math.cos(p.angle) * p.dist * ps;
            p.y = cy + Math.sin(p.angle) * p.dist * ps;
            break;
          }
          default:
            p.vy = -speed * 0.4;
        }

        if (direction !== 'swirl' && direction !== 'pulse') {
          p.x += p.vx;
          p.y += p.vy;
        }

        // Respawn when dead or out of bounds
        if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
          Object.assign(p, spawn());
          p.life = 1;
        }

        const a = p.alpha * Math.max(p.life, 0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(p.color, a);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [visuals]);

  if (!visuals) return null;

  return <canvas ref={canvasRef} className="avatar-aura-canvas" />;
}

import { useRef, useEffect, useCallback, Fragment } from 'react';
import { FlameRenderer } from '../../sainath-engine/FlameRenderer';
import { SainathParticle } from '../../sainath-engine/SainathParticle';
import type { SainathConfig } from '../../sainath-engine/types';

interface SainathAuraCanvasProps {
  config: SainathConfig | null;
  width?: number;
  height?: number;
  particleZIndex?: number;
  flameZIndex?: number;
  showOverlay?: boolean;
  speedMultiplier?: number;
  sizeMultiplier?: number;
  densityMultiplier?: number;
  movementOverride?: string | null;
}

const CANVAS_W = 600;
const CANVAS_H = 700;

export function SainathAuraCanvas({
  config,
  width = CANVAS_W,
  height = CANVAS_H,
  particleZIndex = 10,
  flameZIndex = 25,
  showOverlay = false,
  speedMultiplier = 1.0,
  sizeMultiplier = 1.0,
  densityMultiplier = 1.0,
  movementOverride = null,
}: SainathAuraCanvasProps) {
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const flameCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<SainathParticle[]>([]);
  const flameRef = useRef<FlameRenderer | null>(null);
  const overlayFlameRef = useRef<FlameRenderer | null>(null);
  const lastFrameRef = useRef(performance.now());
  const configRef = useRef<SainathConfig | null>(null);

  const rebuildParticles = useCallback(() => {
    const cfg = configRef.current;
    if (!cfg) {
      particlesRef.current = [];
      return;
    }

    const count = Math.round((cfg.density || 80) * densityMultiplier);
    const effectiveCfg: SainathConfig = movementOverride
      ? {
          ...cfg,
          entities: cfg.entities.map((e) => ({ ...e, movement: movementOverride })),
        }
      : cfg;

    const particles: SainathParticle[] = [];
    for (let i = 0; i < count; i++) {
      const p = new SainathParticle('custom', width, height, effectiveCfg);
      p.speedMultiplier = speedMultiplier;
      p.sizeMultiplier = sizeMultiplier;
      particles.push(p);
    }
    particlesRef.current = particles;
  }, [width, height, densityMultiplier, speedMultiplier, sizeMultiplier, movementOverride]);

  const initFlame = useCallback(() => {
    const cfg = configRef.current;

    if (!flameRef.current) {
      flameRef.current = new FlameRenderer(width, height);
    }
    flameRef.current.resize(width, height);
    flameRef.current.setConfig(cfg?.outerShape ?? null);

    if (!overlayFlameRef.current) {
      overlayFlameRef.current = new FlameRenderer(width, height);
    }
    overlayFlameRef.current.resize(width, height);
    overlayFlameRef.current.setConfig(cfg?.outerShape ?? null);
  }, [width, height]);

  useEffect(() => {
    configRef.current = config;
    initFlame();
    rebuildParticles();
  }, [config, initFlame, rebuildParticles]);

  useEffect(() => {
    for (const p of particlesRef.current) {
      p.speedMultiplier = speedMultiplier;
      p.sizeMultiplier = sizeMultiplier;
    }
  }, [speedMultiplier, sizeMultiplier]);

  useEffect(() => {
    const animate = () => {
      const now = performance.now();
      const dt = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      const particleCanvas = particleCanvasRef.current;
      const flameCanvas = flameCanvasRef.current;
      if (!particleCanvas || !flameCanvas) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      const cfg = configRef.current;
      const pCtx = particleCanvas.getContext('2d')!;
      const fCtx = flameCanvas.getContext('2d')!;

      // --- Canvas 1: Particles (behind avatar, z-10) ---
      if (cfg) {
        const renderMode = cfg.renderMode || 'discrete';
        const bg = cfg.background || 'clear';

        if (renderMode === 'fluid') {
          pCtx.clearRect(0, 0, width, height);
        } else if (bg === 'dark-fade') {
          pCtx.globalCompositeOperation = 'source-over';
          pCtx.fillStyle = 'rgba(10, 10, 15, 0.2)';
          pCtx.fillRect(0, 0, width, height);
        } else if (bg === 'black-fade') {
          pCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          pCtx.fillRect(0, 0, width, height);
        } else {
          pCtx.clearRect(0, 0, width, height);
        }
      } else {
        pCtx.clearRect(0, 0, width, height);
      }

      for (const p of particlesRef.current) {
        p.update();
        p.draw(pCtx);
      }

      // --- Canvas 2: Flame contour (above avatar, z-25) ---
      fCtx.clearRect(0, 0, width, height);
      if (flameRef.current) {
        flameRef.current.update(dt);
        flameRef.current.draw(fCtx);
      }

      // --- Canvas 3: Overlay (optional) ---
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas && showOverlay && overlayFlameRef.current) {
        const oCtx = overlayCanvas.getContext('2d')!;
        oCtx.clearRect(0, 0, width, height);
        overlayFlameRef.current.update(dt);
        oCtx.save();
        oCtx.globalAlpha = 0.35;
        overlayFlameRef.current.draw(oCtx);
        oCtx.restore();
      } else if (overlayCanvas) {
        const oCtx = overlayCanvas.getContext('2d')!;
        oCtx.clearRect(0, 0, width, height);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [width, height, showOverlay]);

  // Matches Sainath's "absolute inset-0 w-full h-full" — canvas fills container,
  // internal resolution (600x700) is CSS-stretched to the container size
  const fillStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  };

  return (
    <Fragment>
      {/* Canvas 1: Particles — behind avatar (z-10) */}
      <canvas
        ref={particleCanvasRef}
        className="aura-canvas-particles"
        style={{ ...fillStyle, zIndex: particleZIndex }}
        width={width}
        height={height}
      />
      {/* Canvas 2: Flame contour — above avatar (z-25) */}
      <canvas
        ref={flameCanvasRef}
        className="aura-canvas-flame"
        style={{ ...fillStyle, zIndex: flameZIndex }}
        width={width}
        height={height}
      />
      {/* Canvas 3: Overlay — soft flame on top (optional, 150% scaled like Sainath's) */}
      <canvas
        ref={overlayCanvasRef}
        className="aura-canvas-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          width: '150%',
          height: '150%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: flameZIndex + 1,
        }}
        width={width}
        height={height}
      />
    </Fragment>
  );
}

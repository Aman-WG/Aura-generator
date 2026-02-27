import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { SainathConfig, MovementPreset } from '../../sainath-engine/types';

export interface SainathModifiers {
  nature: number;
  speed: number;
  particleSize: number;
  density: number;
  movement: MovementPreset | null;
}

interface AuraModifierPanelProps {
  config: SainathConfig;
  onModify: (mods: SainathModifiers) => void;
  onHover?: () => void;
}

function PxIcon({ paths, size = 24 }: { paths: string[]; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 24 24" style={{ imageRendering: 'pixelated' }}>
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

const ICON_PATHS: Record<string, string[]> = {
  repeat: ['M17 5h2v2h-2zM5 17h2v2H5zm6-14h2v6h-2zM9 1h2v8H9zm0 8h2v2H9zm10 8H9v2h10zM5 7H3v10h2zM13 15h-2v6h2zm2-2h-2v8h2zm0 8h-2v2h2zM5 5h10v2H5zm14 12h2V7h-2z'],
  arrowUp: ['M11 20h2V4h-2zm2-12h2V6h-2zm2 2h2V8h-2zm2 2h2v-2h-2zm-6-4H9V6h2zM15 10H7V8h8zm2 2H5v-2h12z'],
  loader: ['M13 22h-2v-6h2v6Zm-6-3H5v-2h2v2Zm12 0h-2v-2h2v2ZM9 17H7v-2h2v2Zm8 0h-2v-2h2v2Zm-9-4H2v-2h6v2Zm14 0h-6v-2h6v2ZM9 9H7V7h2v2Zm8 0h-2V7h2v2Zm-4-1h-2V2h2v6ZM7 7H5V5h2v2Zm12 0h-2V5h2v2Z'],
  target: ['M5 1h14v2H5zM3 3h2v2H3zm0 16h2v2H3zm16 0h2v2h-2zm0-16h2v2h-2zm2 2h2v14h-2zM5 21h14v2H5zM1 5h2v14H1zm8 0h6v2H9zM5 9h2v6H5zm4 8h6v2H9zm8-8h2v6h-2zm-6 0h2v2h-2zM7 7h2v2H7zm0 8h2v2H7zm8 0h2v2h-2zm0-8h2v2h-2zm-6 4h2v2H9zm2 2h2v2h-2zm2-2h2v2h-2z'],
  zap: ['M4 13h8v6h2v2h-2v2h-2v-8H2v-4h2v2Zm12 6h-2v-2h2v2Zm2-2h-2v-2h2v2Zm2-2h-2v-2h2v2Zm-6-6h8v4h-2v-2h-8V5h-2V3h2V1h2v8Zm-8 2H4V9h2v2Zm2-2H6V7h2v2Zm2-2H8V5h2v2Z'],
  feather: ['M2 20h2v2H2zm6-2h6v2H8zm-2-2h2v2H6zm-2 2h2v2H4zm4-4h2v2H8zm2-2h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2zm0 8h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2zm2-6h2v6h-2zm-2-2h2v2h-2zM4 10h2v6H4zm2-2h2v2H6zm2-2h2v2H8zm2-2h2v2h-2zm2-2h6v2h-6z'],
  sparkle: ['M11 1h2v4h-2zm0 22h2v-4h-2zM9 5h2v4H9zm0 14h2v-4H9zm4-14h2v4h-2zm0 14h2v-4h-2zM5 9h4v2H5zm14 0h-4v2h4zM1 11h4v2H1zm22 0h-4v2h4zM5 13h4v2H5zm14 0h-4v2h4z'],
  spiral: [
    'M8 2h8v2H8zM6 4h2v2H6zm10 0h2v2h-2zM4 6h2v4H4zm14 0h2v4h-2zM18 10h-4v2h4zm-8 0h2v2h-2zm2 2h2v2h-2zm2 0h2v2h-2zM6 10h4v2H6zm0 2h2v4H6zm2 4h4v2H8zm4 0h2v-2h-2zm4-4h2v6h-2zm-2 6h2v2h-2zM6 18h4v2H6zM4 14h2v4H4z',
  ],
};

const PHYSICS_OPTIONS: Array<{ id: MovementPreset; label: string; icon: string }> = [
  { id: 'vortex', label: 'Vortex', icon: 'repeat' },
  { id: 'rise', label: 'Rise', icon: 'arrowUp' },
  { id: 'explode', label: 'Explode', icon: 'loader' },
  { id: 'magnetic', label: 'Implode', icon: 'target' },
  { id: 'zigzag', label: 'Zigzag', icon: 'zap' },
  { id: 'float', label: 'Float', icon: 'feather' },
  { id: 'levitate', label: 'Levitate', icon: 'sparkle' },
  { id: 'spiral', label: 'Spiral', icon: 'spiral' },
];

function initMods(cfg: SainathConfig): SainathModifiers {
  return {
    nature: Math.round((cfg.outerShape.smoothness ?? 0.5) * 100),
    speed: cfg.outerShape.speed ?? 1.0,
    particleSize: 1.0,
    density: 1.0,
    movement: null,
  };
}

export function AuraModifierPanel({ config, onModify, onHover }: AuraModifierPanelProps) {
  const [mods, setMods] = useState<SainathModifiers>(() => initMods(config));

  const pendingRef = useRef<SainathModifiers | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    setMods(initMods(config));
  }, [config]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const flush = useCallback(() => {
    if (pendingRef.current) {
      onModify(pendingRef.current);
      pendingRef.current = null;
    }
  }, [onModify]);

  const emit = useCallback(
    (next: SainathModifiers) => {
      setMods(next);
      pendingRef.current = next;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(flush);
    },
    [flush],
  );

  const vibeNorm = mods.nature;
  const sizeNorm = Math.round(((mods.particleSize - 0.3) / 2.7) * 100);
  const speedNorm = Math.round(((mods.speed - 0.2) / 1.8) * 100);

  return (
    <motion.div
      className="aura-modifiers"
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 18 }}
    >
      <div className="aura-modifiers__title-wrap">
        <div className="aura-modifiers__title-glow">Tweak your aura</div>
        <div className="aura-modifiers__title">Tweak your aura</div>
      </div>

      {/* Physics */}
      <div className="aura-modifiers__section">
        <div className="aura-modifiers__section-label">Physics</div>
        <div className="aura-modifiers__physics-grid">
          {PHYSICS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={`aura-modifiers__physics-btn${mods.movement === opt.id ? ' aura-modifiers__physics-btn--active' : ''}`}
              onClick={() => emit({ ...mods, movement: mods.movement === opt.id ? null : opt.id })}
              onMouseEnter={onHover}
            >
              <span className="aura-modifiers__physics-icon">
                <PxIcon paths={ICON_PATHS[opt.icon]} size={24} />
              </span>
              <span className="aura-modifiers__physics-label">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="aura-modifiers__divider" />

      {/* Vibe */}
      <div className="aura-modifiers__section">
        <div className="aura-modifiers__section-label">Vibe</div>
        <div className="aura-modifiers__range-row">
          <span className="aura-modifiers__range-end">Chaotic</span>
          <div className="aura-modifiers__tick-slider">
            <input
              type="range"
              className="aura-modifiers__slider"
              min={0}
              max={100}
              step={1}
              value={vibeNorm}
              onChange={(e) => emit({ ...mods, nature: parseInt(e.target.value) })}
              onMouseEnter={onHover}
              style={{ '--slider-pct': `${vibeNorm}%` } as React.CSSProperties}
            />
          </div>
          <span className="aura-modifiers__range-end">Calm</span>
        </div>
      </div>

      {/* Particle size */}
      <div className="aura-modifiers__section">
        <div className="aura-modifiers__section-label">Particle size</div>
        <div className="aura-modifiers__range-row">
          <span className="aura-modifiers__range-end">Small</span>
          <div className="aura-modifiers__tick-slider">
            <input
              type="range"
              className="aura-modifiers__slider"
              min={0}
              max={100}
              step={1}
              value={sizeNorm}
              onChange={(e) => emit({ ...mods, particleSize: 0.3 + (parseInt(e.target.value) / 100) * 2.7 })}
              onMouseEnter={onHover}
              style={{ '--slider-pct': `${sizeNorm}%` } as React.CSSProperties}
            />
          </div>
          <span className="aura-modifiers__range-end">Large</span>
        </div>
      </div>

      {/* Particle speed */}
      <div className="aura-modifiers__section">
        <div className="aura-modifiers__section-label">Particle speed</div>
        <div className="aura-modifiers__range-row">
          <span className="aura-modifiers__range-end">Slow</span>
          <div className="aura-modifiers__tick-slider">
            <input
              type="range"
              className="aura-modifiers__slider"
              min={0}
              max={100}
              step={1}
              value={speedNorm}
              onChange={(e) => emit({ ...mods, speed: 0.2 + (parseInt(e.target.value) / 100) * 1.8 })}
              onMouseEnter={onHover}
              style={{ '--slider-pct': `${speedNorm}%` } as React.CSSProperties}
            />
          </div>
          <span className="aura-modifiers__range-end">Fast</span>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { AuraParams, EnergyFlowPattern } from '../../aura-engine/types';

interface AuraModifierPanelProps {
  params: AuraParams;
  onModify: (updated: AuraParams) => void;
  onHover?: () => void;
}

const PHYSICS_OPTIONS: Array<{ id: EnergyFlowPattern; label: string; icon: string }> = [
  { id: 'spiral', label: 'Vortex', icon: '🌀' },
  { id: 'rise', label: 'Rise Up', icon: '🔼' },
  { id: 'radial-out', label: 'Explode', icon: '💥' },
  { id: 'radial-in', label: 'Implode', icon: '🕳️' },
  { id: 'cascade', label: 'Flow Down', icon: '🌊' },
  { id: 'pulse', label: 'Pulse', icon: '💓' },
  { id: 'zigzag', label: 'Zig Zag', icon: '⚡' },
  { id: 'wave', label: 'Wave', icon: '〰️' },
];

export function AuraModifierPanel({ params, onModify, onHover }: AuraModifierPanelProps) {
  const [physics, setPhysics] = useState<EnergyFlowPattern>(params.energyFlow?.pattern ?? 'radial-out');
  const [nature, setNature] = useState(50);
  const [speed, setSpeed] = useState(params.flameContour.speed);
  const [particleSize, setParticleSize] = useState(params.particles.size);

  useEffect(() => {
    setPhysics(params.energyFlow?.pattern ?? 'radial-out');
    setSpeed(params.flameContour.speed);
    setParticleSize(params.particles.size);
    setNature(Math.round(params.flameContour.smoothness * 100));
  }, [params]);

  const emit = useCallback(
    (patch: Partial<{
      physics: EnergyFlowPattern;
      nature: number;
      speed: number;
      particleSize: number;
    }>) => {
      const p: AuraParams = JSON.parse(JSON.stringify(params));

      const phys = patch.physics ?? physics;
      const nat = patch.nature ?? nature;
      const spd = patch.speed ?? speed;
      const ps = patch.particleSize ?? particleSize;

      p.energyFlow.pattern = phys;
      p.energyFlow.speed = spd;

      const t = nat / 100;
      p.flameContour.smoothness = 0.05 + t * 0.9;
      p.flameContour.jaggedness = 0.9 - t * 0.75;
      p.flameContour.speed = spd;
      p.particles.size = ps;

      onModify(p);
    },
    [params, physics, nature, speed, particleSize, onModify],
  );

  const handlePhysics = (id: EnergyFlowPattern) => {
    setPhysics(id);
    emit({ physics: id });
  };

  const handleNature = (v: number) => {
    setNature(v);
    emit({ nature: v });
  };

  const handleSpeed = (v: number) => {
    setSpeed(v);
    emit({ speed: v });
  };

  const handleParticleSize = (v: number) => {
    setParticleSize(v);
    emit({ particleSize: v });
  };

  const naturePct = nature;
  const speedPct = ((speed - 0.2) / 1.8) * 100;
  const sizePct = ((particleSize - 0.5) / 5.5) * 100;

  return (
    <motion.div
      className="aura-modifiers"
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 1.8, type: 'spring', stiffness: 120, damping: 18 }}
    >
      <div className="aura-modifiers__title">AURA MODIFIERS</div>

      <div className="aura-modifiers__list">
        {/* Physics buttons */}
        <div className="aura-modifiers__item">
          <label className="aura-modifiers__label">
            <span className="aura-modifiers__icon">🌪️</span>
            Physics
          </label>
          <div className="aura-modifiers__physics-grid">
            {PHYSICS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`aura-modifiers__physics-btn${physics === opt.id ? ' aura-modifiers__physics-btn--active' : ''}`}
                onClick={() => handlePhysics(opt.id)}
                onMouseEnter={onHover}
              >
                <span className="aura-modifiers__physics-icon">{opt.icon}</span>
                <span className="aura-modifiers__physics-label">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Aura Nature */}
        <div className="aura-modifiers__item">
          <label className="aura-modifiers__label">
            <span className="aura-modifiers__icon">🎭</span>
            Aura Nature
          </label>
          <div className="aura-modifiers__nature-row">
            <span className="aura-modifiers__nature-end">CHAOS</span>
            <div className="aura-modifiers__slider-wrap">
              <input
                type="range"
                className="aura-modifiers__slider"
                min={0}
                max={100}
                step={1}
                value={nature}
                onChange={(e) => handleNature(parseInt(e.target.value))}
                onMouseEnter={onHover}
                style={{ '--slider-pct': `${naturePct}%` } as React.CSSProperties}
              />
            </div>
            <span className="aura-modifiers__nature-end">CALM</span>
          </div>
        </div>

        {/* Speed */}
        <div className="aura-modifiers__item">
          <label className="aura-modifiers__label">
            <span className="aura-modifiers__icon">⚡</span>
            Aura Speed
          </label>
          <div className="aura-modifiers__slider-wrap">
            <input
              type="range"
              className="aura-modifiers__slider"
              min={0.2}
              max={2.0}
              step={0.05}
              value={speed}
              onChange={(e) => handleSpeed(parseFloat(e.target.value))}
              onMouseEnter={onHover}
              style={{ '--slider-pct': `${speedPct}%` } as React.CSSProperties}
            />
            <span className="aura-modifiers__value">{speed.toFixed(1)}x</span>
          </div>
        </div>

        {/* Particle Size */}
        <div className="aura-modifiers__item">
          <label className="aura-modifiers__label">
            <span className="aura-modifiers__icon">✦</span>
            Particle Size
          </label>
          <div className="aura-modifiers__slider-wrap">
            <input
              type="range"
              className="aura-modifiers__slider"
              min={0.5}
              max={6}
              step={0.1}
              value={particleSize}
              onChange={(e) => handleParticleSize(parseFloat(e.target.value))}
              onMouseEnter={onHover}
              style={{ '--slider-pct': `${sizePct}%` } as React.CSSProperties}
            />
            <span className="aura-modifiers__value">{particleSize.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

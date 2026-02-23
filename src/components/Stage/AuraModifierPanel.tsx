import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { AuraParams } from '../../aura-engine/types';

interface AuraModifierPanelProps {
  params: AuraParams;
  onModify: (updated: AuraParams) => void;
  onHover?: () => void;
}

interface SliderDef {
  key: string;
  label: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  get: (p: AuraParams) => number;
  set: (p: AuraParams, v: number) => AuraParams;
}

const SLIDERS: SliderDef[] = [
  {
    key: 'speed',
    label: 'Physics Speed',
    icon: '⚡',
    min: 0.1,
    max: 3,
    step: 0.1,
    get: (p) => p.flameContour.speed,
    set: (p, v) => ({
      ...p,
      flameContour: { ...p.flameContour, speed: v },
      particles: { ...p.particles, speed: v },
    }),
  },
  {
    key: 'size',
    label: 'Particle Size',
    icon: '✦',
    min: 1,
    max: 12,
    step: 0.5,
    get: (p) => p.particles.size,
    set: (p, v) => ({ ...p, particles: { ...p.particles, size: v } }),
  },
  {
    key: 'chaos',
    label: 'Chaos',
    icon: '🌀',
    min: 0,
    max: 1,
    step: 0.05,
    get: (p) => p.flameContour.jaggedness,
    set: (p, v) => ({
      ...p,
      flameContour: {
        ...p.flameContour,
        jaggedness: v,
        smoothness: Math.max(0, 1 - v),
      },
    }),
  },
  {
    key: 'intensity',
    label: 'Intensity',
    icon: '🔆',
    min: 0.2,
    max: 2,
    step: 0.1,
    get: (p) => p.intensity,
    set: (p, v) => ({
      ...p,
      intensity: v,
      innerGlow: { ...p.innerGlow, intensity: v },
      outerGlow: { ...p.outerGlow, intensity: v * 0.7 },
    }),
  },
  {
    key: 'height',
    label: 'Aura Height',
    icon: '📐',
    min: 0.3,
    max: 2,
    step: 0.1,
    get: (p) => p.flameContour.height,
    set: (p, v) => ({ ...p, flameContour: { ...p.flameContour, height: v } }),
  },
];

export function AuraModifierPanel({ params, onModify, onHover }: AuraModifierPanelProps) {
  const [values, setValues] = useState<Record<string, number>>({});

  useEffect(() => {
    const initial: Record<string, number> = {};
    SLIDERS.forEach((s) => {
      initial[s.key] = s.get(params);
    });
    setValues(initial);
  }, [params]);

  const handleChange = useCallback(
    (slider: SliderDef, val: number) => {
      setValues((prev) => ({ ...prev, [slider.key]: val }));
      const updated = slider.set(params, val);
      onModify(updated);
    },
    [params, onModify],
  );

  return (
    <motion.div
      className="aura-modifiers"
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 1.8, type: 'spring', stiffness: 120, damping: 18 }}
    >
      <div className="aura-modifiers__title">AURA MODIFIERS</div>

      <div className="aura-modifiers__list">
        {SLIDERS.map((s) => {
          const val = values[s.key] ?? s.get(params);
          const pct = ((val - s.min) / (s.max - s.min)) * 100;

          return (
            <div key={s.key} className="aura-modifiers__item">
              <label className="aura-modifiers__label">
                <span className="aura-modifiers__icon">{s.icon}</span>
                {s.label}
              </label>
              <div className="aura-modifiers__slider-wrap">
                <input
                  type="range"
                  className="aura-modifiers__slider"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={val}
                  onChange={(e) => handleChange(s, parseFloat(e.target.value))}
                  onMouseEnter={onHover}
                  style={{ '--slider-pct': `${pct}%` } as React.CSSProperties}
                />
                <span className="aura-modifiers__value">{val.toFixed(1)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

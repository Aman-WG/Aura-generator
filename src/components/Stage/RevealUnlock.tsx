import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SainathConfig } from '../../sainath-engine/types';
import type { AuraError } from '../../hooks/useSynthesizer';
import { SainathAuraCanvas } from './SainathAuraCanvas';
import { AuraModifierPanel, type SainathModifiers } from './AuraModifierPanel';

interface RevealUnlockProps {
  onEquip: () => void;
  onHover?: () => void;
  onModifyParams?: (mods: SainathModifiers) => void;
  avatarImageUrl?: string;
  auraConfig: SainathConfig | null;
  auraError: AuraError | null;
}

const SPARKLE_COUNT = 14;

/**
 * Choreography:
 *  0ms        – character+aura bounce in at screen center (0→150%→100%)
 *               windmill halo spins behind
 *  0–1200ms   – "wow" hold at center, nothing else visible
 *  1200ms     – character+aura smoothly slide right & scale down
 *               windmill fades out
 *  ~1600ms    – modifier panel slides in from left, CTAs appear below character
 */
const CENTER_HOLD_MS = 1200;
const SLIDE_DURATION_S = 0.5;

const sparkles = Array.from({ length: SPARKLE_COUNT }, (_, i) => {
  const angle = (360 / SPARKLE_COUNT) * i;
  const radius = 38 + Math.random() * 28;
  const size = 3 + Math.random() * 4;
  const delay = Math.random() * 2;
  return { angle, radius, size, delay, id: i };
});

export function RevealUnlock({ onEquip, onHover, onModifyParams, avatarImageUrl, auraConfig, auraError }: RevealUnlockProps) {
  const [settled, setSettled] = useState(false);
  const [mods, setMods] = useState<SainathModifiers | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), CENTER_HOLD_MS);
    return () => clearTimeout(t);
  }, []);

  const handleModify = (m: SainathModifiers) => {
    setMods(m);
    onModifyParams?.(m);
  };

  const effectiveConfig = auraConfig
    ? (() => {
        if (!mods) return auraConfig;
        const cfg: SainathConfig = JSON.parse(JSON.stringify(auraConfig));
        const t = mods.nature / 100;
        cfg.outerShape.smoothness = 0.05 + t * 0.9;
        cfg.outerShape.jaggedness = 0.9 - t * 0.75;
        cfg.outerShape.speed = mods.speed;
        return cfg;
      })()
    : null;

  const glowColor = auraConfig?.glowColor || '#a855f7';

  const avatarDropShadow = useMemo(() => {
    if (!auraConfig) return 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))';
    return `drop-shadow(0 0 30px ${glowColor}) drop-shadow(0 0 60px ${glowColor}80) drop-shadow(0 8px 16px rgba(0,0,0,0.6))`;
  }, [auraConfig, glowColor]);

  return (
    <motion.div
      className="reveal-unlock"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dark overlay */}
      <motion.div
        className="reveal-unlock__dim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* ─── Character+Aura — centered then slides right ─── */}
      <div className="reveal-unlock__hero-wrap">
        <motion.div
          className="reveal-unlock__hero"
          initial={{ x: 0, scale: 1 }}
          animate={{
            x: settled ? '18vw' : 0,
            scale: settled ? 0.82 : 1,
          }}
          transition={{
            duration: SLIDE_DURATION_S,
            ease: [0.42, 0, 0.58, 1],
          }}
        >
          {/* Windmill halo — fades out when settled */}
          <motion.div
            className="reveal-unlock__windmill"
            initial={{ opacity: 0, scale: 0.3, rotate: 0 }}
            animate={{
              opacity: settled ? 0 : [0, 0.8, 0.6],
              scale: settled ? 0.6 : [0.3, 1.3, 1.1],
              rotate: 360,
            }}
            transition={{
              opacity: { duration: settled ? 0.4 : 0.8, ease: 'easeOut' },
              scale: { duration: settled ? 0.4 : 0.9, type: 'spring', stiffness: 60, damping: 14 },
              rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
            }}
          />
          <motion.div
            className="reveal-unlock__windmill reveal-unlock__windmill--alt"
            initial={{ opacity: 0, scale: 0.3, rotate: 30 }}
            animate={{
              opacity: settled ? 0 : [0, 0.5, 0.35],
              scale: settled ? 0.6 : [0.3, 1.4, 1.2],
              rotate: -330,
            }}
            transition={{
              opacity: { duration: settled ? 0.35 : 1, ease: 'easeOut' },
              scale: { duration: settled ? 0.35 : 1, type: 'spring', stiffness: 50, damping: 14 },
              rotate: { duration: 18, repeat: Infinity, ease: 'linear' },
            }}
          />

          {/* Subtle rays — persist after settle */}
          <motion.div
            className="reveal-unlock__rays"
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{
              opacity: settled ? 0.2 : 0.45,
              scale: settled ? 0.85 : 1.1,
              rotate: 360,
            }}
            transition={{
              opacity: { duration: 0.8, ease: 'easeOut' },
              scale: { duration: 0.8, type: 'spring', stiffness: 50, damping: 12 },
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            }}
          />

          {/* Aura canvas */}
          {effectiveConfig && (
            <div className="reveal-unlock__center-aura">
              <SainathAuraCanvas
                config={effectiveConfig}
                speedMultiplier={mods?.speed ?? 1.0}
                sizeMultiplier={mods?.particleSize ?? 1.0}
                densityMultiplier={mods?.density ?? 1.0}
                movementOverride={mods?.movement ?? null}
              />
            </div>
          )}

          {/* Character with bounce entrance */}
          <motion.div
            className="reveal-unlock__character"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: [0, 1.5, 1] }}
            transition={{
              opacity: { duration: 0.15 },
              scale: {
                duration: 0.5,
                times: [0, 0.6, 1],
                ease: [0.22, 1, 0.36, 1],
              },
            }}
          >
            <motion.img
              src={avatarImageUrl || '/sprites/qbit-reveal.png'}
              alt="Qbit with Aura"
              className="reveal-unlock__img"
              draggable={false}
              style={{ filter: avatarDropShadow }}
              animate={{ y: [0, -6, 0, 4, 0] }}
              transition={{
                delay: 2,
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          {/* Sparkles */}
          <div className="reveal-unlock__particles">
            {sparkles.map((s) => (
              <motion.div
                key={s.id}
                className="reveal-unlock__sparkle"
                style={{
                  width: s.size,
                  height: s.size,
                  left: `calc(50% + ${Math.cos((s.angle * Math.PI) / 180) * s.radius}%)`,
                  top: `calc(50% + ${Math.sin((s.angle * Math.PI) / 180) * s.radius}%)`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                transition={{
                  delay: 0.1 + s.delay * 0.3,
                  duration: 1.4,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 1.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── Left panel — only mounts after settled ─── */}
      <AnimatePresence>
        {settled && auraConfig && (
          <motion.div
            className="reveal-unlock__panel-dock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <AuraModifierPanel
              config={auraConfig}
              onModify={handleModify}
              onHover={onHover}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CTAs — only mount after settled ─── */}
      <AnimatePresence>
        {settled && (
          <motion.div
            className="reveal-unlock__cta-dock"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 18 }}
          >
            <span className="reveal-unlock__cta-hint">Done tweaking? Lock it in.</span>
            <button className="pixel-btn" onClick={onEquip} onMouseEnter={onHover}>
              Save &amp; Exit
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

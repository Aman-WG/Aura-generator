import { motion } from 'framer-motion';
import type { AuraParams } from '../../aura-engine/types';
import type { AuraError } from '../../hooks/useSynthesizer';
import { AuraCanvas } from './AuraCanvas';
import { AuraModifierPanel } from './AuraModifierPanel';

interface RevealUnlockProps {
  onEquip: () => void;
  onRetry: () => void;
  onHover?: () => void;
  onModifyParams?: (updated: AuraParams) => void;
  avatarImageUrl?: string;
  auraParams: AuraParams | null;
  auraError: AuraError | null;
}

const SPARKLE_COUNT = 14;

const sparkles = Array.from({ length: SPARKLE_COUNT }, (_, i) => {
  const angle = (360 / SPARKLE_COUNT) * i;
  const radius = 38 + Math.random() * 28;
  const size = 3 + Math.random() * 4;
  const delay = Math.random() * 2;
  return { angle, radius, size, delay, id: i };
});

export function RevealUnlock({ onEquip, onRetry, onHover, onModifyParams, avatarImageUrl, auraParams, auraError }: RevealUnlockProps) {
  const auraName = auraParams?.auraName;
  const isFallback = auraError?.source === 'fallback';

  return (
    <motion.div
      className="reveal-unlock"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Full-screen dim overlay */}
      <motion.div
        className="reveal-unlock__dim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* Two-column layout */}
      <div className="reveal-unlock__layout">

        {/* LEFT — Aura Modifier Controls */}
        <div className="reveal-unlock__left">
          {auraParams && onModifyParams && (
            <AuraModifierPanel
              params={auraParams}
              onModify={onModifyParams}
              onHover={onHover}
            />
          )}
        </div>

        {/* RIGHT — Character + Aura + CTAs */}
        <div className="reveal-unlock__right">
          <div className="reveal-unlock__character-area">
            {/* Rotating light rays */}
            <motion.div
              className="reveal-unlock__rays"
              initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
              animate={{ opacity: [0, 0.7, 0.5], scale: 1.2, rotate: 360 }}
              transition={{
                opacity: { duration: 1.2, delay: 0.2, ease: 'easeOut' },
                scale: { duration: 1, delay: 0.2, type: 'spring', stiffness: 50, damping: 12 },
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
              }}
            />

            <motion.div
              className="reveal-unlock__rays reveal-unlock__rays--alt"
              initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
              animate={{ opacity: [0, 0.4, 0.3], scale: 1.3, rotate: -315 }}
              transition={{
                opacity: { duration: 1.4, delay: 0.3, ease: 'easeOut' },
                scale: { duration: 1.2, delay: 0.3, type: 'spring', stiffness: 40, damping: 12 },
                rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
              }}
            />

            {!auraParams && (
              <motion.div
                className="reveal-unlock__glow"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.7], scale: [0, 1.6, 1.1] }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            )}

            {auraParams && (
              <AuraCanvas
                params={auraParams}
                width={400}
                height={440}
                frontOpacity={0.18}
                backZIndex={1}
                frontZIndex={4}
              />
            )}

            {/* Character — zooms in center, then slides right is handled by parent layout */}
            <motion.div
              className="reveal-unlock__character"
              initial={{ opacity: 0, scale: 0.15, y: 60 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: 0.5,
                type: 'spring',
                stiffness: 160,
                damping: 12,
                mass: 0.8,
              }}
            >
              <motion.img
                src={avatarImageUrl || '/sprites/qbit-reveal.png'}
                alt="Qbit with Aura"
                className="reveal-unlock__img"
                draggable={false}
                animate={{ y: [0, -6, 0, 4, 0] }}
                transition={{
                  delay: 1.5,
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
                    animationDelay: `${s.delay}s`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
                  transition={{
                    delay: 1 + s.delay,
                    duration: 1.8,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 1.5,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Aura name + CTAs stacked below character */}
          <motion.div
            className="reveal-unlock__cta-stack"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.6, type: 'spring', stiffness: 150, damping: 18 }}
          >
            <div className="reveal-unlock__line1">
              {auraName || 'Aura Generated Successfully'}
            </div>

            {isFallback && (
              <div className="reveal-unlock__fallback-notice">
                {auraError?.error || 'AI unavailable — showing element-based aura'}
              </div>
            )}

            <button className="pixel-btn" onClick={onEquip} onMouseEnter={onHover}>
              Equip Aura
            </button>
            <button className="pixel-btn pixel-btn--ghost" onClick={onRetry} onMouseEnter={onHover}>
              Retry
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

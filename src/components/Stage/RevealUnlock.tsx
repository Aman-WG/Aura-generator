import { motion } from 'framer-motion';
import type { AuraParams } from '../../aura-engine/types';
import type { AuraError } from '../../hooks/useSynthesizer';
import { AuraCanvas } from './AuraCanvas';

interface RevealUnlockProps {
  onEquip: () => void;
  onRetry: () => void;
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

export function RevealUnlock({ onEquip, onRetry, avatarImageUrl, auraParams, auraError }: RevealUnlockProps) {
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

      {/* Center stage */}
      <div className="reveal-unlock__center">
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

        {/* Secondary rays (counter-rotate, slower) */}
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

        {/* Radial glow burst — hidden when aura canvas provides its own */}
        {!auraParams && (
          <motion.div
            className="reveal-unlock__glow"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0.7], scale: [0, 1.6, 1.1] }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        {/* Pulsing glow ring — hidden when aura canvas provides its own */}
        {!auraParams && (
          <motion.div
            className="reveal-unlock__pulse-ring"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.6, 0.3, 0.5, 0.3], scale: [0.5, 1, 1.05, 0.98, 1.02] }}
            transition={{
              delay: 0.8,
              duration: 3,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Aura canvas — scaled to match 80% character, still larger than container for soft fade */}
        {auraParams && (
          <AuraCanvas
            params={auraParams}
            width={460}
            height={504}
            frontOpacity={0.18}
            backZIndex={1}
            frontZIndex={4}
          />
        )}

        {/* Character image — the hero moment */}
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

        {/* Sparkle particles */}
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

      {/* Title + CTAs */}
      <div className="reveal-unlock__footer">
        <motion.div
          className="reveal-unlock__line1"
          initial={{ y: 40, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{
            delay: 1.6,
            type: 'spring',
            stiffness: 180,
            damping: 16,
          }}
        >
          {auraName || 'Aura Generated Successfully'}
        </motion.div>

        {isFallback && (
          <motion.div
            className="reveal-unlock__fallback-notice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0, duration: 0.5 }}
          >
            {auraError?.error || 'AI unavailable — showing element-based aura'}
          </motion.div>
        )}

        <motion.div
          className="reveal-unlock__actions"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 2.2,
            type: 'spring',
            stiffness: 150,
            damping: 18,
          }}
        >
          <button className="pixel-btn" onClick={onEquip}>
            Equip Aura
          </button>
          <button className="pixel-btn pixel-btn--ghost" onClick={onRetry}>
            Retry
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

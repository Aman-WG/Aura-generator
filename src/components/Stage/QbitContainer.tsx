import { motion } from 'framer-motion';
import type { Phase } from '../../types';
import { PHASE } from '../../constants/phases';
import { AuraLayer } from './AuraLayer';

interface QbitContainerProps {
  phase: Phase;
}

const floatAnimation = {
  y: [0, -8, 0, 6, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

const pulseVariants = {
  [PHASE.IDLE]: {
    boxShadow: [
      '0 0 20px rgba(0, 255, 136, 0.2)',
      '0 0 40px rgba(0, 255, 136, 0.4)',
      '0 0 20px rgba(0, 255, 136, 0.2)',
    ],
  },
  [PHASE.BLUEPRINT]: {
    boxShadow: [
      '0 0 20px rgba(0, 180, 255, 0.3)',
      '0 0 50px rgba(0, 180, 255, 0.5)',
      '0 0 20px rgba(0, 180, 255, 0.3)',
    ],
  },
  [PHASE.PROCESSING]: {
    boxShadow: [
      '0 0 30px rgba(255, 50, 50, 0.5)',
      '0 0 80px rgba(255, 150, 0, 0.7)',
      '0 0 30px rgba(255, 50, 50, 0.5)',
    ],
  },
  [PHASE.REVEAL]: {
    boxShadow: [
      '0 0 40px rgba(255, 215, 0, 0.4)',
      '0 0 100px rgba(255, 215, 0, 0.8)',
      '0 0 40px rgba(255, 215, 0, 0.4)',
    ],
  },
};

/**
 * QbitContainer — The central "character" pod on stage.
 * Houses the Qbit sprite area and the AuraLayer.
 * Drop a transparent PNG sprite inside .qbit-sprite-slot.
 *
 * Tip for artwork:
 *   Export characters as PNGs with transparent backgrounds.
 *   Recommended size: 400x400px or larger (will be CSS-constrained).
 *   Place files in /public/sprites/ and reference via <img src="/sprites/qbit.png" />
 */
export function QbitContainer({ phase }: QbitContainerProps) {
  return (
    <motion.div
      className="qbit-container"
      animate={{
        ...floatAnimation,
        ...pulseVariants[phase],
      }}
      transition={{
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        },
        y: floatAnimation.transition,
      }}
    >
      {/* Aura glow renders behind the sprite */}
      <AuraLayer phase={phase} />

      {/* Sprite slot — drop your character art here */}
      <div className="qbit-sprite-slot">
        <QbitPlaceholder phase={phase} />
      </div>
    </motion.div>
  );
}

function QbitPlaceholder({ phase }: { phase: Phase }) {
  const phaseColor = {
    [PHASE.IDLE]: '#00ff88',
    [PHASE.BLUEPRINT]: '#00b4ff',
    [PHASE.PROCESSING]: '#ff6600',
    [PHASE.REVEAL]: '#ffd700',
  };

  return (
    <motion.div
      className="qbit-placeholder"
      animate={{
        borderColor: phaseColor[phase],
        color: phaseColor[phase],
      }}
      transition={{ duration: 0.5 }}
    >
      <div className="qbit-placeholder__face">
        <span className="qbit-eye">◉</span>
        <span className="qbit-eye">◉</span>
      </div>
      <div className="qbit-placeholder__label">Q-BIT</div>
    </motion.div>
  );
}

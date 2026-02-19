import { motion, AnimatePresence } from 'framer-motion';
import type { Phase } from '../../types';
import { PHASE } from '../../constants/phases';

interface AuraLayerProps {
  phase: Phase;
  /** Swap this renderer to switch between Lottie / Rive / raw code */
  children?: React.ReactNode;
}

/**
 * AuraLayer — The visual aura that lives inside the Qbit container.
 *
 * Architecture note:
 *   Right now this renders a placeholder glow. To add Lottie:
 *     import Lottie from 'lottie-react';
 *     <Lottie animationData={yourAuraJson} loop />
 *
 *   To swap for Rive later, just replace the children or the
 *   placeholder below. The container sizing stays the same.
 */
export function AuraLayer({ phase, children }: AuraLayerProps) {
  const isVisible = phase === PHASE.REVEAL || phase === PHASE.PROCESSING;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="aura-layer"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{
            opacity: 1,
            scale: [1, 1.05, 0.97, 1.02, 1],
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{
            duration: 0.8,
            scale: {
              duration: 2,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            },
          }}
        >
          {children || <DefaultAuraGlow />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DefaultAuraGlow() {
  return (
    <div className="default-aura-glow">
      <div className="aura-ring aura-ring--outer" />
      <div className="aura-ring aura-ring--mid" />
      <div className="aura-ring aura-ring--inner" />
      <div className="aura-core-dot" />
    </div>
  );
}

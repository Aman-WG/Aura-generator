import { motion } from 'framer-motion';
import type { Phase } from '../../types';
import { DialogueBox } from './DialogueBox';
import { InteractionArea } from './InteractionArea';

interface ConsoleProps {
  phase: Phase;
  displayedLines: string[];
  isTyping: boolean;
  isTypingComplete: boolean;
  onGenerateAura: (prompt: string) => void;
  onHover?: () => void;
  coinBalance?: number | null;
  generateCost: number;
  canAffordGeneration: boolean;
}

export function Console({
  phase,
  displayedLines,
  isTyping,
  isTypingComplete,
  onGenerateAura,
  onHover,
  coinBalance,
  generateCost,
  canAffordGeneration,
}: ConsoleProps) {
  return (
    <motion.div
      className="console"
      layout
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        y: { type: 'spring', stiffness: 170, damping: 22, mass: 0.8 },
        opacity: { duration: 0.3 },
        layout: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      <motion.div className="console__body" layout transition={{ layout: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}>
        <DialogueBox lines={displayedLines} isTyping={isTyping} />
        <InteractionArea
          phase={phase}
          isTypingComplete={isTypingComplete}
          onGenerateAura={onGenerateAura}
          onHover={onHover}
          coinBalance={coinBalance}
          generateCost={generateCost}
          canAffordGeneration={canAffordGeneration}
        />
      </motion.div>
    </motion.div>
  );
}

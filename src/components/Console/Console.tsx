import { motion } from 'framer-motion';
import type { Phase } from '../../types';
import { PHASE } from '../../constants/phases';
import { DialogueBox } from './DialogueBox';
import { InteractionArea } from './InteractionArea';

interface ConsoleProps {
  phase: Phase;
  displayedLines: string[];
  isTyping: boolean;
  isTypingComplete: boolean;
  onInitiate: () => void;
  onSelectElement: (element: string) => void;
  onSelectEnergy: (energy: string) => void;
  onGenerateAura: (chaos: string) => void;
  onHover?: () => void;
}

export function Console({
  phase,
  displayedLines,
  isTyping,
  isTypingComplete,
  onInitiate,
  onSelectElement,
  onSelectEnergy,
  onGenerateAura,
  onHover,
}: ConsoleProps) {
  const isRow = phase === PHASE.IDLE;

  return (
    <motion.div
      className="console"
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        y: { type: 'spring', stiffness: 170, damping: 22, mass: 0.8 },
        opacity: { duration: 0.3 },
      }}
    >
      <div className={`console__body ${isRow ? 'console__body--row' : ''}`}>
        <DialogueBox lines={displayedLines} isTyping={isTyping} />
        <InteractionArea
          phase={phase}
          isTypingComplete={isTypingComplete}
          onInitiate={onInitiate}
          onSelectElement={onSelectElement}
          onSelectEnergy={onSelectEnergy}
          onGenerateAura={onGenerateAura}
          onHover={onHover}
        />
      </div>
    </motion.div>
  );
}

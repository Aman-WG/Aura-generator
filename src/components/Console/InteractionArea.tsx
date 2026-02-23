import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Phase } from '../../types';
import { PHASE } from '../../constants/phases';

const PROMPT_LIMIT = 30;

const PLACEHOLDERS = [
  'A blazing phoenix made of liquid gold...',
  'Frozen lightning crackling with neon sparks...',
  'Dark matter swirling like a cosmic whirlpool...',
  'Cherry blossom petals caught in a purple storm...',
  'Radioactive slime dripping with electric green fire...',
  'Crystal shards orbiting like Saturn\'s rings...',
];

const PRESETS = [
  { label: '🔥 Dragon Ball Super Saiyan', prompt: 'Golden Super Saiyan aura with explosive energy waves' },
  { label: '🌀 Jujutsu Kaisen Cursed Energy', prompt: 'Dark purple cursed energy aura with swirling black sparks' },
  { label: '❄️ Frozen Void Storm', prompt: 'Icy blue void aura with crystalline shards and freezing mist' },
];

interface InteractionAreaProps {
  phase: Phase;
  isTypingComplete: boolean;
  onInitiate: () => void;
  onGenerateAura: (prompt: string) => void;
  onHover?: () => void;
}

const slideIn = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
};

export function InteractionArea({
  phase,
  isTypingComplete,
  onInitiate,
  onGenerateAura,
  onHover,
}: InteractionAreaProps) {
  return (
    <div className="interaction-area">
      <AnimatePresence mode="wait">
        {phase === PHASE.IDLE && isTypingComplete && (
          <motion.div key="idle" className="interaction-area__content interaction-area__content--center" {...slideIn}>
            <motion.button
              className="pixel-btn pixel-btn--lg"
              onClick={onInitiate}
              onMouseEnter={onHover}
              whileHover={{ scale: 1.06, y: -3 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <span style={{ fontSize: '1.8em', lineHeight: 1 }}>☢</span> INITIATE AURA GENERATION <span style={{ fontSize: '1.8em', lineHeight: 1 }}>☢</span>
            </motion.button>
          </motion.div>
        )}

        {phase === PHASE.PROMPT && isTypingComplete && (
          <motion.div key="prompt" className="interaction-area__content" {...slideIn}>
            <PromptInputUI onGenerate={onGenerateAura} onHover={onHover} />
          </motion.div>
        )}

        {phase === PHASE.PROCESSING && (
          <motion.div key="processing" className="interaction-area__content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="processing-bar"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 10, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PromptInputUI({ onGenerate, onHover }: { onGenerate: (prompt: string) => void; onHover?: () => void }) {
  const [text, setText] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > PROMPT_LIMIT;

  const handleSubmit = () => {
    if (overLimit) return;
    onGenerate(text.trim() || 'pure chaos energy');
  };

  return (
    <div className="prompt-ui">
      <div className="prompt-ui__row">
        <div className="prompt-ui__input-wrap">
          <input
            type="text"
            className="prompt-ui__input"
            placeholder={PLACEHOLDERS[placeholderIdx]}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            autoFocus
          />
          <span className={`prompt-ui__wc ${overLimit ? 'prompt-ui__wc--over' : ''}`}>
            {wordCount}/{PROMPT_LIMIT}
          </span>
        </div>
        <motion.button
          className="pixel-btn pixel-btn--sm"
          onClick={handleSubmit}
          onMouseEnter={onHover}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          GENERATE
        </motion.button>
      </div>

      <div className="prompt-ui__presets">
        {PRESETS.map((p) => (
          <motion.button
            key={p.prompt}
            className="prompt-ui__chip"
            onClick={() => onGenerate(p.prompt)}
            onMouseEnter={onHover}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            {p.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Phase } from '../../types';
import { PHASE } from '../../constants/phases';
import { checkPrompt } from '../../utils/contentFilter';

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
  onGenerateAura: (prompt: string) => void;
  onHover?: () => void;
  coinBalance?: number | null;
  generateCost: number;
  canAffordGeneration: boolean;
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
  onGenerateAura,
  onHover,
  coinBalance,
  generateCost,
  canAffordGeneration,
}: InteractionAreaProps) {
  return (
    <div className="interaction-area">
      <AnimatePresence mode="wait">
        {phase === PHASE.PROMPT && isTypingComplete && (
          <motion.div key="prompt" className="interaction-area__content" {...slideIn}>
            <PromptInputUI
              onGenerate={onGenerateAura}
              onHover={onHover}
              generateCost={generateCost}
              canAffordGeneration={canAffordGeneration}
              coinBalance={coinBalance}
            />
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

function PromptInputUI({
  onGenerate,
  onHover,
  generateCost,
  canAffordGeneration,
  coinBalance,
}: {
  onGenerate: (prompt: string) => void;
  onHover?: () => void;
  generateCost: number;
  canAffordGeneration: boolean;
  coinBalance?: number | null;
}) {
  const [text, setText] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));
  const [hasError, setHasError] = useState(false);
  const [stopCycling, setStopCycling] = useState(false);
  const hasWallet = typeof coinBalance === 'number';

  useEffect(() => {
    if (stopCycling) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [stopCycling]);

  useEffect(() => {
    if (hasError) setHasError(false);
  }, [text]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > PROMPT_LIMIT;

  const handleSubmit = () => {
    if (overLimit || !canAffordGeneration) return;
    const prompt = text.trim() || 'pure chaos energy';
    const result = checkPrompt(prompt);
    if (!result.ok) {
      setHasError(true);
      return;
    }
    setHasError(false);
    onGenerate(prompt);
  };

  return (
    <div className="prompt-ui">
      <div className="prompt-ui__row">
        <div className="prompt-ui__left">
          <div className="prompt-ui__input-wrap">
            <input
              type="text"
              className={`prompt-ui__input${hasError ? ' prompt-ui__input--error' : ''}`}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              value={text}
              onChange={(e) => { setText(e.target.value); setStopCycling(true); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              autoFocus
            />
            <span className={`prompt-ui__wc ${overLimit ? 'prompt-ui__wc--over' : ''}`}>
              {wordCount}/{PROMPT_LIMIT}
            </span>
          </div>

          <div className="prompt-ui__presets">
        {PRESETS.map((p) => (
          <motion.button
            key={p.prompt}
            className={`prompt-ui__chip ${text === p.prompt ? 'prompt-ui__chip--active' : ''}`}
            onClick={() => {
              if (text === p.prompt) {
                setText('');
                setStopCycling(false);
              } else {
                setText(p.prompt);
                setStopCycling(true);
              }
            }}
            onMouseEnter={onHover}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            {p.label}
          </motion.button>
        ))}
          </div>
        </div>

        <div className="prompt-ui__generate-wrap">
          <motion.button
            className={`pixel-btn pixel-btn--generate ${!canAffordGeneration ? 'pixel-btn--disabled' : ''}`}
            onClick={handleSubmit}
            onMouseEnter={canAffordGeneration ? onHover : undefined}
            disabled={!canAffordGeneration}
            whileHover={canAffordGeneration ? { scale: 1.06, y: -2 } : undefined}
            whileTap={canAffordGeneration ? { scale: 0.94 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <span className="generate-btn__label">GENERATE</span>
            <span className="generate-btn__cost-pill">
              <span className="generate-btn__coin-icon" aria-hidden="true" />
              <span>{generateCost.toLocaleString()}</span>
            </span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {hasError ? (
          <motion.div
            key="error"
            className="prompt-ui__error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            Content flagged — try a different prompt.
          </motion.div>
        ) : hasWallet && !canAffordGeneration ? (
          <motion.div key="wallet" className="prompt-ui__wallet-warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Not enough coins. You need {(generateCost - (coinBalance ?? 0)).toLocaleString()} more to generate.
          </motion.div>
        ) : (
          <motion.div key="disclaimer" className="prompt-ui__disclaimer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Prompts are logged and visible to your teacher. Keep it legendary, not sus.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

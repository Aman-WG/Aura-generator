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
  onInitiate: () => void;
  onGenerateAura: (prompt: string) => void;
  onHover?: () => void;
  onPromptError?: (msg: string | null) => void;
  coinBalance?: number | null;
  initiateCost: number;
  canAffordInitiation: boolean;
  isInitiatingCharge: boolean;
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
  onPromptError,
  coinBalance,
  initiateCost,
  canAffordInitiation,
  isInitiatingCharge,
}: InteractionAreaProps) {
  const hasWallet = typeof coinBalance === 'number';
  const shortfall = hasWallet ? Math.max(0, initiateCost - coinBalance) : 0;

  return (
    <div className="interaction-area">
      <AnimatePresence mode="wait">
        {phase === PHASE.IDLE && isTypingComplete && (
          <motion.div key="idle" className="interaction-area__content interaction-area__content--center" {...slideIn}>
            <div className="idle-cta">
              <AnimatePresence>
                {isInitiatingCharge && (
                  <motion.div
                    className="idle-cta__debit"
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.95 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      x: [0, 42, 120, 220],
                      y: [0, -18, -54, -138],
                      scale: [0.95, 1.04, 0.98, 0.86],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: 'easeOut', times: [0, 0.2, 0.6, 1] }}
                  >
                    <span className="idle-cta__debit-burst">- {initiateCost.toLocaleString()} COINS</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                className={`pixel-btn pixel-btn--lg ${(!canAffordInitiation || isInitiatingCharge) ? 'pixel-btn--disabled' : ''}`}
                onClick={onInitiate}
                onMouseEnter={canAffordInitiation && !isInitiatingCharge ? onHover : undefined}
                disabled={!canAffordInitiation || isInitiatingCharge}
                whileHover={canAffordInitiation && !isInitiatingCharge ? { scale: 1.06, y: -3 } : undefined}
                whileTap={canAffordInitiation && !isInitiatingCharge ? { scale: 0.94 } : undefined}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <span style={{ fontSize: '1.8em', lineHeight: 1 }}>☢</span>{' '}
                {isInitiatingCharge
                  ? `DEBITING ${initiateCost.toLocaleString()} COINS...`
                  : `INITIATE AURA GENERATION • ${initiateCost.toLocaleString()} COINS`}{' '}
                <span style={{ fontSize: '1.8em', lineHeight: 1 }}>☢</span>
              </motion.button>

              {hasWallet && !canAffordInitiation && (
                <div className="interaction-hint interaction-hint--warning">
                  You need {shortfall.toLocaleString()} more coins before the lab can synthesize your aura.
                </div>
              )}

              {hasWallet && canAffordInitiation && !isInitiatingCharge && (
                <div className="interaction-hint">
                  Your wallet will be charged the moment the generator boots up.
                </div>
              )}

              {!hasWallet && !isInitiatingCharge && (
                <div className="interaction-hint">
                  Aura generation costs {initiateCost.toLocaleString()} coins when launched from the shop.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {phase === PHASE.PROMPT && isTypingComplete && (
          <motion.div key="prompt" className="interaction-area__content" {...slideIn}>
            <PromptInputUI onGenerate={onGenerateAura} onHover={onHover} onPromptError={onPromptError} />
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

function PromptInputUI({ onGenerate, onHover, onPromptError }: { onGenerate: (prompt: string) => void; onHover?: () => void; onPromptError?: (msg: string | null) => void }) {
  const [text, setText] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasError) {
      setHasError(false);
      onPromptError?.(null);
    }
  }, [text]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > PROMPT_LIMIT;

  const handleSubmit = () => {
    if (overLimit) return;
    const prompt = text.trim() || 'pure chaos energy';
    const result = checkPrompt(prompt);
    if (!result.ok) {
      setHasError(true);
      onPromptError?.(result.reason ?? 'Invalid prompt');
      return;
    }
    setHasError(false);
    onPromptError?.(null);
    onGenerate(prompt);
  };

  return (
    <div className="prompt-ui">
      <div className="prompt-ui__row">
        <div className="prompt-ui__input-wrap">
          <input
            type="text"
            className={`prompt-ui__input${hasError ? ' prompt-ui__input--error' : ''}`}
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

      <div className="prompt-ui__disclaimer">
        👀 Heads up — prompts are logged and visible to your teacher. Keep it legendary, not sus.
      </div>
    </div>
  );
}

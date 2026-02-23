import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Phase } from '../../types';
import { PHASE } from '../../constants/phases';

const ELEMENTS = [
  { id: 'fire', label: 'Fire', emoji: '🔥' },
  { id: 'water', label: 'Water', emoji: '💧' },
  { id: 'ice', label: 'Ice', emoji: '❄️' },
  { id: 'slime', label: 'Slime', emoji: '🟢' },
  { id: 'void', label: 'Void', emoji: '🌀' },
];

const ENERGY_FIELDS = [
  { id: 'vortex', label: 'Vortex', emoji: '🌪️' },
  { id: 'sonic', label: 'Sonic', emoji: '🔊' },
  { id: 'explode', label: 'Explode', emoji: '💥' },
  { id: 'pulse', label: 'Pulse', emoji: '💫' },
  { id: 'glitch', label: 'Glitch', emoji: '⚡' },
];

const CHAOS_LIMIT = 20;

interface InteractionAreaProps {
  phase: Phase;
  isTypingComplete: boolean;
  onInitiate: () => void;
  onSelectElement: (element: string) => void;
  onSelectEnergy: (energy: string) => void;
  onGenerateAura: (chaos: string) => void;
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
  onSelectElement,
  onSelectEnergy,
  onGenerateAura,
  onHover,
}: InteractionAreaProps) {
  return (
    <div className="interaction-area">
      <AnimatePresence mode="wait">
        {/* STEP 0: IDLE */}
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

        {/* STEP 1: SELECT BASE ELEMENT */}
        {phase === PHASE.SELECT_ELEMENT && isTypingComplete && (
          <motion.div key="element" className="interaction-area__content" {...slideIn}>
            <div className="pill-row">
              {ELEMENTS.map((el) => (
                <motion.button
                  key={el.id}
                  className="pill-btn"
                  onClick={() => onSelectElement(el.id)}
                  onMouseEnter={onHover}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <span className="pill-btn__emoji">{el.emoji}</span>
                  <span className="pill-btn__label">{el.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2: SELECT ENERGY FIELD */}
        {phase === PHASE.SELECT_ENERGY && isTypingComplete && (
          <motion.div key="energy" className="interaction-area__content" {...slideIn}>
            <div className="pill-row">
              {ENERGY_FIELDS.map((ef) => (
                <motion.button
                  key={ef.id}
                  className="pill-btn"
                  onClick={() => onSelectEnergy(ef.id)}
                  onMouseEnter={onHover}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <span className="pill-btn__emoji">{ef.emoji}</span>
                  <span className="pill-btn__label">{ef.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3: CHAOS INPUT + GENERATE */}
        {phase === PHASE.CHAOS_INPUT && isTypingComplete && (
          <motion.div key="chaos" className="interaction-area__content" {...slideIn}>
            <ChaosInputUI onGenerate={onGenerateAura} onHover={onHover} />
          </motion.div>
        )}

        {/* STEP 4: PROCESSING */}
        {phase === PHASE.PROCESSING && (
          <motion.div key="processing" className="interaction-area__content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="processing-bar"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 4, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChaosInputUI({ onGenerate, onHover }: { onGenerate: (chaos: string) => void; onHover?: () => void }) {
  const [chaos, setChaos] = useState('');

  const wordCount = chaos.trim() ? chaos.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > CHAOS_LIMIT;

  const handleChange = (val: string) => {
    const words = val.trim().split(/\s+/);
    if (words.length <= CHAOS_LIMIT || val.length < chaos.length) {
      setChaos(val);
    }
  };

  return (
    <div className="chaos-ui">
      <div className="chaos-ui__row">
        <div className="chaos-ui__input-wrap">
          <input
            type="text"
            className="chaos-ui__input"
            placeholder="e.g., 'Smells like burnt toast and victory'"
            value={chaos}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !overLimit) onGenerate(chaos.trim() || 'pure chaos');
            }}
            autoFocus
          />
          <span className={`chaos-ui__wc ${overLimit ? 'chaos-ui__wc--over' : ''}`}>
            {wordCount}/{CHAOS_LIMIT}
          </span>
        </div>

        <motion.button
          className="pixel-btn pixel-btn--sm"
          onClick={() => onGenerate(chaos.trim() || 'pure chaos')}
          onMouseEnter={onHover}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          GENERATE AURA
        </motion.button>
      </div>
      <p className="chaos-ui__hint">The weirder, the better. 20 words max.</p>
    </div>
  );
}

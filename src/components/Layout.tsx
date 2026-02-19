import { useMemo, useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Stage } from './Stage';
import { Console } from './Console';
import { IntroSplash } from './IntroSplash';
import { useTypewriter } from '../hooks/useTypewriter';
import { useSound } from '../hooks/useSound';
import { useSynthesizer } from '../hooks/useSynthesizer';
import { PHASE } from '../constants/phases';
import { DIALOGUE } from '../constants/dialogue';

const CONSOLE_ENTRANCE_DELAY = 800;
const TYPEWRITER_START_DELAY = 600;
const GENERATION_DURATION = 10000;
const RETRACT_DURATION = 1500;

/**
 * IDLE -> SELECT_ELEMENT -> SELECT_ENERGY -> CHAOS_INPUT -> PROCESSING -> REVEAL
 *
 * Both robot arms slide in from screen edges and fire on Step 1,
 * then fire again on Step 2.
 */
export function Layout() {
  const synth = useSynthesizer();
  const { play } = useSound();

  const [showIntro, setShowIntro] = useState(true);
  const [showConsole, setShowConsole] = useState(false);
  const [startTyping, setStartTyping] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerFireTrigger, setScannerFireTrigger] = useState(0);
  const [armsEntered, setArmsEntered] = useState(false);
  const [armFireTrigger, setArmFireTrigger] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attemptCount, setAttemptCount] = useState(1);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    const t1 = setTimeout(() => setShowConsole(true), CONSOLE_ENTRANCE_DELAY);
    const t2 = setTimeout(() => setStartTyping(true), CONSOLE_ENTRANCE_DELAY + TYPEWRITER_START_DELAY);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Re-trigger typewriter on phase change
  useEffect(() => {
    if (!showConsole) return;
    setStartTyping(false);
    const t = setTimeout(() => setStartTyping(true), 250);
    return () => clearTimeout(t);
  }, [synth.phase, showConsole]);

  const currentLines = useMemo(() => {
    if (synth.phase === PHASE.IDLE && attemptCount > 1) {
      return [
        `Re-attempting aura generation: Attempt ${attemptCount}`,
        attemptCount === 2
          ? "Previous calibration didn't stick. Let's run it back."
          : attemptCount === 3
            ? 'Persistence detected. The synthesizer remembers you.'
            : "You're practically a lab regular now. Fire when ready.",
      ];
    }
    return DIALOGUE[synth.phase].map((d) => d.text);
  }, [synth.phase, attemptCount]);

  const tw = useTypewriter(currentLines, startTyping, {
    speed: 25,
    lineDelay: 400,
    onLineComplete: () => play('keystroke'),
  });

  // ─── Handlers ──────────────────────────────────────────────

  const handleInitiate = useCallback(() => {
    play('click');
    setScannerVisible(true);
    synth.setPhase(PHASE.SELECT_ELEMENT);
  }, [play, synth]);

  const handleSelectElement = useCallback((element: string) => {
    play('click');
    synth.setElement(element);
    setArmsEntered(true);
    // Delay sprite fire: wait for slide-in + bounce to settle, then 300ms gap
    // Scanner fires in sync with arms
    setTimeout(() => {
      setArmFireTrigger((n) => n + 1);
      setScannerFireTrigger((n) => n + 1);
    }, 1100);
    synth.setPhase(PHASE.SELECT_ENERGY);
  }, [play, synth]);

  const handleSelectEnergy = useCallback((energy: string) => {
    play('click');
    synth.setEnergy(energy);
    // Arms already in position, just a 300ms gap before firing
    // Scanner fires in sync
    setTimeout(() => {
      setArmFireTrigger((n) => n + 1);
      setScannerFireTrigger((n) => n + 1);
    }, 300);
    synth.setPhase(PHASE.CHAOS_INPUT);
  }, [play, synth]);

  const handleGenerateAura = useCallback((chaos: string) => {
    play('glitch');
    synth.setChaos(chaos);
    synth.setPhase(PHASE.PROCESSING);
    synth.setShaking(true);
    setIsGenerating(true);

    setTimeout(() => {
      synth.setShaking(false);
      setIsGenerating(false);
      setScannerVisible(false);
      setArmsEntered(false);

      setTimeout(() => {
        synth.setPhase(PHASE.REVEAL);
      }, RETRACT_DURATION);
    }, GENERATION_DURATION);
  }, [play, synth]);

  const handleEquipAura = useCallback(() => {
    play('click');
  }, [play]);

  const handleRetry = useCallback(() => {
    play('click');
    setAttemptCount((n) => n + 1);
    synth.reset();
    setScannerVisible(false);
    setArmsEntered(false);
    setIsGenerating(false);
  }, [play, synth]);

  const consoleHeight =
    synth.phase === PHASE.CHAOS_INPUT ? '24%'
      : synth.phase === PHASE.SELECT_ELEMENT || synth.phase === PHASE.SELECT_ENERGY ? '22%'
        : '20%';

  const hideConsole = synth.phase === PHASE.REVEAL;

  return (
    <div className="game-viewport">
      <div className="game-window">
        <AnimatePresence>
          {showIntro && <IntroSplash onComplete={handleIntroComplete} />}
        </AnimatePresence>

        <div className="game-window__stage">
          <Stage
            phase={synth.phase}
            isShaking={synth.isShaking}
            scannerVisible={scannerVisible}
            scannerFireTrigger={scannerFireTrigger}
            armsEntered={armsEntered}
            armFireTrigger={armFireTrigger}
            isGenerating={isGenerating}
            onEquipAura={handleEquipAura}
            onRetry={handleRetry}
          />
        </div>

        {showConsole && !hideConsole && (
          <div
            className="game-window__console"
            style={{ height: consoleHeight, transition: 'height 0.4s ease' }}
          >
            <Console
              phase={synth.phase}
              displayedLines={tw.displayedLines}
              isTyping={tw.isTyping}
              isTypingComplete={tw.isComplete}
              onInitiate={handleInitiate}
              onSelectElement={handleSelectElement}
              onSelectEnergy={handleSelectEnergy}
              onGenerateAura={handleGenerateAura}
            />
          </div>
        )}

      </div>
    </div>
  );
}

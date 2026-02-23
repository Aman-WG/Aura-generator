import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Stage } from './Stage';
import { Console } from './Console';
import { IntroSplash } from './IntroSplash';
import { useTypewriter } from '../hooks/useTypewriter';
import { useSound } from '../hooks/useSound';
import { useSynthesizer } from '../hooks/useSynthesizer';
import { useBridge } from '../context/ParentBridgeContext';
import { PHASE } from '../constants/phases';
import { DIALOGUE } from '../constants/dialogue';
import { generateAuraParams, getFallbackParams } from '../aura-engine/aura-ai';

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
  const sfx = useSound();
  const bridge = useBridge();

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

  // Notify parent of every phase transition
  useEffect(() => {
    bridge.sendPhaseChange(synth.phase);
  }, [synth.phase, bridge]);

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
    onChar: () => sfx.typewriterTick(),
    onLineComplete: () => sfx.keystroke(),
  });

  // ─── Handlers ──────────────────────────────────────────────

  const handleInitiate = useCallback(() => {
    sfx.initiate();
    setScannerVisible(true);
    synth.setPhase(PHASE.SELECT_ELEMENT);
  }, [sfx, synth]);

  const handleSelectElement = useCallback((element: string) => {
    sfx.select();
    synth.setElement(element);
    setArmsEntered(true);
    setTimeout(() => {
      sfx.laserBurst();
      setArmFireTrigger((n) => n + 1);
      setScannerFireTrigger((n) => n + 1);
    }, 1100);
    synth.setPhase(PHASE.SELECT_ENERGY);
  }, [sfx, synth]);

  const handleSelectEnergy = useCallback((energy: string) => {
    sfx.select();
    synth.setEnergy(energy);
    setTimeout(() => {
      sfx.laserBurst();
      setArmFireTrigger((n) => n + 1);
      setScannerFireTrigger((n) => n + 1);
    }, 300);
    synth.setPhase(PHASE.CHAOS_INPUT);
  }, [sfx, synth]);

  const aiAbortRef = useRef<AbortController | null>(null);

  const handleGenerateAura = useCallback((chaos: string) => {
    sfx.glitch();
    sfx.startMachine();
    sfx.startLaser();
    sfx.startTension();
    synth.setChaos(chaos);
    synth.setPhase(PHASE.PROCESSING);
    synth.setShaking(true);
    setIsGenerating(true);

    aiAbortRef.current?.abort();
    const abort = new AbortController();
    aiAbortRef.current = abort;

    const element = synth.auraConfig.element ?? 'energy';
    const energy = synth.auraConfig.energy ?? 'surge';
    const savedProvider = localStorage.getItem('aura_provider') ?? 'gemini';
    const apiKey =
      savedProvider === 'portkey'
        ? localStorage.getItem('aura_portkey_key') ?? ''
        : savedProvider === 'openai'
          ? localStorage.getItem('aura_openai_key') ?? ''
          : localStorage.getItem('aura_gemini_key') ?? '';

    const aiPromise = apiKey
      ? generateAuraParams(element, energy, chaos, apiKey, savedProvider as 'gemini' | 'openai' | 'portkey')
      : Promise.resolve({ params: getFallbackParams(element), source: 'fallback' as const, error: undefined });

    const timerPromise = new Promise<void>((r) => setTimeout(r, GENERATION_DURATION));

    Promise.all([aiPromise, timerPromise]).then(([result]) => {
      if (abort.signal.aborted) return;

      sfx.stopMachine();
      sfx.stopLaser();
      sfx.stopTension();
      sfx.shatterReveal();

      synth.setAuraParams(result.params);
      synth.setAuraError({ source: result.source, error: result.error });
      synth.setShaking(false);
      setIsGenerating(false);
      synth.setPhase(PHASE.REVEAL);

      setScannerVisible(false);
      setArmsEntered(false);
    });
  }, [sfx, synth]);

  const handleEquipAura = useCallback(() => {
    sfx.equip();
    bridge.sendEquipped(synth.auraConfig, synth.auraParams ?? undefined);
  }, [sfx, bridge, synth.auraConfig, synth.auraParams]);

  const handleRetry = useCallback(() => {
    sfx.select();
    bridge.sendRetry();
    setAttemptCount((n) => n + 1);
    synth.reset();
    setScannerVisible(false);
    setArmsEntered(false);
    setIsGenerating(false);
  }, [sfx, synth, bridge]);

  const consoleHeight =
    synth.phase === PHASE.CHAOS_INPUT ? '24%'
      : synth.phase === PHASE.SELECT_ELEMENT || synth.phase === PHASE.SELECT_ENERGY ? '22%'
        : '20%';

  const hideConsole = synth.phase === PHASE.REVEAL;

  return (
    <div className="game-viewport">
      <div className="game-window">
        <AnimatePresence>
          {showIntro && <IntroSplash onComplete={handleIntroComplete} onSound={sfx.introWhoosh} />}
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
            onHover={sfx.hover}
            avatarImageUrl={bridge.avatarData?.avatarImageUrl}
            auraParams={synth.auraParams}
            auraError={synth.auraError}
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
              onHover={sfx.hover}
            />
          </div>
        )}

      </div>
    </div>
  );
}

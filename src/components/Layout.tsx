import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Stage } from './Stage';
import { Console } from './Console';
import { IntroSplash } from './IntroSplash';
import { ConfirmExitModal } from './ConfirmExitModal';
import { useTypewriter } from '../hooks/useTypewriter';
import { useSound } from '../hooks/useSound';
import { useSynthesizer } from '../hooks/useSynthesizer';
import { useBridge } from '../context/ParentBridgeContext';
import { PHASE } from '../constants/phases';
import { DIALOGUE } from '../constants/dialogue';
import { generateSainathAura, FALLBACK_CONFIG } from '../sainath-engine/sainath-ai';
import type { SainathConfig } from '../sainath-engine/types';
import type { SainathModifiers } from './Stage/AuraModifierPanel';

const CONSOLE_ENTRANCE_DELAY = 800;
const TYPEWRITER_START_DELAY = 600;
const GENERATION_DURATION = 10000;

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
  const [liveConfig, setLiveConfig] = useState<SainathConfig | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const phaseRef = useRef(synth.phase);
  phaseRef.current = synth.phase;

  // ── Dismiss handling ──
  const requestDismiss = useCallback(() => {
    const phase = phaseRef.current;
    if (phase === PHASE.PROCESSING) {
      bridge.clearCloseRequest();
      return;
    }
    bridge.clearCloseRequest();
    if (phase === PHASE.REVEAL) {
      setShowExitModal(true);
    } else {
      bridge.sendClose();
    }
  }, [bridge]);

  const handleSaveAndExit = useCallback(() => {
    setShowExitModal(false);
    sfx.equip();
    bridge.sendEquipped({ element: null, energy: null, chaosPrompt: synth.prompt }, liveConfig);
  }, [sfx, bridge, synth.prompt, liveConfig]);

  const handleKeepTweaking = useCallback(() => {
    setShowExitModal(false);
  }, []);

  useEffect(() => {
    if (bridge.closeRequested) requestDismiss();
  }, [bridge.closeRequested]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showExitModal) {
        setShowExitModal(false);
        return;
      }
      requestDismiss();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [requestDismiss, showExitModal]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    const t1 = setTimeout(() => setShowConsole(true), CONSOLE_ENTRANCE_DELAY);
    const t2 = setTimeout(() => setStartTyping(true), CONSOLE_ENTRANCE_DELAY + TYPEWRITER_START_DELAY);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    bridge.sendPhaseChange(synth.phase);
  }, [synth.phase, bridge]);

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

  const handleInitiate = useCallback(() => {
    sfx.initiate();
    setScannerVisible(true);
    setArmsEntered(true);
    setTimeout(() => {
      sfx.laserBurst();
      setArmFireTrigger((n) => n + 1);
      setScannerFireTrigger((n) => n + 1);
    }, 1100);
    synth.setPhase(PHASE.PROMPT);
  }, [sfx, synth]);

  const aiAbortRef = useRef<AbortController | null>(null);

  const handleGenerateAura = useCallback((prompt: string) => {
    sfx.glitch();
    sfx.startMachine();
    sfx.startLaser();
    sfx.startTension();

    synth.setPrompt(prompt);
    synth.setPhase(PHASE.PROCESSING);
    synth.setShaking(true);
    setIsGenerating(true);

    setTimeout(() => {
      sfx.laserBurst();
      setArmFireTrigger((n) => n + 1);
      setScannerFireTrigger((n) => n + 1);
    }, 300);

    aiAbortRef.current?.abort();
    const abort = new AbortController();
    aiAbortRef.current = abort;

    const apiKey =
      localStorage.getItem('aura_portkey_key')
      || localStorage.getItem('portkey_api_key')
      || '';

    const aiPromise = apiKey
      ? generateSainathAura(prompt, apiKey)
      : Promise.resolve({ config: FALLBACK_CONFIG, source: 'fallback' as const, error: 'No API key' });

    const timerPromise = new Promise<void>((r) => setTimeout(r, GENERATION_DURATION));

    Promise.all([aiPromise, timerPromise]).then(([result]) => {
      if (abort.signal.aborted) return;

      sfx.stopMachine();
      sfx.stopLaser();
      sfx.stopTension();
      sfx.shatterReveal();

      synth.setAuraConfig(result.config);
      setLiveConfig(result.config);
      synth.setAuraError({ source: result.source, error: result.error });
      synth.setShaking(false);
      setIsGenerating(false);
      synth.setPhase(PHASE.REVEAL);

      setScannerVisible(false);
      setArmsEntered(false);
    });
  }, [sfx, synth]);

  const handleModifyParams = useCallback((_mods: SainathModifiers) => {
    // Modifiers are applied directly in RevealUnlock via SainathAuraCanvas props
  }, []);

  const handleEquipAura = useCallback(() => {
    sfx.equip();
    bridge.sendEquipped({ element: null, energy: null, chaosPrompt: synth.prompt }, undefined);
  }, [sfx, bridge, synth.prompt]);

  const handleRetry = useCallback(() => {
    sfx.select();
    bridge.sendRetry();
    setAttemptCount((n) => n + 1);
    setLiveConfig(null);
    synth.reset();
    setScannerVisible(false);
    setArmsEntered(false);
    setIsGenerating(false);
  }, [sfx, synth, bridge]);

  const consoleHeight = synth.phase === PHASE.PROMPT ? '24%' : '20%';
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
            onModifyParams={handleModifyParams}
            avatarImageUrl={bridge.avatarData?.avatarImageUrl}
            auraConfig={liveConfig}
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
              onGenerateAura={handleGenerateAura}
              onHover={sfx.hover}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showExitModal && (
          <ConfirmExitModal
            onSaveAndExit={handleSaveAndExit}
            onKeepTweaking={handleKeepTweaking}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

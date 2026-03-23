import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Stage } from './Stage';
import { Console } from './Console';
import { IntroSplash } from './IntroSplash';
import { ConfirmExitModal } from './ConfirmExitModal';
import { SpendConfirmModal } from './SpendConfirmModal';
import { useTypewriter } from '../hooks/useTypewriter';
import { useSound } from '../hooks/useSound';
import { useSynthesizer } from '../hooks/useSynthesizer';
import { useBridge } from '../context/ParentBridgeContext';
import { PHASE } from '../constants/phases';
import { DIALOGUE, PROCESSING_LINES } from '../constants/dialogue';
import { generateSainathAura, FALLBACK_CONFIG } from '../sainath-engine/sainath-ai';
import type { SainathConfig } from '../sainath-engine/types';

const CONSOLE_ENTRANCE_DELAY = 0;
const TYPEWRITER_START_DELAY = 300;
const GENERATION_DURATION = 10000;
const GENERATE_COST = 10000;

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
  const [showSpendConfirm, setShowSpendConfirm] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const phaseRef = useRef(synth.phase);
  phaseRef.current = synth.phase;
  const coinBalance =
    typeof bridge.avatarData?.coinBalance === 'number' ? bridge.avatarData.coinBalance : null;
  const canAffordGeneration = coinBalance == null || coinBalance >= GENERATE_COST;

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

  const [processingLine, setProcessingLine] = useState(() =>
    PROCESSING_LINES[Math.floor(Math.random() * PROCESSING_LINES.length)]
  );

  useEffect(() => {
    if (synth.phase !== PHASE.PROCESSING) return;
    setProcessingLine(PROCESSING_LINES[Math.floor(Math.random() * PROCESSING_LINES.length)]);
    const interval = setInterval(() => {
      setProcessingLine((prev) => {
        let next = prev;
        while (next === prev) {
          next = PROCESSING_LINES[Math.floor(Math.random() * PROCESSING_LINES.length)];
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [synth.phase]);

  const currentLines = useMemo(() => {
    if (synth.phase === PHASE.IDLE && attemptCount > 1) {
      return [
        `Aura #${attemptCount} incoming. Synthesizer primed.`,
        attemptCount === 2
          ? "Last one's locked in. Let's cook something new."
          : attemptCount === 3
            ? "Three auras deep. The lab's warming up to you."
            : "You're building a whole collection. Go off.",
      ];
    }
    if (synth.phase === PHASE.PROCESSING) {
      return [processingLine];
    }
    return DIALOGUE[synth.phase].map((d) => d.text);
  }, [synth.phase, attemptCount, processingLine]);

  const tw = useTypewriter(currentLines, startTyping, {
    speed: 25,
    lineDelay: 400,
    onChar: () => sfx.typewriterTick(),
    onLineComplete: () => sfx.keystroke(),
  });

  // Auto-transition from IDLE → PROMPT once greeting dialogue finishes typing
  useEffect(() => {
    if (synth.phase !== PHASE.IDLE || !tw.isComplete) return;
    const t = setTimeout(() => {
      setScannerVisible(true);
      setArmsEntered(true);
      setTimeout(() => {
        sfx.laserBurst();
        setArmFireTrigger((n) => n + 1);
        setScannerFireTrigger((n) => n + 1);
      }, 1100);
      synth.setPhase(PHASE.PROMPT);
    }, 600);
    return () => clearTimeout(t);
  }, [synth.phase, tw.isComplete, sfx, synth]);

  const aiAbortRef = useRef<AbortController | null>(null);

  const handleRequestGenerate = useCallback((prompt: string) => {
    if (!canAffordGeneration) return;
    setPendingPrompt(prompt);
    setShowSpendConfirm(true);
  }, [canAffordGeneration]);

  const handleConfirmGenerate = useCallback(() => {
    setShowSpendConfirm(false);
    const prompt = pendingPrompt;

    // Charge coins on generate
    if (coinBalance != null) {
      bridge.sendSpendCoins(GENERATE_COST, 'aura-generation');
    }
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
  }, [sfx, synth, bridge, coinBalance, pendingPrompt]);

  const handleEquipAura = useCallback(() => {
    sfx.equip();
    bridge.sendEquipped({ element: null, energy: null, chaosPrompt: synth.prompt }, undefined);
  }, [sfx, bridge, synth.prompt]);

  const hideConsole = synth.phase === PHASE.REVEAL;

  return (
    <div className="game-viewport">
      <div className="game-window">
        <AnimatePresence>
          {showIntro && <IntroSplash onComplete={handleIntroComplete} onSound={sfx.introWhoosh} />}
        </AnimatePresence>

        {coinBalance != null && (
          <div className="wallet-hud">
            <span className="wallet-hud__label">STUDENT WALLET</span>
            <span className="wallet-hud__value">◉ {coinBalance.toLocaleString()} coins</span>
          </div>
        )}

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
            onHover={sfx.hover}
            avatarImageUrl={bridge.avatarData?.avatarImageUrl}
            auraConfig={liveConfig}
            auraError={synth.auraError}
          />
        </div>

        {showConsole && !hideConsole && (
          <div className="game-window__console">
            <Console
              phase={synth.phase}
              displayedLines={tw.displayedLines}
              isTyping={tw.isTyping}
              isTypingComplete={tw.isComplete}
              onGenerateAura={handleRequestGenerate}
              onHover={sfx.hover}
              coinBalance={coinBalance}
              generateCost={GENERATE_COST}
              canAffordGeneration={canAffordGeneration}
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

      <AnimatePresence>
        {showSpendConfirm && (
          <SpendConfirmModal
            cost={GENERATE_COST}
            onConfirm={handleConfirmGenerate}
            onCancel={() => setShowSpendConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

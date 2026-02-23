import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Phase, AuraParams } from '../../types';
import type { AuraError } from '../../hooks/useSynthesizer';
import { PHASE } from '../../constants/phases';
import { RoboArm } from './RoboArm';
import { ScannerScreen } from './ScannerScreen';
import { RevealUnlock } from './RevealUnlock';

interface StageProps {
  phase: Phase;
  isShaking: boolean;
  scannerVisible: boolean;
  scannerFireTrigger: number;
  armsEntered: boolean;
  armFireTrigger: number;
  isGenerating: boolean;
  onEquipAura: () => void;
  onRetry: () => void;
  avatarImageUrl?: string;
  auraParams?: AuraParams | null;
  auraError?: AuraError | null;
}

const shakeKeyframes = {
  x: [0, -8, 6, -5, 4, -2, 0],
  y: [0, 4, -6, 5, -3, 1, 0],
  rotate: [0, -0.6, 0.6, -0.4, 0.3, -0.1, 0],
};

export function Stage({ phase, isShaking, scannerVisible, scannerFireTrigger, armsEntered, armFireTrigger, isGenerating, onEquipAura, onRetry, avatarImageUrl, auraParams, auraError }: StageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    const tryPlay = () => {
      video.play().catch(() => {
        const h = () => { video.play(); document.removeEventListener('click', h); };
        document.addEventListener('click', h);
      });
    };
    if (video.readyState >= 2) tryPlay();
    else video.addEventListener('loadeddata', tryPlay, { once: true });
  }, []);

  return (
    <motion.div
      className="stage"
      animate={isShaking ? shakeKeyframes : { x: 0, y: 0, rotate: 0 }}
      transition={
        isShaking
          ? { duration: 0.12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
          : { duration: 0.3, ease: 'easeOut' }
      }
    >
      <div className="stage__bg">
        <video
          ref={videoRef}
          className="stage__video"
          src="/video/lab-bg.mp4"
          autoPlay loop muted playsInline preload="auto"
        />
        <div className="stage__overlay" />
      </div>

      {/* Scanner screen — rises from bottom center on initiate */}
      <ScannerScreen visible={scannerVisible} fireTrigger={scannerFireTrigger} isLooping={isGenerating} />

      {/* Arm mounting rails — the docks the claws extend from */}
      <div className="arm-mount arm-mount--left" />
      <div className="arm-mount arm-mount--right" />

      {/* Dual robot arms — slide in from edges, fire on trigger */}
      <RoboArm side="left" entered={armsEntered} fireTrigger={armFireTrigger} isLooping={isGenerating} />
      <RoboArm side="right" entered={armsEntered} fireTrigger={armFireTrigger} isLooping={isGenerating} />

      <div className="scanlines" />
      <div className="vignette" />

      <AnimatePresence>
        {isShaking && (
          <motion.div
            className="stage__flicker"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0, 0.5, 0, 0.8, 0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === PHASE.REVEAL && <RevealUnlock onEquip={onEquipAura} onRetry={onRetry} avatarImageUrl={avatarImageUrl} auraParams={auraParams ?? null} auraError={auraError ?? null} />}
      </AnimatePresence>
    </motion.div>
  );
}

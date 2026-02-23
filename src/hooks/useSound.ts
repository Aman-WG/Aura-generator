import { useCallback, useRef, useEffect } from 'react';
import { soundManager } from '../sound/SoundManager';

interface UseSoundOptions {
  enabled?: boolean;
}

/**
 * React hook wrapping the ZzFX-based SoundManager.
 * Provides stable callbacks for every sound in the Aura Lab flow
 * and auto-cleans up all looping sounds on unmount.
 */
export function useSound(options: UseSoundOptions = {}) {
  const { enabled = true } = options;
  const machineStopRef = useRef<(() => void) | null>(null);
  const tensionStopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    soundManager.setEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    return () => soundManager.stopAll();
  }, []);

  const hover = useCallback(() => soundManager.playHover(), []);
  const select = useCallback(() => soundManager.playSelectElement(), []);
  const keystroke = useCallback(() => soundManager.playKeystroke(), []);
  const typewriterTick = useCallback(() => soundManager.playTypewriterTick(), []);
  const initiate = useCallback(() => soundManager.playInitiate(), []);
  const glitch = useCallback(() => soundManager.playGlitch(), []);
  const shatterReveal = useCallback(() => soundManager.playShatterReveal(), []);
  const equip = useCallback(() => soundManager.playEquip(), []);
  const introWhoosh = useCallback(() => soundManager.playIntroWhoosh(), []);

  const laserBurst = useCallback(() => soundManager.playLaserBurst(), []);
  const startLaser = useCallback(() => soundManager.startLaser(), []);
  const stopLaser = useCallback(() => soundManager.stopLaser(), []);

  const startMachine = useCallback(() => {
    machineStopRef.current?.();
    machineStopRef.current = soundManager.playMachineLoading();
  }, []);

  const stopMachine = useCallback(() => {
    machineStopRef.current?.();
    machineStopRef.current = null;
  }, []);

  const startTension = useCallback(() => {
    tensionStopRef.current?.();
    tensionStopRef.current = soundManager.startTension();
  }, []);

  const stopTension = useCallback(() => {
    tensionStopRef.current?.();
    tensionStopRef.current = null;
  }, []);

  return {
    hover,
    select,
    keystroke,
    typewriterTick,
    initiate,
    glitch,
    shatterReveal,
    equip,
    introWhoosh,
    laserBurst,
    startLaser,
    stopLaser,
    startMachine,
    stopMachine,
    startTension,
    stopTension,
  };
}

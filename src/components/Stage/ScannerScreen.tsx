import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const COLS = 5;
const ROWS = 6;
const TOTAL_FRAMES = COLS * ROWS; // 30
const FRAME_DURATION_MS = 70;

const DISPLAY_W = 280;
const DISPLAY_H = 348;

interface ScannerScreenProps {
  visible: boolean;
  fireTrigger: number;
  isLooping?: boolean;
}

export function ScannerScreen({ visible, fireTrigger, isLooping = false }: ScannerScreenProps) {
  const [frame, setFrame] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTrigger = useRef(fireTrigger);
  const loopingRef = useRef(isLooping);

  useEffect(() => {
    loopingRef.current = isLooping;
  }, [isLooping]);

  const stopAnim = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
  }, []);

  const playAnimation = useCallback(() => {
    stopAnim();
    let f = 0;
    setFrame(0);

    animRef.current = setInterval(() => {
      f++;
      if (f >= TOTAL_FRAMES) {
        if (loopingRef.current) {
          f = 0;
          setFrame(0);
        } else {
          setFrame(0);
          stopAnim();
        }
        return;
      }
      setFrame(f);
    }, FRAME_DURATION_MS);
  }, [stopAnim]);

  useEffect(() => {
    if (isLooping) {
      playAnimation();
    }
  }, [isLooping, playAnimation]);

  useEffect(() => {
    if (fireTrigger > prevTrigger.current) {
      playAnimation();
    }
    prevTrigger.current = fireTrigger;
  }, [fireTrigger, playAnimation]);

  useEffect(() => () => stopAnim(), [stopAnim]);

  const col = frame % COLS;
  const row = Math.floor(frame / COLS);
  const bgX = -(col * DISPLAY_W);
  const bgY = -(row * DISPLAY_H);

  return (
    <motion.div
      className="scanner-screen"
      initial={{ y: 200, opacity: 0 }}
      animate={{
        y: visible ? 0 : 200,
        opacity: visible ? 1 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 80,
        damping: 14,
        mass: 1,
      }}
      style={{ backgroundPosition: `${bgX}px ${bgY}px` }}
    />
  );
}

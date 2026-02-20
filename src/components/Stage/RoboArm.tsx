import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const COLS = 6;
const ROWS = 6;
const TOTAL_FRAMES = COLS * ROWS; // 36
const FRAME_DURATION_MS = 60;

const DISPLAY_W = 276;
const DISPLAY_H = 283;

const RETRACT_X = 210;

interface RoboArmProps {
  side: 'left' | 'right';
  entered: boolean;
  fireTrigger: number;
  isLooping?: boolean;
}

export function RoboArm({ side, entered, fireTrigger, isLooping = false }: RoboArmProps) {
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

  const mirror = side === 'right' ? -1 : 1;
  const retractedX = side === 'left' ? -RETRACT_X : RETRACT_X;

  return (
    <motion.div
      className={`robo-arm robo-arm--${side}`}
      initial={{ x: retractedX, scaleX: mirror }}
      animate={{ x: entered ? 0 : retractedX, scaleX: mirror }}
      transition={{
        type: 'spring',
        stiffness: 60,
        damping: 8,
        mass: 1.2,
      }}
      style={{ backgroundPosition: `${bgX}px ${bgY}px` }}
    />
  );
}

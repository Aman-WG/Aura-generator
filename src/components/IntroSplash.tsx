import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface IntroSplashProps {
  onComplete: () => void;
  onSound?: () => void;
}

const HOLD_DURATION = 3800;
const FADE_DURATION = 1200;

export function IntroSplash({ onComplete, onSound }: IntroSplashProps) {
  useEffect(() => {
    const t = setTimeout(() => onSound?.(), 900);
    return () => clearTimeout(t);
  }, [onSound]);
  return (
    <motion.div
      className="intro-splash"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{
        duration: FADE_DURATION / 1000,
        delay: HOLD_DURATION / 1000,
        ease: 'easeInOut',
      }}
      onAnimationComplete={onComplete}
    >
      {/* Scanline overlay on intro */}
      <div className="intro-splash__scanlines" />

      {/* Horizontal light sweep */}
      <motion.div
        className="intro-splash__sweep"
        initial={{ top: '-4px' }}
        animate={{ top: '104%' }}
        transition={{ delay: 1.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Center content */}
      <div className="intro-splash__center">
        {/* "Welcome to" — small, elegant */}
        <motion.div
          className="intro-splash__welcome"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
        >
          Welcome to
        </motion.div>

        {/* "AURA LAB" — massive, dramatic */}
        <motion.div
          className="intro-splash__title-wrap"
          initial={{ opacity: 0, scale: 1.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 1.0,
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <div className="intro-splash__title" data-text="AURA LAB">
            <span className="intro-splash__title-main">AURA LAB</span>
          </div>

          {/* Glitch layers */}
          <motion.div
            className="intro-splash__glitch intro-splash__glitch--r"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0, 0.6, 0, 0.7, 0, 0] }}
            transition={{ delay: 1.6, duration: 0.6, ease: 'linear' }}
          >
            AURA LAB
          </motion.div>
          <motion.div
            className="intro-splash__glitch intro-splash__glitch--b"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0, 0.8, 0, 0.5, 0, 0] }}
            transition={{ delay: 1.65, duration: 0.55, ease: 'linear' }}
          >
            AURA LAB
          </motion.div>
        </motion.div>

        {/* Tagline under title */}
        <motion.div
          className="intro-splash__sub"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0, duration: 0.7, ease: 'easeOut' }}
        >
          // Q-BIT AURA SYNTHESIZER v2.0
        </motion.div>
      </div>

      {/* Corner deco — tech frame */}
      <div className="intro-splash__corner intro-splash__corner--tl" />
      <div className="intro-splash__corner intro-splash__corner--tr" />
      <div className="intro-splash__corner intro-splash__corner--bl" />
      <div className="intro-splash__corner intro-splash__corner--br" />
    </motion.div>
  );
}

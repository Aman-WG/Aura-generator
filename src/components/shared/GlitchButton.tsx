import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlitchButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

const variantStyles: Record<string, string> = {
  primary: 'glitch-btn--primary',
  secondary: 'glitch-btn--secondary',
  danger: 'glitch-btn--danger',
};

/**
 * GlitchButton — The "juicy" CTA button with spring physics.
 * Framer Motion handles hover/tap for that satisfying press feel.
 */
export function GlitchButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}: GlitchButtonProps) {
  return (
    <motion.button
      className={`glitch-btn ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95, y: 1 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17,
      }}
    >
      <span className="glitch-btn__text">{children}</span>
      <span className="glitch-btn__glare" />
    </motion.button>
  );
}

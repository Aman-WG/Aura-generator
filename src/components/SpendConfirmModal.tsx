import { motion } from 'framer-motion';

interface SpendConfirmModalProps {
  cost: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SpendConfirmModal({ cost, onConfirm, onCancel }: SpendConfirmModalProps) {
  return (
    <motion.div
      className="exit-modal__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onCancel}
    >
      <motion.div
        className="exit-modal"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="exit-modal__icon">◉</div>
        <h2 className="exit-modal__title">Spend {cost.toLocaleString()} coins?</h2>
        <p className="exit-modal__body">
          Coins once spent cannot be refunded.
        </p>

        <div className="exit-modal__actions">
          <button className="pixel-btn pixel-btn--ghost" onClick={onCancel}>
            Nah, I'm Good
          </button>
          <button className="pixel-btn" onClick={onConfirm}>
            Let's Go
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

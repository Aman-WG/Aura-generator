import { motion } from 'framer-motion';

interface ConfirmExitModalProps {
  onSaveAndExit: () => void;
  onKeepTweaking: () => void;
}

export function ConfirmExitModal({ onSaveAndExit, onKeepTweaking }: ConfirmExitModalProps) {
  return (
    <motion.div
      className="exit-modal__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onKeepTweaking}
    >
      <motion.div
        className="exit-modal"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="exit-modal__icon">⚡</div>
        <h2 className="exit-modal__title">Hold up — you&apos;re leaving the lab!</h2>
        <p className="exit-modal__body">
          Want to save this aura as-is, or stick around and fine-tune it?
        </p>

        <div className="exit-modal__actions">
          <button className="pixel-btn pixel-btn--ghost" onClick={onKeepTweaking}>
            Keep Tweaking
          </button>
          <button className="pixel-btn" onClick={onSaveAndExit}>
            Save &amp; Exit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

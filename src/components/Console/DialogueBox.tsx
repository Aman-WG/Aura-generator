import { motion, AnimatePresence } from 'framer-motion';

interface DialogueBoxProps {
  lines: string[];
  isTyping: boolean;
}

export function DialogueBox({ lines, isTyping }: DialogueBoxProps) {
  return (
    <div className="dialogue-box">
      <div className="dialogue-box__scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key="dialogue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {lines.map((line, i) => (
              <motion.div
                key={i}
                className="dialogue-line"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
              >
                <span className="dialogue-line__text">{line}</span>
                {i === lines.length - 1 && isTyping && (
                  <motion.span
                    className="dialogue-cursor"
                    animate={{ opacity: [1, 0] }}
                    transition={{
                      duration: 0.45,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  >
                    |
                  </motion.span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

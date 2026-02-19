import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypewriterOptions {
  speed?: number;
  lineDelay?: number;
  onLineComplete?: (lineIndex: number) => void;
  onComplete?: () => void;
}

interface TypewriterState {
  displayedLines: string[];
  currentLineIndex: number;
  isTyping: boolean;
  isComplete: boolean;
}

export function useTypewriter(
  lines: string[],
  trigger: boolean,
  options: UseTypewriterOptions = {}
) {
  const { speed = 35, lineDelay = 400 } = options;

  // Store callbacks in refs so they don't cause effect re-runs
  const onLineCompleteRef = useRef(options.onLineComplete);
  const onCompleteRef = useRef(options.onComplete);
  onLineCompleteRef.current = options.onLineComplete;
  onCompleteRef.current = options.onComplete;

  const [state, setState] = useState<TypewriterState>({
    displayedLines: [],
    currentLineIndex: 0,
    isTyping: false,
    isComplete: false,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Reset + run: fires when lines or trigger change
  useEffect(() => {
    cleanup();

    // Reset state
    setState({
      displayedLines: [],
      currentLineIndex: 0,
      isTyping: false,
      isComplete: false,
    });

    if (!trigger || lines.length === 0) return;

    let charIndex = 0;
    let lineIndex = 0;
    let cancelled = false;

    setState(prev => ({ ...prev, isTyping: true }));

    function typeNextChar() {
      if (cancelled) return;

      if (lineIndex >= lines.length) {
        setState(prev => ({ ...prev, isTyping: false, isComplete: true }));
        onCompleteRef.current?.();
        return;
      }

      const currentLine = lines[lineIndex];

      if (charIndex <= currentLine.length) {
        const partial = currentLine.slice(0, charIndex);
        const li = lineIndex;

        setState(prev => {
          const newLines = [...prev.displayedLines];
          newLines[li] = partial;
          return { ...prev, displayedLines: newLines, currentLineIndex: li };
        });

        charIndex++;

        if (charIndex <= currentLine.length) {
          const jitter = Math.random() * 20 - 10;
          timeoutRef.current = setTimeout(typeNextChar, speed + jitter);
        } else {
          // Line done
          onLineCompleteRef.current?.(li);
          lineIndex++;
          charIndex = 0;
          timeoutRef.current = setTimeout(typeNextChar, lineDelay);
        }
      }
    }

    timeoutRef.current = setTimeout(typeNextChar, 150);

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [trigger, lines, speed, lineDelay, cleanup]);

  return state;
}

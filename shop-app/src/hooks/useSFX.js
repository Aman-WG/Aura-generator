import { useCallback, useRef } from 'react';

// Pentatonic scale frequencies mapped to each category tab
const TAB_FREQUENCIES = {
  'limited':     880.00, // A5 — sparkly high note for special tab
  'skin':        523.25, // C5
  'hair':        587.33, // D5
  'headgear':    659.25, // E5
  'accessories': 783.99, // G5
  'topwear':     440.00, // A4
  'bottomwear':  493.88, // B4
  'shoes':       349.23, // F4
  'backpack':    392.00, // G4
  'aura':        1046.50, // C6 — ethereal high note
};

export function useSFX() {
  const audioCtxRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  // Standard tab click — plays a unique pentatonic note per category
  const playTabClick = useCallback((categoryId) => {
    const ctx = getAudioContext();
    const freq = TAB_FREQUENCIES[categoryId] || 523.25;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Quick attack, short decay — satisfying "boop" envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }, [getAudioContext]);

  // Special cascading sparkle for the Limited Edition tab
  const playSparkle = useCallback(() => {
    const ctx = getAudioContext();
    const freqs = [1200, 1500, 1800];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = i * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    });
  }, [getAudioContext]);

  // Main entry point — routes to the right sound
  const playTabSound = useCallback((categoryId) => {
    try {
      if (categoryId === 'limited' || categoryId === 'aura') {
        playSparkle();
      } else {
        playTabClick(categoryId);
      }
    } catch {
      // Silently fail if audio isn't available
    }
  }, [playTabClick, playSparkle]);

  return { playTabSound };
}


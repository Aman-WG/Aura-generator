import { useRef, useCallback } from 'react';

type SoundName = 'keystroke' | 'click' | 'whoosh' | 'glitch' | 'reveal' | 'lock';

// Sound effect URLs — replace these with your actual SFX files in /public/sfx/
const SOUND_MAP: Record<SoundName, string> = {
  keystroke: '/sfx/keystroke.mp3',
  click: '/sfx/click.mp3',
  whoosh: '/sfx/whoosh.mp3',
  glitch: '/sfx/glitch.mp3',
  reveal: '/sfx/reveal.mp3',
  lock: '/sfx/lock.mp3',
};

interface UseSoundOptions {
  volume?: number;
  enabled?: boolean;
}

/**
 * Lightweight sound hook using HTML5 Audio.
 * Drop your .mp3 files into /public/sfx/ and they'll just work.
 * Gracefully fails if files are missing (no crash, just silence).
 */
export function useSound(options: UseSoundOptions = {}) {
  const { volume = 0.5, enabled = true } = options;
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return;

      try {
        const src = SOUND_MAP[name];
        if (!src) return;

        let audio = audioCache.current.get(name);

        if (!audio) {
          audio = new Audio(src);
          audio.volume = volume;
          audioCache.current.set(name, audio);
        }

        // Reset and play (allows rapid re-triggers)
        audio.currentTime = 0;
        audio.volume = volume;
        audio.play().catch(() => {
          // Silently fail — browser may block autoplay
        });
      } catch {
        // No crash on missing files
      }
    },
    [volume, enabled]
  );

  return { play };
}

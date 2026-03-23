import { PHASE, type Phase } from './phases';

export interface DialogueLine {
  text: string;
  delay?: number;
}

export const DIALOGUE: Record<Phase, DialogueLine[]> = {
  [PHASE.IDLE]: [
    { text: 'Q-BIT scan complete. Drip levels: CRITICAL.', delay: 0 },
    { text: "Time to cook. Initializing aura synthesizer...", delay: 700 },
  ],

  [PHASE.PROMPT]: [
    { text: 'Describe the aura you want. Be wild.', delay: 0 },
  ],

  [PHASE.PROCESSING]: [
    { text: 'Cooking your aura...', delay: 0 },
  ],

  [PHASE.REVEAL]: [],
};

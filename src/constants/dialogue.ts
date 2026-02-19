import { PHASE, type Phase } from './phases';

export interface DialogueLine {
  text: string;
  delay?: number;
}

export const DIALOGUE: Record<Phase, DialogueLine[]> = {
  [PHASE.IDLE]: [
    { text: 'Q-BIT scan complete. Drip levels: CRITICAL.', delay: 0 },
    { text: "Let's fix that. Hit the button.", delay: 700 },
  ],

  [PHASE.SELECT_ELEMENT]: [
    { text: 'Pick your base element.', delay: 0 },
  ],

  [PHASE.SELECT_ENERGY]: [
    { text: 'Now pick an energy field.', delay: 0 },
  ],

  [PHASE.CHAOS_INPUT]: [
    { text: 'Last step. Type something weird to spice it up.', delay: 0 },
  ],

  [PHASE.PROCESSING]: [
    { text: 'Cooking your aura...', delay: 0 },
  ],

  [PHASE.REVEAL]: [],
};

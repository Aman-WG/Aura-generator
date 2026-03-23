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

export const PROCESSING_LINES = [
  'Mixing particle frequencies...',
  'Borrowing energy from a parallel dimension...',
  'Feeding your prompt to the aura gods...',
  'Calibrating chaos levels...',
  'Splitting atoms for aesthetic purposes...',
  'Downloading drip from the cloud...',
  'Consulting the vibe oracle...',
  'Rendering pure swag into pixels...',
  'Distilling your energy signature...',
  'Overclocking the style engine...',
  'Synthesizing cosmic sauce...',
  'Injecting personality into particles...',
  'Tuning the frequency of cool...',
  'Running it through the drip filter...',
  'Assembling aura DNA...',
  'Compressing a supernova into your avatar...',
  'Extracting the essence of fire...',
  'Spinning up the glow reactor...',
  'Channeling main character energy...',
  'Melting crayons at lightspeed...',
  'Teaching particles how to vibe...',
  'Bottling lightning, hold tight...',
  'Folding spacetime for maximum glow...',
  'Your aura is almost sentient...',
  'Final seasoning... almost there...',
];

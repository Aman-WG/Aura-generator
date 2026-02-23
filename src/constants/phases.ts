export const PHASE = {
  IDLE: 'IDLE',
  PROMPT: 'PROMPT',
  PROCESSING: 'PROCESSING',
  REVEAL: 'REVEAL',
} as const;

export type Phase = (typeof PHASE)[keyof typeof PHASE];

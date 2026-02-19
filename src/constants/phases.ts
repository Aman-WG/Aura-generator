export const PHASE = {
  IDLE: 'IDLE',
  SELECT_ELEMENT: 'SELECT_ELEMENT',
  SELECT_ENERGY: 'SELECT_ENERGY',
  CHAOS_INPUT: 'CHAOS_INPUT',
  PROCESSING: 'PROCESSING',
  REVEAL: 'REVEAL',
} as const;

export type Phase = (typeof PHASE)[keyof typeof PHASE];

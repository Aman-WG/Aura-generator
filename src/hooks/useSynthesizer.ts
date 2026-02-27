import { useReducer, useCallback } from 'react';
import { PHASE, type Phase } from '../constants/phases';
import type { SainathConfig } from '../sainath-engine/types';

export interface AuraError {
  source: 'ai' | 'fallback';
  error?: string;
}

interface SynthesizerState {
  phase: Phase;
  prompt: string | null;
  auraConfig: SainathConfig | null;
  auraError: AuraError | null;
  isShaking: boolean;
}

const initialState: SynthesizerState = {
  phase: PHASE.IDLE,
  prompt: null,
  auraConfig: null,
  auraError: null,
  isShaking: false,
};

type Action =
  | { type: 'SET_PHASE'; payload: Phase }
  | { type: 'SET_PROMPT'; payload: string }
  | { type: 'SET_AURA_CONFIG'; payload: SainathConfig | null }
  | { type: 'SET_AURA_ERROR'; payload: AuraError | null }
  | { type: 'SET_SHAKING'; payload: boolean }
  | { type: 'RESET' };

function reducer(state: SynthesizerState, action: Action): SynthesizerState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'SET_PROMPT':
      return { ...state, prompt: action.payload };
    case 'SET_AURA_CONFIG':
      return { ...state, auraConfig: action.payload };
    case 'SET_AURA_ERROR':
      return { ...state, auraError: action.payload };
    case 'SET_SHAKING':
      return { ...state, isShaking: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useSynthesizer() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return {
    ...state,
    setPhase: useCallback((p: Phase) => dispatch({ type: 'SET_PHASE', payload: p }), []),
    setPrompt: useCallback((v: string) => dispatch({ type: 'SET_PROMPT', payload: v }), []),
    setAuraConfig: useCallback((c: SainathConfig | null) => dispatch({ type: 'SET_AURA_CONFIG', payload: c }), []),
    setAuraError: useCallback((e: AuraError | null) => dispatch({ type: 'SET_AURA_ERROR', payload: e }), []),
    setShaking: useCallback((v: boolean) => dispatch({ type: 'SET_SHAKING', payload: v }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
  };
}

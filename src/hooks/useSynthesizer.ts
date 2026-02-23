import { useReducer, useCallback } from 'react';
import { PHASE, type Phase } from '../constants/phases';
import type { AuraConfig, AuraParams } from '../types';

export interface AuraError {
  source: 'ai' | 'fallback';
  error?: string;
}

interface SynthesizerState {
  phase: Phase;
  auraConfig: AuraConfig;
  auraParams: AuraParams | null;
  auraError: AuraError | null;
  isShaking: boolean;
}

const initialState: SynthesizerState = {
  phase: PHASE.IDLE,
  auraConfig: { element: null, energy: null, chaosPrompt: null },
  auraParams: null,
  auraError: null,
  isShaking: false,
};

type Action =
  | { type: 'SET_PHASE'; payload: Phase }
  | { type: 'SET_ELEMENT'; payload: string }
  | { type: 'SET_ENERGY'; payload: string }
  | { type: 'SET_CHAOS'; payload: string }
  | { type: 'SET_AURA_PARAMS'; payload: AuraParams | null }
  | { type: 'SET_AURA_ERROR'; payload: AuraError | null }
  | { type: 'SET_SHAKING'; payload: boolean }
  | { type: 'RESET' };

function reducer(state: SynthesizerState, action: Action): SynthesizerState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'SET_ELEMENT':
      return { ...state, auraConfig: { ...state.auraConfig, element: action.payload } };
    case 'SET_ENERGY':
      return { ...state, auraConfig: { ...state.auraConfig, energy: action.payload } };
    case 'SET_CHAOS':
      return { ...state, auraConfig: { ...state.auraConfig, chaosPrompt: action.payload } };
    case 'SET_AURA_PARAMS':
      return { ...state, auraParams: action.payload };
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
    setElement: useCallback((v: string) => dispatch({ type: 'SET_ELEMENT', payload: v }), []),
    setEnergy: useCallback((v: string) => dispatch({ type: 'SET_ENERGY', payload: v }), []),
    setChaos: useCallback((v: string) => dispatch({ type: 'SET_CHAOS', payload: v }), []),
    setAuraParams: useCallback((p: AuraParams | null) => dispatch({ type: 'SET_AURA_PARAMS', payload: p }), []),
    setAuraError: useCallback((e: AuraError | null) => dispatch({ type: 'SET_AURA_ERROR', payload: e }), []),
    setShaking: useCallback((v: boolean) => dispatch({ type: 'SET_SHAKING', payload: v }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
  };
}

import { useEffect, useCallback, useRef, useState } from 'react';
import type { AvatarPayload, AuraMessage, ParentMessage, AuraConfig } from '../types';

/**
 * Handles postMessage communication between the Aura Lab (iframe)
 * and the Q-bit Shop (parent window).
 *
 * - Listens for avatar data from the parent
 * - Listens for close requests from the parent
 * - Exposes a `send()` helper to post typed messages back
 * - Detects whether the app is running inside an iframe
 */
export function useParentBridge() {
  const [avatarData, setAvatarData] = useState<AvatarPayload | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [closeRequested, setCloseRequested] = useState(false);
  const parentOriginRef = useRef<string>('*');

  const clearCloseRequest = useCallback(() => setCloseRequested(false), []);

  useEffect(() => {
    const embedded = window.self !== window.top;
    setIsEmbedded(embedded);

    if (!embedded) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as ParentMessage | undefined;
      if (!data?.type?.startsWith('qbit:')) return;

      parentOriginRef.current = event.origin;

      if (data.type === 'qbit:avatar-data') {
        setAvatarData(data.payload);
      }
      if (data.type === 'qbit:coin-balance') {
        setAvatarData((prev) => {
          if (!prev) return prev;
          return { ...prev, coinBalance: data.payload.coinBalance };
        });
      }
      if (data.type === 'qbit:request-close') {
        setCloseRequested(true);
      }
    };

    window.addEventListener('message', handleMessage);

    window.parent.postMessage({ type: 'aura:ready' } satisfies AuraMessage, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const send = useCallback((msg: AuraMessage) => {
    if (window.self === window.top) return;
    window.parent.postMessage(msg, parentOriginRef.current);
  }, []);

  const sendEquipped = useCallback(
    (auraConfig: AuraConfig, auraParams?: unknown) =>
      send({ type: 'aura:equipped', payload: { auraConfig, auraParams } }),
    [send],
  );

  const sendPhaseChange = useCallback(
    (phase: string) => send({ type: 'aura:phase-change', payload: { phase } }),
    [send],
  );

  const sendSave = useCallback(
    (auraConfig: AuraConfig, auraParams?: unknown) =>
      send({ type: 'aura:save', payload: { auraConfig, auraParams } }),
    [send],
  );

  const sendRetry = useCallback(() => send({ type: 'aura:retry' }), [send]);
  const sendClose = useCallback(() => send({ type: 'aura:close' }), [send]);
  const sendSpendCoins = useCallback(
    (amount: number, reason = 'aura-initiation') =>
      send({ type: 'aura:spend-coins', payload: { amount, reason } }),
    [send],
  );

  return {
    isEmbedded,
    avatarData,
    closeRequested,
    clearCloseRequest,
    sendEquipped,
    sendSave,
    sendPhaseChange,
    sendRetry,
    sendClose,
    sendSpendCoins,
  };
}

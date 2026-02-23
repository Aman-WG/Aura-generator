import { useEffect, useCallback, useRef, useState } from 'react';
import type { AvatarPayload, AuraMessage, ParentMessage, AuraConfig, AuraParams } from '../types';

/**
 * Handles postMessage communication between the Aura Lab (iframe)
 * and the Q-bit Shop (parent window).
 *
 * - Listens for avatar data from the parent
 * - Exposes a `send()` helper to post typed messages back
 * - Detects whether the app is running inside an iframe
 */
export function useParentBridge() {
  const [avatarData, setAvatarData] = useState<AvatarPayload | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const parentOriginRef = useRef<string>('*');

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
    (auraConfig: AuraConfig, auraParams?: AuraParams) =>
      send({ type: 'aura:equipped', payload: { auraConfig, auraParams } }),
    [send],
  );

  const sendPhaseChange = useCallback(
    (phase: string) => send({ type: 'aura:phase-change', payload: { phase } }),
    [send],
  );

  const sendRetry = useCallback(() => send({ type: 'aura:retry' }), [send]);
  const sendClose = useCallback(() => send({ type: 'aura:close' }), [send]);

  return {
    isEmbedded,
    avatarData,
    sendEquipped,
    sendPhaseChange,
    sendRetry,
    sendClose,
  };
}

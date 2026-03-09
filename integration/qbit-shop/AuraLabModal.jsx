import { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';

const AURA_LAB_URL = 'http://localhost:5173';

export function AuraLabModal({
  open,
  onClose,
  onAuraEquipped,
  avatarCanvasRef,
  avatarConfig,
  coinBalance,
  onSpendCoins,
}) {
  const iframeRef = useRef(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [labPhase, setLabPhase] = useState('IDLE');

  const isProcessing = labPhase === 'PROCESSING';

  const requestClose = () => {
    if (isProcessing) return;
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'qbit:request-close' },
        AURA_LAB_URL,
      );
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (!open) return;

    const handleMessage = (event) => {
      const { data } = event;
      if (!data?.type?.startsWith('aura:')) return;

      switch (data.type) {
        case 'aura:ready':
          setIframeReady(true);
          break;
        case 'aura:phase-change':
          setLabPhase(data.payload?.phase || 'IDLE');
          break;
        case 'aura:equipped':
          onAuraEquipped?.(data.payload.auraConfig, data.payload.auraParams ?? null);
          onClose();
          break;
        case 'aura:retry':
          break;
        case 'aura:spend-coins': {
          const amount = Number(data.payload?.amount) || 0;
          const result = onSpendCoins?.(amount);
          if (iframeRef.current?.contentWindow && typeof result?.balance === 'number') {
            iframeRef.current.contentWindow.postMessage(
              {
                type: 'qbit:coin-balance',
                payload: { coinBalance: result.balance },
              },
              AURA_LAB_URL,
            );
          }
          break;
        }
        case 'aura:close':
          onClose();
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      setIframeReady(false);
      setLabPhase('IDLE');
    };
  }, [open, onClose, onAuraEquipped, onSpendCoins]);

  useEffect(() => {
    if (!iframeReady || !avatarCanvasRef?.current || !iframeRef.current) return;

    html2canvas(avatarCanvasRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    }).then((canvas) => {
      const avatarImageUrl = canvas.toDataURL('image/png');
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'qbit:avatar-data',
          payload: { avatarImageUrl, avatarConfig, coinBalance },
        },
        AURA_LAB_URL,
      );
    });
  }, [iframeReady, avatarCanvasRef, avatarConfig, coinBalance]);

  if (!open) return null;

  return (
    <div className="aura-modal-overlay">
      <div className="aura-modal-close-wrap">
        <button
          className={`aura-modal-close${isProcessing ? ' aura-modal-close--disabled' : ''}`}
          onClick={requestClose}
          disabled={isProcessing}
        >
          ✕
        </button>
        {isProcessing && (
          <div className="aura-modal-close-tooltip">
            ⏳ Hang tight — your aura is still cooking!
          </div>
        )}
      </div>
      <iframe
        ref={iframeRef}
        src={AURA_LAB_URL}
        title="Aura Lab"
        className="aura-modal-iframe"
        allow="autoplay"
      />
    </div>
  );
}

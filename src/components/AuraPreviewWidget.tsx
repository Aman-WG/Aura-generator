import { useRef, useEffect, useCallback } from 'react';
import { AuraEngine } from '../aura-engine/AuraEngine';
import type { AuraParams } from '../aura-engine/types';

export type { AuraParams };

interface AuraPreviewWidgetProps {
  /** The AI-generated aura parameters (from the aura:equipped payload) */
  auraParams: AuraParams | null;
  /** Content to render inside the aura (e.g. the character/avatar) */
  children: React.ReactNode;
  /** Width of the widget container in px (default 300) */
  width?: number;
  /** Height of the widget container in px (default 400) */
  height?: number;
  /** Opacity for the front overlay canvas (default 0.15) */
  frontOpacity?: number;
  /** Extra className for the outer wrapper */
  className?: string;
  /** Extra inline styles for the outer wrapper */
  style?: React.CSSProperties;
}

/**
 * Drop-in widget that renders an animated Canvas 2D aura around any children.
 *
 * Usage in the shop:
 * ```jsx
 * <AuraPreviewWidget auraParams={equippedAura} width={300} height={400}>
 *   <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
 * </AuraPreviewWidget>
 * ```
 */
export function AuraPreviewWidget({
  auraParams,
  children,
  width = 300,
  height = 400,
  frontOpacity = 0.15,
  className,
  style,
}: AuraPreviewWidgetProps) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AuraEngine | null>(null);

  const canvasW = Math.round(width * 1.4);
  const canvasH = Math.round(height * 1.4);

  const initEngine = useCallback(() => {
    if (!backRef.current || !frontRef.current) return;
    if (engineRef.current) engineRef.current.stop();

    const engine = new AuraEngine(backRef.current, frontRef.current);
    engine.resize(canvasW, canvasH);
    if (auraParams) engine.setParams(auraParams);
    engine.start();
    engineRef.current = engine;
  }, [canvasW, canvasH, auraParams]);

  useEffect(() => {
    initEngine();
    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (engineRef.current) engineRef.current.resize(canvasW, canvasH);
  }, [canvasW, canvasH]);

  useEffect(() => {
    if (auraParams && engineRef.current) engineRef.current.setParams(auraParams);
  }, [auraParams]);

  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width,
    height,
    overflow: 'visible',
    ...style,
  };

  if (!auraParams) {
    return (
      <div className={className} style={wrapperStyle}>
        <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={wrapperStyle}>
      <canvas
        ref={backRef}
        style={{ ...canvasStyle, zIndex: 1 }}
        width={canvasW}
        height={canvasH}
      />
      <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
        {children}
      </div>
      <canvas
        ref={frontRef}
        style={{ ...canvasStyle, zIndex: 3, opacity: frontOpacity }}
        width={canvasW}
        height={canvasH}
      />
    </div>
  );
}

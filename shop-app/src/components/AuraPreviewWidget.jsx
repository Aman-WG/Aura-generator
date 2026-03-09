import { useRef, useEffect, useCallback, Fragment } from 'react';
import { AuraEngine } from '../aura-engine/AuraEngine';

/**
 * Renders the full AI-generated aura (two canvas layers) around children.
 * If auraParams is null, renders children with no canvas overhead.
 */
export function AuraPreviewWidget({
  auraParams,
  children,
  width = 300,
  height = 400,
  frontOpacity = 0.15,
  className,
  style,
}) {
  const backRef = useRef(null);
  const frontRef = useRef(null);
  const engineRef = useRef(null);

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
    if (!auraParams) return;
    initEngine();
    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auraParams]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.resize(canvasW, canvasH);
  }, [canvasW, canvasH]);

  const canvasStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  };

  const wrapperStyle = {
    position: 'relative',
    width,
    height,
    overflow: 'visible',
    ...style,
  };

  if (!auraParams) {
    return (
      <div className={className} style={wrapperStyle}>
        {children}
      </div>
    );
  }

  return (
    <div className={className} style={wrapperStyle}>
      <canvas
        ref={backRef}
        style={{ ...canvasStyle, zIndex: 0 }}
        width={canvasW}
        height={canvasH}
      />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        {children}
      </div>
      <canvas
        ref={frontRef}
        style={{ ...canvasStyle, zIndex: 2, opacity: frontOpacity }}
        width={canvasW}
        height={canvasH}
      />
    </div>
  );
}

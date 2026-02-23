import { useRef, useEffect, useCallback, Fragment } from 'react';
import { AuraEngine } from '../../aura-engine/AuraEngine';
import type { AuraParams } from '../../aura-engine/types';

interface AuraCanvasProps {
  params: AuraParams | null;
  width?: number;
  height?: number;
  /** Opacity for the front (overlay) canvas — 0 to 1 */
  frontOpacity?: number;
  /** z-index for the back (behind character) canvas */
  backZIndex?: number;
  /** z-index for the front (overlay) canvas */
  frontZIndex?: number;
}

const DEFAULT_W = 400;
const DEFAULT_H = 500;

/**
 * Renders two absolutely-positioned canvases (back + front).
 * The parent must be `position: relative` so the canvases
 * overlay correctly. No wrapper div is created — the canvases
 * participate in the parent's stacking context directly,
 * allowing a character sprite to sit between them via z-index.
 */
export function AuraCanvas({
  params,
  width = DEFAULT_W,
  height = DEFAULT_H,
  frontOpacity = 0.18,
  backZIndex = 1,
  frontZIndex = 3,
}: AuraCanvasProps) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AuraEngine | null>(null);

  const initEngine = useCallback(() => {
    if (!backRef.current || !frontRef.current) return;
    if (engineRef.current) engineRef.current.stop();

    const engine = new AuraEngine(backRef.current, frontRef.current);
    engine.resize(width, height);
    if (params) engine.setParams(params);
    engine.start();
    engineRef.current = engine;
  }, [width, height, params]);

  useEffect(() => {
    initEngine();
    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.resize(width, height);
    }
  }, [width, height]);

  useEffect(() => {
    if (params && engineRef.current) {
      engineRef.current.setParams(params);
    }
  }, [params]);

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  };

  return (
    <Fragment>
      <canvas
        ref={backRef}
        className="aura-canvas-back"
        style={{ ...baseStyle, zIndex: backZIndex }}
        width={width}
        height={height}
      />
      <canvas
        ref={frontRef}
        className="aura-canvas-front"
        style={{ ...baseStyle, zIndex: frontZIndex, opacity: frontOpacity }}
        width={width}
        height={height}
      />
    </Fragment>
  );
}

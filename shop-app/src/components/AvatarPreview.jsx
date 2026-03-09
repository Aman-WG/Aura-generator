import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { LAYER_ORDER } from '../data/assets';
import { QbitBaseSVG } from './QbitBaseSVG';
import { ExpressionSVG } from './ExpressionSVG';
import { AuraCanvas } from './AuraCanvas';
import { AuraPreviewWidget } from './AuraPreviewWidget';

// Map expression ids to ExpressionSVG expression keys
const EXPRESSION_ID_MAP = {
  'basic': 'basic',
  'chibi': 'chibihead',
  'surprise': 'surprisehead',
  'happy': 'happyhead',
};

export function AvatarPreview({ selections, onRandomize, skinTone, expression, activeCategory, avatarCanvasRef, auraParams }) {
  const internalRef = useRef(null);
  const avatarRef = avatarCanvasRef || internalRef;
  const hasFullCostume = selections.fullCostume !== null;
  const selectedAura = selections.aura;
  const expressionKey = EXPRESSION_ID_MAP[expression] || 'basic';

  // Zoom into head area when headgear or hair category is active
  // Scale up and shift down so the head is prominent and body clips off the bottom
  const isHeadZoom = activeCategory === 'headgear' || activeCategory === 'hair';
  const zoomStyle = isHeadZoom
    ? { transform: 'scale(1.2) translateY(24%)' }
    : {};

  const handleExport = useCallback(async () => {
    if (!avatarRef.current) return;
    
    try {
      const canvas = await html2canvas(avatarRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const link = document.createElement('a');
      link.download = 'my-qbit-avatar.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export avatar:', error);
    }
  }, []);

  return (
    <div className={`avatar-preview-container ${isHeadZoom ? 'headgear-zoom' : ''}`}>
      <div className="avatar-wrapper">
        <div className="avatar-frame">
          {selectedAura && auraParams && (
            <AuraPreviewWidget
              key={selectedAura.id}
              auraParams={auraParams}
              width={320}
              height={420}
              frontOpacity={0.12}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              <span />
            </AuraPreviewWidget>
          )}
          {selectedAura && !auraParams && (
            <div className="avatar-aura-wrap" key={selectedAura.id}>
              <AuraCanvas aura={selectedAura} />
            </div>
          )}
          <div className="avatar-zoom-wrapper" style={zoomStyle}>
          <div className="avatar-canvas" ref={avatarRef}>
          {/* If a full costume is selected, render only the costume with skin tone base */}
          {hasFullCostume ? (
            <>
              {/* Base body (without head) - dynamic skin tone */}
              <div className="avatar-layer base-layer" style={{ zIndex: 1 }}>
                <QbitBaseSVG skinTone={skinTone} includeHead={false} />
              </div>
              
              {/* Expression/Face layer - dynamic skin tone and expression */}
              <div className="avatar-layer expression-layer" style={{ zIndex: 2 }}>
                <ExpressionSVG expressionId={expressionKey} skinTone={skinTone} />
              </div>
              
              {/* Full costume layer - covers everything except face */}
              <img
                src={selections.fullCostume.file}
                alt={selections.fullCostume.name}
                className="avatar-layer full-costume-layer"
                style={{ zIndex: 10 }}
                draggable={false}
              />
            </>
          ) : (
            <>
              {/* Backpack layer - behind base avatar */}
              {selections.backpack && (
                <img
                  src={selections.backpack.file}
                  alt={selections.backpack.name}
                  className="avatar-layer"
                  style={{ zIndex: 0 }}
                  draggable={false}
                />
              )}
              
              {/* Base body (without head) - dynamic skin tone */}
              <div className="avatar-layer base-layer" style={{ zIndex: 1 }}>
                <QbitBaseSVG skinTone={skinTone} includeHead={false} />
              </div>
              
              {/* Expression/Face layer - dynamic skin tone and expression */}
              <div className="avatar-layer expression-layer" style={{ zIndex: 2 }}>
                <ExpressionSVG expressionId={expressionKey} skinTone={skinTone} />
              </div>
              
              {/* Render other layers in order (excluding backpack) */}
              {LAYER_ORDER.filter(id => id !== 'backpack').map((categoryId, index) => {
                const selected = selections[categoryId];
                if (!selected) return null;
                
                return (
                  <img
                    key={categoryId}
                    src={selected.file}
                    alt={selected.name}
                    className="avatar-layer"
                    style={{ zIndex: index + 3 }}
                    draggable={false}
                  />
                );
              })}
            </>
          )}
          </div>
          </div>
        </div>
        
        <div className="avatar-actions">
          <button className="action-btn randomize-btn" onClick={onRandomize} title="Randomize">
            <span className="btn-icon">🎲</span>
          </button>
          <button className="action-btn export-btn" onClick={handleExport} title="Download">
            <span className="btn-icon">⬇</span>
          </button>
        </div>
      </div>
    </div>
  );
}


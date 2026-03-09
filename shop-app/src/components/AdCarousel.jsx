import { useState, useCallback, useMemo } from 'react';
import { getNewItems } from '../data/assets';

const MAX_ITEMS = 5; // Maximum items to show in carousel

// Manual offsets for centering items in the ad preview (eyeballed)
const AD_OFFSETS = {
  'b_qferrari': { x: 0, y: -15 },
  'bl_puffer': { x: 0, y: -18 },
  'hawain_shirt': { x: 0, y: -15 },
  'pi_tswift': { x: 0, y: -15 },
  'r_jacketwbag': { x: 0, y: -15 },
};

export function AdCarousel({ onPurchase, onApply }) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Get new items (limited to MAX_ITEMS)
  const newItems = useMemo(() => getNewItems().slice(0, MAX_ITEMS), []);

  // Current items to display
  const currentItems = newItems;

  const goToSlide = useCallback((index) => {
    setActiveSlide(index);
  }, []);

  const goToPrev = useCallback(() => {
    setActiveSlide(prev => 
      prev === 0 ? currentItems.length - 1 : prev - 1
    );
  }, [currentItems.length]);

  const goToNext = useCallback(() => {
    setActiveSlide(prev => (prev + 1) % currentItems.length);
  }, [currentItems.length]);

  const handlePurchase = useCallback((item) => {
    onPurchase(item);
    // Also apply the item immediately after purchase
    onApply(item.category, item);
  }, [onPurchase, onApply]);

  // Don't render if no items
  if (newItems.length === 0) {
    return null;
  }

  const currentItem = currentItems[activeSlide];

  return (
    <div className="ad-carousel">
      {/* Navigation Arrows */}
      {currentItems.length > 1 && (
        <>
          <button 
            className="ad-nav-btn ad-nav-prev" 
            onClick={goToPrev}
            aria-label="Previous item"
          >
            ‹
          </button>
          <button 
            className="ad-nav-btn ad-nav-next" 
            onClick={goToNext}
            aria-label="Next item"
          >
            ›
          </button>
        </>
      )}

      {/* Item Card */}
      {currentItem && (
        <div className="ad-item-card">
          <div className="ad-item-preview">
            <img 
              src={currentItem.file} 
              alt={currentItem.name}
              draggable={false}
              style={{
                transform: `translate(calc(-50% + ${AD_OFFSETS[currentItem.id]?.x || 0}px), calc(-50% + ${AD_OFFSETS[currentItem.id]?.y || 0}px))`
              }}
            />
          </div>
          
          <div className="ad-item-info">
            <span className="ad-label">NEW ITEM</span>
            <h4 className="ad-item-name">{currentItem.name}</h4>
            <button 
              className="ad-btn ad-btn-price"
              onClick={() => handlePurchase(currentItem)}
            >
              <img src="/assets/coin/image.png" alt="coin" className="ad-coin-icon" draggable={false} />
              {currentItem.price.toLocaleString()}
            </button>
          </div>

          {/* Dot Indicators */}
          {currentItems.length > 1 && (
            <div className="ad-dots">
              {currentItems.map((_, index) => (
                <button
                  key={index}
                  className={`ad-dot ${index === activeSlide ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


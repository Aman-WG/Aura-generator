export function ItemCard({ item, isSelected, onSelect }) {
  // Check if this item needs background
  const isHairItem = item.colorId !== undefined;
  const isHeadgearItem = item.isHeadgear === true;
  const isFaceAccessory = item.isFaceAccessory === true;
  const isBodyAccessory = item.isBodyAccessory === true;
  
  const showHeadBackground = isHairItem || isHeadgearItem || isFaceAccessory;
  const showBodyBackground = isBodyAccessory;
  
  // Apply custom thumbnail scale and offset for items that need zoom
  const imageStyle = {};
  if (item.thumbnailScale) {
    const offsetX = item.thumbnailOffsetX || 0;
    const offsetY = item.thumbnailOffsetY || 0;
    imageStyle.transform = `scale(${item.thumbnailScale}) translate(${offsetX}%, ${offsetY}%)`;
    imageStyle.transformOrigin = 'center center';
  }

  const previewClass = showHeadBackground ? 'hair-preview' : (showBodyBackground ? 'body-preview' : '');

  return (
    <button
      className={`item-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(item)}
      title={item.name}
    >
      <div className={`item-preview ${previewClass}`}>
        {/* Show Qbit head behind hair, headgear, and face accessories */}
        {showHeadBackground && (
          <img 
            src="/assets/expressions/basic.svg"
            alt=""
            className="hair-base-head"
            draggable={false}
          />
        )}
        {/* Show Qbit full body behind body accessories */}
        {showBodyBackground && (
          <img 
            src="/assets/qbit base.png"
            alt=""
            className="body-base"
            draggable={false}
          />
        )}
        <img 
          src={item.file} 
          alt={item.name}
          draggable={false}
          style={imageStyle}
          className={showHeadBackground ? 'hair-layer' : (showBodyBackground ? 'body-layer' : '')}
        />
      </div>
      <span className="item-name">{item.name}</span>
      {item.price !== undefined && (
        <span className="item-price">
          <img src="/assets/coin/image.png" alt="coin" className="price-icon-img" draggable={false} />
          {item.price.toLocaleString()}
        </span>
      )}
      {isSelected && (
        <div className="selected-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}


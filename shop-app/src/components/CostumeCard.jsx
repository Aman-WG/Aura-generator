import { QbitBaseSVG, QbitEyesSVG } from './QbitBaseSVG';

export function CostumeCard({ item, isSelected, onSelect }) {
  return (
    <button
      className={`costume-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(item)}
      title={item.name}
    >
      {isSelected && (
        <div className="costume-info-icon" title="Full costume - removes other items">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
      )}
      
      <div className="costume-preview">
        {/* Use thumbnail if available, otherwise show base + costume layer */}
        {item.thumbnail ? (
          <img 
            src={item.thumbnail} 
            alt={item.name}
            className="costume-thumbnail"
            draggable={false}
          />
        ) : (
          <>
            {/* Body and head behind costume */}
            <div className="costume-base">
              <QbitBaseSVG skinTone="default" includeHead={true} />
            </div>
            {/* Costume layer */}
            <img 
              src={item.file} 
              alt={item.name}
              className="costume-layer"
              draggable={false}
            />
            {/* Eyes on top of costume */}
            <div className="costume-eyes">
              <QbitEyesSVG />
            </div>
          </>
        )}
      </div>
      
      <span className="costume-name">{item.name}</span>
      {item.price !== undefined && (
        <span className="costume-price">
          <img src="/assets/coin/image.png" alt="coin" className="price-icon-img" draggable={false} />
          {item.price.toLocaleString()}
        </span>
      )}
    </button>
  );
}


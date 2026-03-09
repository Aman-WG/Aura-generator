import { HAIR_COLORS } from '../data/assets';

export function HairColorSelector({ selectedColor, onColorChange }) {
  return (
    <div className="hair-color-selector">
      <span className="color-label">Hair Color</span>
      <div className="color-swatches">
        {HAIR_COLORS.map(colorOption => (
          <button
            key={colorOption.id}
            className={`color-swatch ${selectedColor === colorOption.id ? 'active' : ''}`}
            style={{ '--swatch-color': colorOption.color }}
            onClick={() => onColorChange(colorOption.id)}
            title={colorOption.name}
            aria-label={`Select ${colorOption.name} hair color`}
          >
            {selectedColor === colorOption.id && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}


import { SKIN_TONES } from '../data/assets';

export function SkinToneSelector({ selectedTone, onToneChange }) {
  return (
    <div className="skin-tone-selector">
      <span className="color-label">Skin tone</span>
      <div className="skin-tone-swatches">
        {SKIN_TONES.map(tone => (
          <button
            key={tone.id}
            className={`skin-tone-swatch ${selectedTone === tone.id ? 'active' : ''}`}
            style={{ '--swatch-color': tone.color }}
            onClick={() => onToneChange(tone.id)}
            title={tone.name}
            aria-label={`Select ${tone.name} skin tone`}
          >
            {selectedTone === tone.id && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}


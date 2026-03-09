import { CATEGORIES } from '../data/assets';
import { useSFX } from '../hooks/useSFX';

export function CategoryTabs({ activeCategory, onCategoryChange, selections }) {
  const { playTabSound } = useSFX();

  const handleTabClick = (categoryId) => {
    playTabSound(categoryId);
    onCategoryChange(categoryId);
  };

  return (
    <div className="category-tabs">
      {CATEGORIES.map(category => {
        const isActive = activeCategory === category.id;
        // Check for full costume selection for limited category
        const hasSelection = category.id === 'limited' 
          ? selections.fullCostume !== null 
          : selections[category.id] !== null;
        const isLimited = category.id === 'limited';
        const isAura = category.id === 'aura';
        
        return (
          <button
            key={category.id}
            className={`category-tab ${isActive ? 'active' : ''} ${hasSelection ? 'has-selection' : ''} ${isLimited ? 'limited-tab' : ''} ${isAura ? 'aura-tab' : ''}`}
            onClick={() => handleTabClick(category.id)}
            title={category.name}
          >
            <span className="tab-icon">
              <img src={category.iconFile} alt={category.name} className="tab-icon-svg" />
            </span>
            <span className="tab-name">{category.name}</span>
            {hasSelection && <span className="selection-dot" />}
          </button>
        );
      })}
    </div>
  );
}


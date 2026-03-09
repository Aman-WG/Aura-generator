import { ItemCard } from './ItemCard';
import { CostumeCard } from './CostumeCard';
import { HairColorSelector } from './HairColorSelector';
import { SkinToneSelector } from './SkinToneSelector';
import { ExpressionSelector } from './ExpressionSelector';
import { ASSETS, CATEGORIES, getHairAssets, LIMITED_COLLECTIONS } from '../data/assets';

export function ItemGrid({ 
  activeCategory, 
  selections, 
  onSelectItem, 
  onClearCategory,
  hairColor,
  onHairColorChange,
  skinTone,
  onSkinToneChange,
  expression,
  onExpressionChange,
  onOpenAuraLab,
  customAuras,
}) {
  // Get items - use dynamic hair assets if hair category is active
  const items = activeCategory === 'hair' 
    ? getHairAssets(hairColor) 
    : (ASSETS[activeCategory] || []);
  
  const selectedItem = selections[activeCategory];
  const selectedCostume = selections.fullCostume;
  const categoryInfo = CATEGORIES.find(c => c.id === activeCategory);
  const isHairCategory = activeCategory === 'hair';
  const isSkinCategory = activeCategory === 'skin';
  const isLimitedCategory = activeCategory === 'limited';
  const isAuraCategory = activeCategory === 'aura';

  // Aura category view
  if (isAuraCategory) {
    const presetItems = ASSETS.aura || [];
    const userCreated = customAuras || [];
    const selectedAura = selections.aura;

    return (
      <div className="item-grid-container aura-container">
        <div className="grid-header">
          <h2 className="grid-title">
            <span className="title-icon">✦</span>
            Aura
          </h2>
          {selectedAura && (
            <button className="clear-btn" onClick={() => onClearCategory('aura')}>
              Remove Aura
            </button>
          )}
        </div>
        <p className="aura-subtitle">Give your Q-bit a unique energy aura</p>

        {/* User-created auras from the Aura Lab */}
        {userCreated.length > 0 && (
          <>
            <h3 className="aura-section-title">Your Creations</h3>
            <div className="aura-grid">
              {userCreated.map(item => {
                const isSelected = selectedAura?.id === item.id;
                return (
                  <button
                    key={item.id}
                    className={`aura-card aura-card--created ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectItem('aura', item)}
                  >
                    <div
                      className="aura-card__glow"
                      style={{ background: item.gradient }}
                    />
                    <span className="aura-card__emoji">{item.emoji}</span>
                    <span className="aura-card__name">{item.name}</span>
                    <span className="aura-card__badge">Custom</span>
                    {isSelected && (
                      <div className="selected-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Preset auras + Make your own CTA */}
        <h3 className="aura-section-title">Preset Auras</h3>
        <div className="aura-grid">
          {presetItems.map(item => {
            const isSelected = selectedAura?.id === item.id;
            const isCustom = item.isCustomAura;

            return (
              <button
                key={item.id}
                className={`aura-card ${isSelected ? 'selected' : ''} ${isCustom ? 'aura-card--custom' : ''}`}
                onClick={() => {
                  if (isCustom) {
                    onOpenAuraLab?.();
                  } else {
                    onSelectItem('aura', item);
                  }
                }}
              >
                <div
                  className="aura-card__glow"
                  style={{ background: item.gradient }}
                />
                <span className="aura-card__emoji">{item.emoji}</span>
                <span className="aura-card__name">{item.name}</span>
                <span className="aura-card__price">
                  <img src="/assets/coin/image.png" alt="coin" className="price-icon-img" draggable={false} />
                  {item.price.toLocaleString()}
                </span>
                {isSelected && (
                  <div className="selected-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Limited Edition view
  if (isLimitedCategory) {
    return (
      <div className="item-grid-container limited-edition-container">
        <div className="grid-header">
          <h2 className="grid-title">
            <span className="title-icon">{categoryInfo?.icon}</span>
            {categoryInfo?.name}
          </h2>
          <div className="grid-header-right">
            <span 
              className="collection-badge" 
              style={{ background: LIMITED_COLLECTIONS[0]?.badgeColor }}
            >
              {LIMITED_COLLECTIONS[0]?.badge}
            </span>
            {selectedCostume && (
              <button className="clear-btn" onClick={() => onSelectItem('limited', selectedCostume)}>
                Remove Costume
              </button>
            )}
          </div>
        </div>
        
        <hr className="limited-edition-divider" />
        
        {LIMITED_COLLECTIONS.map(collection => (
          <div key={collection.id} className="collection-section">
            <div className="collection-header">
              <h3 className="collection-title">
                {collection.id === 'stranger-things' ? (
                  <img 
                    src="/assets/limited-edition/stranger-things/strangerqbits_logo.png" 
                    alt="Stranger QBits"
                    className="collection-logo"
                  />
                ) : (
                  collection.name
                )}
              </h3>
            </div>
            <p className="collection-description">{collection.description}</p>
            
            <div className="costume-grid">
              {collection.items.map(item => (
                <CostumeCard
                  key={item.id}
                  item={item}
                  isSelected={selectedCostume?.id === item.id}
                  onSelect={(item) => onSelectItem('limited', item)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="item-grid-container">
      <div className="grid-header">
        <h2 className="grid-title">
          <span className="title-icon">{categoryInfo?.icon}</span>
          {categoryInfo?.name}
        </h2>
        {selectedItem && (
          <button className="clear-btn" onClick={() => onClearCategory(activeCategory)}>
            Clear Selection
          </button>
        )}
      </div>
      
      {isHairCategory && (
        <HairColorSelector 
          selectedColor={hairColor} 
          onColorChange={onHairColorChange} 
        />
      )}
      
      {isSkinCategory && (
        <>
          <SkinToneSelector 
            selectedTone={skinTone} 
            onToneChange={onSkinToneChange} 
          />
          <ExpressionSelector 
            selectedExpression={expression}
            onExpressionChange={onExpressionChange}
            skinTone={skinTone}
          />
        </>
      )}
      
      {items.length === 0 && !isSkinCategory ? (
        <div className="empty-state">
          <p>No items available in this category</p>
        </div>
      ) : (
        <div className="item-grid">
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onSelect={(item) => onSelectItem(activeCategory, item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

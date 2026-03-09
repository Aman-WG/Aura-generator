import { useRef, useState, useCallback } from 'react';
import { AvatarPreview } from './components/AvatarPreview';
import { CategoryTabs } from './components/CategoryTabs';
import { ItemGrid } from './components/ItemGrid';
import { AdCarousel } from './components/AdCarousel';
import { AuraLabModal } from './components/AuraLabModal';
import { useAvatarState } from './hooks/useAvatarState';
import { ASSETS } from './data/assets';

function App() {
  const {
    selections,
    activeCategory,
    setActiveCategory,
    selectItem,
    clearCategory,
    resetAll,
    randomize,
    hairColor,
    changeHairColor,
    skinTone,
    changeSkinTone,
    expression,
    changeExpression,
    coinBalance,
    spendCoins,
    purchasedItems,
    purchaseItem,
    customAuras,
    equipCustomAura,
    auraParams,
  } = useAvatarState();

  const avatarCanvasRef = useRef(null);
  const [showAuraLab, setShowAuraLab] = useState(false);

  const handleRandomize = () => randomize(ASSETS);
  const handleCloseAuraLab = useCallback(() => setShowAuraLab(false), []);
  const handleAuraEquipped = useCallback((auraConfig, params) => {
    equipCustomAura(auraConfig, params);
    setActiveCategory('aura');
  }, [equipCustomAura, setActiveCategory]);

  return (
    <div className="app">
      {/* Animated blob background */}
      <div className="blob-container">
        <div className="blob blob-red"></div>
        <div className="blob blob-yellow"></div>
        <div className="blob-blue-layer"></div>
        {/* Particle effects */}
        <div className="particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>
      <main className="app-main">
        <aside className="editor-panel">
          <CategoryTabs 
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            selections={selections}
          />
          <section className="customization-section">
            <ItemGrid 
              activeCategory={activeCategory}
              selections={selections}
              onSelectItem={selectItem}
              onClearCategory={clearCategory}
              hairColor={hairColor}
              onHairColorChange={changeHairColor}
              skinTone={skinTone}
              onSkinToneChange={changeSkinTone}
              expression={expression}
              onExpressionChange={changeExpression}
              onOpenAuraLab={() => setShowAuraLab(true)}
              customAuras={customAuras}
            />
          </section>
        </aside>

        <section className="preview-section">
          <AdCarousel
            onPurchase={purchaseItem}
            onApply={selectItem}
          />
          <AvatarPreview 
            selections={selections}
            onReset={resetAll}
            onRandomize={handleRandomize}
            skinTone={skinTone}
            expression={expression}
            activeCategory={activeCategory}
            avatarCanvasRef={avatarCanvasRef}
            auraParams={auraParams}
          />
        </section>
      </main>

      <AuraLabModal
        open={showAuraLab}
        onClose={handleCloseAuraLab}
        onAuraEquipped={handleAuraEquipped}
        avatarCanvasRef={avatarCanvasRef}
        avatarConfig={selections}
        coinBalance={coinBalance}
        onSpendCoins={spendCoins}
      />
    </div>
  );
}

export default App;

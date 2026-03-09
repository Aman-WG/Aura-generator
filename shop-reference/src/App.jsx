import { useRef, useState, useCallback } from 'react';
import { AuraLabModal } from './components/AuraLabModal';
import { useAvatarState } from './hooks/useAvatarState';

function App() {
  const {
    selections,
    coinBalance,
    spendCoins,
    equipCustomAura,
  } = useAvatarState();

  const avatarCanvasRef = useRef(null);
  const [showAuraLab, setShowAuraLab] = useState(false);

  const handleCloseAuraLab = useCallback(() => setShowAuraLab(false), []);
  const handleAuraEquipped = useCallback((auraConfig, params) => {
    equipCustomAura(auraConfig, params);
  }, [equipCustomAura]);

  return (
    <>
      {/* Existing shop UI goes here */}
      {/* Keep your avatar preview node attached to avatarCanvasRef */}

      <AuraLabModal
        open={showAuraLab}
        onClose={handleCloseAuraLab}
        onAuraEquipped={handleAuraEquipped}
        avatarCanvasRef={avatarCanvasRef}
        avatarConfig={selections}
        coinBalance={coinBalance}
        onSpendCoins={spendCoins}
      />
    </>
  );
}

export default App;

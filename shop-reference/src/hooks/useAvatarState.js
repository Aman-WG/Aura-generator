import { useState, useCallback } from 'react';

export function useAvatarState() {
  const [selections, setSelections] = useState({});
  const [coinBalance, setCoinBalance] = useState(5000);
  const [customAuras, setCustomAuras] = useState([]);

  const spendCoins = useCallback((amount) => {
    let nextBalance = null;
    let ok = false;

    setCoinBalance((prev) => {
      if (prev < amount) {
        nextBalance = prev;
        return prev;
      }
      ok = true;
      nextBalance = prev - amount;
      return nextBalance;
    });

    return { ok, balance: nextBalance };
  }, []);

  const equipCustomAura = useCallback((auraConfig, params = null) => {
    setCustomAuras((prev) => [...prev, { auraConfig, params }]);
    setSelections((prev) => ({ ...prev, aura: { auraConfig, params } }));
  }, []);

  return {
    selections,
    setSelections,
    coinBalance,
    spendCoins,
    customAuras,
    equipCustomAura,
  };
}

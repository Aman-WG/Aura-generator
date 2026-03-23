import { useState, useCallback } from 'react';
import { CATEGORIES, HAIR_COLORS, SKIN_TONES, EXPRESSIONS, getHairAssets } from '../data/assets';
import { buildCustomAuraItem } from '../data/auraVisuals';

// Initialize empty selections for all categories
const getInitialSelections = () => {
  const selections = {};
  CATEGORIES.forEach(cat => {
    selections[cat.id] = null;
  });
  // Add fullCostume field for limited edition costumes
  selections.fullCostume = null;
  return selections;
};

export function useAvatarState() {
  const [selections, setSelections] = useState(getInitialSelections);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [hairColor, setHairColor] = useState('black'); // Default hair color
  const [skinTone, setSkinTone] = useState('default'); // Default skin tone
  const [expression, setExpression] = useState('basic'); // Default expression
  const [coinBalance, setCoinBalance] = useState(100000);
  const [purchasedItems, setPurchasedItems] = useState(new Set());
  const [customAuras, setCustomAuras] = useState([]);
  const [auraParams, setAuraParams] = useState(null);

  // Select an item in a category (or deselect if same item clicked)
  const selectItem = useCallback((categoryId, item) => {
    setSelections(prev => {
      // Handle full costume selection (limited edition)
      if (item.isFullCostume) {
        if (prev.fullCostume?.id === item.id) {
          return { ...prev, fullCostume: null };
        }
        const clearedSelections = {};
        CATEGORIES.forEach(cat => { clearedSelections[cat.id] = null; });
        return { ...clearedSelections, fullCostume: item };
      }

      const isDeselect = prev[categoryId]?.id === item.id;

      if (categoryId === 'aura') {
        setAuraParams(isDeselect ? null : (item.auraParams || null));
      }

      return {
        ...prev,
        fullCostume: null,
        [categoryId]: isDeselect ? null : item,
      };
    });
  }, []);

  // Handle hair color change - update the hair selection to use new color
  const changeHairColor = useCallback((newColor) => {
    setHairColor(newColor);
    
    // If there's a hair selected, update it to the new color variant
    setSelections(prev => {
      if (!prev.hair) return prev;
      
      // Find the style ID of the current hair
      const currentStyleId = prev.hair.styleId;
      if (!currentStyleId) return prev;
      
      // Get the new hair assets for the selected color
      const newHairAssets = getHairAssets(newColor);
      const newHairItem = newHairAssets.find(h => h.styleId === currentStyleId);
      
      if (newHairItem) {
        return {
          ...prev,
          hair: newHairItem,
        };
      }
      return prev;
    });
  }, []);

  // Handle skin tone change
  const changeSkinTone = useCallback((newTone) => {
    setSkinTone(newTone);
  }, []);

  // Handle expression change
  const changeExpression = useCallback((newExpression) => {
    setExpression(newExpression);
  }, []);

  // Purchase an item (mark as owned)
  const purchaseItem = useCallback((item) => {
    setPurchasedItems(prev => {
      const newSet = new Set(prev);
      newSet.add(item.id);
      return newSet;
    });
  }, []);

  const spendCoins = useCallback((amount) => {
    let nextBalance = null;
    let ok = false;

    setCoinBalance(prev => {
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

  const setWalletBalance = useCallback((amount) => {
    setCoinBalance(Math.max(0, Math.floor(amount)));
  }, []);

  // Receive a custom aura from the Aura Lab, create a tile, and equip it
  const equipCustomAura = useCallback((auraConfig, params = null) => {
    const item = buildCustomAuraItem(auraConfig, customAuras.length);
    item.auraParams = params;
    setCustomAuras(prev => [...prev, item]);
    setSelections(prev => ({ ...prev, aura: item }));
    setAuraParams(params);
  }, [customAuras.length]);

  // Clear selection for a specific category
  const clearCategory = useCallback((categoryId) => {
    setSelections(prev => ({
      ...prev,
      [categoryId]: null,
    }));
  }, []);

  // Reset all selections
  const resetAll = useCallback(() => {
    const initial = getInitialSelections();
    initial.fullCostume = null;
    setSelections(initial);
    setHairColor('black');
    setSkinTone('default');
    setExpression('basic');
  }, []);

  // Randomize selections
  const randomize = useCallback((assets) => {
    const newSelections = { fullCostume: null };
    
    // Randomize hair color first
    const randomColorIndex = Math.floor(Math.random() * HAIR_COLORS.length);
    const randomHairColor = HAIR_COLORS[randomColorIndex].id;
    setHairColor(randomHairColor);
    
    // Randomize skin tone
    const randomSkinIndex = Math.floor(Math.random() * SKIN_TONES.length);
    const randomSkinTone = SKIN_TONES[randomSkinIndex].id;
    setSkinTone(randomSkinTone);
    
    // Randomize expression
    const randomExpressionIndex = Math.floor(Math.random() * EXPRESSIONS.length);
    const randomExpression = EXPRESSIONS[randomExpressionIndex].id;
    setExpression(randomExpression);
    
    CATEGORIES.forEach(cat => {
      if (cat.id === 'limited' || cat.id === 'aura') {
        newSelections[cat.id] = null;
        return;
      }
      
      let categoryAssets;
      
      if (cat.id === 'hair') {
        // Use dynamic hair assets based on random color
        categoryAssets = getHairAssets(randomHairColor);
      } else {
        categoryAssets = assets[cat.id];
      }
      
      if (categoryAssets && categoryAssets.length > 0) {
        // 70% chance to select an item, 30% chance to leave empty
        if (Math.random() > 0.3) {
          const randomIndex = Math.floor(Math.random() * categoryAssets.length);
          newSelections[cat.id] = categoryAssets[randomIndex];
        } else {
          newSelections[cat.id] = null;
        }
      } else {
        newSelections[cat.id] = null;
      }
    });
    setSelections(newSelections);
  }, []);

  return {
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
    setWalletBalance,
    spendCoins,
    purchasedItems,
    purchaseItem,
    customAuras,
    equipCustomAura,
    auraParams,
  };
}

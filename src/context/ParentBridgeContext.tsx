import { createContext, useContext } from 'react';
import { useParentBridge } from '../hooks/useParentBridge';

type BridgeValue = ReturnType<typeof useParentBridge>;

const ParentBridgeContext = createContext<BridgeValue | null>(null);

export function ParentBridgeProvider({ children }: { children: React.ReactNode }) {
  const bridge = useParentBridge();
  return (
    <ParentBridgeContext.Provider value={bridge}>
      {children}
    </ParentBridgeContext.Provider>
  );
}

export function useBridge(): BridgeValue {
  const ctx = useContext(ParentBridgeContext);
  if (!ctx) throw new Error('useBridge must be used within <ParentBridgeProvider>');
  return ctx;
}

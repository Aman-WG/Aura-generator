# Shop And Aura Generator Handoff

This folder mirrors the shop-side integration points so a developer can inspect
the full dismissal flow without needing the separate `qbit_shop` repo open.

Most important files:

- `shop-reference/src/components/AuraLabModal.jsx`
  Host-side iframe wrapper with the visible close button, disabled-processing
  state, tooltip, and `qbit:request-close` message.
- `shop-reference/src/App.jsx`
  Reference mount point showing where the modal is opened and how the shop
  passes `coinBalance` and `onSpendCoins` into the iframe wrapper.
- `shop-reference/src/hooks/useAvatarState.js`
  Reference wallet state showing the `coinBalance` store and `spendCoins()`
  helper used by the modal.
- `shop-reference/src/styles/aura-modal.css`
  Close button and tooltip styling used by the shop-side modal.

Aura-side files remain in the main app:

- `src/components/ConfirmExitModal.tsx`
- `src/components/Layout.tsx`
- `src/hooks/useParentBridge.ts`
- `src/types/index.ts`

End-to-end dismissal flow:

1. Shop user clicks the host-side `X` in `AuraLabModal.jsx`
2. Host sends `qbit:request-close` into the Aura Lab iframe
3. Aura Lab receives that in `useParentBridge.ts`
4. `Layout.tsx` decides:
   - block close during `PROCESSING`
   - show `ConfirmExitModal` during `REVEAL`
   - otherwise send `aura:close`

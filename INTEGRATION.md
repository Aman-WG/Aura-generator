# Integrating the Aura Lab into the Q-bit Shop

This guide explains how to add the "Enter Aura Lab" flow to the Q-bit Customisation shop.
The Aura Lab runs inside an iframe; the two apps communicate via `postMessage`.

---

## Message Protocol

### Parent (Shop) → Iframe (Aura Lab)

| Message type         | Payload                                                          | When to send                    |
| -------------------- | ---------------------------------------------------------------- | ------------------------------- |
| `qbit:avatar-data`   | `{ avatarImageUrl: string, avatarConfig?: {}, coinBalance?: number }` | Right after the iframe is ready |
| `qbit:request-close` | —                                                                | When the host close button is pressed |
| `qbit:coin-balance`  | `{ coinBalance: number }`                                        | After the host spends coins for aura initiation |

### Iframe (Aura Lab) → Parent (Shop)

| Message type         | Payload                                                                    | Meaning                                |
| -------------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| `aura:ready`         | —                                                                          | Iframe loaded, send avatar data now    |
| `aura:phase-change`  | `{ phase: string }`                                                        | User progressed to a new phase         |
| `aura:equipped`      | `{ auraConfig: { element, energy, chaosPrompt }, auraParams?: AuraParams }` | User clicked "Equip Aura"              |
| `aura:retry`         | —                                                                          | User clicked "Retry"                   |
| `aura:close`         | —                                                                          | User wants to exit the lab             |
| `aura:spend-coins`   | `{ amount: number, reason?: string }`                                      | Iframe requests host-side wallet debit |

---

## Drop-in Component For The Q-bit Shop

This repo now includes the host-side handoff files your dev needs:

```text
integration/qbit-shop/AuraLabModal.jsx
integration/qbit-shop/aura-modal.css
```

Copy those into the shop project and render the modal from the host app.

### 1. Copy the provided files

```text
integration/qbit-shop/AuraLabModal.jsx  →  <shop>/src/components/AuraLabModal.jsx
integration/qbit-shop/aura-modal.css    →  <shop>/src/styles/aura-modal.css
```

Then import the CSS in your shop entrypoint or top-level app:

```jsx
import './styles/aura-modal.css';
```

### 2. Wire it into `App.jsx`

In the Q-bit Shop's `App.jsx`, pass the avatar ref, selections, wallet balance, and spend handler:

```jsx
import { useRef, useState } from 'react';
import { AuraLabModal } from './components/AuraLabModal';
import { AuraPreviewWidget } from './components/AuraPreviewWidget';
// ... existing imports ...

function App() {
  const avatarRef = useRef(null);          // ref to the avatar preview DOM node
  const [showAuraLab, setShowAuraLab] = useState(false);
  const [equippedAura, setEquippedAura] = useState(null);
  const [coinBalance, setCoinBalance] = useState(5000);

  const spendCoins = (amount) => {
    let nextBalance = coinBalance;
    let ok = false;
    setCoinBalance((prev) => {
      if (prev < amount) return prev;
      ok = true;
      nextBalance = prev - amount;
      return nextBalance;
    });
    return { ok, balance: nextBalance };
  };

  // ... existing useAvatarState() hook, etc. ...

  return (
    <>
      {/* ... existing shop UI ... */}

      {/* Avatar preview with equipped aura */}
      <AuraPreviewWidget auraParams={equippedAura} width={300} height={400}>
        <div ref={avatarRef}>
          <AvatarPreview {/* ...existing props... */} />
        </div>
      </AuraPreviewWidget>

      {/* CTA button — place wherever makes sense in the UI */}
      <button onClick={() => setShowAuraLab(true)}>
        ⚡ Enter Aura Lab
      </button>

      {/* The iframe modal */}
      <AuraLabModal
        open={showAuraLab}
        onClose={() => setShowAuraLab(false)}
        onAuraEquipped={(config, params) => {
          setEquippedAura(params);
          // persist config + params to your backend if needed
        }}
        avatarCanvasRef={avatarRef}
        avatarConfig={selections}
        coinBalance={coinBalance}
        onSpendCoins={spendCoins}
      />
    </>
  );
}
```

### 3. Update the Aura Lab URL

In `AuraLabModal.jsx`, change `AURA_LAB_URL` to your actual deployment URL.
In this merged shop-first branch, local development uses `http://localhost:5175` for the Aura Lab because the shop occupies `5173`.

---

## How the flow works end-to-end

```
Student opens Q-bit Shop
  └─ Customizes their avatar (hair, headgear, skin, etc.)
  └─ Clicks "⚡ Enter Aura Lab"
       └─ Full-screen iframe overlay opens with host-side close button
       └─ Aura Lab loads, sends `aura:ready`
       └─ Shop captures avatar via html2canvas, sends `qbit:avatar-data`
       └─ Student can press host close button
            └─ Host sends `qbit:request-close`
            └─ Aura Lab either blocks close during PROCESSING, or shows the exit modal during REVEAL
       └─ Student starts generation
            └─ Aura Lab requests `aura:spend-coins`
            └─ Shop debits wallet and returns `qbit:coin-balance`
       └─ Student clicks "Equip Aura"
            └─ Aura Lab sends `aura:equipped` with the aura config
            └─ Shop receives it, closes the iframe, stores the result
```

---

## Rendering the Equipped Aura in the Shop

After the student equips an aura, you'll have `auraParams` — a JSON object that
drives the animated Canvas 2D aura. To render it around the avatar in the shop:

### 1. Copy the aura engine into the shop project

Copy these folders/files from the Aura Lab repo into your shop project:

```
src/aura-engine/          →  src/aura-engine/
src/components/AuraPreviewWidget.tsx  →  src/components/AuraPreviewWidget.tsx
```

The `aura-engine/` folder is self-contained (no external deps beyond React).

### 2. Store auraParams when equipping

```jsx
const [equippedAura, setEquippedAura] = useState(null);

<AuraLabModal
  open={showAuraLab}
  onClose={() => setShowAuraLab(false)}
  onEquip={(config, params) => {
    setEquippedAura(params);     // store for rendering
    saveToBackend(config, params); // persist if needed
  }}
  avatarRef={avatarRef}
  avatarConfig={selections}
/>
```

### 3. Wrap the avatar preview with AuraPreviewWidget

```jsx
import { AuraPreviewWidget } from './components/AuraPreviewWidget';

{/* In the shop's avatar display area */}
<AuraPreviewWidget
  auraParams={equippedAura}
  width={300}
  height={400}
>
  <img
    src={avatarImageUrl}
    alt="Q-bit"
    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
  />
</AuraPreviewWidget>
```

The widget handles everything:
- Renders two Canvas 2D layers (behind + in front of the children)
- Auto-sizes the canvas 1.4× larger than the container so the aura extends naturally
- If `auraParams` is `null`, renders children with no aura (no canvas overhead)
- Performance-safe: 30fps cap, particle pooling, no `getImageData`

### 4. Persisting auraParams

`auraParams` is a plain JSON object (~1-2 KB). Store it however you store user
preferences — localStorage, database, API, etc. When the student returns, pass
the stored object back into `<AuraPreviewWidget auraParams={stored} />`.

---

## Dismissal Handoff Notes

- The host close button lives in `integration/qbit-shop/AuraLabModal.jsx`
- The exit confirmation modal lives inside the Aura Lab repo in `src/components/ConfirmExitModal.tsx`
- The internal close orchestration lives in `src/components/Layout.tsx`
- The bridge listener for `qbit:request-close` lives in `src/hooks/useParentBridge.ts`

## Development tips

- In this merged branch, the shop runs on `5173` and the Aura Lab runs on `5175`
- For local testing here, set `AURA_LAB_URL = 'http://localhost:5175'`
- The iframe needs `allow="autoplay"` for the background video and sounds to work
- The `html2canvas` library is already a dependency of the Q-bit Shop project

# Integrating the Aura Lab into the Q-bit Shop

This guide explains how to add the "Enter Aura Lab" flow to the Q-bit Customisation shop.
The Aura Lab runs inside an iframe; the two apps communicate via `postMessage`.

---

## Message Protocol

### Parent (Shop) → Iframe (Aura Lab)

| Message type         | Payload                                        | When to send                    |
| -------------------- | ---------------------------------------------- | ------------------------------- |
| `qbit:avatar-data`   | `{ avatarImageUrl: string, avatarConfig?: {} }` | Right after the iframe is ready |

### Iframe (Aura Lab) → Parent (Shop)

| Message type          | Payload                                                 | Meaning                                |
| --------------------- | ------------------------------------------------------- | -------------------------------------- |
| `aura:ready`          | —                                                       | Iframe loaded, send avatar data now    |
| `aura:phase-change`   | `{ phase: string }`                                     | User progressed to a new phase         |
| `aura:equipped`       | `{ auraConfig: { element, energy, chaosPrompt }, auraParams?: AuraParams }` | User clicked "Equip Aura"              |
| `aura:retry`          | —                                                       | User clicked "Retry"                   |
| `aura:close`          | —                                                       | User wants to exit the lab             |

---

## Drop-in component for the Q-bit Shop

Copy `src/components/AuraLabModal.jsx` (below) into the Q-bit Shop project
and render it from `App.jsx`.

### 1. Create `src/components/AuraLabModal.jsx`

```jsx
import { useRef, useEffect, useCallback, useState } from 'react';
import html2canvas from 'html2canvas';

// Point this at wherever the Aura Lab is deployed
const AURA_LAB_URL = 'https://your-aura-lab.vercel.app';

export function AuraLabModal({ open, onClose, onEquip, avatarRef, avatarConfig }) {
  const iframeRef = useRef(null);
  const [iframeReady, setIframeReady] = useState(false);

  // Listen for messages from the Aura Lab iframe
  useEffect(() => {
    if (!open) return;

    const handleMessage = (event) => {
      const { data } = event;
      if (!data?.type?.startsWith('aura:')) return;

      switch (data.type) {
        case 'aura:ready':
          setIframeReady(true);
          break;

        case 'aura:equipped':
          console.log('Aura equipped!', data.payload.auraConfig);
          // Store BOTH auraConfig and auraParams — auraParams powers the canvas aura
          onEquip(data.payload.auraConfig, data.payload.auraParams ?? null);
          onClose();
          break;

        case 'aura:retry':
          console.log('User retrying aura generation');
          break;

        case 'aura:close':
          onClose();
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      setIframeReady(false);
    };
  }, [open, onClose]);

  // Once the iframe signals ready, capture the avatar and send it over
  useEffect(() => {
    if (!iframeReady || !avatarRef?.current || !iframeRef.current) return;

    html2canvas(avatarRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    }).then((canvas) => {
      const avatarImageUrl = canvas.toDataURL('image/png');

      iframeRef.current.contentWindow.postMessage(
        {
          type: 'qbit:avatar-data',
          payload: { avatarImageUrl, avatarConfig },
        },
        AURA_LAB_URL,
      );
    });
  }, [iframeReady, avatarRef, avatarConfig]);

  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <button style={closeBtnStyle} onClick={onClose}>✕</button>
      <iframe
        ref={iframeRef}
        src={AURA_LAB_URL}
        title="Aura Lab"
        style={iframeStyle}
        allow="autoplay"
      />
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  background: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const iframeStyle = {
  width: '100%',
  height: '100%',
  border: 'none',
  borderRadius: '12px',
};

const closeBtnStyle = {
  position: 'absolute',
  top: 16,
  right: 16,
  zIndex: 10000,
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.3)',
  color: '#fff',
  fontSize: '1.25rem',
  width: 40,
  height: 40,
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
```

### 2. Wire it into `App.jsx`

In the Q-bit Shop's `App.jsx`, add the modal and an "Enter Aura Lab" button:

```jsx
import { useRef, useState } from 'react';
import { AuraLabModal } from './components/AuraLabModal';
import { AuraPreviewWidget } from './components/AuraPreviewWidget';
// ... existing imports ...

function App() {
  const avatarRef = useRef(null);          // ref to the avatar preview DOM node
  const [showAuraLab, setShowAuraLab] = useState(false);
  const [equippedAura, setEquippedAura] = useState(null);

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
        onEquip={(config, params) => {
          setEquippedAura(params);
          // persist config + params to your backend if needed
        }}
        avatarRef={avatarRef}
        avatarConfig={selections}
      />
    </>
  );
}
```

### 3. Update the Aura Lab URL

In `AuraLabModal.jsx`, change `AURA_LAB_URL` to your actual deployment URL.
For local development, use `http://localhost:5173` (or whichever port Vite uses).

---

## How the flow works end-to-end

```
Student opens Q-bit Shop
  └─ Customizes their avatar (hair, headgear, skin, etc.)
  └─ Clicks "⚡ Enter Aura Lab"
       └─ Full-screen iframe overlay opens
       └─ Aura Lab loads, sends `aura:ready`
       └─ Shop captures avatar via html2canvas, sends `qbit:avatar-data`
       └─ Student goes through: Element → Energy → Chaos Prompt → Processing
       └─ REVEAL screen shows their customized Q-bit with the generated aura
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

## Development tips

- Run both projects simultaneously on different ports (`5173` and `5174`)
- For local testing, set `AURA_LAB_URL = 'http://localhost:5174'`
- The iframe needs `allow="autoplay"` for the background video and sounds to work
- The `html2canvas` library is already a dependency of the Q-bit Shop project

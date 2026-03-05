# Aura Lab — Sound Map

Every sound in the Aura Lab experience, mapped to its MP3 file,
when it plays, and how to play it.

---

## Quick Reference

| MP3 File | Trigger | Type | Used In |
|---|---|---|---|
| `hover.mp3` | Mouse enters any button | One-shot | All screens |
| `select.mp3` | Button click (general) | One-shot | Retry button |
| `keystroke.mp3` | Typewriter line completes | One-shot | Dialogue box |
| `typewriterTick.mp3` | Each character typed in dialogue | One-shot (throttled ~60ms) | Dialogue box |
| `initiate.mp3` | "Initiate Aura Generation" pressed | One-shot | IDLE → PROMPT |
| `glitch.mp3` | "Generate" pressed on prompt | One-shot | PROMPT → PROCESSING |
| `laserZap.mp3` | Claw arms fire a single burst | One-shot | Arms animate |
| `laserBeam.mp3` | Continuous laser during processing | **Loop** | PROCESSING phase |
| `machineDrone.mp3` | Low drone during processing | **Loop** | PROCESSING phase |
| `machinePulse.mp3` | Rhythmic pulse during processing | One-shot, **every 650ms** | PROCESSING phase |
| `tensionSub.mp3` | Sub-bass throb during screen shake | **Loop** | PROCESSING phase |
| `shatterImpact.mp3` | Reveal starts — heavy boom | One-shot | PROCESSING → REVEAL |
| `shatterShimmer.mp3` | Reveal — ascending shimmer | One-shot, **200ms after impact** | REVEAL |
| `shatterSparkle.mp3` | Reveal — crystalline sparkle | One-shot, **500ms after impact** | REVEAL |
| `equip.mp3` | "Equip Aura" pressed — first chime | One-shot | REVEAL |
| `equipChime.mp3` | Second ascending chime | One-shot, **120ms after equip** | REVEAL |
| `introWhoosh.mp3` | Intro splash — deep whoosh | One-shot | Intro screen |
| `introHit.mp3` | Intro splash — punchy hit | One-shot, **300ms after whoosh** | Intro screen |

---

## Detailed Flow

### 1. INTRO SPLASH (app load)

```
0ms    → play introWhoosh.mp3
300ms  → play introHit.mp3
```

### 2. IDLE SCREEN (waiting for user)

```
Dialogue typing:
  Each character → play typewriterTick.mp3  (throttle: skip if <60ms since last)
  Line complete  → play keystroke.mp3

Any button hover → play hover.mp3

"Initiate Aura Generation" clicked:
  → play initiate.mp3
  → transition to PROMPT phase
```

### 3. PROMPT SCREEN (user enters prompt)

```
Dialogue typing:
  Same typewriter sounds as IDLE

Any button hover → play hover.mp3

"Generate" clicked (or Enter key):
  → play glitch.mp3
  → start all PROCESSING sounds (see below)
  → transition to PROCESSING phase

300ms after generate:
  → play laserZap.mp3  (one-shot claw burst)
```

### 4. PROCESSING PHASE (aura being generated, ~10s)

**Start all of these simultaneously when processing begins:**

```
LOOP:  laserBeam.mp3    — continuous laser hum
LOOP:  machineDrone.mp3  — low machine drone
LOOP:  tensionSub.mp3    — sub-bass throb

INTERVAL (every 650ms):
  → play machinePulse.mp3

ESCALATING ALARM (code-generated, NOT in MP3 files):
  The tension alarm pulses that accelerate and rise in pitch
  are dynamically generated — see note below.
```

**When generation completes (after ~10s), stop everything and reveal:**

```
STOP:  laserBeam.mp3
STOP:  machineDrone.mp3
STOP:  tensionSub.mp3
STOP:  machinePulse interval

Then immediately play the 3-layer reveal sequence:
  0ms    → play shatterImpact.mp3
  200ms  → play shatterShimmer.mp3
  500ms  → play shatterSparkle.mp3

→ transition to REVEAL phase
```

### 5. REVEAL SCREEN (aura modifier + character)

```
Any button hover → play hover.mp3

"Equip Aura" clicked:
  0ms    → play equip.mp3
  120ms  → play equipChime.mp3

"Retry" clicked:
  → play select.mp3
  → reset to IDLE
```

---

## How to Loop an MP3

```js
const audio = new Audio('/sounds/laserBeam.mp3');
audio.loop = true;
audio.play();

// To stop:
audio.pause();
audio.currentTime = 0;
```

## How to Play a One-Shot

```js
const audio = new Audio('/sounds/hover.mp3');
audio.play();
```

For frequently played sounds (hover, typewriterTick), pre-create
the Audio object and clone it to allow overlapping playback:

```js
const hoverSrc = new Audio('/sounds/hover.mp3');
function playHover() {
  const clone = hoverSrc.cloneNode();
  clone.play();
}
```

## How to Play a Timed Sequence

```js
// Shatter reveal
new Audio('/sounds/shatterImpact.mp3').play();
setTimeout(() => new Audio('/sounds/shatterShimmer.mp3').play(), 200);
setTimeout(() => new Audio('/sounds/shatterSparkle.mp3').play(), 500);
```

---

## Note on Tension Alarm

The escalating alarm during screen shake (pulses that start slow at 260Hz
and accelerate from 900ms intervals down to 100ms while rising in pitch)
is **dynamically generated** in the current ZzFX implementation and has
no static MP3 equivalent. Options:

1. **Keep this one sound as ZzFX** — it's a single `zzfx()` call in a timer
2. **Pre-render a full 10s alarm ramp** as one long MP3
3. **Skip it** — the 3 looping layers + pulse already sound dramatic

---

## File Sizes

Total: ~178 KB for all 18 MP3 files.

Generated from ZzFX parameters using: `node scripts/export-sounds.mjs`

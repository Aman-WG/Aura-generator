import { zzfx, ZZFX } from 'zzfx';

type ZzfxParams = (number | undefined)[];

// ─── ZzFX Parameter Index Reference ────────────────────────────────
// [volume, randomness, frequency, attack, sustain, release, shape,
//  shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime,
//  noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo]
//
// Shapes: 0=sin  1=tri  2=saw  3=tan  4=noise

const SFX = {
  // ── UI Feedback ──────────────────────────────────────────────────

  hover: [, , 1500, .003, .01, .01, 1, , 20, , , , , , , , , .5] as ZzfxParams,

  select: [, , 560, .01, .07, .12, 2, 1.8, , -5, -60, .03, , , , , .01, .65] as ZzfxParams,

  keystroke: [.04, , 2500, .001, .005, .008, 4, , , , , , , , , , , .3] as ZzfxParams,

  typewriterTick: [.07, .02, 720, .001, .02, .025, 1, , -15, , , , , , , , , .65] as ZzfxParams,

  // ── Flow Triggers ────────────────────────────────────────────────

  initiate: [.5, , 220, .01, .2, .35, 2, 1.5, 30, 1.5, 400, .12, , , , , , .5, .08] as ZzfxParams,

  glitch: [.4, .1, 180, .01, .1, .25, 3, 2, 10, , -250, .01, .03, .5, 25, .02, , .3, .04, .15] as ZzfxParams,

  // ── Laser / Claw Fire ────────────────────────────────────────────

  laserZap: [.3, .03, 1000, .02, .7, .25, 0, , -40, , , , , .04, 50, , , .6] as ZzfxParams,

  laserBeam: [.12, , 900, .08, .7, .08, 0, , , , , , , .03, 55, , , .9] as ZzfxParams,

  // ── Machine Processing (2 layers: drone + rhythmic pulse) ───────

  machineDrone: [.12, , 80, .15, 1.0, .15, 2, 2, , , , , , , 8, , , , , .35] as ZzfxParams,

  machinePulse: [.12, .05, 220, , .05, .08, 2, 1.5, -30, , -80, .02, , .2] as ZzfxParams,

  // ── Tension Build (sub-bass layer, looped) ───────────────────────

  tensionSub: [.12, , 50, .1, .8, .1, 0, , , , , , , , , , , , , .45] as ZzfxParams,

  // ── Gacha Reveal (3-layer shatter) ───────────────────────────────

  shatterImpact: [.7, .1, 50, , .12, .5, 4, 2, , , -200, .02, , .6, , , .02, .15, .05] as ZzfxParams,

  shatterShimmer: [.35, , 700, .06, .35, .7, 0, 1, , , 500, .1, , , , , , .6] as ZzfxParams,

  shatterSparkle: [.25, , 1400, .01, .15, .4, 0, , 60, , 200, .05, , , , , , .5] as ZzfxParams,

  // ── Equip Confirmation ───────────────────────────────────────────

  equip: [.5, , 500, .02, .12, .2, 0, 1.2, , , 350, .07, , , , , , .7] as ZzfxParams,

  equipChime: [.3, , 900, .01, .08, .3, 0, , , , 200, .06, , , , , .05, .5] as ZzfxParams,

  // ── Intro Cinematic ──────────────────────────────────────────────

  introWhoosh: [.3, , 60, .08, .25, .5, 0, , 80, 3, , , , .15, , , , .3, .08] as ZzfxParams,

  introHit: [.6, .05, 120, , .08, .4, 4, 1.5, , , , , , .4, , , , .2, .05] as ZzfxParams,
} as const;

class SoundManager {
  private _enabled = true;
  private _machineInterval: ReturnType<typeof setInterval> | null = null;
  private _droneSource: AudioBufferSourceNode | null = null;
  private _laserSource: AudioBufferSourceNode | null = null;
  private _tensionActive = false;
  private _tensionTimeout: ReturnType<typeof setTimeout> | null = null;
  private _tensionSubSource: AudioBufferSourceNode | null = null;
  private _lastTickTime = 0;

  get enabled() {
    return this._enabled;
  }

  setEnabled(on: boolean) {
    this._enabled = on;
    if (!on) {
      this.stopMachineLoading();
      this.stopLaser();
      this.stopTension();
    }
  }

  private fire(params: ZzfxParams) {
    if (!this._enabled) return;
    try {
      zzfx(...params);
    } catch {
      /* audio context may not be ready */
    }
  }

  // ── Public API ─────────────────────────────────────────────────

  playHover() {
    this.fire(SFX.hover);
  }

  playSelectElement() {
    this.fire(SFX.select);
  }

  playKeystroke() {
    this.fire(SFX.keystroke);
  }

  /** Tiny per-character tick, throttled to ~60ms so rapid typing doesn't stack. */
  playTypewriterTick() {
    if (!this._enabled) return;
    const now = performance.now();
    if (now - this._lastTickTime < 60) return;
    this._lastTickTime = now;
    this.fire(SFX.typewriterTick);
  }

  playInitiate() {
    this.fire(SFX.initiate);
  }

  playGlitch() {
    this.fire(SFX.glitch);
  }

  // ── Laser (claw fire) ────────────────────────────────────────

  /** One-shot laser zap — plays once when claws fire a single burst. */
  playLaserBurst() {
    this.fire(SFX.laserZap);
  }

  /** Continuous looping laser beam for the processing-phase claw loop. */
  startLaser() {
    if (!this._enabled) return;
    this.stopLaser();
    try {
      const samples = ZZFX.buildSamples(...SFX.laserBeam);
      this._laserSource = ZZFX.playSamples([samples], 1, 1, 0, true);
    } catch { /* fallback: silent */ }
  }

  stopLaser() {
    if (this._laserSource) {
      try { this._laserSource.stop(); } catch { /* already stopped */ }
      this._laserSource = null;
    }
  }

  // ── Machine Processing ────────────────────────────────────────

  /**
   * Starts a layered machine processing sound:
   * continuous low drone + periodic rhythmic pulses.
   * Call stopMachineLoading() or the returned cleanup fn to stop.
   */
  playMachineLoading(): () => void {
    if (!this._enabled) return () => {};

    this.stopMachineLoading();

    try {
      const droneSamples = ZZFX.buildSamples(...SFX.machineDrone);
      this._droneSource = ZZFX.playSamples([droneSamples], 1, 1, 0, true);
    } catch {
      /* fallback: no drone */
    }

    const pulse = () => this.fire(SFX.machinePulse);
    pulse();
    this._machineInterval = setInterval(pulse, 650);

    return () => this.stopMachineLoading();
  }

  stopMachineLoading() {
    if (this._droneSource) {
      try { this._droneSource.stop(); } catch { /* already stopped */ }
      this._droneSource = null;
    }
    if (this._machineInterval) {
      clearInterval(this._machineInterval);
      this._machineInterval = null;
    }
  }

  // ── Tension Build (screen shake phase) ────────────────────────

  /**
   * Escalating alarm that builds tension over the processing phase:
   * - A looped sub-bass throb for physical weight
   * - Alarm pulses that start slow & low-pitched, then accelerate
   *   and rise in frequency toward a critical climax
   */
  startTension(): () => void {
    if (!this._enabled) return () => {};
    this.stopTension();

    this._tensionActive = true;
    let pitch = 0;
    let interval = 900;

    try {
      const subSamples = ZZFX.buildSamples(...SFX.tensionSub);
      this._tensionSubSource = ZZFX.playSamples([subSamples], 1, 1, 0, true);
    } catch { /* silent fallback */ }

    const tick = () => {
      if (!this._tensionActive) return;
      pitch += 22;
      interval = Math.max(100, interval - 55);
      // [vol, rand, freq, atk, sus, rel, shape, curve, ...]
      this.fire([.18, .03, 260 + pitch, .005, .04, .1, 1, , , , , , , , , , , .5]);
      this._tensionTimeout = setTimeout(tick, interval);
    };

    tick();
    return () => this.stopTension();
  }

  stopTension() {
    this._tensionActive = false;
    if (this._tensionTimeout) {
      clearTimeout(this._tensionTimeout);
      this._tensionTimeout = null;
    }
    if (this._tensionSubSource) {
      try { this._tensionSubSource.stop(); } catch { /* already stopped */ }
      this._tensionSubSource = null;
    }
  }

  // ── Reveal / Equip / Intro ────────────────────────────────────

  /**
   * Epic 3-layer gacha shatter reveal:
   * 1. Heavy impact boom
   * 2. Ascending shimmer sweep (200ms later)
   * 3. High crystalline sparkle (500ms later)
   */
  playShatterReveal() {
    if (!this._enabled) return;
    this.fire(SFX.shatterImpact);
    setTimeout(() => this.fire(SFX.shatterShimmer), 200);
    setTimeout(() => this.fire(SFX.shatterSparkle), 500);
  }

  /**
   * Triumphant ascending equip confirmation — double chime.
   */
  playEquip() {
    if (!this._enabled) return;
    this.fire(SFX.equip);
    setTimeout(() => this.fire(SFX.equipChime), 120);
  }

  /**
   * Cinematic intro: deep whoosh + punchy hit.
   */
  playIntroWhoosh() {
    if (!this._enabled) return;
    this.fire(SFX.introWhoosh);
    setTimeout(() => this.fire(SFX.introHit), 300);
  }

  /** Kills every looping / scheduled sound at once. */
  stopAll() {
    this.stopMachineLoading();
    this.stopLaser();
    this.stopTension();
  }
}

export const soundManager = new SoundManager();

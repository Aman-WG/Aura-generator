/**
 * Exports all ZzFX sounds from SoundManager as WAV files.
 * Run: node scripts/export-sounds.mjs
 * Then convert to MP3: for f in public/sounds/*.wav; do ffmpeg -i "$f" -b:a 128k "${f%.wav}.mp3"; done
 */
import { writeFileSync, mkdirSync } from 'fs';

// ─── Inline the ZZFX sample builder (pure math, no Web Audio needed) ───
const SAMPLE_RATE = 44100;

function buildSamples(
  volume = 1, randomness = 0, frequency = 220, attack = 0, sustain = 0,
  release = 0.1, shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0,
  pitchJump = 0, pitchJumpTime = 0, repeatTime = 0, noise = 0,
  modulation = 0, bitCrush = 0, delay = 0, sustainVolume = 1,
  decay = 0, tremolo = 0
) {
  const PI2 = Math.PI * 2;
  const abs = Math.abs;
  const sign = v => v < 0 ? -1 : 1;

  let startSlide = slide *= 500 * PI2 / SAMPLE_RATE / SAMPLE_RATE;
  let startFrequency = frequency *= (1 + randomness * 2 * Math.random() - randomness) * PI2 / SAMPLE_RATE;
  let modOffset = 0, repeat = 0, crush = 0, jump = 1;
  let b = [], t = 0, i = 0, s = 0, f;

  attack = attack * SAMPLE_RATE || 9;
  decay *= SAMPLE_RATE;
  sustain *= SAMPLE_RATE;
  release *= SAMPLE_RATE;
  delay *= SAMPLE_RATE;
  deltaSlide *= 500 * PI2 / SAMPLE_RATE ** 3;
  modulation *= PI2 / SAMPLE_RATE;
  pitchJump *= PI2 / SAMPLE_RATE;
  pitchJumpTime *= SAMPLE_RATE;
  repeatTime = repeatTime * SAMPLE_RATE | 0;

  for (let length = attack + decay + sustain + release + delay | 0; i < length; b[i++] = s * volume) {
    if (!(++crush % (bitCrush * 100 | 0))) {
      s = shape ? shape > 1 ? shape > 2 ? shape > 3 ? shape > 4 ?
        (t / PI2 % 1 < shapeCurve / 2) * 2 - 1 :
        Math.sin(t ** 3) :
        Math.max(Math.min(Math.tan(t), 1), -1) :
        1 - (2 * t / PI2 % 2 + 2) % 2 :
        1 - 4 * abs(Math.round(t / PI2) - t / PI2) :
        Math.sin(t);

      s = (repeatTime ? 1 - tremolo + tremolo * Math.sin(PI2 * i / repeatTime) : 1) *
        (shape > 4 ? s : sign(s) * abs(s) ** shapeCurve) *
        (i < attack ? i / attack :
          i < attack + decay ? 1 - ((i - attack) / decay) * (1 - sustainVolume) :
            i < attack + decay + sustain ? sustainVolume :
              i < length - delay ? (length - i - delay) / release * sustainVolume : 0);

      s = delay ? s / 2 + (delay > i ? 0 :
        (i < length - delay ? 1 : (length - i) / delay) * b[i - delay | 0] / 2 / volume) : s;
    }

    f = (frequency += slide += deltaSlide) * Math.cos(modulation * modOffset++);
    t += f + f * noise * Math.sin(i ** 5);

    if (jump && ++jump > pitchJumpTime) {
      frequency += pitchJump;
      startFrequency += pitchJump;
      jump = 0;
    }

    if (repeatTime && !(++repeat % repeatTime)) {
      frequency = startFrequency;
      slide = startSlide;
      jump ||= 1;
    }
  }

  return b;
}

// ─── WAV encoder ───
function encodeWav(samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = SAMPLE_RATE * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = samples.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return Buffer.from(buffer);
}

// ─── All our ZzFX sounds ───
const SFX = {
  hover:          [undefined, undefined, 1500, .003, .01, .01, 1, undefined, 20, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, .5],
  select:         [undefined, undefined, 560, .01, .07, .12, 2, 1.8, undefined, -5, -60, .03, undefined, undefined, undefined, undefined, .01, .65],
  keystroke:      [.04, undefined, 2500, .001, .005, .008, 4, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, .3],
  typewriterTick: [.07, .02, 720, .001, .02, .025, 1, undefined, -15, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, .65],
  initiate:       [.5, undefined, 220, .01, .2, .35, 2, 1.5, 30, 1.5, 400, .12, undefined, undefined, undefined, undefined, undefined, .5, .08],
  glitch:         [.4, .1, 180, .01, .1, .25, 3, 2, 10, undefined, -250, .01, .03, .5, 25, .02, undefined, .3, .04, .15],
  laserZap:       [.3, .03, 1000, .02, .7, .25, 0, undefined, -40, undefined, undefined, undefined, undefined, .04, 50, undefined, undefined, .6],
  laserBeam:      [.12, undefined, 900, .08, .7, .08, 0, undefined, undefined, undefined, undefined, undefined, undefined, .03, 55, undefined, undefined, .9],
  machineDrone:   [.12, undefined, 80, .15, 1.0, .15, 2, 2, undefined, undefined, undefined, undefined, undefined, undefined, 8, undefined, undefined, undefined, undefined, .35],
  machinePulse:   [.12, .05, 220, undefined, .05, .08, 2, 1.5, -30, undefined, -80, .02, undefined, .2],
  tensionSub:     [.12, undefined, 50, .1, .8, .1, 0, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, .45],
  shatterImpact:  [.7, .1, 50, undefined, .12, .5, 4, 2, undefined, undefined, -200, .02, undefined, .6, undefined, undefined, .02, .15, .05],
  shatterShimmer: [.35, undefined, 700, .06, .35, .7, 0, 1, undefined, undefined, 500, .1, undefined, undefined, undefined, undefined, undefined, .6],
  shatterSparkle: [.25, undefined, 1400, .01, .15, .4, 0, undefined, 60, undefined, 200, .05, undefined, undefined, undefined, undefined, undefined, .5],
  equip:          [.5, undefined, 500, .02, .12, .2, 0, 1.2, undefined, undefined, 350, .07, undefined, undefined, undefined, undefined, undefined, .7],
  equipChime:     [.3, undefined, 900, .01, .08, .3, 0, undefined, undefined, undefined, 200, .06, undefined, undefined, undefined, undefined, .05, .5],
  introWhoosh:    [.3, undefined, 60, .08, .25, .5, 0, undefined, 80, 3, undefined, undefined, undefined, .15, undefined, undefined, undefined, .3, .08],
  introHit:       [.6, .05, 120, undefined, .08, .4, 4, 1.5, undefined, undefined, undefined, undefined, undefined, .4, undefined, undefined, undefined, .2, .05],
};

// ─── Export ───
const outDir = 'public/sounds';
mkdirSync(outDir, { recursive: true });

let count = 0;
for (const [name, params] of Object.entries(SFX)) {
  const cleanParams = params.map(v => v === undefined ? undefined : v);
  const samples = buildSamples(...cleanParams);
  const wav = encodeWav(samples);
  const path = `${outDir}/${name}.wav`;
  writeFileSync(path, wav);
  count++;
  console.log(`  ✓ ${path}  (${(wav.length / 1024).toFixed(1)} KB, ${(samples.length / SAMPLE_RATE).toFixed(2)}s)`);
}

console.log(`\nDone! Exported ${count} sounds to ${outDir}/`);
console.log(`\nTo convert to MP3, run:`);
console.log(`  for f in ${outDir}/*.wav; do ffmpeg -i "$f" -b:a 128k "\${f%.wav}.mp3"; done`);
console.log(`  rm ${outDir}/*.wav  # optional: remove WAVs after conversion`);

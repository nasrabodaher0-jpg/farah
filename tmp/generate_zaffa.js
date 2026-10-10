const fs = require('fs');
const { execSync } = require('child_process');

const sampleRate = 44100;
const duration = 52; // 52 seconds loop
const totalSamples = sampleRate * duration;

const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);

// Helpers
function addTone(buffer, startSec, durSec, freq, gain, type = 'pluck') {
  const startIdx = Math.floor(startSec * sampleRate);
  const len = Math.floor(durSec * sampleRate);
  for (let i = 0; i < len; i++) {
    const idx = startIdx + i;
    if (idx >= totalSamples) break;
    const t = i / sampleRate;
    let env = 0;
    if (type === 'pluck') {
      env = Math.exp(-i / (sampleRate * 0.45)) * (1 - Math.exp(-i / 100));
    } else if (type === 'flute') {
      const attack = Math.min(1, i / (sampleRate * 0.08));
      const release = Math.max(0, 1 - (t - durSec + 0.1) / 0.1);
      env = attack * release;
    } else if (type === 'string') {
      const attack = Math.min(1, i / (sampleRate * 0.12));
      const release = Math.max(0, 1 - (t - durSec + 0.15) / 0.15);
      env = attack * release;
    }

    // Vibrato
    const vib = 1 + 0.008 * Math.sin(2 * Math.PI * 5.2 * t);
    const f = freq * vib;
    const s1 = Math.sin(2 * Math.PI * f * t);
    const s2 = 0.5 * Math.sin(2 * Math.PI * f * 2 * t);
    const s3 = 0.25 * Math.sin(2 * Math.PI * f * 3 * t);
    const s4 = 0.12 * Math.sin(2 * Math.PI * f * 4 * t);
    buffer[idx] += (s1 + s2 + s3 + s4) * env * gain;
  }
}

// Drum (Dom / Tak)
function addDrum(buffer, startSec, type = 'dom', gain = 0.6) {
  const startIdx = Math.floor(startSec * sampleRate);
  const durSec = type === 'dom' ? 0.35 : 0.18;
  const len = Math.floor(durSec * sampleRate);

  for (let i = 0; i < len; i++) {
    const idx = startIdx + i;
    if (idx >= totalSamples) break;
    const t = i / sampleRate;
    if (type === 'dom') {
      const freq = 120 * Math.exp(-t * 18) + 48;
      const env = Math.exp(-t * 9);
      const val = Math.sin(2 * Math.PI * freq * t) * env;
      buffer[idx] += val * gain;
    } else if (type === 'tak') {
      const freq = 650 * Math.exp(-t * 28) + 260;
      const noise = (Math.random() * 2 - 1) * 0.35;
      const env = Math.exp(-t * 22);
      const val = (Math.sin(2 * Math.PI * freq * t) + noise) * env;
      buffer[idx] += val * gain;
    } else if (type === 'clap') {
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 30);
      buffer[idx] += noise * gain * 0.7;
    }
  }
}

// Zaghrouta (Festive Ululation frequency oscillation flutter)
function addZaghrouta(buffer, startSec, durSec, baseFreq = 1600, gain = 0.1) {
  const startIdx = Math.floor(startSec * sampleRate);
  const len = Math.floor(durSec * sampleRate);
  for (let i = 0; i < len; i++) {
    const idx = startIdx + i;
    if (idx >= totalSamples) break;
    const t = i / sampleRate;
    const env = Math.sin(Math.PI * (i / len)); // swell
    // Rapid flutter 14Hz
    const flutter = Math.sin(2 * Math.PI * 14 * t) * 80;
    const freq = baseFreq + flutter;
    const val = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t)) * env;
    buffer[idx] += val * gain;
  }
}

// Arabic Maqam Hijaz / Bayati scale frequencies
// D4, Eb4, F#4, G4, A4, Bb4, C5, D5
const MAQAM = {
  D3: 146.83,
  A3: 220.0,
  D4: 293.66,
  Eb4: 311.13,
  Fs4: 369.99,
  G4: 392.0,
  A4: 440.0,
  Bb4: 466.16,
  C5: 523.25,
  D5: 587.33,
  Eb5: 622.25,
  Fs5: 739.99,
};

// 1. Festive Zaffa Malfuf Rhythm (Tempo 116 BPM -> Beat = 0.517s, Bar = 2.068s)
const beat = 60 / 116; // ~0.517s
const totalBeats = Math.floor(duration / beat);

for (let b = 0; b < totalBeats; b++) {
  const t = b * beat;
  const beatInBar = b % 4;
  if (beatInBar === 0) {
    addDrum(left, t, 'dom', 0.65);
    addDrum(right, t, 'dom', 0.65);
  } else if (beatInBar === 1) {
    addDrum(left, t, 'tak', 0.45);
    addDrum(right, t + 0.002, 'tak', 0.45);
  } else if (beatInBar === 2) {
    addDrum(left, t + beat * 0.5, 'tak', 0.4);
    addDrum(right, t + beat * 0.5, 'tak', 0.4);
  } else if (beatInBar === 3) {
    addDrum(left, t, 'tak', 0.5);
    addDrum(right, t, 'tak', 0.5);
    addDrum(left, t + beat * 0.5, 'dom', 0.4);
    addDrum(right, t + beat * 0.5, 'dom', 0.4);
  }

  // Hand claps on beats 2 and 4
  if (b >= 4 && (beatInBar === 1 || beatInBar === 3)) {
    addDrum(left, t, 'clap', 0.35);
    addDrum(right, t + 0.003, 'clap', 0.35);
  }
}

// 2. Celebratory Drone (Oud / Bass foundation D3 & A3)
for (let t = 0; t < duration; t += beat * 4) {
  addTone(left, t, beat * 4.2, MAQAM.D3, 0.28, 'string');
  addTone(right, t, beat * 4.2, MAQAM.A3, 0.22, 'string');
}

// 3. Melodic Zaffa Phrases (Traditional Arabian Wedding Melody)
// Phrase A: D4 -> G4 -> F#4 -> G4 -> A4 -> G4 -> F#4 -> Eb4 -> D4
const melodyPattern = [
  // Measure 1 & 2
  { note: 'D4', d: 1 },
  { note: 'Fs4', d: 1 },
  { note: 'G4', d: 1.5 },
  { note: 'A4', d: 0.5 },
  { note: 'Bb4', d: 1 },
  { note: 'A4', d: 1 },
  { note: 'G4', d: 2 },
  // Measure 3 & 4
  { note: 'A4', d: 1 },
  { note: 'Bb4', d: 0.5 },
  { note: 'C5', d: 0.5 },
  { note: 'D5', d: 2 },
  { note: 'C5', d: 0.5 },
  { note: 'Bb4', d: 0.5 },
  { note: 'A4', d: 1 },
  { note: 'G4', d: 2 },
  // Measure 5 & 6 (Cadence)
  { note: 'G4', d: 1 },
  { note: 'Fs4', d: 1 },
  { note: 'Eb4', d: 1.5 },
  { note: 'Fs4', d: 0.5 },
  { note: 'D4', d: 3 },
  { note: 'D4', d: 1 },
];

let curBeat = 4; // Start melody after 1 measure of drums
while (curBeat * beat < duration - 4) {
  for (const item of melodyPattern) {
    const t = curBeat * beat;
    if (t >= duration - 4) break;
    const durSec = item.d * beat * 0.95;
    const freq = MAQAM[item.note] || 293.66;
    // Oud Pluck
    addTone(left, t, durSec, freq, 0.42, 'pluck');
    // Sweet flute/ney harmonic doubled in right channel
    addTone(right, t + 0.005, durSec, freq * 2, 0.16, 'flute');
    curBeat += item.d;
  }
}

// 4. Festive Zaghrouta (Joyful ululations at key arrival moments: sec 12, sec 28, sec 44)
addZaghrouta(right, 11.5, 3.2, 1750, 0.14);
addZaghrouta(left, 27.8, 3.5, 1820, 0.15);
addZaghrouta(right, 43.5, 3.8, 1780, 0.16);

// Simple stereo delay / reverb
const delaySamples = Math.floor(0.18 * sampleRate);
for (let i = delaySamples; i < totalSamples; i++) {
  left[i] += right[i - delaySamples] * 0.22;
  right[i] += left[i - delaySamples] * 0.22;
}

// Normalize & write 16-bit PCM WAV
let maxAmp = 0;
for (let i = 0; i < totalSamples; i++) {
  if (Math.abs(left[i]) > maxAmp) maxAmp = Math.abs(left[i]);
  if (Math.abs(right[i]) > maxAmp) maxAmp = Math.abs(right[i]);
}

const norm = maxAmp > 0 ? 0.92 / maxAmp : 1;
const wavHeaderSize = 44;
const byteLen = wavHeaderSize + totalSamples * 4;
const wavBuffer = Buffer.alloc(byteLen);

// WAV Header
wavBuffer.write('RIFF', 0);
wavBuffer.writeUInt32LE(byteLen - 8, 4);
wavBuffer.write('WAVE', 8);
wavBuffer.write('fmt ', 12);
wavBuffer.writeUInt32LE(16, 16); // PCM chunk size
wavBuffer.writeUInt16LE(1, 20); // Audio format 1 (PCM)
wavBuffer.writeUInt16LE(2, 22); // Num channels (stereo)
wavBuffer.writeUInt32LE(sampleRate, 24); // Sample rate
wavBuffer.writeUInt32LE(sampleRate * 4, 28); // Byte rate
wavBuffer.writeUInt16LE(4, 32); // Block align
wavBuffer.writeUInt16LE(16, 34); // Bits per sample
wavBuffer.write('data', 36);
wavBuffer.writeUInt32LE(totalSamples * 4, 40);

let offset = 44;
for (let i = 0; i < totalSamples; i++) {
  const l = Math.max(-1, Math.min(1, left[i] * norm));
  const r = Math.max(-1, Math.min(1, right[i] * norm));
  wavBuffer.writeInt16LE(Math.round(l * 32767), offset);
  wavBuffer.writeInt16LE(Math.round(r * 32767), offset + 2);
  offset += 4;
}

fs.writeFileSync('/tmp/zaffa.wav', wavBuffer);
console.log('WAV generated successfully! Encoding with ffmpeg...');

// Convert to high quality MP3
execSync('ffmpeg -y -i /tmp/zaffa.wav -codec:a libmp3lame -qscale:a 2 /public/templates/bab/assets/zaffa.mp3');
console.log('MP3 created at /public/templates/bab/assets/zaffa.mp3!');

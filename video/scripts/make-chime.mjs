// Generates a pleasant two-note bell chime as a 16-bit PCM WAV.
import { writeFileSync, mkdirSync } from "node:fs";

const sampleRate = 44100;
const duration = 1.8; // seconds
const n = Math.floor(sampleRate * duration);

// Two notes (G5, C6) with a bell-like exponential decay + a bright partial.
const notes = [
  { freq: 783.99, start: 0.0, decay: 2.6, gain: 0.55 }, // G5
  { freq: 1046.5, start: 0.16, decay: 2.4, gain: 0.5 }, // C6
];

const data = new Float32Array(n);
for (let i = 0; i < n; i++) {
  const t = i / sampleRate;
  let s = 0;
  for (const note of notes) {
    const local = t - note.start;
    if (local < 0) continue;
    const env = Math.exp(-note.decay * local);
    // fundamental + a quieter 2nd partial for a bell timbre
    s +=
      note.gain *
      env *
      (Math.sin(2 * Math.PI * note.freq * local) +
        0.35 * Math.sin(2 * Math.PI * note.freq * 2 * local));
  }
  data[i] = s;
}

// Normalize to avoid clipping and apply a short fade-out at the very end.
let peak = 0;
for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(data[i]));
const norm = peak > 0 ? 0.9 / peak : 1;
const fade = Math.floor(sampleRate * 0.05);
for (let i = 0; i < n; i++) {
  let v = data[i] * norm;
  if (i > n - fade) v *= (n - i) / fade;
  data[i] = v;
}

// Write 16-bit mono WAV
const bytesPerSample = 2;
const buffer = Buffer.alloc(44 + n * bytesPerSample);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + n * bytesPerSample, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
buffer.writeUInt16LE(bytesPerSample, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(n * bytesPerSample, 40);
for (let i = 0; i < n; i++) {
  const v = Math.max(-1, Math.min(1, data[i]));
  buffer.writeInt16LE(Math.round(v * 32767), 44 + i * bytesPerSample);
}

mkdirSync("public", { recursive: true });
writeFileSync("public/chime.wav", buffer);
console.log(`Wrote public/chime.wav (${(buffer.length / 1024).toFixed(1)} kB, ${duration}s)`);

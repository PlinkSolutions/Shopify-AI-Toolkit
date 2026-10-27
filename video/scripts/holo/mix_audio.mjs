// Mix a composition's soundtrack straight from its cue module, without
// rendering frames (an audio-only Remotion render still evaluates every WebGL
// frame, which takes longer than the video itself).
//
// usage: node scripts/holo/mix_audio.mjs <cues.ts> <out.wav>
// The module exports FPS, TOTAL_FRAMES and CUES ({src (public path), at
// (frame), vol}[]), the same values the composition plays. Output: 48 kHz
// stereo 16-bit, like Remotion's mixer.
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [cuesPath, outPath] = process.argv.slice(2);
if (!cuesPath || !outPath) {
  console.error("usage: node scripts/holo/mix_audio.mjs <cues.ts> <out.wav>");
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), "mix-"));
const bundle = join(dir, "cues.mjs");
await build({ entryPoints: [resolve(cuesPath)], bundle: true, platform: "node", format: "esm", outfile: bundle, logLevel: "error" });
const { FPS, TOTAL_FRAMES, CUES } = await import(pathToFileURL(bundle).href);
rmSync(dir, { recursive: true, force: true });

const SR = 48000;
const N = Math.round((TOTAL_FRAMES / FPS) * SR);
const mix = new Float64Array(N);

/** 16-bit PCM WAV → mono Float64Array resampled to SR. */
const cache = new Map();
function load(src) {
  if (cache.has(src)) return cache.get(src);
  const b = readFileSync(join("public", src));
  let p = 12, fmt, data;
  while (p < b.length) {
    const id = b.toString("ascii", p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === "fmt ") fmt = { ch: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
    if (id === "data") data = b.subarray(p + 8, p + 8 + size);
    p += 8 + size + (size % 2);
  }
  if (!fmt || !data || fmt.bits !== 16) throw new Error(`${src}: expected 16-bit PCM WAV`);
  const frames = data.length / 2 / fmt.ch;
  const mono = new Float64Array(frames);
  for (let i = 0; i < frames; i++) {
    let s = 0;
    for (let c = 0; c < fmt.ch; c++) s += data.readInt16LE((i * fmt.ch + c) * 2);
    mono[i] = s / fmt.ch / 32768;
  }
  const len = Math.floor((frames * SR) / fmt.sr);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const x = (i * fmt.sr) / SR, i0 = Math.floor(x), t = x - i0;
    out[i] = mono[i0] * (1 - t) + (mono[Math.min(i0 + 1, frames - 1)] ?? 0) * t;
  }
  cache.set(src, out);
  return out;
}

for (const c of CUES) {
  const x = load(c.src), o = Math.round((Math.max(0, c.at) / FPS) * SR);
  for (let i = 0; i < x.length && o + i < N; i++) mix[o + i] += x[i] * c.vol;
}

let peak = 0;
for (const v of mix) peak = Math.max(peak, Math.abs(v));
const pcm = Buffer.alloc(44 + N * 4);
pcm.write("RIFF", 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write("WAVEfmt ", 8);
pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34);
pcm.write("data", 36); pcm.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const s = Math.round(Math.max(-1, Math.min(1, mix[i])) * 32767);
  pcm.writeInt16LE(s, 44 + i * 4); pcm.writeInt16LE(s, 46 + i * 4);
}
writeFileSync(outPath, pcm);
console.log(`${outPath}: ${(N / SR).toFixed(2)} s, ${CUES.length} cues, peak ${peak.toFixed(2)}${peak > 1 ? " (clipped)" : ""}`);

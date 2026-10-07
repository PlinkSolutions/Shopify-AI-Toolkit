import { pipeline, env } from "@huggingface/transformers";
import { readFileSync, writeFileSync } from "node:fs";

const [, , modelRoot, audioPath, outPath] = process.argv;
env.allowRemoteModels = false;
env.localModelPath = modelRoot;

const SR = 16000;
const buf = readFileSync(audioPath);
const audio = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
const asr = await pipeline("automatic-speech-recognition", "Xenova/whisper-small", {
  dtype: { encoder_model: "q8", decoder_model_merged: "q8" },
});

const all = [];
for (const start of [0, 10, 20]) {
  const slice = audio.subarray(start * SR, Math.min(audio.length, (start + 10) * SR));
  const out = await asr(slice, { return_timestamps: "word", language: "spanish", task: "transcribe" });
  console.log(`[${start}s]`, out.text.trim());
  for (const c of out.chunks) {
    all.push({ text: c.text.trim(), start: c.timestamp[0] + start, end: (c.timestamp[1] ?? c.timestamp[0] + 0.3) + start });
  }
}
writeFileSync(outPath, JSON.stringify(all, null, 2));
console.log("words:", all.length);

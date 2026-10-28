// Narrate a reel with ElevenLabs and write its word timings in one step: the
// with-timestamps endpoint returns per-character times for the exact text we
// send, so every script word gets its [start, end] without transcription.
//
// usage: node scripts/holo/voice_elevenlabs.mjs <reel-dir> [--from-response resp.json]
// env:   ELEVENLABS_API_KEY (required), ELEVENLABS_VOICE_ID (else looked up by
//        the name in scripts/holo/voz.json, which also holds model and settings)
// out:   public/holo/reels/<slug>/voice.mp3 + voice.wav, <reel-dir>/voice.ts
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const reelDir = args[0];
const fromResponse = args.includes("--from-response") ? args[args.indexOf("--from-response") + 1] : null;
if (!reelDir) {
  console.error("usage: node scripts/holo/voice_elevenlabs.mjs <reel-dir> [--from-response resp.json]");
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), "voice-"));
await build({ entryPoints: [resolve("src/Holo/kit/timeline.ts")], bundle: true, platform: "node", format: "esm", outfile: join(tmp, "t.mjs"), logLevel: "error" });
const { segmentsOf, scriptWords } = await import(pathToFileURL(join(tmp, "t.mjs")).href);

const guion = JSON.parse(readFileSync(join(reelDir, "guion.json"), "utf8"));
const voz = JSON.parse(readFileSync("scripts/holo/voz.json", "utf8"));
const words = scriptWords(segmentsOf(guion));
// one paragraph per block, as pasted by hand in ElevenLabs (gives natural pauses)
const text = guion.bloques.map((b) => b.escenas.map((e) => e.texto).join(" ")).join("\n");

const API = "https://api.elevenlabs.io/v1";
function curl(url, { method = "GET", body } = {}) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set (add it to the environment's secrets)");
  const headers = join(tmp, "h.txt"), out = join(tmp, "out.json");
  writeFileSync(headers, `xi-api-key: ${key}\nContent-Type: application/json\n`, { mode: 0o600 });
  const cmd = ["-sS", "-X", method, url, "-H", `@${headers}`, "-o", out, "-w", "%{http_code}", "--max-time", "300"];
  if (body) {
    writeFileSync(join(tmp, "body.json"), JSON.stringify(body));
    cmd.push("--data-binary", `@${join(tmp, "body.json")}`);
  }
  try {
    for (let attempt = 1; ; attempt++) {
      const code = Number(execFileSync("curl", cmd, { encoding: "utf8" }));
      const res = readFileSync(out, "utf8");
      if (code === 200) return JSON.parse(res);
      if ((code === 429 || code >= 500) && attempt < 4) {
        execFileSync("sleep", [String(attempt * 10)]);
        continue;
      }
      throw new Error(`ElevenLabs ${code}: ${res.slice(0, 400)}`);
    }
  } finally {
    rmSync(headers, { force: true }); // the key never stays on disk
  }
}

let resp;
if (fromResponse) resp = JSON.parse(readFileSync(fromResponse, "utf8"));
else {
  let voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) {
    const { voices } = curl(`${API}/voices?search=${encodeURIComponent(voz.voz.split(" - ")[0])}`);
    const v = voices.find((x) => x.name === voz.voz) ?? voices.find((x) => x.name.startsWith(voz.voz.split(" - ")[0]));
    if (!v) throw new Error(`voice "${voz.voz}" not found in the account; set ELEVENLABS_VOICE_ID`);
    voiceId = v.voice_id;
  }
  console.log(`ElevenLabs: ${text.length} characters, voice ${voiceId}, ${voz.model_id}`);
  resp = curl(`${API}/text-to-speech/${voiceId}/with-timestamps?output_format=${voz.output_format}`, {
    method: "POST",
    body: { text, model_id: voz.model_id, voice_settings: voz.voice_settings },
  });
  writeFileSync(join(tmp, "response.json"), JSON.stringify(resp));
}

// Group the character timings into whitespace-separated words.
const { characters: ch, character_start_times_seconds: cs, character_end_times_seconds: ce } = resp.alignment;
const timed = [];
let cur = null;
ch.forEach((c, i) => {
  if (/\s/.test(c)) {
    if (cur) timed.push(cur);
    cur = null;
  } else if (!cur) cur = { text: c, start: cs[i], end: ce[i] };
  else {
    cur.text += c;
    cur.end = ce[i];
  }
});
if (cur) timed.push(cur);
if (timed.length !== words.length || timed.some((t, i) => t.text !== words[i].text)) {
  const i = timed.findIndex((t, k) => t.text !== words[k]?.text);
  throw new Error(`alignment does not match the script at word ${i}: "${timed[i]?.text}" vs "${words[i]?.text}" (${timed.length} vs ${words.length} words)`);
}

const slug = guion.slug;
const outDir = join("public/holo/reels", slug);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "voice.mp3"), Buffer.from(resp.audio_base64, "base64"));
const ff = process.env.FFMPEG ?? "ffmpeg";
execFileSync(ff, ["-v", "error", "-y", "-i", join(outDir, "voice.mp3"), "-af", `volume=${voz.gain_db}dB`, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", join(outDir, "voice.wav")]);

const rows = timed.map((t, i) => `  [${t.start.toFixed(3)}, ${t.end.toFixed(3)}], // ${words[i].text}`);
writeFileSync(
  join(reelDir, "voice.ts"),
  `// Narration word timings (seconds), one [start, end] per script word in
// reading order. Generated by scripts/holo/voice_elevenlabs.mjs from the
// ElevenLabs character timestamps — regenerate instead of editing.
export const VOICE_WORDS: [number, number][] = [
${rows.join("\n")}
];
`,
);
rmSync(tmp, { recursive: true, force: true });
const last = timed[timed.length - 1].end;
console.log(`${slug}: ${words.length} words, ${last.toFixed(1)} s of narration → ${outDir}/voice.wav, ${reelDir}/voice.ts`);

// Facts about a reel's timeline, for the render script and the reviewer.
//
// usage: node scripts/holo/reel_info.mjs <slug>          → JSON summary
//        node scripts/holo/reel_info.mjs <slug> frames   → total frames only
import { build } from "esbuild";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [slug, what] = process.argv.slice(2);
if (!slug) {
  console.error("usage: node scripts/holo/reel_info.mjs <slug> [frames]");
  process.exit(1);
}
const dir = resolve("src/Holo/reels", slug);
const tmp = mkdtempSync(join(tmpdir(), "info-"));
writeFileSync(join(tmp, "entry.ts"), `export { TL, GUION } from ${JSON.stringify(join(dir, "timeline.ts"))};\nexport { VOICE_WORDS } from ${JSON.stringify(join(dir, "voice.ts"))};\n`);
await build({ entryPoints: [join(tmp, "entry.ts")], bundle: true, platform: "node", format: "esm", outfile: join(tmp, "e.mjs"), logLevel: "error" });
const { TL, GUION, VOICE_WORDS } = await import(pathToFileURL(join(tmp, "e.mjs")).href);
rmSync(tmp, { recursive: true, force: true });

if (what === "frames") {
  console.log(TL.TOTAL_FRAMES);
  process.exit(0);
}
const FPS = 30;
const words = TL.WORDS.length;
const speech = TL.WORDS[words - 1].end - TL.WORDS[0].start;
const firstWord = TL.WORDS[0].start;
console.log(
  JSON.stringify(
    {
      slug,
      composition: `reel-${slug}`,
      titulo: GUION.titulo,
      frames: TL.TOTAL_FRAMES,
      seconds: +(TL.TOTAL_FRAMES / FPS).toFixed(2),
      voice: VOICE_WORDS.length === words ? "real" : "estimated (no voice yet)",
      words,
      words_per_minute: Math.round((words / speech) * 60),
      first_word_at_s: +firstWord.toFixed(2),
      caption_pages: TL.PAGES.length,
      scenes: TL.SCENES.map((s, i) => ({
        n: i + 1,
        from_s: +(s.from / FPS).toFixed(2),
        dur_s: +(s.dur / FPS).toFixed(2),
        words: s.words.length,
        text: s.words.map((w) => w.text).join(" "),
      })),
      end_card_from_s: +(TL.END_FROM / FPS).toFixed(2),
    },
    null,
    1,
  ),
);

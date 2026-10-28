// Scaffold a reel folder from its guion.json: empty voice timings, timeline,
// cues (voice + cut whooshes + end glitch), index, one placeholder scene per
// narration segment, and the entry in src/Holo/reels/index.ts. Replace the
// placeholder scenes with the real ones; existing files are never overwritten.
//
// usage: node scripts/holo/new_reel.mjs <slug>   (src/Holo/reels/<slug>/guion.json must exist)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];
const dir = join("src/Holo/reels", slug ?? "");
if (!slug || !existsSync(join(dir, "guion.json"))) {
  console.error("usage: node scripts/holo/new_reel.mjs <slug>  (write src/Holo/reels/<slug>/guion.json first)");
  process.exit(1);
}
const guion = JSON.parse(readFileSync(join(dir, "guion.json"), "utf8"));
if (guion.slug !== slug) throw new Error(`guion.json slug "${guion.slug}" ≠ folder "${slug}"`);
const segments = guion.bloques.flatMap((b) => b.escenas);
const pad = (n) => String(n).padStart(2, "0");

const files = {
  "voice.ts": `// Narration word timings (seconds), one [start, end] per script word in
// reading order. Empty until the voice exists (timings are then estimated);
// written by scripts/holo/voice_elevenlabs.mjs — regenerate instead of editing.
export const VOICE_WORDS: [number, number][] = [];
`,
  "timeline.ts": `import { Guion } from "../../kit/guion";
import { makeTimeline } from "../../kit/timeline";
import guionJson from "./guion.json";
import { VOICE_WORDS } from "./voice";

export const GUION: Guion = guionJson;
export const TL = makeTimeline(GUION, VOICE_WORDS);
`,
  "cues.ts": `// Soundtrack: the narration plus sound effects keyed to its words (no music
// bed), about 8 dB under the voice (vol ~0.2–0.35; whoosh 0.28; glitch 0.45).
import { Cue, cueAt, cutWhooshes, sfx, voiceCue } from "../../kit/cues";
import { GUION, TL } from "./timeline";

export { FPS } from "../../kit/timeline";
export const TOTAL_FRAMES = TL.TOTAL_FRAMES;

const at = cueAt(TL);

export const CUES: Cue[] = [
  voiceCue(GUION.slug),
  ...cutWhooshes(TL),
  sfx("blip", at(0, ${JSON.stringify(segments[0].texto.split(/\s+/)[1] ?? segments[0].texto.split(/\s+/)[0])}), 0.3),
  sfx("glitch", TL.GLITCH[0], 0.45),
];
`,
  "index.ts": `import { defineReel } from "../../kit/Reel";
import { CUES } from "./cues";
import { SCENE_COMPONENTS } from "./scenes";
import { GUION, TL } from "./timeline";

export const reel = defineReel(GUION, TL, SCENE_COMPONENTS, CUES);
`,
  "scenes.tsx": `import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Capsule, Cam, HoloStage, V3 } from "../../stage";
import { Chip } from "../../kit/hud";
import { beat, Scene } from "../../kit/timeline";

// One scene per narration segment. Every beat (a label typing in, a toggle
// flipping, a signal travelling) is keyed to the word that triggers it.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = (f: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });
const cam = (sc: Scene, from: V3, to: V3, target: V3, orbit = 0.14): Cam => ({ from, to, target, orbit, dur: sc.dur });

type P = { sc: Scene };

${segments
  .map(
    (e, i) => `// ${i + 1} — ${JSON.stringify(e.texto)}
// TODO: ${e.imagen.replace(/\n/g, " ")}
export const S${pad(i + 1)}: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, ${JSON.stringify(e.texto.split(/\s+/)[0])});
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA ${i + 1}
      </Chip>
    </AbsoluteFill>
  );
};`,
  )
  .join("\n\n")}

export const SCENE_COMPONENTS = [${segments.map((_, i) => `S${pad(i + 1)}`).join(", ")}];
`,
};

for (const [name, body] of Object.entries(files)) {
  const p = join(dir, name);
  if (existsSync(p)) console.log(`keep   ${p}`);
  else {
    writeFileSync(p, body);
    console.log(`create ${p}`);
  }
}

const reg = "src/Holo/reels/index.ts";
let index = readFileSync(reg, "utf8");
const varName = `r${slug.split("-")[0]}`;
if (!index.includes(`"./${slug}"`)) {
  index = index.replace(/(import \{ reel as r\d+ \} from "\.\/[^"]+";\n)(?!import \{ reel)/, `$1import { reel as ${varName} } from "./${slug}";\n`);
  index = index.replace(/export const REELS: ReelDef\[\] = \[([^\]]*)\];/, (_, list) => `export const REELS: ReelDef[] = [${list}, ${varName}];`);
  writeFileSync(reg, index);
  console.log(`register ${varName} in ${reg}`);
}
console.log(`${segments.length} scenes → composition reel-${slug}`);

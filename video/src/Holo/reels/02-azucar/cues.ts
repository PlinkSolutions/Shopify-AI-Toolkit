// Soundtrack: the narration plus sound effects keyed to its words (no music
// bed), about 8 dB under the voice.
import { Cue, cueAt, cutWhooshes, sfx, voiceCue } from "../../kit/cues";
import { beat } from "../../kit/timeline";
import { landings } from "./motion";
import { GUION, TL } from "./timeline";

export { FPS } from "../../kit/timeline";
export const TOTAL_FRAMES = TL.TOTAL_FRAMES;

const at = cueAt(TL);
const S = TL.SCENES;
const crazy = beat(S[0], "locos");

export const CUES: Cue[] = [
  voiceCue(GUION.slug),
  ...cutWhooshes(TL),
  ...[0, 9, 18, 27].map((d) => sfx("pop", S[0].from + 4 + d, 0.14)), // candy popping in
  ...landings(crazy, S[0].dur).map((f, i) => sfx("boing", S[0].from + f - 1, i % 2 ? 0.2 : 0.26)),
  sfx("pop", at(0, "locos"), 0.3),
  ...[0, 4, 8, 12, 16, 20].map((d) => sfx("whoosh", S[1].from + 2 + d, 0.12)), // arrows flying in
  sfx("pop", at(1, "azúcar."), 0.32),
  sfx("stamp", at(2, "no."), 0.45),
  sfx("glitch", TL.GLITCH[0], 0.45),
];

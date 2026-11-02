// Soundtrack: the narration plus sound effects keyed to its words (no music
// bed), about 8 dB under the voice (vol ~0.2–0.35; whoosh 0.28; glitch 0.45).
import { Cue, cueAt, cutWhooshes, sfx, voiceCue } from "../../kit/cues";
import { GUION, TL } from "./timeline";

export { FPS } from "../../kit/timeline";
export const TOTAL_FRAMES = TL.TOTAL_FRAMES;

const at = cueAt(TL);

export const CUES: Cue[] = [
  voiceCue(GUION.slug),
  ...cutWhooshes(TL),
  sfx("blip", at(0, "qué"), 0.3),
  sfx("glitch", TL.GLITCH[0], 0.45),
];

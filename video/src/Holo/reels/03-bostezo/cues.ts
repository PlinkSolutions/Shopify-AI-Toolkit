// Soundtrack: the narration plus sound effects keyed to its words (no music
// bed), about 8 dB under the voice. The hook has sound from frame 0 (stopwatch
// ticking + the challenge popping in), then Leo's yawn and the gulp.
import { Cue, cueAt, cutWhooshes, sfx, voiceCue } from "../../kit/cues";
import { GUION, TL } from "./timeline";

export { FPS } from "../../kit/timeline";
export const TOTAL_FRAMES = TL.TOTAL_FRAMES;

const at = cueAt(TL);

export const CUES: Cue[] = [
  voiceCue(GUION.slug),
  ...cutWhooshes(TL, 0.22),
  // 1 — hook
  sfx("tick", 0, 0.32),
  sfx("pop", 0, 0.3),
  sfx("yawn", 8, 0.42),
  sfx("gulp", 31, 0.4),
  sfx("whoosh", 36, 0.3),
  sfx("blip", at(0, "bostezar"), 0.28),
  sfx("pop", at(0, "termine"), 0.26),
  // 2 — why do we yawn, why is it contagious
  sfx("pop", at(1, "qué", 0), 0.3),
  sfx("yawn", at(1, "bostezamos") - 3, 0.3),
  sfx("pop", at(1, "qué", 1), 0.3),
  sfx("chirps", at(1, "contagia") - 2, 0.2),
  sfx("yawn2", at(1, "contagia") + 9, 0.3),
  sfx("glitch", TL.GLITCH[0], 0.45),
];

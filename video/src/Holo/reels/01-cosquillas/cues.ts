// Soundtrack: the narration plus sound effects keyed to its words (no music
// bed), each about 8 dB under the voice.
import { Cue, cueAt, cutWhooshes, sfx, voiceCue } from "../../kit/cues";
import { GUION, TL } from "./timeline";

export { FPS } from "../../kit/timeline";
export const TOTAL_FRAMES = TL.TOTAL_FRAMES;

const at = cueAt(TL);
const S = TL.SCENES;

export const CUES: Cue[] = [
  voiceCue(GUION.slug),
  ...cutWhooshes(TL),
  sfx("zap", at(0, "cosquillas"), 0.35),
  sfx("laugh", at(1, "rías"), 0.22),
  sfx("blip", at(2, "piel"), 0.25),
  ...["copia", "predice", "apaga"].map((w) => sfx("blip", at(3, w), 0.3)),
  sfx("notif", at(4, "mensaje") - 4, 0.4),
  sfx("error", at(5, "predicción."), 0.2),
  sfx("zip", at(6, "señal"), 0.25),
  sfx("glow", at(6, "hipotálamo"), 0.35),
  sfx("laugh", at(6, "risa."), 0.25),
  sfx("scan", S[7].from + 4, 0.2),
  ...[0, 14, 28].map((d) => sfx("blip", at(8, "antes") - 6 + d, 0.32)),
  sfx("glow", S[9].from + 2, 0.4),
  sfx("whoosh", at(10, "neurocientífica") - 8, 0.3),
  sfx("servo", at(10, "robot.") - 6, 0.22),
  sfx("servo", S[11].from + 4, 0.16),
  sfx("laugh", at(11, "volvían."), 0.19),
  sfx("laugh", at(11, "cosquillas."), 0.25),
  sfx("chirps", at(12, "ríen"), 0.28),
  sfx("fear", at(13, "miedo,"), 0.18),
  sfx("rise", at(14, "confianza.") - 10, 0.45),
  sfx("blip", at(15, "persona"), 0.35),
  sfx("sent", at(15, "cosquillas.") - 2, 0.45),
  sfx("glitch", TL.GLITCH[0], 0.45),
];

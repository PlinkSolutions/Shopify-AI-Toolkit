// Soundtrack of the tickle reel: the narration plus sound effects keyed to its
// words (no music bed). Kept apart from the scenes so scripts/holo/mix_audio.mjs
// can mix the same cues without rendering every WebGL frame.
import { beat, END_FROM, SCENES } from "./timeline";

export { FPS, TOTAL_FRAMES } from "./timeline";

export const GLITCH_FROM = END_FROM - 10;
export const GLITCH_TO = END_FROM + 4;
const at = (i: number, word: string, nth = 0) => SCENES[i].from + beat(SCENES[i], word, nth);

export type Cue = { src: string; at: number; vol: number };
export const CUES: Cue[] = [
  { src: "holo/tickle/voice.wav", at: 0, vol: 1 },
  ...SCENES.slice(1).map((s) => ({ src: "holo/sfx/whoosh.wav", at: s.from - 3, vol: 0.28 })),
  { src: "holo/tickle/zap.wav", at: at(0, "cosquillas"), vol: 0.35 },
  { src: "holo/tickle/laugh.wav", at: at(1, "rías"), vol: 0.22 },
  { src: "holo/sfx/blip.wav", at: at(2, "piel"), vol: 0.25 },
  ...["copia", "predice", "apaga"].map((w) => ({ src: "holo/sfx/blip.wav", at: at(3, w), vol: 0.3 })),
  { src: "holo/tickle/notif.wav", at: at(4, "mensaje") - 4, vol: 0.4 },
  { src: "holo/tickle/error.wav", at: at(5, "predicción."), vol: 0.2 },
  { src: "holo/tickle/zip.wav", at: at(6, "señal"), vol: 0.25 },
  { src: "holo/tickle/glow.wav", at: at(6, "hipotálamo"), vol: 0.35 },
  { src: "holo/tickle/laugh.wav", at: at(6, "risa."), vol: 0.25 },
  { src: "holo/tickle/scan.wav", at: SCENES[7].from + 4, vol: 0.2 },
  ...[0, 14, 28].map((d) => ({ src: "holo/sfx/blip.wav", at: at(8, "antes") - 6 + d, vol: 0.32 })),
  { src: "holo/tickle/glow.wav", at: SCENES[9].from + 2, vol: 0.4 },
  { src: "holo/sfx/whoosh.wav", at: at(10, "neurocientífica") - 8, vol: 0.3 },
  { src: "holo/tickle/servo.wav", at: at(10, "robot.") - 6, vol: 0.22 },
  { src: "holo/tickle/servo.wav", at: SCENES[11].from + 4, vol: 0.16 },
  { src: "holo/tickle/laugh.wav", at: at(11, "volvían."), vol: 0.19 },
  { src: "holo/tickle/laugh.wav", at: at(11, "cosquillas."), vol: 0.25 },
  { src: "holo/tickle/chirps.wav", at: at(12, "ríen"), vol: 0.28 },
  { src: "holo/tickle/fear.wav", at: at(13, "miedo,"), vol: 0.18 },
  { src: "holo/tickle/rise.wav", at: at(14, "confianza.") - 10, vol: 0.45 },
  { src: "holo/sfx/blip.wav", at: at(15, "persona"), vol: 0.35 },
  { src: "holo/tickle/sent.wav", at: at(15, "cosquillas.") - 2, vol: 0.45 },
  { src: "holo/tickle/glitch.wav", at: GLITCH_FROM, vol: 0.45 },
];

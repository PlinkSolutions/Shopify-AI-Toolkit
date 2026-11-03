// Soundtrack: the narration plus sound effects keyed to its words (no music
// bed), about 8 dB under the voice. The hook has sound from frame 0 (stopwatch
// ticking + the challenge popping in), then Leo's yawn and the gulp.
import { Cue, cueAt, cutWhooshes, sfx, voiceCue } from "../../kit/cues";
import { GUION, TL } from "./timeline";

export { FPS } from "../../kit/timeline";
export const TOTAL_FRAMES = TL.TOTAL_FRAMES;

const at = cueAt(TL);
const start = (i: number) => TL.SCENES[i].from;

export const CUES: Cue[] = [
  voiceCue(GUION.slug),
  ...cutWhooshes(TL, 0.2),
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
  // 3 — lab: yawning scientist, chalk drawing, stamp
  sfx("yawn2", at(2, "hacemos") - 2, 0.24),
  sfx("zip", at(2, "nacer") - 2, 0.16),
  sfx("blip", at(2, "nacer") + 2, 0.22),
  sfx("stamp", at(2, "sabe"), 0.4),
  sfx("boing", at(2, "sirve") - 4, 0.18),
  // 4 — ultrasound
  sfx("scan", at(3, "ecografías"), 0.24),
  sfx("pop", at(3, "bostezar"), 0.2),
  sfx("blip", at(3, "veinticuatro"), 0.28),
  sfx("whoosh", at(3, "vientre") - 6, 0.24),
  // 5 — not sleep, not contagion
  sfx("pop", start(4) + 2, 0.24),
  sfx("error", at(4, "sueño"), 0.3),
  sfx("error", at(4, "contagio"), 0.3),
  // 6 — cooling the brain
  sfx("pop", start(5) + 2, 0.24),
  sfx("yawn", at(5, "bostezar") - 4, 0.26),
  sfx("glow", at(5, "enfría") - 2, 0.3),
  // 7 — ice pack, fewer yawns
  sfx("pop", at(6, "frío"), 0.26),
  sfx("thump", at(6, "frente") + 2, 0.4),
  sfx("blip", at(6, "menos"), 0.24),
  sfx("blip", at(6, "menos") + 4, 0.24),
  sfx("blip", at(6, "menos") + 8, 0.28),
  // 8 — lights off, the weird part
  sfx("thump", start(7) + 2, 0.3),
  sfx("boing", at(7, "aquí"), 0.3),
  sfx("notif", at(7, "raro"), 0.24),
  // 9 — Pisa
  sfx("blip", at(8, "Universidad"), 0.26),
  sfx("chirps", at(8, "observaron"), 0.2),
  sfx("pop", at(8, "cien"), 0.28),
  sfx("zip", at(8, "durante") + 2, 0.18),
  sfx("blip", at(8, "año"), 0.24),
  // 10 — family, friends, strangers
  sfx("yawn", at(9, "familia") - 8, 0.24),
  sfx("yawn2", at(9, "familia") + 8, 0.2),
  sfx("blip", at(9, "amigos"), 0.24),
  sfx("error", at(9, "desconocidos") + 6, 0.18),
  // 11 — dogs
  sfx("yawn", at(10, "humanos") - 10, 0.26),
  sfx("boing", at(10, "humanos") + 8, 0.16),
  sfx("whoosh", at(10, "veintiuno") - 2, 0.24),
  sfx("chirps", at(10, "veintiuno") + 6, 0.22),
  sfx("notif", at(10, "veintinueve"), 0.26),
  // 12 — empathy or alarm
  sfx("pop", at(11, "empatía"), 0.28),
  sfx("siren", at(11, "alarma"), 0.22),
  sfx("boing", at(11, "despierto"), 0.22),
  sfx("thump", at(11, "nadie"), 0.34),
  // 13 — back to the close-up, the stopwatch stops
  sfx("ding", at(12, "bostezaste"), 0.4),
  sfx("pop", at(12, "confianza") + 2, 0.3),
  // 14 — share
  sfx("whoosh", at(13, "Envíaselo"), 0.24),
  sfx("blip", at(13, "quien"), 0.28),
  sfx("sent", at(13, "contagia"), 0.32),
  sfx("yawn2", at(13, "bostezos"), 0.2),
  // 15 — academy promo
  sfx("pop", at(14, "crear") - 4, 0.24),
  sfx("chirps", at(14, "crear"), 0.16),
  sfx("notif", at(14, "Síguenos") + 8, 0.3),
  sfx("rise", at(14, "revelamos") - 6, 0.24),
  sfx("stamp", at(14, "método"), 0.4),
  // end card
  sfx("pop", TL.END_FROM + 2, 0.3),
  sfx("yawn", TL.END_FROM + 30, 0.2),
];

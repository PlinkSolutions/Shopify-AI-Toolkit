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
  // 1–3 hook, accused cube, FALSO
  ...[0, 9, 18, 27].map((d) => sfx("pop", S[0].from + 4 + d, 0.14)),
  ...landings(crazy, S[0].dur).map((f, i) => sfx("boing", S[0].from + f - 1, i % 2 ? 0.2 : 0.26)),
  sfx("pop", at(0, "locos"), 0.3),
  ...[0, 4, 8, 12, 16].map((d) => sfx("whoosh", S[1].from + 2 + d, 0.12)),
  sfx("pop", at(1, "azúcar."), 0.32),
  sfx("stamp", at(2, "no."), 0.45),
  // 4–5 the blind diets: plates, domes up, calendars, domes down, shuffle, question
  ...[0, 4, 8].map((d) => sfx("pop", S[3].from + d, 0.16)),
  sfx("glow", at(3, "dietas"), 0.3),
  ...[0, 4, 8].map((d) => sfx("blip", at(3, "semanas") + d, 0.25)),
  sfx("pop", at(4, "azúcar"), 0.28),
  sfx("pop", at(4, "endulzantes"), 0.28),
  sfx("thump", at(4, "Nadie") + 6, 0.35),
  ...[0, 11, 22].map((d) => sfx("whoosh", at(4, "Nadie") + 9 + d, 0.2)),
  sfx("pop", at(4, "tocaba"), 0.32),
  // 6 the kids' gauges line up
  sfx("pop", at(5, "sensibles"), 0.26),
  sfx("blip", at(5, "distinto"), 0.32),
  // 7–9 the magnifier, mom's thought bubble, the lie
  sfx("whoosh", S[6].from + 3, 0.3),
  sfx("scan", S[6].from + 6, 0.12),
  sfx("whoosh", at(7, "dijeron"), 0.22),
  sfx("pop", at(7, "mamás"), 0.28),
  sfx("pop", at(7, "mucha"), 0.24),
  sfx("pop", at(7, "azúcar."), 0.24),
  sfx("zip", at(8, "mentira:"), 0.3),
  sfx("glow", at(8, "mentira:") + 8, 0.25),
  sfx("pop", at(8, "endulzante"), 0.26),
  // 10 split screen
  ...[0, 13, 26, 39].map((d) => sfx("boing", S[9].from + 4 + d, 0.16)),
  sfx("error", at(9, "inquietos…"), 0.18),
  sfx("whoosh", at(9, "vigilaban"), 0.2),
  sfx("pop", at(9, "cerca."), 0.26),
  // 11 the balance settles
  ...[0, 6, 12, 18, 24].map((d) => sfx("thump", at(10, "juntar") + 9 + d, 0.18)),
  sfx("servo", at(10, "juntar") + 4, 0.14),
  sfx("glow", at(10, "cambió"), 0.3),
  // 12–13 the party and the pink glasses
  sfx("rise", at(11, "fiesta,") - 6, 0.3),
  sfx("laugh", at(11, "fiesta,") + 6, 0.2),
  sfx("pop", at(11, "disfraces,"), 0.3),
  ...[0, 4, 8].map((d) => sfx("boing", at(11, "otros") + 8 + d, 0.2)),
  sfx("whoosh", at(12, "esperamos") - 6, 0.3),
  sfx("thump", at(12, "esperamos") + 2, 0.3),
  // 14 share
  sfx("blip", at(13, "quien"), 0.3),
  sfx("sent", at(13, "ponen"), 0.4),
  sfx("stamp", at(13, "locos."), 0.42),
  sfx("glitch", TL.GLITCH[0], 0.45),
];

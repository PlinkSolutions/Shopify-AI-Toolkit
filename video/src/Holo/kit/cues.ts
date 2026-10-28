// Sound cue helpers. A reel's cues.ts lists its voice and sound effects with
// these; scripts/holo/mix_audio.mjs mixes the same list without rendering
// frames, so keep cue modules React-free.
import { beat, Timeline } from "./timeline";

export type Cue = { src: string; at: number; vol: number };

/** Absolute frame of a word in scene i (n-th occurrence). */
export const cueAt = (tl: Timeline) => (i: number, word: string, nth = 0) => tl.SCENES[i].from + beat(tl.SCENES[i], word, nth);

/** The narration, from frame 0 (its own timings include the lead-in). */
export const voiceCue = (slug: string): Cue => ({ src: `holo/reels/${slug}/voice.wav`, at: 0, vol: 1 });

/** Soft whoosh into every cut. */
export const cutWhooshes = (tl: Timeline, vol = 0.28): Cue[] => tl.SCENES.slice(1).map((s) => ({ src: "holo/sfx/whoosh.wav", at: s.from - 3, vol }));

/** Sound effect from the shared library (public/holo/sfx, scripts/holo/make_sfx_library.py). */
export const sfx = (name: string, at: number, vol: number): Cue => ({ src: `holo/sfx/${name}.wav`, at, vol });

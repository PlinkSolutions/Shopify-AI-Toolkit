// Narration timeline of a reel. Every word of the script gets a [start, end]
// from the voice-over (the reel's voice.ts, written by voice_elevenlabs.mjs or
// align_words.mjs); scenes, caption pages, HUD beats and sound cues all follow
// those timings. Without a recording yet, timings are estimated from a calm
// documentary read so the reel can be previewed. React-free on purpose:
// scripts bundle it (mix_audio.mjs, voice_elevenlabs.mjs).
import type { Guion } from "./guion";

export const FPS = 30;
const LEAD_IN = 0.35;
const END_CARD = 3.2; // seconds after the last word

export type Word = { text: string; seg: number; start: number; end: number; key: boolean };
export type Scene = { seg: number; from: number; dur: number; words: Word[] };
export type Page = { from: number; to: number; words: Word[] };
export type Timeline = {
  WORDS: Word[];
  SCENES: Scene[];
  PAGES: Page[];
  END_FROM: number;
  END_DUR: number;
  TOTAL_FRAMES: number;
  /** Frames of the RGB glitch into the end card. */
  GLITCH: [number, number];
};

export const bare = (w: string) => w.toLowerCase().replace(/[¿?¡!.,:;…"«»]/g, "");
const f = (s: number) => Math.round(s * FPS);

/** One narration segment per scene, in reading order. */
export const segmentsOf = (g: Guion) => g.bloques.flatMap((b) => b.escenas.map((e) => e.texto));

/** Script words in reading order (the unit every timing refers to). */
export const scriptWords = (segments: string[]) => segments.flatMap((s, seg) => s.split(/\s+/).filter(Boolean).map((text) => ({ text, seg })));

function estimate(words: { text: string; seg: number }[], targetSeconds: number): [number, number][] {
  const raw = words.map(({ text, seg }, i) => {
    const letters = text.replace(/[^\p{L}\p{N}]/gu, "").length;
    let pause = 0;
    if (/…$/.test(text)) pause = 0.5;
    else if (/[.?!]$/.test(text)) pause = 0.36;
    else if (/:$/.test(text)) pause = 0.28;
    else if (/,$/.test(text)) pause = 0.17;
    if (!words[i + 1] || words[i + 1].seg !== seg) pause += 0.12;
    return { t: 0.15 + 0.058 * letters, pause };
  });
  const total = raw.reduce((a, r) => a + r.t + r.pause, 0);
  const k = (targetSeconds - LEAD_IN) / total;
  let clock = LEAD_IN;
  return raw.map((r) => {
    const start = clock;
    clock = start + (r.t + r.pause) * k;
    return [start, start + r.t * k];
  });
}

export function makeTimeline(guion: Guion, voice: [number, number][]): Timeline {
  const segments = segmentsOf(guion);
  const keywords = new Set(guion.palabras_clave.map(bare));
  const script = scriptWords(segments);
  if (voice.length && voice.length !== script.length) {
    throw new Error(`${guion.slug}: voice.ts has ${voice.length} words but guion.json has ${script.length}; the script changed after the voice was made, regenerate it`);
  }
  // no voice yet: ~160 words per minute, as in the reference
  const times = voice.length ? voice : estimate(script, (script.length / 160) * 60);
  const WORDS: Word[] = script.map(({ text, seg }, i) => ({ text, seg, start: times[i][0], end: times[i][1], key: keywords.has(bare(text)) }));
  const lastEnd = WORDS[WORDS.length - 1].end;

  const SCENES: Scene[] = segments.map((_, seg) => {
    const ws = WORDS.filter((w) => w.seg === seg);
    return { seg, from: Math.max(0, f(ws[0].start) - 4), dur: 0, words: ws };
  });
  SCENES.forEach((s, i) => {
    const next = SCENES[i + 1];
    s.dur = (next ? next.from : f(lastEnd + 0.9)) - s.from;
  });

  // Caption pages: 1–4 words per page, clauses split evenly (no orphan words).
  const PAGES: Page[] = [];
  let clause: Word[] = [];
  const flushClause = () => {
    if (!clause.length) return;
    const chars = clause.map((w) => w.text).join(" ").length;
    const n = Math.max(Math.ceil(clause.length / 4), Math.ceil(chars / 24));
    const size = Math.ceil(clause.length / n);
    for (let i = 0; i < clause.length; i += size) {
      const ws = clause.slice(i, i + size);
      PAGES.push({ from: f(ws[0].start), to: 0, words: ws });
    }
    clause = [];
  };
  WORDS.forEach((w, i) => {
    if (clause.length && clause[0].seg !== w.seg) flushClause();
    clause.push(w);
    if (/[.,:;…?!]$/.test(w.text) || i === WORDS.length - 1) flushClause();
  });
  PAGES.forEach((p, i) => {
    p.to = PAGES[i + 1] ? PAGES[i + 1].from : f(lastEnd + 0.9);
  });

  const last = SCENES[SCENES.length - 1];
  const END_FROM = last.from + last.dur;
  const END_DUR = f(END_CARD);
  return { WORDS, SCENES, PAGES, END_FROM, END_DUR, TOTAL_FRAMES: END_FROM + END_DUR, GLITCH: [END_FROM - 10, END_FROM + 4] };
}

/** Frame (relative to the scene start) when the n-th occurrence of a word starts. */
export function beat(scene: Scene, word: string, nth = 0) {
  const target = bare(word);
  const hits = scene.words.filter((w) => bare(w.text) === target);
  const w = hits[Math.min(nth, hits.length - 1)];
  if (!w) throw new Error(`"${word}" not in scene ${scene.seg}`);
  return f(w.start) - scene.from;
}

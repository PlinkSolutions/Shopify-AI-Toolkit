// Narration timeline for "¿Por qué no puedes hacerte cosquillas a ti mismo?".
// Word timings come from the voice-over (voice.ts, aligned with
// scripts/holo/align_words.mjs); every scene, caption and HUD beat follows
// them. If the script changes before a new recording exists, the timings are
// estimated from a calm documentary read instead, for previews.
import { scriptWords, SEGMENTS } from "./script";
import { VOICE_WORDS } from "./voice";

export const FPS = 30;
const TARGET_SECONDS = 100; // estimated narration length (matches the reference)
const LEAD_IN = 0.35;
const END_CARD = 3.2; // seconds after the last word

/** Words shown in the gold caption box. */
const KEYWORDS = new Set([
  "cosquillas", "cerebro", "cerebelo", "apaga", "mensaje", "predicción", "hipotálamo", "risa", "resonancia",
  "antes", "curioso", "robot", "retraso", "ratas", "miedo", "confianza", "salvo", "leyó", "completa",
]);

export type Word = { text: string; seg: number; start: number; end: number; key: boolean };
export type Scene = { seg: number; from: number; dur: number; words: Word[] };
export type Page = { from: number; to: number; words: Word[] };

const bare = (w: string) => w.toLowerCase().replace(/[¿?¡!.,:;…"]/g, "");

function estimate(words: { text: string; seg: number }[]): [number, number][] {
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
  const k = (TARGET_SECONDS - LEAD_IN) / total;
  let clock = LEAD_IN;
  return raw.map((r) => {
    const start = clock;
    clock = start + (r.t + r.pause) * k;
    return [start, start + r.t * k];
  });
}

const SCRIPT = scriptWords();
const TIMES = VOICE_WORDS.length === SCRIPT.length ? VOICE_WORDS : estimate(SCRIPT);
export const WORDS: Word[] = SCRIPT.map(({ text, seg }, i) => ({ text, seg, start: TIMES[i][0], end: TIMES[i][1], key: KEYWORDS.has(bare(text)) }));
const f = (s: number) => Math.round(s * FPS);

export const SCENES: Scene[] = SEGMENTS.map((_, seg) => {
  const ws = WORDS.filter((w) => w.seg === seg);
  return { seg, from: Math.max(0, f(ws[0].start) - 4), dur: 0, words: ws };
});
SCENES.forEach((s, i) => {
  const next = SCENES[i + 1];
  s.dur = (next ? next.from : f(WORDS[WORDS.length - 1].end + 0.9)) - s.from;
});

export const END_FROM = SCENES[SCENES.length - 1].from + SCENES[SCENES.length - 1].dur;
export const END_DUR = f(END_CARD);
export const TOTAL_FRAMES = END_FROM + END_DUR;

/** Caption pages: 1–4 words per page, clauses split evenly (no orphan words). */
export const PAGES: Page[] = (() => {
  const pages: Page[] = [];
  let clause: Word[] = [];
  const flushClause = () => {
    if (!clause.length) return;
    const chars = clause.map((w) => w.text).join(" ").length;
    const n = Math.max(Math.ceil(clause.length / 4), Math.ceil(chars / 24));
    const size = Math.ceil(clause.length / n);
    for (let i = 0; i < clause.length; i += size) {
      const ws = clause.slice(i, i + size);
      pages.push({ from: f(ws[0].start), to: 0, words: ws });
    }
    clause = [];
  };
  WORDS.forEach((w, i) => {
    if (clause.length && clause[0].seg !== w.seg) flushClause();
    clause.push(w);
    if (/[.,:;…?!]$/.test(w.text) || i === WORDS.length - 1) flushClause();
  });
  pages.forEach((p, i) => {
    p.to = pages[i + 1] ? pages[i + 1].from : f(WORDS[WORDS.length - 1].end + 0.9);
  });
  return pages;
})();

/** Frame (relative to the scene start) when the n-th occurrence of a word starts. */
export function beat(scene: Scene, word: string, nth = 0) {
  const target = bare(word);
  const hits = scene.words.filter((w) => bare(w.text) === target);
  const w = hits[Math.min(nth, hits.length - 1)];
  if (!w) throw new Error(`"${word}" not in scene ${scene.seg}`);
  return f(w.start) - scene.from;
}

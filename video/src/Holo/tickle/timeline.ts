// Narration timeline for "¿Por qué no puedes hacerte cosquillas a ti mismo?".
// Word timings are estimated from a calm documentary read (~160 wpm with
// pauses at punctuation and "…"). When the real voice-over exists, replace
// `estimate()` with the word timestamps from its transcription and every
// scene, caption and HUD beat follows automatically.

export const FPS = 30;
const TARGET_SECONDS = 100; // total narration length (matches the reference)
const LEAD_IN = 0.35;
const END_CARD = 3.2; // seconds after the last word

/** One scene per sentence or idea, in script order. */
export const SEGMENTS: string[] = [
  "¿Por qué no puedes hacerte cosquillas a ti mismo?",
  "¿Y por qué basta con que alguien acerque la mano… para que te rías antes de que te toque?",
  "No es que tu piel falle. Es que tu cerebro sabe lo que vas a hacer… antes de que lo hagas.",
  "Piénsalo así: cuando mueves la mano, tu cerebelo copia la orden, predice lo que vas a sentir… y apaga la sensación.",
  "Tus propias cosquillas son un mensaje que tu cerebro ya leyó.",
  "Pero si la mano es de otra persona, no hay predicción.",
  "Y pasan tres cosas: la señal llega completa… el hipotálamo, una zona que controla tus reacciones automáticas, se enciende… y tu cuerpo estalla en risa.",
  "Investigadores de la Universidad de Friburgo lo vieron con resonancia magnética:",
  "el hipotálamo se activa incluso antes del contacto, solo con anticipar las cosquillas.",
  "Pero aquí viene lo curioso.",
  "En el University College London, la neurocientífica Sarah-Jayne Blakemore hizo que voluntarios se hicieran cosquillas con un robot.",
  "Si el robot copiaba su movimiento al instante, las sentían mucho menos… pero con un pequeño retraso, volvían. Cuanto más retraso, más cosquillas.",
  "Y no somos los únicos. En la Universidad Humboldt de Berlín vieron que las ratas también se ríen con las cosquillas, con un sonido que no podemos oír…",
  "pero si tenían miedo, las cosquillas desaparecían.",
  "Los científicos creen que en nosotros pasa algo parecido. Las cosquillas no son solo un juego… son una señal de confianza. Tu cerebro solo se deja sorprender por alguien con quien se siente a salvo.",
  "Mándaselo a esa persona que sabe exactamente dónde tienes cosquillas.",
];

/** Words shown in the gold caption box. */
const KEYWORDS = new Set([
  "cosquillas", "cerebro", "cerebelo", "apaga", "mensaje", "predicción", "hipotálamo", "risa", "resonancia",
  "antes", "curioso", "robot", "retraso", "ratas", "miedo", "confianza", "salvo", "leyó", "completa",
]);

export type Word = { text: string; seg: number; start: number; end: number; key: boolean };
export type Scene = { seg: number; from: number; dur: number; words: Word[] };
export type Page = { from: number; to: number; words: Word[] };

const bare = (w: string) => w.toLowerCase().replace(/[¿?¡!.,:;…"]/g, "");

function estimate() {
  const raw: { text: string; seg: number; t: number; pause: number }[] = [];
  SEGMENTS.forEach((s, seg) => {
    const ws = s.split(/\s+/).filter(Boolean);
    ws.forEach((text, k) => {
      const letters = text.replace(/[^\p{L}\p{N}]/gu, "").length;
      let pause = 0;
      if (/…$/.test(text)) pause = 0.5;
      else if (/[.?!]$/.test(text)) pause = 0.36;
      else if (/:$/.test(text)) pause = 0.28;
      else if (/,$/.test(text)) pause = 0.17;
      if (k === ws.length - 1) pause += 0.12;
      raw.push({ text, seg, t: 0.15 + 0.058 * letters, pause });
    });
  });
  const total = raw.reduce((a, r) => a + r.t + r.pause, 0);
  const k = (TARGET_SECONDS - LEAD_IN) / total;
  let clock = LEAD_IN;
  return raw.map((r) => {
    const start = clock;
    const end = start + r.t * k;
    clock = end + r.pause * k;
    return { text: r.text, seg: r.seg, start, end, key: KEYWORDS.has(bare(r.text)) };
  });
}

export const WORDS: Word[] = estimate();
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

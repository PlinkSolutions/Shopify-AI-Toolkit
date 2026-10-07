import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, GRID, HEIGHT, SPLIT_Y, WIDTH } from "./theme";

export type CaptionChunk = { text: string; startFrame: number; endFrame: number };
export type Word = { text: string; start: number; end: number };

// Spanish words a caption should not end on ("Y ENCIMA TE" -> "Y ENCIMA" / "TE RESPONDE").
const FUNCTION_WORDS = new Set([
  "a", "al", "con", "de", "del", "el", "en", "la", "las", "lo", "los", "me", "os", "por", "que", "qué", "se", "si", "te", "tu", "un", "una", "y",
]);
// Capitalised words that do not start a sentence.
const PROPER = new Set(["Claude", "Instagram", "Agent", "Skill", "IA", "AGENTE"]);

// Group transcript words into 1-3 word caption chunks, like the reference
// ("CLAUDE ACABA" / "A INSTAGRAM" / "LO CONECTÁS"). Chunks break at sentence
// ends and starts, at pauses, and never end on a function word.
export const buildCaptionChunks = (
  words: Word[],
  fps: number,
  maxWords = 3,
  maxChars = 16,
): CaptionChunk[] => {
  const clean = (t: string) => t.replace(/[.,;:]/g, "").toUpperCase();
  const bare = (t: string) => t.replace(/[¿?¡!.,;:]/g, "");
  const startsSentence = (w: Word) => /^[¿¡]?[A-ZÁÉÍÓÚÑ]/.test(w.text) && !PROPER.has(bare(w.text));
  const groups: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next: Word | undefined = words[i + 1];
    const label = cur.map((x) => clean(x.text)).join(" ");
    const hardBreak = !next || /[.,?!]$/.test(w.text) || next.start - w.end > 0.3 || startsSentence(next);
    const full = !!next && (cur.length >= maxWords || (label + " " + clean(next.text)).length > maxChars);
    if (hardBreak || full) {
      // soft break on a function word: carry it over to the next chunk
      if (!hardBreak && cur.length > 1 && FUNCTION_WORDS.has(bare(w.text).toLowerCase())) {
        cur.pop();
        groups.push(cur);
        cur = [w];
      } else {
        groups.push(cur);
        cur = [];
      }
    }
  });
  if (cur.length) {
    groups.push(cur);
  }
  // a pause can still leave "EN" / "Y TE" / "ES LA" dangling: join it to the next chunk if it fits
  const len = (g: Word[]) => g.map((x) => clean(x.text)).join(" ").length;
  for (let i = 0; i < groups.length - 1; i++) {
    const last = bare(groups[i][groups[i].length - 1].text).toLowerCase();
    const sentenceEnd = /[.?!]$/.test(groups[i][groups[i].length - 1].text);
    if (!sentenceEnd && FUNCTION_WORDS.has(last) && len(groups[i]) + 1 + len(groups[i + 1]) <= maxChars + 2) {
      groups.splice(i, 2, [...groups[i], ...groups[i + 1]]);
      i--;
    }
  }
  return groups.map((g, i) => {
    const next = groups[i + 1];
    return {
      text: g.map((x) => clean(x.text)).join(" "),
      startFrame: Math.round(g[0].start * fps),
      endFrame: Math.round((next ? next[0].start : g[g.length - 1].end + 0.4) * fps),
    };
  });
};

export const GridPaper: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      height: SPLIT_Y,
      backgroundColor: colors.paper,
      backgroundImage: `linear-gradient(${colors.gridLine} 2px, transparent 2px), linear-gradient(90deg, ${colors.gridLine} 2px, transparent 2px)`,
      backgroundSize: `${GRID}px ${GRID}px`,
      backgroundPosition: `-1px -1px`,
      overflow: "hidden",
    }}
  >
    {children}
  </AbsoluteFill>
);

export const CaptionPill: React.FC<{ chunks: CaptionChunk[] }> = ({ chunks }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chunk = chunks.find((c) => frame >= c.startFrame && frame < c.endFrame);
  if (!chunk) {
    return null;
  }
  const pop = spring({
    frame: frame - chunk.startFrame,
    fps,
    config: { damping: 18, stiffness: 260, mass: 0.5 },
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: SPLIT_Y,
          left: WIDTH / 2,
          transform: `translate(-50%, -50%) scale(${interpolate(pop, [0, 1], [0.86, 1])})`,
          backgroundColor: colors.pill,
          color: "white",
          fontFamily: fonts.mono,
          fontWeight: 800,
          fontSize: 50,
          letterSpacing: "0.12em",
          lineHeight: 1,
          padding: "22px 32px 24px 38px",
          borderRadius: 14,
          whiteSpace: "nowrap",
          boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
        }}
      >
        {chunk.text}
      </div>
    </AbsoluteFill>
  );
};

/** Plays only the given [start, end] source ranges back to back (jump cuts). */
export const JumpCutVideo: React.FC<{
  src: string; // file inside public/
  segments: [number, number][];
  faceY?: string;
}> = ({ src, segments, faceY = "30%" }) => {
  const { fps } = useVideoConfig();
  let at = 0;
  return (
    <>
      {segments.map(([s0, s1], i) => {
        const from = Math.round(at * fps);
        at += s1 - s0;
        const to = Math.round(at * fps);
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <AbsoluteFill>
              <OffthreadVideo
                src={staticFile(src)}
                startFrom={Math.round(s0 * fps)}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${faceY}` }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </>
  );
};

export const SplitLayout: React.FC<{
  top: React.ReactNode;
  video?: string; // file inside public/, played straight through
  bottom?: React.ReactNode; // or any custom bottom layer (e.g. JumpCutVideo)
  captions: CaptionChunk[];
  faceY?: string; // object-position Y for the talking head crop
}> = ({ top, video, bottom, captions, faceY = "30%" }) => (
  <AbsoluteFill style={{ backgroundColor: colors.paper }}>
    {/* Each layer in its own AbsoluteFill so they stack instead of flowing. */}
    <AbsoluteFill style={{ top: SPLIT_Y, height: HEIGHT - SPLIT_Y, overflow: "hidden" }}>
      {bottom ??
        (video ? (
          <OffthreadVideo
            src={staticFile(video)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${faceY}` }}
          />
        ) : null)}
    </AbsoluteFill>
    <GridPaper>{top}</GridPaper>
    <CaptionPill chunks={captions} />
  </AbsoluteFill>
);

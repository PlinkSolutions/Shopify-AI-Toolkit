import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, GRID, HEIGHT, SPLIT_Y, WIDTH } from "./theme";

export type CaptionChunk = { text: string; startFrame: number; endFrame: number };
export type Word = { text: string; start: number; end: number };

// Group transcript words into 1-3 word caption chunks, like the reference
// ("CLAUDE ACABA" / "A INSTAGRAM" / "LO CONECTÁS").
export const buildCaptionChunks = (
  words: Word[],
  fps: number,
  maxWords = 3,
  maxChars = 16,
): CaptionChunk[] => {
  const clean = (t: string) => t.replace(/[.,;:]/g, "").toUpperCase();
  const chunks: CaptionChunk[] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const label = cur.map((x) => clean(x.text)).join(" ");
    const endsPhrase = /[.,?!]$/.test(w.text);
    const tooLong = next && (label + " " + clean(next.text)).length > maxChars;
    if (!next || endsPhrase || tooLong || cur.length >= maxWords || next.start - w.end > 0.3) {
      chunks.push({
        text: label,
        startFrame: Math.round(cur[0].start * fps),
        endFrame: Math.round((next ? next.start : w.end + 0.4) * fps),
      });
      cur = [];
    }
  });
  return chunks;
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

export const SplitLayout: React.FC<{
  top: React.ReactNode;
  video: string; // file inside public/
  captions: CaptionChunk[];
  faceY?: string; // object-position Y for the talking head crop
}> = ({ top, video, captions, faceY = "30%" }) => (
  <AbsoluteFill style={{ backgroundColor: colors.paper }}>
    {/* Each layer in its own AbsoluteFill so they stack instead of flowing. */}
    <AbsoluteFill style={{ top: SPLIT_Y, height: HEIGHT - SPLIT_Y, overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(video)}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${faceY}` }}
      />
    </AbsoluteFill>
    <GridPaper>{top}</GridPaper>
    <CaptionPill chunks={captions} />
  </AbsoluteFill>
);

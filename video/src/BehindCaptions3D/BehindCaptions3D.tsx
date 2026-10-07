import "@fontsource/gluten/900.css";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CaptionPage, CaptionWord, PAGES } from "./pages";

// Big bubbly 3D poster captions behind the speaker. Layers: full video,
// captions, person cutout on top, so the speaker is never covered while the
// text can disappear behind them. Layout comes from make_pages_3d.py.

// Keep in sync with scripts/behind-captions/make_pages_3d.py
const LINE_HEIGHT = 0.8;
const LETTER_SPACING = -0.01;
const SPACE_EM = 0.22;

const FILL = "#c0de4e";
const EXTRUDE_FROM = "#93b52c";
const EXTRUDE_TO = "#2e440d";

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

// Stacked hard shadows fake an extruded 3D slab under the letters.
const extrusion = (fontSize: number) => {
  const depth = 12;
  const step = fontSize / 240;
  const layers: string[] = [];
  for (let k = 1; k <= depth; k++) {
    layers.push(
      `${(k * 0.45 * step).toFixed(2)}px ${(k * 0.85 * step).toFixed(2)}px 0 ${mix(EXTRUDE_FROM, EXTRUDE_TO, k / depth)}`,
    );
  }
  layers.push(`0 ${fontSize * 0.12}px ${fontSize * 0.22}px rgba(0,0,0,0.45)`);
  return layers.join(", ");
};

const Word: React.FC<{
  word: CaptionWord;
  pageStart: number;
  fontSize: number;
}> = ({ word, pageStart, fontSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - (word.startFrame - pageStart);

  // bouncy pop, rising from behind the speaker
  const s = spring({
    frame: local,
    fps,
    config: { damping: 12, stiffness: 190, mass: 0.6 },
  });
  const opacity = interpolate(local, [0, 2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shadow = extrusion(fontSize);

  return (
    <span
      style={{
        display: "inline-block",
        opacity,
        transform: `translateY(${(1 - s) * fontSize * 0.3}px) scale(${0.35 + 0.65 * s})`,
        transformOrigin: "50% 80%",
      }}
    >
      {[...word.text].map((ch, i) => {
        // hand-made poster feel: every letter slightly off its neighbours
        const seed = `${word.startFrame}-${word.text}-${i}`;
        const rot = (random(`r${seed}`) - 0.5) * 9;
        const dy = (random(`y${seed}`) - 0.5) * 0.05 * fontSize;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${dy}px) rotate(${rot}deg)`,
              textShadow: shadow,
              letterSpacing: `${LETTER_SPACING}em`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

const Page: React.FC<{ page: CaptionPage; index: number }> = ({
  page,
  index,
}) => {
  const frame = useCurrentFrame();
  const duration = page.endFrame - page.startFrame;
  const exit = interpolate(frame, [duration - 4, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tilt = index % 2 === 0 ? -1.5 : 1.5;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: page.top,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "Gluten",
          fontWeight: 900,
          fontSize: page.fontSize,
          lineHeight: LINE_HEIGHT,
          whiteSpace: "nowrap",
          color: FILL,
          opacity: 1 - exit,
          transform: `rotate(${tilt}deg) scale(${1 - exit * 0.15})`,
        }}
      >
        {page.lines.map((line, li) => (
          <div
            key={li}
            style={{ display: "flex", gap: `${SPACE_EM}em`, height: `${LINE_HEIGHT}em` }}
          >
            {line.map((w, i) => (
              <Word
                key={i}
                word={w}
                pageStart={page.startFrame}
                fontSize={page.fontSize}
              />
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const BehindCaptions3D: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <OffthreadVideo src={staticFile("joined.mp4")} />
      {PAGES.map((page, i) => (
        <Sequence
          key={i}
          from={page.startFrame}
          durationInFrames={Math.max(1, page.endFrame - page.startFrame)}
        >
          <Page page={page} index={i} />
        </Sequence>
      ))}
      <OffthreadVideo src={staticFile("person.webm")} transparent muted />
    </AbsoluteFill>
  );
};

import "@fontsource/anton/400.css";
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
import { CaptionPage, CaptionWord, PAGES } from "./pages";

// Layer order (bottom -> top): full video, 3D captions, person cutout.
// The cutout (VP9 + alpha) hides the parts of the text that fall behind
// the person, which makes the captions look like they sit in the room.

const WHITE_FILL = "#ffffff";
const GOLD_FILL = "#ffd54a";

// Stacked hard shadows fake an extruded 3D slab under the letters.
const extrusion = (fontSize: number, from: string, to: string) => {
  const depth = 14;
  const step = fontSize / 260;
  const layers: string[] = [];
  for (let k = 1; k <= depth; k++) {
    const t = k / depth;
    layers.push(
      `${(k * 0.55 * step).toFixed(2)}px ${(k * 1.0 * step).toFixed(2)}px 0 ${mix(from, to, t)}`,
    );
  }
  layers.push(`0 ${fontSize * 0.14}px ${fontSize * 0.2}px rgba(0,0,0,0.45)`);
  return layers.join(", ");
};

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

const Word: React.FC<{
  word: CaptionWord;
  pageStart: number;
  fontSize: number;
  active: boolean;
}> = ({ word, pageStart, fontSize, active }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - (word.startFrame - pageStart);

  const s = spring({
    frame: local,
    fps,
    config: { damping: 11, stiffness: 170, mass: 0.7 },
  });
  const opacity = interpolate(local, [0, 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <span
      style={{
        display: "inline-block",
        opacity,
        transform: `translateZ(${(1 - s) * -700}px) rotateX(${(1 - s) * 75}deg) scale(${0.6 + 0.4 * s})`,
        color: active ? GOLD_FILL : WHITE_FILL,
        textShadow: active
          ? extrusion(fontSize, "#e0a800", "#5a3300")
          : extrusion(fontSize, "#cdbcff", "#341a63"),
      }}
    >
      {word.text}
    </span>
  );
};

const Page: React.FC<{ page: CaptionPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const duration = page.endFrame - page.startFrame;
  const absolute = frame + page.startFrame;

  const exit = interpolate(frame, [duration - 4, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // gentle idle drift so the text feels like it floats in the room
  const drift = Math.sin(frame / 9) * 6;

  // the most recently spoken word on this page is highlighted
  const activeIndex = page.words.reduce(
    (acc, w, i) => (w.startFrame <= absolute ? i : acc),
    0,
  );

  return (
    <AbsoluteFill
      style={{ perspective: 1100, perspectiveOrigin: `50% ${page.centerY}px` }}
    >
      <div
        style={{
          position: "absolute",
          top: page.centerY,
          left: 30,
          right: 30,
          display: "flex",
          justifyContent: "center",
          gap: page.fontSize * 0.22,
          fontFamily: "Anton",
          fontSize: page.fontSize,
          lineHeight: 1,
          letterSpacing: page.fontSize * 0.01,
          whiteSpace: "nowrap",
          transformStyle: "preserve-3d",
          opacity: 1 - exit,
          transform: `translateY(-50%) translateY(${drift}px) rotateX(14deg) rotateY(${page.tilt * 10}deg) rotateZ(${page.tilt * -2}deg) translateZ(${exit * -350}px)`,
        }}
      >
        {page.words.map((w, i) => (
          <Word
            key={i}
            word={w}
            pageStart={page.startFrame}
            fontSize={page.fontSize}
            active={i === activeIndex}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const BehindCaptions: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <OffthreadVideo src={staticFile("joined.mp4")} />
      {PAGES.map((page, i) => (
        <Sequence
          key={i}
          from={page.startFrame}
          durationInFrames={Math.max(1, page.endFrame - page.startFrame)}
        >
          <Page page={page} />
        </Sequence>
      ))}
      <OffthreadVideo src={staticFile("person.webm")} transparent muted />
    </AbsoluteFill>
  );
};

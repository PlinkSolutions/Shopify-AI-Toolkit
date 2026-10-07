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
import { CaptionPage, CaptionWord, PAGES, Side } from "./pages";

// Layer order (bottom -> top): full video, 3D captions, person cutout.
// Each caption page is split into two "walls" anchored at the left and right
// frame edges that recede in perspective toward the speaker, so the text
// sits behind them without ever covering them. The cutout (VP9 + alpha) stays
// on top, so a hand swinging past simply passes in front of the text.

// Keep in sync with scripts/behind-captions/make_pages.py (used for fitting).
const PERSPECTIVE = 1500;
const ANGLE_DEG = 48;
const MARGIN = 26;

const WHITE_FILL = "#ffffff";
const GOLD_FILL = "#ffd54a";

// Clip 3 (from frame 480) is shot from above: tilt the text back further so
// it reads as lying on the floor beside the speaker.
const TOP_DOWN_FROM_FRAME = 480;

// Stacked hard shadows fake an extruded 3D slab under the letters.
const extrusion = (fontSize: number, from: string, to: string) => {
  const depth = 10;
  const step = fontSize / 200;
  const layers: string[] = [];
  for (let k = 1; k <= depth; k++) {
    const t = k / depth;
    layers.push(
      `${(k * 0.5 * step).toFixed(2)}px ${(k * 0.9 * step).toFixed(2)}px 0 ${mix(from, to, t)}`,
    );
  }
  layers.push(`0 ${fontSize * 0.12}px ${fontSize * 0.2}px rgba(0,0,0,0.5)`);
  return layers.join(", ");
};

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

// +1 = toward the speaker for the left wall, -1 for the right wall
const towardSpeaker = (side: Side) => (side === "left" ? 1 : -1);

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
    // no overshoot: a bounce would push the word past the frame edge
    config: { damping: 14, stiffness: 170, mass: 0.7, overshootClamping: true },
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
        // slides out along its wall from behind the speaker
        transform: `translateX(${towardSpeaker(word.side) * (1 - s) * fontSize * 2.5}px) scale(${0.85 + 0.15 * s})`,
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

const Wall: React.FC<{
  page: CaptionPage;
  side: Side;
  activeWord: CaptionWord | undefined;
  lean: number;
  exit: number;
  drift: number;
}> = ({ page, side, activeWord, lean, exit, drift }) => {
  const words = page.words.filter((w) => w.side === side);
  if (words.length === 0) {
    return null;
  }
  const lines = [...new Set(words.map((w) => w.line))].sort();
  const isLeft = side === "left";

  return (
    <div
      style={{
        position: "absolute",
        top: page.centerY,
        [isLeft ? "left" : "right"]: MARGIN,
        display: "flex",
        flexDirection: "column",
        alignItems: isLeft ? "flex-start" : "flex-end",
        fontFamily: "Anton",
        fontSize: page.fontSize,
        lineHeight: 1,
        letterSpacing: page.fontSize * 0.01,
        whiteSpace: "nowrap",
        transformStyle: "preserve-3d",
        // hinge on the frame edge; the speaker-side end recedes into depth
        transformOrigin: isLeft ? "0% 50%" : "100% 50%",
        opacity: 1 - exit,
        // on exit the wall slides back behind the speaker
        transform: `translateY(-50%) translateY(${drift}px) rotateY(${isLeft ? ANGLE_DEG : -ANGLE_DEG}deg) rotateX(${lean}deg) translateX(${towardSpeaker(side) * exit * page.fontSize * 3}px)`,
      }}
    >
      {lines.map((line) => (
        <div
          key={line}
          style={{
            display: "flex",
            gap: page.fontSize * 0.22,
            transformStyle: "preserve-3d",
          }}
        >
          {words
            .filter((w) => w.line === line)
            .map((w, i) => (
              <Word
                key={i}
                word={w}
                pageStart={page.startFrame}
                fontSize={page.fontSize}
                active={w === activeWord}
              />
            ))}
        </div>
      ))}
    </div>
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
  const drift = Math.sin(frame / 9) * 4;
  const lean = page.startFrame >= TOP_DOWN_FROM_FRAME ? 22 : 6;

  // the most recently spoken word on this page is highlighted
  const activeWord = page.words.reduce<CaptionWord | undefined>(
    (acc, w) => (w.startFrame <= absolute ? w : acc),
    undefined,
  );

  return (
    <AbsoluteFill
      style={{
        perspective: PERSPECTIVE,
        perspectiveOrigin: `50% ${page.centerY}px`,
      }}
    >
      {(["left", "right"] as const).map((side) => (
        <Wall
          key={side}
          page={page}
          side={side}
          activeWord={activeWord}
          lean={lean}
          exit={exit}
          drift={drift}
        />
      ))}
    </AbsoluteFill>
  );
};

export const BehindCaptions: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Each layer gets its own AbsoluteFill: bare videos would stack in normal
          flow (the cutout ended up below the frame) and paint under the
          absolutely positioned captions. */}
      <AbsoluteFill>
        <OffthreadVideo src={staticFile("joined.mp4")} />
      </AbsoluteFill>
      {PAGES.map((page, i) => (
        <Sequence
          key={i}
          from={page.startFrame}
          durationInFrames={Math.max(1, page.endFrame - page.startFrame)}
        >
          <Page page={page} />
        </Sequence>
      ))}
      <AbsoluteFill>
        <OffthreadVideo src={staticFile("person.webm")} transparent muted />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

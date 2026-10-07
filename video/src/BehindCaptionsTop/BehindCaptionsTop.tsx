import "@fontsource/bebas-neue/400.css";
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

// Big flat title-style captions above the speaker, partly hidden behind the
// head (like a magazine cover). Layers: full video, captions, person cutout.

const FILL = "#f0d820";
const CAP_HEIGHT = 0.7; // Bebas Neue cap height in em

const Word: React.FC<{
  word: CaptionWord;
  pageStart: number;
  fontSize: number;
}> = ({ word, pageStart, fontSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - (word.startFrame - pageStart);

  const s = spring({
    frame: local,
    fps,
    config: { damping: 16, stiffness: 160, mass: 0.7, overshootClamping: true },
  });
  const opacity = interpolate(local, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <span
      style={{
        display: "inline-block",
        opacity,
        // rises up from behind the head
        transform: `translateY(${(1 - s) * CAP_HEIGHT * fontSize * 0.6}px)`,
      }}
    >
      {word.text}
    </span>
  );
};

const Page: React.FC<{ page: CaptionPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const duration = page.endFrame - page.startFrame;
  const exit = interpolate(frame, [duration - 3, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: page.top,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: page.fontSize * 0.25,
          fontFamily: "Bebas Neue",
          fontSize: page.fontSize,
          lineHeight: 1,
          whiteSpace: "nowrap",
          color: FILL,
          opacity: 1 - exit,
          textShadow: `0 ${page.fontSize * 0.02}px ${page.fontSize * 0.08}px rgba(0,0,0,0.18)`,
        }}
      >
        {page.words.map((w, i) => (
          <Word
            key={i}
            word={w}
            pageStart={page.startFrame}
            fontSize={page.fontSize}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const BehindCaptionsTop: React.FC = () => {
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

import "@fontsource/gluten/900.css";
import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { extrusion, FILL } from "../BehindCaptions3D/BehindCaptions3D";

// Instagram cover for the viking reel: a frame from the video, the title in
// the reel's yellow 3D caption style tucked behind the head, the speaker cut
// out on top. The photo is lowered by `shift` px so the title fits above the
// head inside the profile-grid 3:4 crop (y 240..1680); the gap at the top is
// filled with a blurred mirror of the frame.

export type VikingCoverProps = {
  frame: string; // file in public/
  cutout: string; // same frame with alpha (person only)
  shift: number;
  textTop: number;
  lines: { text: string; size: number }[];
};

const W = 1080;
const H = 1920;
const LINE_HEIGHT = 0.8;

const Title: React.FC<{ text: string; size: number }> = ({ text, size }) => (
  <div style={{ height: `${LINE_HEIGHT}em`, fontSize: size, display: "flex", justifyContent: "center" }}>
    {[...text].map((ch, i) => (
      <span
        key={i}
        style={{
          display: "inline-block",
          whiteSpace: "pre",
          textShadow: extrusion(size),
          // same hand-made wobble as the reel captions
          transform: `translateY(${(random(`y-${text}-${i}`) - 0.5) * 0.05 * size}px) rotate(${(random(`r-${text}-${i}`) - 0.5) * 9}deg)`,
        }}
      >
        {ch}
      </span>
    ))}
  </div>
);

export const VikingCover: React.FC<VikingCoverProps> = ({ frame, cutout, shift, textTop, lines }) => {
  const photo: React.CSSProperties = { position: "absolute", left: 0, top: shift, width: W, height: H };
  return (
    <AbsoluteFill style={{ backgroundColor: "#1d1714", overflow: "hidden" }}>
      {/* blurred mirror of the frame fills the space opened above the photo */}
      <AbsoluteFill>
        <Img
          src={staticFile(frame)}
          style={{ ...photo, top: shift - H + 60, transform: "scaleY(-1)", filter: "blur(26px) brightness(0.92)" }}
        />
      </AbsoluteFill>
      {/* the photo, its top edge feathered into the mirror */}
      <AbsoluteFill>
        <Img
          src={staticFile(frame)}
          style={{
            ...photo,
            maskImage: "linear-gradient(to bottom, transparent 0px, black 140px)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 140px)",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(20,12,8,0.45) 0%, rgba(20,12,8,0) 38%)" }} />
      {/* title, behind the speaker */}
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            top: textTop,
            left: 0,
            right: 0,
            fontFamily: "Gluten",
            fontWeight: 900,
            lineHeight: LINE_HEIGHT,
            color: FILL,
            letterSpacing: "-0.01em",
          }}
        >
          {lines.map((l, i) => (
            <Title key={i} text={l.text} size={l.size} />
          ))}
        </div>
      </AbsoluteFill>
      {/* the speaker on top */}
      <AbsoluteFill>
        <Img src={staticFile(cutout)} style={photo} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

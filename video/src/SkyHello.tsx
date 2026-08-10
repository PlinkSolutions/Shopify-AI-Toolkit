import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type SkyHelloProps = {
  text: string;
};

type Cloud = {
  y: number; // vertical center (%)
  w: number; // width in px
  h: number; // height in px
  color: string;
  opacity: number;
  blur: number;
  speed: number; // px drift across the whole clip
  startX: number; // starting x (%)
};

const CLOUDS: Cloud[] = [
  { y: 62, w: 1400, h: 360, color: "255,150,190", opacity: 0.5, blur: 60, speed: 240, startX: -10 },
  { y: 70, w: 1700, h: 420, color: "180,90,200", opacity: 0.45, blur: 80, speed: 160, startX: 20 },
  { y: 55, w: 1100, h: 300, color: "255,190,150", opacity: 0.35, blur: 70, speed: 320, startX: 55 },
  { y: 48, w: 1300, h: 280, color: "120,70,170", opacity: 0.4, blur: 90, speed: 120, startX: 5 },
  { y: 78, w: 1900, h: 500, color: "90,40,120", opacity: 0.55, blur: 100, speed: 90, startX: -20 },
];

const NUM_STARS = 70;

export const SkyHello: React.FC<SkyHelloProps> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();

  // Stars (upper portion only), deterministic via remotion random
  const stars = new Array(NUM_STARS).fill(0).map((_, i) => {
    const x = random(`sx-${i}`) * 100;
    const y = random(`sy-${i}`) * 45; // top 45% of the sky
    const size = 1 + random(`ss-${i}`) * 2.2;
    const phase = random(`sp-${i}`) * Math.PI * 2;
    const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame / 8 + phase));
    return { x, y, size, twinkle };
  });

  // Text animation: fade + gentle rise + subtle scale, then fade out
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 40 });
  const textScale = interpolate(enter, [0, 1], [0.92, 1]);
  const textY = interpolate(enter, [0, 1], [26, 0]);
  const textOpacity = interpolate(
    frame,
    [6, 30, durationInFrames - 22, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(to bottom, #140627 0%, #2b0c4d 26%, #59197f 50%, #97276f 70%, #d1477e 85%, #f7a488 100%)",
      }}
    >
      {/* Stars */}
      <AbsoluteFill>
        {stars.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              opacity: s.twinkle * 0.9,
              filter: "blur(0.3px)",
            }}
          />
        ))}
      </AbsoluteFill>

      {/* Sun / horizon glow just below the horizon line */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 1200px 520px at 50% 96%, rgba(255,214,170,0.85) 0%, rgba(255,150,120,0.35) 35%, rgba(255,150,120,0) 70%)",
        }}
      />

      {/* Drifting cloud layers (parallax) */}
      <AbsoluteFill>
        {CLOUDS.map((c, i) => {
          const drift = interpolate(frame, [0, durationInFrames], [0, c.speed]);
          const x = (c.startX / 100) * width + drift;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${c.y}%`,
                left: 0,
                transform: `translate(${x}px, -50%)`,
                width: c.w,
                height: c.h,
                background: `radial-gradient(ellipse at center, rgba(${c.color},${c.opacity}) 0%, rgba(${c.color},0) 68%)`,
                filter: `blur(${c.blur}px)`,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* Vignette for depth */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(10,2,25,0.55) 100%)",
        }}
      />

      {/* "hello" */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `translateY(${textY}px) scale(${textScale})`,
            opacity: textOpacity,
            color: "#ffffff",
            fontSize: 170,
            fontWeight: 700,
            letterSpacing: 2,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            textShadow:
              "0 0 24px rgba(255,255,255,0.55), 0 0 70px rgba(210,150,255,0.55), 0 6px 30px rgba(0,0,0,0.35)",
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

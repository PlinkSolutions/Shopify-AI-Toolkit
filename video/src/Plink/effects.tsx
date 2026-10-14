import React from "react";
import { AbsoluteFill, Img, interpolate, OffthreadVideo, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Editing effects for the Plink reel, modelled on the reference: a wall of
// video thumbnails behind the speaker, red marker strikes over icons, a warm
// light leak on the last take and a digital glitch for "no existo".

/** Grid of 9:16 thumbnails popping in behind the speaker ("vídeos como este"). */
export const ThumbWall: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols = 6;
  const cw = 168;
  const ch = 298;
  const gap = 10;
  const x0 = (1080 - cols * cw - (cols - 1) * gap) / 2;
  const y0 = 300;
  const out = interpolate(frame, [duration - 4, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {/* darken the room a touch so the cards read as a wall */}
      <AbsoluteFill style={{ backgroundColor: `rgba(12,8,20,${0.45 * Math.min(1, frame / 4)})` }} />
      {Array.from({ length: 12 }, (_, k) => {
        const c = k % cols;
        const r = Math.floor(k / cols);
        // pop in from the outside towards the centre, staggered
        const order = [2, 1, 0, 0, 1, 2][c] * 2 + r;
        const p = spring({ frame: frame - order, fps, config: { damping: 12, stiffness: 210 } });
        const rot = (random(`rot${k}`) - 0.5) * 6;
        const views = (random(`v${k}`) * 4 + 0.6).toFixed(1).replace(".", ",");
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x0 + c * (cw + gap),
              top: y0 + r * (ch + gap),
              width: cw,
              height: ch,
              borderRadius: 16,
              overflow: "hidden",
              transform: `scale(${0.4 + 0.6 * p}) rotate(${rot * (1 - p)}deg)`,
              opacity: Math.min(1, p * 2),
              boxShadow: "0 10px 28px rgba(0,0,0,0.45)",
              border: "3px solid rgba(255,255,255,0.9)",
            }}
          >
            <Img src={staticFile(`plink/thumbs/thumb${String(k).padStart(2, "0")}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 70, background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }} />
            <div
              style={{
                position: "absolute",
                left: 12,
                bottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: 22,
              }}
            >
              <svg width="16" height="18" viewBox="0 0 16 18">
                <path d="M2 1.5 L14.5 9 L2 16.5 Z" fill="#fff" />
              </svg>
              {views}M
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Red marker line drawn across an icon box (size x size), like the reference. */
export const Strike: React.FC<{ size: number; at: number; exitAt: number; seed: string }> = ({ size, at, exitAt, seed }) => {
  const frame = useCurrentFrame();
  if (frame < at) {
    return null;
  }
  const draw = interpolate(frame, [at, at + 4], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(frame, [exitAt, exitAt + 5], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const j = (k: string) => (random(`${seed}${k}`) - 0.5) * size * 0.08;
  const a = [size * 0.1, size * 0.62 + j("a")];
  const b = [size * 0.9, size * 0.36 + j("b")];
  const m = [size * 0.5 + j("mx"), (a[1] + b[1]) / 2 - size * 0.05];
  const d = `M${a[0]},${a[1]} Q${m[0]},${m[1]} ${b[0]},${b[1]}`;
  const len = size * 0.9;
  return (
    <svg width={size} height={size} style={{ position: "absolute", left: 0, top: 0, opacity: out, filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.35))", overflow: "visible" }}>
      <path d={d} fill="none" stroke="#ff2b3a" strokeWidth={size * 0.055} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
    </svg>
  );
};

/** Warm light leak sweeping across the frame (screen blend). */
export const LightLeak: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const t = frame / duration;
  const env = interpolate(t, [0, 0.18, 0.55, 1], [0, 1, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = interpolate(t, [0, 1], [-20, 120]);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: env, pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(ellipse 55% 45% at ${x}% 30%, rgba(255,170,80,0.95), transparent 70%)`,
            `radial-gradient(ellipse 40% 60% at ${x - 25}% 65%, rgba(255,80,130,0.8), transparent 70%)`,
            `radial-gradient(ellipse 35% 30% at ${x + 15}% 15%, rgba(255,235,170,0.9), transparent 70%)`,
          ].join(","),
        }}
      />
    </AbsoluteFill>
  );
};

/** SVG filter splitting R and B channels sideways; reference it with filter:url(#plink-rgb). */
export const RgbSplitDefs: React.FC<{ shift: number }> = ({ shift }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="plink-rgb" x="-5%" y="0%" width="110%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={shift} dy={0} result="r2" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={-shift} dy={0} result="b2" />
        <feBlend in="r2" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b2" mode="screen" />
      </filter>
    </defs>
  </svg>
);

/** Horizontal bands of the base video shifted sideways (glitch slices). */
export const GlitchSlices: React.FC<{ src: string; frameKey: number; videoStyle: React.CSSProperties }> = ({ src, frameKey, videoStyle }) => (
  <>
    {Array.from({ length: 4 }, (_, k) => {
      const y = random(`gy${frameKey}-${k}`) * 1700;
      const h = 40 + random(`gh${frameKey}-${k}`) * 160;
      const dx = (random(`gd${frameKey}-${k}`) - 0.5) * 160;
      return (
        <AbsoluteFill key={k} style={{ clipPath: `inset(${y}px 0 ${Math.max(0, 1920 - y - h)}px 0)`, transform: `translateX(${dx}px)` }}>
          <AbsoluteFill style={videoStyle}>
            <OffthreadVideo src={src} muted style={{ width: "100%", height: "100%" }} />
          </AbsoluteFill>
        </AbsoluteFill>
      );
    })}
  </>
);

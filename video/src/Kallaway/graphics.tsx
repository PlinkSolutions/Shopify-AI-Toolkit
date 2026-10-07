import React from "react";
import {
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, shadow } from "./theme";

// Motion-graphics building blocks for the top panel. Every element takes a
// `delay` (frames, relative to its Sequence) for its entrance animation.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const useEnter = (delay = 0, damping = 14, stiffness = 180) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 0.7 } });
};

/** Fades/slides/scales its children in. */
export const Pop: React.FC<{
  delay?: number;
  from?: "up" | "down" | "left" | "right" | "scale";
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, from = "up", style, children }) => {
  const frame = useCurrentFrame();
  const s = useEnter(delay);
  const opacity = interpolate(frame - delay, [0, 4], [0, 1], clamp);
  const d = (1 - s) * 60;
  const t = {
    up: `translateY(${d}px)`,
    down: `translateY(${-d}px)`,
    left: `translateX(${d}px)`,
    right: `translateX(${-d}px)`,
    scale: `scale(${0.6 + 0.4 * s})`,
  }[from];
  return <div style={{ ...style, opacity, transform: `${t} ${style?.transform ?? ""}` }}>{children}</div>;
};

export const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: colors.card, borderRadius: 36, boxShadow: shadow, padding: 44, ...style }}>{children}</div>
);

/** Yellow uppercase label ("LA SKILL"). */
export const Label: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({
  children,
  color = colors.yellow,
  style,
}) => (
  <span
    style={{
      display: "inline-block",
      background: color,
      color: colors.ink,
      fontFamily: fonts.mono,
      fontWeight: 800,
      fontSize: 26,
      letterSpacing: "0.14em",
      padding: "8px 16px",
      borderRadius: 8,
      ...style,
    }}
  >
    {children}
  </span>
);

/** Tilted blue sticker ("26 fórmulas de hook"). */
export const Sticker: React.FC<{ children: React.ReactNode; rotate?: number; color?: string; delay?: number; style?: React.CSSProperties }> = ({
  children,
  rotate = 4,
  color = colors.blue,
  delay = 0,
  style,
}) => {
  const s = useEnter(delay, 10, 220);
  return (
    <div
      style={{
        display: "inline-block",
        background: color,
        color: "white",
        fontFamily: fonts.mono,
        fontWeight: 800,
        fontSize: 32,
        padding: "12px 22px",
        borderRadius: 12,
        boxShadow: "0 8px 20px rgba(47,107,232,0.35)",
        transform: `rotate(${rotate}deg) scale(${s})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Rubber stamp that slams in ("GRATIS", "PROBADO", "QUEDÓ PRONTO"). */
export const Stamp: React.FC<{ text: string; color?: string; rotate?: number; delay?: number; size?: number; style?: React.CSSProperties }> = ({
  text,
  color = colors.red,
  rotate = -8,
  delay = 0,
  size = 46,
  style,
}) => {
  const frame = useCurrentFrame();
  const s = useEnter(delay, 12, 260);
  const scale = interpolate(s, [0, 1], [2.2, 1]);
  const opacity = interpolate(frame - delay, [0, 3], [0, 1], clamp);
  return (
    <div
      style={{
        display: "inline-block",
        color,
        border: `5px solid ${color}`,
        borderRadius: 12,
        padding: "6px 20px",
        fontFamily: fonts.mono,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "0.06em",
        whiteSpace: "nowrap",
        opacity: opacity * 0.92,
        transform: `rotate(${rotate}deg) scale(${scale})`,
        background: "rgba(255,255,255,0.55)",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** Red handwritten note, revealed left to right like it is being written. */
export const HandNote: React.FC<{ text: string; delay?: number; rotate?: number; size?: number; color?: string; style?: React.CSSProperties }> = ({
  text,
  delay = 0,
  rotate = -4,
  size = 58,
  color = colors.red,
  style,
}) => {
  const frame = useCurrentFrame();
  // written quickly (~0.55 frame per letter) so it finishes inside short scenes
  const p = interpolate(frame - delay, [0, Math.max(6, text.length * 0.55)], [0, 100], clamp);
  return (
    <div
      style={{
        display: "inline-block",
        fontFamily: fonts.hand,
        fontWeight: 700,
        fontSize: size,
        color,
        transform: `rotate(${rotate}deg)`,
        // negative right inset once done, so the slanted last letter is not clipped
        clipPath: `inset(-30% ${p >= 100 ? -15 : 100 - p}% -30% -10%)`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** Typewriter text with an orange caret. */
export const TypeText: React.FC<{ text: string; delay?: number; cps?: number; caret?: boolean; style?: React.CSSProperties }> = ({
  text,
  delay = 0,
  cps = 28,
  caret = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < delay) {
    return null; // no lonely caret before typing starts
  }
  const n = Math.max(0, Math.floor(((frame - delay) / fps) * cps));
  const done = n >= text.length;
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <span style={style}>
      {text.slice(0, n)}
      {caret && (!done || blink) ? (
        <span style={{ color: colors.orange, fontWeight: 400, marginLeft: 2 }}>|</span>
      ) : null}
    </span>
  );
};

/** Outlined chip ("13 skills", "Claude Code"). */
export const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      display: "inline-block",
      border: `3px solid ${colors.border}`,
      borderRadius: 999,
      padding: "8px 22px",
      fontFamily: fonts.mono,
      fontWeight: 700,
      fontSize: 26,
      color: "#4a4843",
      marginRight: 14,
    }}
  >
    {children}
  </span>
);

/** Mac-style window ("Claude" chat, terminal, browser). */
export const MacWindow: React.FC<{ title?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({
  title = "Claude",
  style,
  children,
}) => (
  <div style={{ background: "#f7f6f3", borderRadius: 30, boxShadow: shadow, overflow: "hidden", ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 28px", borderBottom: `2px solid ${colors.border}` }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <span key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
      ))}
      <span style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 28, color: "#3b3a36", marginLeft: 10 }}>{title}</span>
    </div>
    <div style={{ padding: "26px 34px" }}>{children}</div>
  </div>
);

/** Grey user message bubble, right aligned. */
export const UserBubble: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <Pop delay={delay} from="up" style={{ display: "flex", justifyContent: "flex-end" }}>
    <span style={{ background: "#ebe9e4", borderRadius: 18, padding: "14px 24px", fontFamily: fonts.sans, fontWeight: 500, fontSize: 30, color: colors.ink }}>
      {children}
    </span>
  </Pop>
);

/** Huge headline; `accent` is drawn in orange before the text ("13" SKILLS). */
export const BigTitle: React.FC<{ accent?: string; text: string; size?: number; delay?: number }> = ({ accent, text, size = 104, delay = 0 }) => (
  <Pop delay={delay} from="scale">
    <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: size, letterSpacing: "-0.04em", color: colors.ink, lineHeight: 1 }}>
      {accent ? <span style={{ color: colors.orange }}>{accent} </span> : null}
      {text}
    </div>
  </Pop>
);

/** Small pixel-art critter used as an icon (original 11x8 design). */
export const PixelMascot: React.FC<{ color?: string; size?: number }> = ({ color = colors.orange, size = 72 }) => {
  const rows = [
    "..XXXXXXX..",
    ".XXXXXXXXX.",
    "XX.XXXXX.XX",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    ".X.X...X.X.",
    ".X.X...X.X.",
  ];
  const px = size / 11;
  return (
    <svg width={size} height={px * rows.length} style={{ display: "block", shapeRendering: "crispEdges" }}>
      {rows.flatMap((r, y) =>
        [...r].map((c, x) => (c === "X" ? <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px + 0.5} height={px + 0.5} fill={color} /> : null)),
      )}
    </svg>
  );
};

/** Icon tile with a mono label; `locked` turns it into the orange "?" tile. */
export const Tile: React.FC<{ label?: string; icon?: React.ReactNode; locked?: boolean; delay?: number; size?: number }> = ({
  label,
  icon,
  locked,
  delay = 0,
  size = 132,
}) => (
  <Pop delay={delay} from="scale">
    <div
      style={{
        width: size,
        height: size * 1.1,
        borderRadius: 22,
        background: locked ? colors.orange : colors.card,
        boxShadow: shadow,
        border: locked ? "5px solid white" : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: locked ? "white" : colors.ink,
        fontFamily: fonts.mono,
        fontWeight: 700,
        fontSize: 20,
      }}
    >
      {locked ? <span style={{ fontSize: 64, fontWeight: 800 }}>?🔒</span> : icon}
      {label ? <span>{label}</span> : null}
    </div>
  </Pop>
);

/** Number that counts from `from` to `to`. */
export const Counter: React.FC<{ from?: number; to: number; delay?: number; duration?: number; style?: React.CSSProperties }> = ({
  from = 0,
  to,
  delay = 0,
  duration = 20,
  style,
}) => {
  const frame = useCurrentFrame();
  const v = Math.round(interpolate(frame - delay, [0, duration], [from, to], clamp));
  return <span style={style}>{v}</span>;
};

/** Circular score ring (e.g. a profile scored 53 -> 54). */
export const ScoreRing: React.FC<{ from?: number; to: number; delay?: number; size?: number }> = ({ from = 0, to, delay = 0, size = 120 }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame - delay, [0, 24], [from, to], clamp);
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={10} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={colors.red} strokeWidth={10} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} strokeLinecap="round" />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.sans, fontWeight: 900, fontSize: size * 0.34, color: colors.red }}>
        {Math.round(v)}
      </span>
    </div>
  );
};

/** Final call to action: follow + comment a keyword (+ handwritten promise). */
export const CtaCard: React.FC<{
  handle: string;
  keyword: string;
  avatar?: string; // staticFile() url
  note?: string;
  delay?: number;
}> = ({ handle, keyword, avatar, note = "+ la guía completa por DM", delay = 0 }) => {
  const frame = useCurrentFrame();
  const followed = frame - delay > 14;
  const row = { display: "flex", alignItems: "center", gap: 26 } as const;
  const dot = (n: number) => (
    <span style={{ width: 52, height: 52, borderRadius: 26, background: colors.orange, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.sans, fontWeight: 800, fontSize: 30 }}>
      {n}
    </span>
  );
  return (
    <Pop delay={delay} from="up">
      <Card style={{ width: 960, padding: "48px 52px", display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={row}>
          {dot(1)}
          <div style={{ width: 92, height: 92, borderRadius: 46, background: "#d9d6cf", overflow: "hidden", border: "4px solid #f0a35e" }}>
            {avatar ? <Img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 56, color: colors.ink, lineHeight: 1 }}>Seguime</div>
            <div style={{ fontFamily: fonts.sans, fontWeight: 500, fontSize: 30, color: colors.muted }}>@{handle}</div>
          </div>
          <span style={{ background: followed ? "#efeeea" : colors.blue, color: followed ? colors.ink : "white", fontFamily: fonts.sans, fontWeight: 700, fontSize: 30, padding: "14px 28px", borderRadius: 14 }}>
            {followed ? "Siguiendo" : "Seguir"}
          </span>
        </div>
        <div style={row}>
          {dot(2)}
          <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 56, color: colors.ink }}>Comentá</div>
          <div style={{ flex: 1, border: `3px solid ${colors.border}`, borderRadius: 16, padding: "16px 22px", fontFamily: fonts.mono, fontWeight: 700, fontSize: 34, color: colors.ink, minHeight: 44 }}>
            <TypeText text={keyword} delay={delay + 22} cps={10} />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <HandNote text={note} delay={delay + 34} size={50} rotate={-3} />
        </div>
      </Card>
    </Pop>
  );
};

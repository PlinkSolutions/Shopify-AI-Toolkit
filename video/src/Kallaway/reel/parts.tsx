import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { PixelMascot, Pop, TypeText, useEnter } from "../graphics";
import { colors, fonts, shadow } from "../theme";

// Extra motion-graphics parts for the Claude x Instagram reel. All delays are
// in frames relative to the enclosing scene Sequence.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Frames from the scene start (seconds) to an absolute time (seconds). */
export const at = (t: number, sceneStart: number, fps = 30) => Math.max(0, Math.round((t - sceneStart) * fps));

export const abs = (x: number, y: number, extra?: React.CSSProperties): React.CSSProperties => ({
  position: "absolute",
  left: x,
  top: y,
  ...extra,
});

/** App icon in Instagram's gradient with a camera glyph. `ko` greys it out. */
export const IgIcon: React.FC<{ size?: number; ko?: number }> = ({ size = 220, ko = 0 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.26,
      background: "linear-gradient(45deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)",
      boxShadow: shadow,
      filter: `grayscale(${ko})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 100 100">
      <rect x="8" y="8" width="84" height="84" rx="26" fill="none" stroke="white" strokeWidth="9" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="9" />
      <circle cx="74" cy="26" r="6" fill="white" />
    </svg>
  </div>
);

/** Dark rounded tile with the orange mascot (stands for Claude). */
export const ClaudeTile: React.FC<{ size?: number; label?: string }> = ({ size = 190, label = "Claude" }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: colors.ink,
        boxShadow: shadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <PixelMascot size={size * 0.62} />
    </div>
    {label ? <span style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 30, color: colors.ink }}>{label}</span> : null}
  </div>
);

/** Dashed cable drawn from (x1,y1) to (x2,y2), then a dot travels along it. */
export const Cable: React.FC<{ x1: number; y1: number; x2: number; y2: number; delay?: number; duration?: number }> = ({
  x1,
  y1,
  x2,
  y2,
  delay = 0,
  duration = 14,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, duration], [0, 1], clamp);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const dot = ((frame - delay - duration) % 24) / 24;
  const midY = Math.min(y1, y2) - 70;
  const path = `M ${x1} ${y1} C ${x1 + len * 0.3} ${midY}, ${x2 - len * 0.3} ${midY}, ${x2} ${y2}`;
  const q = Math.max(0, dot);
  const bx = (t: number) =>
    (1 - t) ** 3 * x1 + 3 * (1 - t) ** 2 * t * (x1 + len * 0.3) + 3 * (1 - t) * t ** 2 * (x2 - len * 0.3) + t ** 3 * x2;
  const by = (t: number) => (1 - t) ** 3 * y1 + 3 * (1 - t) ** 2 * t * midY + 3 * (1 - t) * t ** 2 * midY + t ** 3 * y2;
  return (
    <svg width={1080} height={690} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={path} fill="none" stroke={colors.orange} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
      {p >= 1 ? <circle cx={bx(q)} cy={by(q)} r={12} fill={colors.green} /> : null}
    </svg>
  );
};

/** iOS-style switch that flips on at `delay`. */
export const Toggle: React.FC<{ label: string; delay?: number }> = ({ label, delay = 0 }) => {
  const s = useEnter(delay, 16, 220);
  const on = interpolate(s, [0, 1], [0, 1], clamp);
  const bg = on > 0.5 ? colors.green : "#cfccc5";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <div style={{ width: 120, height: 66, borderRadius: 33, background: bg, position: "relative", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.12)" }}>
        <div style={{ position: "absolute", top: 6, left: 6 + on * 54, width: 54, height: 54, borderRadius: 27, background: "white", boxShadow: "0 3px 8px rgba(0,0,0,0.2)" }} />
      </div>
      <span style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 34, color: colors.ink }}>
        {label} <span style={{ color: on > 0.5 ? colors.green : colors.muted }}>{on > 0.5 ? "ON" : "OFF"}</span>
      </span>
    </div>
  );
};

/** Horizontal progress bar filling 0 -> 100% with a percentage. */
export const ProgressBar: React.FC<{ width?: number; delay?: number; duration?: number; label?: string; color?: string }> = ({
  width = 620,
  delay = 0,
  duration = 22,
  label,
  color = colors.orange,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, duration], [0, 100], clamp);
  return (
    <div style={{ width }}>
      {label ? (
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.mono, fontWeight: 700, fontSize: 26, color: colors.muted, marginBottom: 10 }}>
          <span>{label}</span>
          <span style={{ color: colors.ink }}>{Math.round(p)}%</span>
        </div>
      ) : null}
      <div style={{ height: 26, borderRadius: 13, background: "#dedbd4", overflow: "hidden" }}>
        <div style={{ width: `${p}%`, height: "100%", borderRadius: 13, background: color }} />
      </div>
    </div>
  );
};

/** Chip with a green check that pops in. */
export const CheckChip: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => (
  <Pop delay={delay} from="scale" style={{ display: "inline-block" }}>
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        background: "white",
        boxShadow: shadow,
        borderRadius: 999,
        padding: "12px 26px 12px 14px",
        fontFamily: fonts.mono,
        fontWeight: 800,
        fontSize: 32,
        color: colors.ink,
      }}
    >
      <span style={{ width: 40, height: 40, borderRadius: 20, background: colors.green, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>✓</span>
      {text}
    </span>
  </Pop>
);

/** Compact Instagram-like profile card. */
export const ProfileCard: React.FC<{ handle?: string; width?: number }> = ({ handle = "tu_cuenta", width = 420 }) => (
  <div style={{ width, background: "white", borderRadius: 30, boxShadow: shadow, padding: 26 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ width: 78, height: 78, borderRadius: 39, background: "linear-gradient(45deg,#feda75,#d62976,#4f5bd5)", padding: 5 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#d8d4cc", border: "4px solid white" }} />
      </div>
      <div>
        <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 32, color: colors.ink }}>@{handle}</div>
        <div style={{ fontFamily: fonts.sans, fontSize: 24, color: colors.muted }}>1.204 seguidores</div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 20 }}>
      {["#f1c9b6", "#c9d8f1", "#d6efc9", "#f1e3b6", "#e3c9f1", "#c9f1ea"].map((c) => (
        <div key={c} style={{ aspectRatio: "1", background: c, borderRadius: 8 }} />
      ))}
    </div>
  </div>
);

/** Small playing-card style tile with a coloured mascot. */
export const SkillCard: React.FC<{ color: string; label: string; w?: number; locked?: boolean; glow?: number }> = ({
  color,
  label,
  w = 112,
  locked,
  glow = 0,
}) => (
  <div
    style={{
      width: w,
      height: w * 1.4,
      borderRadius: 18,
      background: locked ? colors.orange : "white",
      boxShadow: `${shadow}${glow ? `, 0 0 ${40 * glow}px ${16 * glow}px rgba(245,200,66,${0.75 * glow})` : ""}`,
      border: "4px solid white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    }}
  >
    {locked ? (
      <span style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: w * 0.6, color: "white", lineHeight: 1 }}>?</span>
    ) : (
      <PixelMascot color={color} size={w * 0.58} />
    )}
    <span style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: w * 0.15, color: locked ? "white" : colors.ink }}>{label}</span>
  </div>
);

/** Rotating sunburst rays behind a highlighted element. */
export const Rays: React.FC<{ size?: number; color?: string; delay?: number }> = ({ size = 560, color = "rgba(245,200,66,0.45)", delay = 0 }) => {
  const frame = useCurrentFrame();
  const s = useEnter(delay, 20, 120);
  const n = 16;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      style={{ transform: `rotate(${frame * 0.8}deg) scale(${s})`, opacity: s }}
    >
      {Array.from({ length: n }).map((_, i) => {
        const a0 = (i / n) * Math.PI * 2;
        const a1 = a0 + Math.PI / n;
        return <path key={i} d={`M0 0 L ${100 * Math.cos(a0)} ${100 * Math.sin(a0)} L ${100 * Math.cos(a1)} ${100 * Math.sin(a1)} Z`} fill={color} />;
      })}
    </svg>
  );
};

/** Paper page with numbered lines written one after another. */
export const ScriptPage: React.FC<{ title: string; lines: string[]; delay?: number; gap?: number; width?: number }> = ({
  title,
  lines,
  delay = 0,
  gap = 14,
  width = 560,
}) => (
  <div style={{ width, background: "#fffdf8", borderRadius: 24, boxShadow: shadow, padding: "28px 34px", borderLeft: `10px solid ${colors.orange}` }}>
    <div style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 24, color: colors.muted, letterSpacing: "0.1em", marginBottom: 16 }}>{title}</div>
    {lines.map((l, i) => (
      <div key={i} style={{ display: "flex", gap: 16, alignItems: "baseline", marginBottom: 12 }}>
        <span style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 24, color: colors.orange }}>{String(i + 1).padStart(2, "0")}</span>
        <span style={{ fontFamily: fonts.serif, fontSize: 32, color: colors.ink }}>
          <TypeText text={l} delay={delay + i * gap} cps={40} caret={false} />
        </span>
      </div>
    ))}
  </div>
);

/** Round badge with a number that counts up. */
export const CountBadge: React.FC<{ to: number; caption: string; delay?: number; size?: number }> = ({ to, caption, delay = 0, size = 190 }) => {
  const frame = useCurrentFrame();
  const s = useEnter(delay, 11, 200);
  const v = Math.round(interpolate(frame - delay, [0, 18], [0, to], clamp));
  return (
    <div style={{ transform: `scale(${s}) rotate(${(1 - s) * -40 + 6}deg)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: size, height: size, borderRadius: size / 2, background: colors.orange, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.sans, fontWeight: 900, fontSize: size * 0.48, boxShadow: shadow, border: "6px solid white" }}>
        {v}
      </div>
      <span style={{ marginTop: 10, maxWidth: size * 1.3, textAlign: "center", background: colors.ink, color: "white", fontFamily: fonts.mono, fontWeight: 800, fontSize: 24, padding: "6px 14px", borderRadius: 8 }}>{caption}</span>
    </div>
  );
};

/** A comment with an automatic reply typed underneath. */
export const CommentRow: React.FC<{ user: string; text: string; reply: string; delay?: number; replyDelay?: number }> = ({
  user,
  text,
  reply,
  delay = 0,
  replyDelay = 10,
}) => {
  const frame = useCurrentFrame();
  const replied = frame - delay - replyDelay > reply.length / 1.6;
  return (
    <Pop delay={delay} from="left">
      <div style={{ background: "white", borderRadius: 22, boxShadow: shadow, padding: "18px 24px", width: 560 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", fontFamily: fonts.sans, fontSize: 28, color: colors.ink }}>
          <span style={{ width: 44, height: 44, borderRadius: 22, background: "#d8d4cc", flex: "none" }} />
          <b>{user}</b>
          <span>{text}</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, marginLeft: 58, fontFamily: fonts.sans, fontSize: 26, color: "#3c3b37" }}>
          <PixelMascot size={34} />
          <TypeText text={reply} delay={delay + replyDelay} cps={36} caret={false} />
          {replied ? <span style={{ color: colors.green, fontWeight: 800 }}>✓</span> : null}
        </div>
      </div>
    </Pop>
  );
};

/** Semicircle gauge; the needle sweeps to `to` (0-100). */
export const Gauge: React.FC<{ to: number; delay?: number; size?: number }> = ({ to, delay = 0, size = 360 }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame - delay, [0, 26], [0, to], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const r = size / 2 - 22;
  const cx = size / 2;
  const cy = size / 2;
  const arc = (from: number, toV: number, col: string) => {
    const a0 = Math.PI * (1 - from / 100);
    const a1 = Math.PI * (1 - toV / 100);
    return (
      <path
        d={`M ${cx + r * Math.cos(a0)} ${cy - r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy - r * Math.sin(a1)}`}
        stroke={col}
        strokeWidth={30}
        fill="none"
        strokeLinecap="butt"
      />
    );
  };
  const a = Math.PI * (1 - v / 100);
  return (
    <div style={{ position: "relative", width: size, height: size / 2 + 70 }}>
      <svg width={size} height={size / 2 + 20} style={{ overflow: "visible" }}>
        {arc(0, 33, "#e58a7b")}
        {arc(33, 66, "#f5c842")}
        {arc(66, 100, "#7bc68f")}
        <line x1={cx} y1={cy} x2={cx + (r - 26) * Math.cos(a)} y2={cy - (r - 26) * Math.sin(a)} stroke={colors.ink} strokeWidth={10} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={18} fill={colors.ink} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: size / 2 + 6, textAlign: "center", fontFamily: fonts.sans, fontWeight: 900, fontSize: 64, color: colors.ink }}>
        {Math.round(v)}
        <span style={{ fontSize: 30, color: colors.muted }}>/100</span>
      </div>
    </div>
  );
};

/** Mon-Sun strip whose days fill with content blocks one by one. */
export const WeekStrip: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const items = [
    ["#d97757", "REEL"],
    ["#2f6be8", "CARR."],
    ["#2e9e4f", "STORY"],
    ["#d97757", "REEL"],
    ["#7b4ce0", "LIVE"],
    ["#2f6be8", "CARR."],
    ["#2e9e4f", "STORY"],
  ];
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {days.map((d, i) => (
        <div key={d} style={{ width: 118, background: "white", borderRadius: 18, boxShadow: shadow, padding: "12px 10px", textAlign: "center" }}>
          <div style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 26, color: colors.muted }}>{d}</div>
          <Pop delay={delay + i * 3} from="down">
            <div style={{ marginTop: 10, height: 70, borderRadius: 12, background: items[i][0], color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontWeight: 800, fontSize: 20 }}>
              {items[i][1]}
            </div>
          </Pop>
        </div>
      ))}
    </div>
  );
};

/** Card that flips from a locked "?" face to its reveal face at `flipAt`. */
export const FlipCard: React.FC<{ flipAt: number; front: React.ReactNode; back: React.ReactNode }> = ({ flipAt, front, back }) => {
  const s = useEnter(flipAt, 13, 120);
  const rot = interpolate(s, [0, 1], [0, 180]);
  const face = (r: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    transform: `rotateY(${r}deg)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", perspective: 1400 }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${rot}deg)` }}>
        <div style={face(0)}>{front}</div>
        <div style={face(180)}>{back}</div>
      </div>
    </div>
  );
};

/** Views chart with a line that shoots up. */
export const RisingChart: React.FC<{ delay?: number; width?: number; height?: number }> = ({ delay = 0, width = 600, height = 330 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 22], [0, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 2 });
  const pts = [
    [0, 0.08],
    [0.2, 0.12],
    [0.4, 0.1],
    [0.55, 0.22],
    [0.7, 0.35],
    [0.85, 0.7],
    [1, 0.98],
  ].map(([x, y]) => [30 + x * (width - 60), height - 30 - y * (height - 60)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  return (
    <div style={{ width, height, background: "white", borderRadius: 26, boxShadow: shadow, position: "relative" }}>
      <svg width={width} height={height}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={30} x2={width - 30} y1={30 + g * (height - 60)} y2={30 + g * (height - 60)} stroke="#eceae5" strokeWidth={3} />
        ))}
        <path d={d} fill="none" stroke={colors.red} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
        {p > 0.98 ? <circle cx={pts[6][0]} cy={pts[6][1]} r={16} fill={colors.red} /> : null}
      </svg>
      <span style={{ position: "absolute", left: 30, top: 18, fontFamily: fonts.mono, fontWeight: 800, fontSize: 24, color: colors.muted }}>VISUALIZACIONES</span>
    </div>
  );
};

/** Vertical reel thumbnail with a play icon and a view count. */
export const ReelThumb: React.FC<{ w?: number; views?: string; tint?: string }> = ({ w = 180, views = "2,3M", tint = "#c9b8a6" }) => (
  <div
    style={{
      width: w,
      height: w * 1.78,
      borderRadius: 22,
      background: `linear-gradient(160deg, ${tint}, #3b3631)`,
      boxShadow: shadow,
      position: "relative",
      border: "5px solid white",
      overflow: "hidden",
    }}
  >
    <div style={{ position: "absolute", left: "50%", top: "45%", transform: "translate(-40%, -50%)", width: 0, height: 0, borderTop: `${w * 0.13}px solid transparent`, borderBottom: `${w * 0.13}px solid transparent`, borderLeft: `${w * 0.2}px solid rgba(255,255,255,0.9)` }} />
    <span style={{ position: "absolute", left: 12, bottom: 12, color: "white", fontFamily: fonts.sans, fontWeight: 800, fontSize: w * 0.13 }}>▶ {views}</span>
  </div>
);

/** Hand-drawn arrow (SVG path drawn over time). */
export const DrawnArrow: React.FC<{ d: string; delay?: number; color?: string; width?: number; height?: number }> = ({
  d,
  delay = 0,
  color = colors.red,
  width = 1080,
  height = 690,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 8], [0, 1], clamp);
  return (
    <svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
    </svg>
  );
};

/** Animated voice waveform bars. */
export const Waveform: React.FC<{ bars?: number; delay?: number; color?: string }> = ({ bars = 28, delay = 0, color = colors.orange }) => {
  const frame = useCurrentFrame();
  const s = useEnter(delay);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, height: 120 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = 18 + 90 * Math.abs(Math.sin(frame / 4 + i * 0.7) * Math.sin(i * 1.3 + frame / 9));
        return <div key={i} style={{ width: 10, height: h * s, borderRadius: 5, background: color }} />;
      })}
    </div>
  );
};

/** Two red strokes that cross something out. */
export const XStrike: React.FC<{ w: number; h: number; delay?: number }> = ({ w, h, delay = 0 }) => {
  const frame = useCurrentFrame();
  const p1 = interpolate(frame - delay, [0, 6], [0, 1], clamp);
  const p2 = interpolate(frame - delay - 5, [0, 6], [0, 1], clamp);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={`M 20 20 L ${w - 20} ${h - 20}`} stroke={colors.red} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p1} />
      <path d={`M ${w - 20} 20 L 20 ${h - 20}`} stroke={colors.red} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p2} />
    </svg>
  );
};

/** Phone-style notification banner sliding down. */
export const Notification: React.FC<{ title: string; body: string; delay?: number; width?: number }> = ({ title, body, delay = 0, width = 720 }) => (
  <Pop delay={delay} from="down">
    <div style={{ width, display: "flex", gap: 22, alignItems: "center", background: "rgba(255,255,255,0.96)", borderRadius: 30, boxShadow: shadow, padding: "22px 28px" }}>
      <IgIcon size={84} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.sans, fontWeight: 800, fontSize: 30, color: colors.ink }}>
          <span>{title}</span>
          <span style={{ fontWeight: 500, fontSize: 24, color: colors.muted }}>ahora</span>
        </div>
        <div style={{ fontFamily: fonts.sans, fontSize: 28, color: "#3c3b37" }}>{body}</div>
      </div>
    </div>
  </Pop>
);

/** Shakes its children between `from` and `to` frames. */
export const Shake: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const on = frame >= from && frame < to;
  const r = on ? Math.sin((frame - from) * 2.6) * 7 : 0;
  const x = on ? Math.sin((frame - from) * 3.3) * 8 : 0;
  return <div style={{ transform: `translateX(${x}px) rotate(${r}deg)` }}>{children}</div>;
};

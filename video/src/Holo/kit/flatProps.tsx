import React, { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  random,
  useCurrentFrame,
} from "remotion";
import { C, ease, Face, Head, Look, Outfit, pop, useSh } from "./flat";
import { MONO, SANS } from "./hud";

// Props for flat-illustration reels (same rules as flat.tsx: no outlines,
// hard offset shadow via useSh(), flat daytime colours). Positions are SVG
// user units on the 1080×1920 canvas or inside a camT() world.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const useUid = (p: string) => p + useId().replace(/[^a-zA-Z0-9]/g, "");

// ---------------------------------------------------------------- people
/** Head and shoulders, shoulder line centre at (x, y). */
export const Bust: React.FC<
  { x: number; y: number; s?: number; who: Look; fit: Outfit } & Face
> = ({ x, y, s = 1, who, fit, ...face }) => {
  const sh = useSh();
  const lift = 6 * (face.yawn ?? 0);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter={sh}>
      <rect x={-20} y={-40} width={40} height={50} rx={12} fill={who.shade} />
      <path
        d="M -110 140 L -110 40 Q -110 -14 -50 -14 L 50 -14 Q 110 -14 110 40 L 110 140 Z"
        fill={fit.top}
      />
      <path
        d="M -34 -12 Q 0 26 34 -12"
        stroke={fit.trim}
        strokeWidth={9}
        fill="none"
      />
      <g transform={`translate(0 ${-112 - lift})`}>
        <Head who={who} {...face} />
      </g>
    </g>
  );
};

/** Tiny person for crowds (head + body), feet at (x, y). */
export const Mini: React.FC<{
  x: number;
  y: number;
  s?: number;
  body: string;
  skin: string;
  hair: string;
  yawn?: number;
  lids?: number;
  seed?: number;
}> = ({ x, y, s = 1, body, skin, hair, yawn = 0, lids = 0, seed = 0 }) => {
  const sh = useSh();
  const shut = Math.max(lids, yawn > 0.5 ? (yawn - 0.5) * 2 : 0);
  const long = random(`mini${seed}`) > 0.6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter={sh}>
      <rect x={-30} y={-78} width={60} height={78} rx={24} fill={body} />
      {long ? (
        <rect x={-30} y={-138} width={60} height={56} rx={26} fill={hair} />
      ) : null}
      <circle cx={0} cy={-112} r={28} fill={skin} />
      <path
        d="M -29 -112 Q -30 -146 0 -146 Q 30 -146 29 -112 Q 14 -128 -29 -112 Z"
        fill={hair}
      />
      {shut >= 0.85 ? (
        <>
          <path
            d="M -16 -110 Q -10 -106 -4 -110"
            stroke={C.ink}
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 4 -110 Q 10 -106 16 -110"
            stroke={C.ink}
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <ellipse
            cx={-10}
            cy={-112 + shut * 2}
            rx={3.6}
            ry={4.4 * (1 - shut * 0.75)}
            fill={C.ink}
          />
          <ellipse
            cx={10}
            cy={-112 + shut * 2}
            rx={3.6}
            ry={4.4 * (1 - shut * 0.75)}
            fill={C.ink}
          />
        </>
      )}
      {yawn > 0.05 ? (
        <ellipse
          cx={0}
          cy={-96 + 2 * yawn}
          rx={4 + 5 * yawn}
          ry={2 + 8 * yawn}
          fill={C.mouth}
        />
      ) : (
        <path
          d="M -6 -98 Q 0 -95 6 -98"
          stroke={C.ink}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </g>
  );
};

/** Dog face icon (for grids), centre (x, y); `on` = coloured, off = grey. */
export const DogFace: React.FC<{
  x: number;
  y: number;
  s?: number;
  yawn?: number;
  on?: number;
  tone?: string;
}> = ({ x, y, s = 1, yawn = 0, on = 1, tone = "#d58a3c" }) => {
  const sh = useSh();
  const body = interpolateColors(on, [0, 1], ["#c7cbd1", tone]);
  const ear = interpolateColors(on, [0, 1], ["#9aa0a8", "#8a5426"]);
  const snout = interpolateColors(on, [0, 1], ["#e3e6ea", "#f6e3c8"]);
  const shut = yawn > 0.5 ? (yawn - 0.5) * 2 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter={sh}>
      <path d="M -50 -40 Q -86 -16 -68 44 Q -48 24 -38 -20 Z" fill={ear} />
      <path d="M 50 -40 Q 86 -16 68 44 Q 48 24 38 -20 Z" fill={ear} />
      <ellipse cx={0} cy={0} rx={54} ry={50} fill={body} />
      {shut >= 0.85 ? (
        <>
          <path
            d="M -30 -8 Q -22 -2 -14 -8"
            stroke={C.ink}
            strokeWidth={4.5}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 14 -8 Q 22 -2 30 -8"
            stroke={C.ink}
            strokeWidth={4.5}
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <ellipse
            cx={-22}
            cy={-8}
            rx={6.5}
            ry={7.5 * (1 - shut * 0.8)}
            fill={C.ink}
          />
          <ellipse
            cx={22}
            cy={-8}
            rx={6.5}
            ry={7.5 * (1 - shut * 0.8)}
            fill={C.ink}
          />
        </>
      )}
      <ellipse
        cx={0}
        cy={26 + 4 * yawn}
        rx={28}
        ry={20 + 4 * yawn}
        fill={snout}
      />
      {yawn > 0.05 ? (
        <>
          <ellipse
            cx={0}
            cy={42 + 8 * yawn}
            rx={9 + 10 * yawn}
            ry={2 + 18 * yawn}
            fill={C.mouth}
          />
          <ellipse
            cx={0}
            cy={54 + 14 * yawn}
            rx={6 + 5 * yawn}
            ry={2 + 6 * yawn}
            fill={C.tongue}
          />
        </>
      ) : null}
      <ellipse cx={0} cy={14 + 2 * yawn} rx={10} ry={7} fill={C.ink} />
    </g>
  );
};

// ---------------------------------------------------------------- symbols
/** Heart (pops in at `at`, then beats). */
export const Heart: React.FC<{
  x: number;
  y: number;
  size?: number;
  at: number;
  color?: string;
}> = ({ x, y, size = 1, at, color = C.red }) => {
  const frame = useCurrentFrame();
  const sh = useSh();
  if (frame < at) return null;
  const beatK = 1 + 0.08 * Math.max(0, Math.sin((frame - at) / 3.2));
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size * pop(frame, at, 9) * beatK})`}
      filter={sh}
    >
      <path
        d="M 0 40 C -70 -6 -62 -66 -22 -66 C -6 -66 0 -54 0 -46 C 0 -54 6 -66 22 -66 C 62 -66 70 -6 0 40 Z"
        fill={color}
      />
      <ellipse
        cx={-26}
        cy={-40}
        rx={9}
        ry={6}
        fill="#fff"
        opacity={0.55}
        transform="rotate(-30 -26 -40)"
      />
    </g>
  );
};

/** Rubber stamp that slams in at `at`. */
export const Stamp: React.FC<{
  x: number;
  y: number;
  text: string;
  at: number;
  size?: number;
  color?: string;
  rot?: number;
}> = ({ x, y, text, at, size = 64, color = C.red, rot = -10 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const k = interpolate(frame, [at, at + 5], [2.2, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  const o = interpolate(frame, [at, at + 3], [0, 1], clamp);
  const w = text.length * size * 0.7 + size;
  const h = size * 1.6;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}
      opacity={o}
    >
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={12}
        fill="rgba(255,255,255,0.12)"
        stroke={color}
        strokeWidth={10}
      />
      <text
        x={0}
        y={size * 0.36}
        textAnchor="middle"
        fontFamily={SANS}
        fontWeight={800}
        fontSize={size}
        fill={color}
        letterSpacing={size * 0.05}
      >
        {text}
      </text>
    </g>
  );
};

/** Big red X drawn on at `at`. */
export const Cross: React.FC<{
  x: number;
  y: number;
  size?: number;
  at: number;
}> = ({ x, y, size = 200, at }) => {
  const frame = useCurrentFrame();
  const sh = useSh();
  if (frame < at) return null;
  const a = ease(frame, at, at + 5, Easing.out(Easing.cubic));
  const b = ease(frame, at + 4, at + 9, Easing.out(Easing.cubic));
  const r = size / 2;
  return (
    <g
      transform={`translate(${x} ${y})`}
      filter={sh}
      stroke={C.red}
      strokeWidth={size * 0.13}
      strokeLinecap="round"
    >
      <line x1={-r} y1={-r} x2={-r + 2 * r * a} y2={-r + 2 * r * a} />
      {b > 0 ? (
        <line x1={r} y1={-r} x2={r - 2 * r * b} y2={-r + 2 * r * b} />
      ) : null}
    </g>
  );
};

/** Sleeping "Z z z" floating up from (x, y). */
export const Zzz: React.FC<{
  x: number;
  y: number;
  size?: number;
  color?: string;
}> = ({ x, y, size = 60, color = C.blue }) => {
  const frame = useCurrentFrame();
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const t = ((frame / 30 + i * 0.45) % 1.35) / 1.35;
        return (
          <text
            key={i}
            x={x + i * size * 0.55 + Math.sin(t * 6) * 6}
            y={y - t * size * 2.2 - i * size * 0.5}
            fontFamily={SANS}
            fontWeight={800}
            fontSize={size * (1 - i * 0.22)}
            fill={color}
            opacity={Math.sin(Math.PI * t)}
          >
            Z
          </text>
        );
      })}
    </g>
  );
};

/** Thermometer, bulb at the bottom; level 0–1 (colour goes red → blue as it drops). */
export const Thermo: React.FC<{
  x: number;
  y: number;
  s?: number;
  level: number;
  cold?: number;
}> = ({ x, y, s = 1, level, cold = 0 }) => {
  const sh = useSh();
  const col = interpolateColors(cold, [0, 1], [C.red, "#3d9be0"]);
  const H = 300;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter={sh}>
      <rect x={-30} y={-H} width={60} height={H + 20} rx={30} fill="#fff" />
      <circle cx={0} cy={30} r={48} fill="#fff" />
      <circle cx={0} cy={30} r={34} fill={col} />
      <rect
        x={-14}
        y={-H + 26 + (H - 40) * (1 - level)}
        width={28}
        height={(H - 40) * level + 20}
        rx={14}
        fill={col}
      />
      {[0.2, 0.4, 0.6, 0.8].map((k) => (
        <rect
          key={k}
          x={18}
          y={-H + 26 + (H - 40) * (1 - k)}
          width={22}
          height={6}
          rx={3}
          fill="#c9d1db"
        />
      ))}
    </g>
  );
};

/** Ice pack (blue gel bag with a snowflake). */
export const IcePack: React.FC<{
  x: number;
  y: number;
  s?: number;
  rot?: number;
}> = ({ x, y, s = 1, rot = 0 }) => {
  const sh = useSh();
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}
      filter={sh}
    >
      <rect x={-86} y={-36} width={172} height={72} rx={30} fill="#56b6ee" />
      <rect x={-70} y={-26} width={60} height={14} rx={7} fill="#a8dcfa" />
      <g
        stroke="#fff"
        strokeWidth={6}
        strokeLinecap="round"
        transform="translate(40 2)"
      >
        <line x1={-20} y1={0} x2={20} y2={0} />
        <line x1={-10} y1={-17} x2={10} y2={17} />
        <line x1={10} y1={-17} x2={-10} y2={17} />
      </g>
    </g>
  );
};

/** White card with a label and a big counter that bumps when it changes. */
export const CounterCard: React.FC<{
  x: number;
  y: number;
  label: string;
  value: number;
  bumpAt?: number[];
  at: number;
  color?: string;
}> = ({ x, y, label, value, bumpAt = [], at, color = C.red }) => {
  const frame = useCurrentFrame();
  const sh = useSh();
  if (frame < at) return null;
  const bump = bumpAt.reduce(
    (m, b) =>
      Math.max(
        m,
        frame >= b
          ? interpolate(frame, [b, b + 3, b + 8], [0, 0.2, 0], clamp)
          : 0,
      ),
    0,
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${pop(frame, at)})`} filter={sh}>
      <rect x={-150} y={-150} width={300} height={300} rx={36} fill="#fff" />
      <text
        x={0}
        y={-82}
        textAnchor="middle"
        fontFamily={SANS}
        fontWeight={800}
        fontSize={40}
        fill={C.ink}
        letterSpacing={2}
      >
        {label}
      </text>
      <text
        x={0}
        y={92}
        textAnchor="middle"
        fontFamily={SANS}
        fontWeight={800}
        fontSize={190}
        fill={color}
        transform={`scale(${1 + bump})`}
      >
        {value}
      </text>
    </g>
  );
};

/** Horizontal meter (navy track, coloured fill). */
export const Meter: React.FC<{
  x: number;
  y: number;
  w: number;
  value: number;
  color?: string;
  at: number;
}> = ({ x, y, w, value, color = C.orange, at }) => {
  const frame = useCurrentFrame();
  const sh = useSh();
  if (frame < at) return null;
  return (
    <g
      transform={`translate(${x} ${y})`}
      filter={sh}
      opacity={interpolate(frame, [at, at + 5], [0, 1], clamp)}
    >
      <rect x={0} y={-22} width={w} height={44} rx={22} fill={C.navy} />
      <rect
        x={6}
        y={-16}
        width={Math.max(32, (w - 12) * value)}
        height={32}
        rx={16}
        fill={color}
      />
    </g>
  );
};

/** Rotating siren light; beams while `on`. */
export const Siren: React.FC<{
  x: number;
  y: number;
  s?: number;
  on: boolean;
}> = ({ x, y, s = 1, on }) => {
  const frame = useCurrentFrame();
  const sh = useSh();
  const a = frame * 14;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {on ? (
        <g opacity={0.55}>
          <path
            d="M 0 -70 L -380 -150 L -380 10 Z"
            fill={C.yellow}
            transform={`rotate(${Math.sin((a * Math.PI) / 180) * 25} 0 -70)`}
            opacity={0.5 + 0.5 * Math.sin((a * Math.PI) / 90)}
          />
          <path
            d="M 0 -70 L 380 -150 L 380 10 Z"
            fill={C.yellow}
            transform={`rotate(${-Math.sin((a * Math.PI) / 180) * 25} 0 -70)`}
            opacity={0.5 - 0.5 * Math.sin((a * Math.PI) / 90)}
          />
        </g>
      ) : null}
      <g filter={sh}>
        <path
          d="M -70 0 L -70 -60 Q -70 -136 0 -136 Q 70 -136 70 -60 L 70 0 Z"
          fill={
            on ? (Math.floor(frame / 4) % 2 ? "#ff4b3a" : "#ff8a3a") : "#b6574c"
          }
        />
        <rect
          x={-40}
          y={-112}
          width={20}
          height={56}
          rx={10}
          fill="#fff"
          opacity={0.5}
        />
        <rect x={-96} y={-8} width={192} height={40} rx={10} fill={C.navy} />
      </g>
    </g>
  );
};

/** Spotlight cone from the top of the frame onto a floor ellipse at (x, y). */
export const Spotlight: React.FC<{
  x: number;
  y: number;
  w?: number;
  on: number;
}> = ({ x, y, w = 520, on }) => (
  <g opacity={on}>
    <path
      d={`M ${x - 70} -40 L ${x + 70} -40 L ${x + w / 2} ${y} L ${x - w / 2} ${y} Z`}
      fill="#fff6c8"
      opacity={0.28}
    />
    <ellipse cx={x} cy={y} rx={w / 2} ry={w / 8} fill="#fff6c8" opacity={0.4} />
  </g>
);

// ---------------------------------------------------------------- lab
/** Pale lab background: wall, shelf with flasks, floor. */
export const Lab: React.FC<{ floorY?: number }> = ({ floorY = 1460 }) => {
  const sh = useSh();
  return (
    <g>
      <rect
        x={-400}
        y={-400}
        width={1880}
        height={floorY + 400}
        fill="#dfe7ee"
      />
      <rect
        x={-400}
        y={floorY - 300}
        width={1880}
        height={300}
        fill="#d0dae3"
      />
      <rect x={-400} y={floorY} width={1880} height={900} fill="#aab6c2" />
      <rect x={-400} y={floorY - 14} width={1880} height={16} fill="#eef3f7" />
      <g filter={sh}>
        <rect x={760} y={650} width={300} height={18} rx={6} fill="#9aa6b2" />
        <rect x={790} y={560} width={44} height={90} rx={10} fill={C.green} />
        <path
          d="M 860 650 L 880 590 L 880 560 L 910 560 L 910 590 L 930 650 Z"
          fill={C.cyan}
        />
        <rect x={950} y={590} width={36} height={60} rx={8} fill={C.coral} />
      </g>
    </g>
  );
};

/** Green chalkboard centred at (x, y). */
export const Board: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, children }) => {
  const sh = useSh();
  return (
    <g transform={`translate(${x} ${y})`}>
      <g filter={sh}>
        <rect
          x={-w / 2 - 22}
          y={-h / 2 - 22}
          width={w + 44}
          height={h + 44}
          rx={14}
          fill="#a8703f"
        />
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={6}
          fill="#2f5d50"
        />
        <rect
          x={-w / 2 + 40}
          y={h / 2 + 18}
          width={w - 80}
          height={16}
          rx={6}
          fill="#8d5a30"
        />
      </g>
      {children}
    </g>
  );
};

/** A chalk line drawn on progressively (p 0–1). */
export const Chalk: React.FC<{
  d: string;
  p: number;
  width?: number;
  color?: string;
}> = ({ d, p, width = 9, color = "#eef3ea" }) =>
  p <= 0 ? null : (
    <path
      d={d}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - Math.min(1, p)}
      stroke={color}
      strokeWidth={width}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.92}
    />
  );

// ---------------------------------------------------------------- ultrasound
/** Ultrasound monitor centred at (x, y): fan image, sweeping scan line, baby in profile that can yawn. */
export const Ultrasound: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  baby: number;
  yawn: number;
  label?: string;
}> = ({ x, y, w = 760, h = 600, baby, yawn, label = "ECOGRAFÍA" }) => {
  const frame = useCurrentFrame();
  const sh = useSh();
  const clip = useUid("fan");
  const apexY = -h / 2 + 60;
  const R = h - 110;
  const A = (40 * Math.PI) / 180;
  const fan = `M 0 ${apexY} L ${-Math.sin(A) * R} ${apexY + Math.cos(A) * R} A ${R} ${R} 0 0 0 ${Math.sin(A) * R} ${apexY + Math.cos(A) * R} Z`;
  const sweep = Math.sin(frame / 9) * 38;
  const dots = Array.from({ length: 70 }, (_, i) => {
    const a = (random(`ua${i}`) * 2 - 1) * A;
    const r = (0.15 + 0.85 * Math.sqrt(random(`ur${i}`))) * R;
    return [
      Math.sin(a) * r,
      apexY + Math.cos(a) * r,
      2 + random(`us${i}`) * 5,
    ] as const;
  });
  const g1 = "#c9cfd6",
    g2 = "#9aa2ab";
  return (
    <g transform={`translate(${x} ${y})`}>
      <g filter={sh}>
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={34}
          fill="#2a3240"
        />
        <rect x={-36} y={h / 2} width={72} height={70} fill="#2a3240" />
        <rect
          x={-150}
          y={h / 2 + 60}
          width={300}
          height={30}
          rx={14}
          fill="#2a3240"
        />
      </g>
      <rect
        x={-w / 2 + 24}
        y={-h / 2 + 24}
        width={w - 48}
        height={h - 48}
        rx={16}
        fill="#0c1016"
      />
      <text
        x={-w / 2 + 50}
        y={-h / 2 + 66}
        fontFamily={MONO}
        fontWeight={700}
        fontSize={24}
        fill="#7f8b99"
        letterSpacing={3}
      >
        {label}
      </text>
      <circle
        cx={w / 2 - 54}
        cy={-h / 2 + 58}
        r={9}
        fill={Math.floor(frame / 15) % 2 ? C.red : "#55303a"}
      />
      <clipPath id={clip}>
        <path d={fan} />
      </clipPath>
      <path d={fan} fill="#2a2f36" />
      <g clipPath={`url(#${clip})`}>
        {dots.map(([dx, dy, r], i) => (
          <circle key={i} cx={dx} cy={dy} r={r} fill="#8d959e" opacity={0.25} />
        ))}
        <g
          opacity={baby}
          transform={`translate(${-10} ${apexY + R * 0.56}) scale(${R / 470})`}
        >
          <ellipse
            cx={70}
            cy={50}
            rx={100}
            ry={74}
            fill={g2}
            transform="rotate(18 70 50)"
          />
          <ellipse
            cx={130}
            cy={110}
            rx={64}
            ry={34}
            fill={g1}
            transform="rotate(-20 130 110)"
          />
          <circle cx={-50} cy={-20} r={84} fill={g1} />
          <ellipse
            cx={-30}
            cy={-60}
            rx={40}
            ry={20}
            fill="#dde2e7"
            opacity={0.6}
          />
          <path
            d={`M -112 -30 Q -102 -24 -92 -30`}
            stroke="#3a4048"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={-136} cy={-2} r={12} fill={g1} />
          {yawn > 0.05 ? (
            <ellipse
              cx={-118}
              cy={34 + 6 * yawn}
              rx={9 + 9 * yawn}
              ry={3 + 17 * yawn}
              fill="#1d2127"
            />
          ) : (
            <path
              d="M -128 30 L -108 32"
              stroke="#3a4048"
              strokeWidth={6}
              strokeLinecap="round"
            />
          )}
          <ellipse cx={-60} cy={62} rx={30} ry={20} fill={g1} />
        </g>
        <path
          d={`M 0 ${apexY} L ${Math.sin((sweep * Math.PI) / 180) * R * 1.1} ${apexY + Math.cos((sweep * Math.PI) / 180) * R * 1.1}`}
          stroke="#e8f2ff"
          strokeWidth={6}
          opacity={0.35}
        />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- brain
/** Head in profile (facing right) with the brain showing; yawn opens the jaw, cool 0–1 turns the brain from hot to cool. */
export const ProfileHead: React.FC<{
  x: number;
  y: number;
  s?: number;
  yawn: number;
  cool: number;
  skin?: string;
  shade?: string;
  hair?: string;
}> = ({
  x,
  y,
  s = 1,
  yawn,
  cool,
  skin = "#eab58e",
  shade = "#d79670",
  hair = "#3b2a22",
}) => {
  const sh = useSh();
  const brain = interpolateColors(cool, [0, 1], ["#f47f86", "#8fc4f0"]);
  const fold = interpolateColors(cool, [0, 1], ["#d4555f", "#5d9bd6"]);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter={sh}>
      <rect x={-70} y={150} width={130} height={120} rx={30} fill={shade} />
      <path d="M 120 150 Q 110 190 40 196 L 40 120 Z" fill={skin} />
      <path d="M 60 60 L 144 56 L 136 100 L 60 110 Z" fill={C.mouth} />
      <g transform={`rotate(${yawn * 26} 40 40)`}>
        <path
          d="M 60 66 L 142 66 L 138 96 Q 128 134 88 138 L 40 146 L 30 70 Z"
          fill={skin}
        />
        <path
          d="M 120 72 L 140 70 L 138 80 L 118 84 Z"
          fill={C.tongue}
          opacity={yawn > 0.1 ? 1 : 0}
        />
      </g>
      <path
        d="M -60 210 C -140 110 -150 -60 -70 -150 C -10 -214 116 -186 134 -62 L 136 -20 L 174 22 L 140 40 L 146 58 L 60 62 L 40 140 L 30 210 Z"
        fill={skin}
      />
      <path
        d="M -70 -150 C -10 -214 100 -196 128 -96 C 70 -150 -10 -150 -62 -60 C -110 -40 -130 20 -130 60 C -150 -10 -130 -100 -70 -150 Z"
        fill={hair}
      />
      <ellipse cx={-34} cy={30} rx={20} ry={30} fill={shade} />
      <path
        d="M 82 -30 Q 94 -22 106 -30"
        stroke={C.ink}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 80 -62 L 112 -66"
        stroke={hair}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <ellipse cx={8} cy={-70} rx={112} ry={84} fill="#fff" opacity={0.85} />
      <g transform="translate(8 -70)">
        <path
          d="M -96 6 C -100 -50 -50 -76 -6 -70 C 40 -84 96 -54 94 -6 C 106 34 66 62 26 56 C -6 70 -50 66 -66 46 C -96 46 -104 26 -96 6 Z"
          fill={brain}
        />
        <g stroke={fold} strokeWidth={7} fill="none" strokeLinecap="round">
          <path d="M -60 -30 Q -40 -50 -20 -30 Q 0 -10 20 -32" />
          <path d="M -70 10 Q -50 -10 -30 10 Q -10 30 10 6 Q 30 -14 50 8" />
          <path d="M 40 -50 Q 60 -30 70 -40" />
          <path d="M -30 40 Q -10 24 10 40 Q 30 52 56 34" />
        </g>
      </g>
    </g>
  );
};

/** Breath of cold air drawn along a path while `p` goes 0 → 1 (three parallel strands). */
export const AirFlow: React.FC<{ d: string; p: number; color?: string }> = ({
  d,
  p,
  color = "#3d9be0",
}) => {
  const sh = useSh();
  if (p <= 0) return null;
  return (
    <g filter={sh}>
      {[-16, 0, 16].map((o, i) => (
        <path
          key={i}
          d={d}
          transform={`translate(0 ${o})`}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - Math.min(1, p * (1 - i * 0.12))}
          stroke={i === 1 ? color : "#8fd0ff"}
          strokeWidth={i === 1 ? 16 : 9}
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- Pisa
/** The leaning tower, base centre at (x, y). */
export const PisaTower: React.FC<{
  x: number;
  y: number;
  s?: number;
  tilt?: number;
}> = ({ x, y, s = 1, tilt = 5 }) => {
  const sh = useSh();
  const tiers = 7;
  const tierH = 66;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}
      filter={sh}
    >
      {Array.from({ length: tiers }, (_, i) => {
        const ty = -(i + 1) * tierH;
        return (
          <g key={i}>
            <rect
              x={-92}
              y={ty}
              width={184}
              height={tierH}
              fill={i === 0 ? "#efe4cc" : "#f6eedb"}
            />
            <rect
              x={-100}
              y={ty - 6}
              width={200}
              height={12}
              rx={4}
              fill="#e2d4b4"
            />
            {[-62, -20, 22, 64].map((ax) => (
              <rect
                key={ax}
                x={ax - 12}
                y={ty + 18}
                width={24}
                height={40}
                rx={12}
                fill="#d6c7a5"
              />
            ))}
          </g>
        );
      })}
      <rect
        x={-62}
        y={-tiers * tierH - 70}
        width={124}
        height={70}
        fill="#f6eedb"
      />
      <rect
        x={-70}
        y={-tiers * tierH - 78}
        width={140}
        height={12}
        rx={4}
        fill="#e2d4b4"
      />
      {[-30, 0, 30].map((ax) => (
        <rect
          key={ax}
          x={ax - 9}
          y={-tiers * tierH - 56}
          width={18}
          height={36}
          rx={9}
          fill="#d6c7a5"
        />
      ))}
    </g>
  );
};

/** Wall calendar that flips its 12 months from `at`. */
export const CalendarFlip: React.FC<{
  x: number;
  y: number;
  at: number;
  s?: number;
}> = ({ x, y, at, s = 1 }) => {
  const frame = useCurrentFrame();
  const sh = useSh();
  const months = [
    "ENE",
    "FEB",
    "MAR",
    "ABR",
    "MAY",
    "JUN",
    "JUL",
    "AGO",
    "SEP",
    "OCT",
    "NOV",
    "DIC",
  ];
  const t = Math.max(0, frame - at);
  const i = Math.min(11, Math.floor(t / 2.2));
  const flip = frame >= at && i < 11 ? (t / 2.2) % 1 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter={sh}>
      <rect x={-120} y={-110} width={240} height={250} rx={22} fill="#fff" />
      <rect x={-120} y={-110} width={240} height={70} rx={22} fill={C.red} />
      <rect x={-120} y={-64} width={240} height={24} fill={C.red} />
      <circle cx={-60} cy={-110} r={12} fill={C.navy} />
      <circle cx={60} cy={-110} r={12} fill={C.navy} />
      <text
        x={0}
        y={70}
        textAnchor="middle"
        fontFamily={SANS}
        fontWeight={800}
        fontSize={84}
        fill={C.ink}
        transform={`scale(1 ${1 - flip * 0.8})`}
        style={{ transformOrigin: "0px 10px" }}
      >
        {months[i]}
      </text>
    </g>
  );
};

/** Magnifying glass (lens centre at x, y). */
export const Magnifier: React.FC<{ x: number; y: number; s?: number }> = ({
  x,
  y,
  s = 1,
}) => {
  const sh = useSh();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter={sh}>
      <line
        x1={64}
        y1={64}
        x2={150}
        y2={150}
        stroke="#6b4a2b"
        strokeWidth={34}
        strokeLinecap="round"
      />
      <circle
        cx={0}
        cy={0}
        r={92}
        fill="rgba(190,230,255,0.35)"
        stroke={C.navy}
        strokeWidth={20}
      />
      <path
        d="M -50 -30 Q -40 -56 -14 -62"
        stroke="#fff"
        strokeWidth={10}
        fill="none"
        strokeLinecap="round"
        opacity={0.8}
      />
    </g>
  );
};

// ---------------------------------------------------------------- end card
/** Flat end card: the closing question with its keyword in a blue box, and the CTA. */
export const FlatEndCard: React.FC<{
  question: string;
  keyword: string;
  cta: string;
  art?: React.ReactNode;
}> = ({ question, keyword, cta, art }) => {
  const frame = useCurrentFrame();
  const k = pop(frame, 2, 10);
  const i = question.indexOf(keyword);
  const parts =
    i < 0
      ? [question, "", ""]
      : [question.slice(0, i), keyword, question.slice(i + keyword.length)];
  const arrow = Math.sin(frame / 5) * 10;
  return (
    <AbsoluteFill
      style={{ background: C.wall, display: "grid", placeItems: "center" }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 40% at 50% 46%, #fbf1dc, ${C.wall})`,
        }}
      />
      {art}
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          gap: 44,
          padding: art ? "0 90px 360px" : "0 90px",
          transform: `scale(${k})`,
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 88,
            lineHeight: 1.15,
            color: C.ink,
            textAlign: "center",
          }}
        >
          {parts[0]}
          {parts[1] ? (
            <span
              style={{
                background: "#1f6f9f",
                color: "#fff",
                borderRadius: 16,
                padding: "0 18px",
                boxShadow: `8px 7px 0 ${C.shadow}`,
              }}
            >
              {parts[1]}
            </span>
          ) : null}
          {parts[2]}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: "0.06em",
            color: "#fff",
            background: C.navy,
            padding: "16px 30px",
            borderRadius: 999,
            textAlign: "center",
            boxShadow: `8px 7px 0 ${C.red}`,
          }}
        >
          {cta}
        </div>
        <div
          style={{
            fontSize: 90,
            color: C.red,
            transform: `translateY(${arrow}px)`,
            fontFamily: SANS,
            fontWeight: 800,
          }}
        >
          ↓
        </div>
      </div>
    </AbsoluteFill>
  );
};

import "@fontsource/poppins/800.css";
import React, { createContext, useContext, useId } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { MONO, SANS } from "./hud";

// Flat-illustration art direction: vector shapes without outlines, a hard dark
// shadow offset down-right behind every figure, soft daytime colours, a simple
// recurring character, white pill labels with dark text. Everything is drawn
// in SVG on the 1080×1920 canvas; a scene "camera" is just a zoom/pan transform
// (camT) over one illustrated world, so close-ups and wide shots match.

export const C = {
  shadow: "#1b2230",
  ink: "#1b2230",
  wall: "#f2e3c6",
  wallDark: "#e7d2aa",
  floor: "#c99a6b",
  floorLine: "#b4855a",
  sky: "#a9d8ef",
  cloud: "#fff6e3",
  frame: "#fbf7ef",
  mustard: "#e3a33b",
  mustardDark: "#c4862a",
  mustardLight: "#efbd5c",
  orange: "#f39a2e",
  red: "#ef5a36",
  yellow: "#ffd23f",
  green: "#4caf72",
  leaf: "#3f9a5f",
  teal: "#5fb3a8",
  coral: "#ef7d64",
  blue: "#3f74d6",
  blueDark: "#2c58ad",
  blueLight: "#8fb0f0",
  cyan: "#43c0e8",
  mouth: "#5a1f2b",
  tongue: "#e8707f",
  white: "#ffffff",
  navy: "#141b26",
  grey: "#8a919c",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = (
  f: number,
  a: number,
  b: number,
  e = Easing.inOut(Easing.cubic),
) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Overshooting pop-in (0 → 1.08 → 1). */
export const pop = (f: number, at: number, len = 8) =>
  interpolate(f, [at, at + len], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(2.2)),
  });

// ---------------------------------------------------------------- canvas
const FlatCtx = createContext("none");
const useUid = (p: string) => p + useId().replace(/[^a-zA-Z0-9]/g, "");
/** Hard offset shadow for a figure group: <g filter={useSh()}>. */
export const useSh = () => `url(#${useContext(FlatCtx)})`;

/** One flat illustration layer covering the frame. */
export const FlatSvg: React.FC<{
  children: React.ReactNode;
  bg?: string;
  style?: React.CSSProperties;
}> = ({ children, bg, style }) => {
  const sh = useUid("sh");
  return (
    <svg
      viewBox="0 0 1080 1920"
      width={1080}
      height={1920}
      style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}
    >
      <defs>
        <filter
          id={sh}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feOffset in="SourceAlpha" dx={11} dy={9} result="o" />
          <feFlood floodColor={C.shadow} result="c" />
          <feComposite in="c" in2="o" operator="in" result="s" />
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {bg ? <rect width={1080} height={1920} fill={bg} /> : null}
      <FlatCtx.Provider value={sh}>{children}</FlatCtx.Provider>
    </svg>
  );
};

/** Camera over the illustrated world: world point (cx, cy) at screen (sx, sy), zoom z. */
export const camT = (cx: number, cy: number, z: number, sx = 540, sy = 960) =>
  `translate(${sx} ${sy}) scale(${z}) translate(${-cx} ${-cy})`;

// ---------------------------------------------------------------- characters
export type Look = {
  skin: string;
  shade: string;
  hair: string;
  style: "messy" | "bun" | "short" | "bald";
  blush?: string;
  glasses?: "round" | "sun";
};
export type Outfit = {
  top: string;
  trim: string;
  bottom: string;
  shoes: string;
  pajama?: boolean;
  coat?: boolean;
};

export const LEO: Look = {
  skin: "#eab58e",
  shade: "#d79670",
  hair: "#3b2a22",
  style: "messy",
  blush: "#f08a7a",
};
export const LEO_FIT: Outfit = {
  top: C.blue,
  trim: "#d9e5ff",
  bottom: C.blueDark,
  shoes: "#8a919c",
  pajama: true,
};
export const SOFI: Look = {
  skin: "#b97b53",
  shade: "#9c6240",
  hair: "#1e1a1d",
  style: "bun",
  blush: "#e0705c",
};
export const SOFI_FIT: Outfit = {
  top: "#3aa57a",
  trim: "#c9f0dc",
  bottom: "#2d6e57",
  shoes: "#f2e3c6",
};
/** The scientist (lab coat, round glasses). */
export const DRA: Look = {
  skin: "#f1c6a2",
  shade: "#dca27c",
  hair: "#b8552e",
  style: "short",
  blush: "#f08a7a",
  glasses: "round",
};
export const DRA_FIT: Outfit = {
  top: "#f7f8fa",
  trim: "#cfd6de",
  bottom: "#3b4656",
  shoes: "#2a3240",
  coat: true,
};

// messy spiky cap: alternating tip/valley radii around the top of the head, closed by a jagged fringe
const MESSY = (() => {
  const tips = [100, 116, 106, 122, 110, 126, 112, 120, 104, 114, 98];
  const pts: [number, number][] = [];
  const n = tips.length;
  for (let i = 0; i <= 2 * n; i++) {
    const a = Math.PI + (i / (2 * n)) * Math.PI;
    const r = i % 2 === 1 ? tips[(i - 1) / 2] : 90;
    pts.push([Math.cos(a) * r * 0.93, Math.sin(a) * r - 4]);
  }
  const fringe: [number, number][] = [
    [84, 8],
    [70, -40],
    [52, -26],
    [34, -54],
    [12, -34],
    [-10, -58],
    [-30, -36],
    [-50, -56],
    [-66, -34],
    [-86, 8],
  ];
  return (
    "M " +
    [...pts, ...fringe]
      .map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" L ") +
    " Z"
  );
})();

export type Face = {
  /** 0 closed mouth → 1 full yawn (jaw drops, eyes squeeze, brows lift) */
  yawn?: number;
  /** 0 open eyes → 1 closed (sleepy ≈ 0.5) */
  lids?: number;
  /** right eye wink 0–1 */
  wink?: number;
  /** pupils offset (-1..1) */
  look?: [number, number];
  smile?: number;
  /** eyebrows raised (surprise) 0–1 */
  brows?: number;
};

/** Head centred on the face (≈150 wide, 175 tall + hair). */
export const Head: React.FC<Face & { who: Look }> = ({
  who,
  yawn = 0,
  lids = 0,
  wink = 0,
  look = [0, 0],
  smile = 0,
  brows = 0,
}) => {
  const clip = useUid("m");
  const jaw = 9 * yawn;
  const my = 44 + 12 * yawn;
  const mrx = 13 + 20 * yawn;
  const mry = 3 + 40 * yawn;
  const squeeze = yawn > 0.5 ? (yawn - 0.5) / 0.5 : 0;
  const shut = Math.max(lids, squeeze);
  const eyeY = -8 - 3 * yawn;
  const brow = -32 - 10 * yawn + 4 * lids - 12 * brows;
  const eye = (x: number, closed: number, side: number) =>
    closed >= 0.88 ? (
      <path
        d={`M ${x - 12} ${eyeY - 1} Q ${x} ${eyeY + 7} ${x + 12} ${eyeY - 1}`}
        stroke={C.ink}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
    ) : (
      <g>
        <ellipse
          cx={x + look[0] * 4}
          cy={eyeY + look[1] * 3}
          rx={9}
          ry={11}
          fill={C.ink}
        />
        <circle
          cx={x + look[0] * 4 + 3}
          cy={eyeY + look[1] * 3 - 4}
          r={2.6}
          fill="#fff"
        />
        {closed > 0.05 ? (
          <rect
            x={x - 14}
            y={eyeY - 14}
            width={28}
            height={2 + 22 * closed}
            fill={who.skin}
          />
        ) : null}
        {closed > 0.05 ? (
          <path
            d={`M ${x - 13} ${eyeY - 12 + 22 * closed} L ${x + 13} ${eyeY - 12 + 22 * closed + side * 1.5}`}
            stroke={C.ink}
            strokeWidth={4.5}
            strokeLinecap="round"
          />
        ) : null}
      </g>
    );
  return (
    <g>
      {who.style === "bun" ? (
        <circle cx={0} cy={-118} r={40} fill={who.hair} />
      ) : null}
      <ellipse cx={-76} cy={6} rx={15} ry={21} fill={who.shade} />
      <ellipse cx={76} cy={6} rx={15} ry={21} fill={who.shade} />
      <ellipse
        cx={0}
        cy={jaw * 0.5}
        rx={76}
        ry={86 + jaw * 0.5}
        fill={who.skin}
      />
      {who.blush ? (
        <>
          <ellipse
            cx={-48}
            cy={26}
            rx={13}
            ry={7}
            fill={who.blush}
            opacity={0.4}
          />
          <ellipse
            cx={48}
            cy={26}
            rx={13}
            ry={7}
            fill={who.blush}
            opacity={0.4}
          />
        </>
      ) : null}
      {eye(-30, shut, -1)}
      {eye(30, Math.max(shut, wink), 1)}
      <path
        d={`M -44 ${brow + 2} L -18 ${brow - 2}`}
        stroke={who.hair}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d={`M 18 ${brow - 2} L 44 ${brow + 2}`}
        stroke={who.hair}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <ellipse cx={0} cy={18} rx={10} ry={7} fill={who.shade} />
      {yawn < 0.04 ? (
        <path
          d={`M -14 ${my} Q 0 ${my + 4 + smile * 9} 14 ${my}`}
          stroke={C.ink}
          strokeWidth={4.5}
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <g>
          <clipPath id={clip}>
            <ellipse cx={0} cy={my} rx={mrx} ry={mry} />
          </clipPath>
          <ellipse cx={0} cy={my} rx={mrx} ry={mry} fill={C.mouth} />
          <g clipPath={`url(#${clip})`}>
            <ellipse
              cx={0}
              cy={my + mry * 0.9}
              rx={mrx * 0.72}
              ry={mry * 0.5}
              fill={C.tongue}
            />
            <rect
              x={-mrx}
              y={my - mry - 1}
              width={mrx * 2}
              height={2 + Math.min(10, mry * 0.22)}
              fill="#fff"
            />
          </g>
        </g>
      )}
      {who.style === "messy" ? <path d={MESSY} fill={who.hair} /> : null}
      {who.style === "bun" || who.style === "short" ? (
        <path
          d="M -84 10 C -92 -70 -50 -104 0 -104 C 50 -104 92 -70 84 10 C 76 -30 60 -48 30 -52 C 10 -40 -30 -36 -60 -44 C -72 -30 -80 -14 -84 10 Z"
          fill={who.hair}
        />
      ) : null}
      {who.style === "bald" ? (
        <>
          <path d="M -80 -10 Q -84 -46 -66 -60 L -60 -20 Z" fill={who.hair} />
          <path d="M 80 -10 Q 84 -46 66 -60 L 60 -20 Z" fill={who.hair} />
        </>
      ) : null}
      {who.glasses === "round" ? (
        <g stroke={C.ink} strokeWidth={5} fill="rgba(255,255,255,0.18)">
          <circle cx={-30} cy={eyeY} r={21} />
          <circle cx={30} cy={eyeY} r={21} />
          <path
            d={`M -9 ${eyeY - 2} Q 0 ${eyeY - 8} 9 ${eyeY - 2}`}
            fill="none"
          />
        </g>
      ) : null}
      {who.glasses === "sun" ? (
        <g fill={C.ink}>
          <rect x={-56} y={eyeY - 16} width={48} height={30} rx={10} />
          <rect x={8} y={eyeY - 16} width={48} height={30} rx={10} />
          <rect x={-10} y={eyeY - 10} width={20} height={6} />
        </g>
      ) : null}
    </g>
  );
};

export type Pose = Face & {
  /** arms 0 resting on the lap → 1 stretched above the head */
  stretch?: number;
  /** head nod (degrees, + = chin down) */
  nod?: number;
  /** right hand scratching the head 0–1 */
  scratch?: number;
  /** both palms up, "who knows" 0–1 */
  shrug?: number;
  /** left arm pointing out and up 0–1 */
  point?: number;
};

type Arm = [number, number, number, number]; // elbow x, y, hand x, y (right side; mirrored for the left)
const mixArm = (a: Arm, b: Arm, t: number): Arm => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
  lerp(a[3], b[3], t),
];
const ARM_LAP: Arm = [110, -96, 54, 4];
const ARM_SIDE: Arm = [106, -104, 104, -6];
const ARM_UP: Arm = [150, -318, 92, -446];
const ARM_SCRATCH: Arm = [168, -330, 78, -436];
const ARM_SHRUG: Arm = [150, -132, 212, -236];
const ARM_POINT: Arm = [196, -252, 300, -318];

/** A person, hip centre at (x, y). Seated (front view, on a sofa) or standing. */
export const Person: React.FC<
  {
    x: number;
    y: number;
    s?: number;
    who: Look;
    fit: Outfit;
    seated?: boolean;
    flip?: boolean;
  } & Pose
> = ({
  x,
  y,
  s = 1,
  who,
  fit,
  seated = true,
  flip = false,
  stretch = 0,
  nod = 0,
  scratch = 0,
  shrug = 0,
  point = 0,
  ...face
}) => {
  const sh = useSh();
  const frame = useCurrentFrame();
  const arm = (side: number) => {
    const sx = side * 74,
      sy = -206;
    let a = mixArm(seated ? ARM_LAP : ARM_SIDE, ARM_UP, stretch);
    a = mixArm(a, ARM_SHRUG, shrug);
    if (side > 0) a = mixArm(a, ARM_SCRATCH, scratch);
    if (side < 0) a = mixArm(a, ARM_POINT, point);
    const ex = side * a[0],
      ey = a[1];
    const hx = side * a[2],
      hy = a[3] + (side > 0 ? Math.sin(frame * 0.9) * 7 * scratch : 0);
    return (
      <g key={side}>
        <path
          d={`M ${sx} ${sy} L ${ex} ${ey} L ${hx} ${hy}`}
          stroke={fit.top}
          strokeWidth={42}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={hx} cy={hy} r={21} fill={who.skin} />
      </g>
    );
  };
  const lift = 8 * (face.yawn ?? 0);
  return (
    <g
      transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}
      filter={sh}
    >
      {seated ? (
        <>
          <rect
            x={-70}
            y={18}
            width={54}
            height={150}
            rx={22}
            fill={fit.bottom}
          />
          <rect
            x={16}
            y={18}
            width={54}
            height={150}
            rx={22}
            fill={fit.bottom}
          />
          <ellipse cx={-48} cy={172} rx={42} ry={17} fill={fit.shoes} />
          <ellipse cx={48} cy={172} rx={42} ry={17} fill={fit.shoes} />
        </>
      ) : (
        <>
          <rect
            x={-66}
            y={-12}
            width={56}
            height={252}
            rx={24}
            fill={fit.bottom}
          />
          <rect
            x={10}
            y={-12}
            width={56}
            height={252}
            rx={24}
            fill={fit.bottom}
          />
          <ellipse cx={-50} cy={244} rx={40} ry={17} fill={fit.shoes} />
          <ellipse cx={50} cy={244} rx={40} ry={17} fill={fit.shoes} />
        </>
      )}
      <rect x={-20} y={-266} width={40} height={40} rx={12} fill={who.shade} />
      <rect
        x={-86}
        y={-238}
        width={172}
        height={fit.coat && !seated ? 330 : 250}
        rx={46}
        fill={fit.top}
      />
      {fit.coat ? (
        <>
          <path
            d="M -30 -236 L 0 -150 L 30 -236"
            stroke={fit.trim}
            strokeWidth={10}
            fill="none"
            strokeLinejoin="round"
          />
          <rect
            x={-2}
            y={-150}
            width={4}
            height={seated ? 150 : 240}
            fill={fit.trim}
          />
          <rect x={30} y={-120} width={36} height={8} rx={4} fill={C.blue} />
          <rect
            x={-64}
            y={-20}
            width={40}
            height={34}
            rx={8}
            fill={fit.trim}
            opacity={0.6}
          />
        </>
      ) : null}
      {fit.pajama ? (
        <>
          <path
            d="M -34 -234 L 0 -192 L 34 -234"
            stroke={fit.trim}
            strokeWidth={9}
            fill="none"
            strokeLinejoin="round"
          />
          {[-160, -116, -72].map((cy) => (
            <circle key={cy} cx={0} cy={cy} r={6.5} fill={fit.trim} />
          ))}
          <rect
            x={-66}
            y={-176}
            width={36}
            height={30}
            rx={7}
            fill={fit.trim}
            opacity={0.35}
          />
        </>
      ) : (
        <path
          d="M -40 -236 Q 0 -200 40 -236"
          stroke={fit.trim}
          strokeWidth={8}
          fill="none"
        />
      )}
      {seated ? (
        <rect
          x={-94}
          y={-22}
          width={188}
          height={68}
          rx={30}
          fill={fit.bottom}
        />
      ) : null}
      <g transform={`translate(0 ${-334 - lift}) rotate(${nod})`}>
        <Head who={who} {...face} />
      </g>
      {arm(-1)}
      {arm(1)}
    </g>
  );
};

/** Sitting dog, front view, paws at (x, y). */
export const Dog: React.FC<{
  x: number;
  y: number;
  s?: number;
  yawn?: number;
  wag?: number;
  lids?: number;
  tone?: string;
  flip?: boolean;
}> = ({
  x,
  y,
  s = 1,
  yawn = 0,
  wag = 0,
  lids = 0,
  tone = "#d58a3c",
  flip = false,
}) => {
  const sh = useSh();
  const dark = "#8a5426";
  const squeeze = yawn > 0.5 ? (yawn - 0.5) / 0.5 : 0;
  const shut = Math.max(lids, squeeze);
  const eye = (ex: number) =>
    shut >= 0.85 ? (
      <path
        d={`M ${ex - 9} -168 Q ${ex} -162 ${ex + 9} -168`}
        stroke={C.ink}
        strokeWidth={4.5}
        fill="none"
        strokeLinecap="round"
      />
    ) : (
      <ellipse
        cx={ex}
        cy={-170}
        rx={7}
        ry={8 * (1 - shut * 0.8)}
        fill={C.ink}
      />
    );
  return (
    <g
      transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}
      filter={sh}
    >
      <path
        d={`M 52 -20 Q ${96 + wag * 18} ${-60 - wag * 10} ${86 + wag * 30} ${-104 + Math.abs(wag) * 6}`}
        stroke={tone}
        strokeWidth={18}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx={0} cy={-62} rx={62} ry={74} fill={tone} />
      <ellipse cx={0} cy={-50} rx={30} ry={46} fill="#f6e3c8" />
      <ellipse cx={-30} cy={-4} rx={24} ry={14} fill={tone} />
      <ellipse cx={30} cy={-4} rx={24} ry={14} fill={tone} />
      <g transform={`translate(0 ${-6 * yawn}) rotate(${-4 * yawn})`}>
        <path
          d="M -52 -196 Q -88 -172 -70 -112 Q -50 -132 -40 -176 Z"
          fill={dark}
        />
        <path d="M 52 -196 Q 88 -172 70 -112 Q 50 -132 40 -176 Z" fill={dark} />
        <ellipse cx={0} cy={-162} rx={56} ry={50} fill={tone} />
        {eye(-22)}
        {eye(22)}
        <ellipse
          cx={0}
          cy={-136 + 6 * yawn}
          rx={30}
          ry={22 + 4 * yawn}
          fill="#f6e3c8"
        />
        {yawn > 0.04 ? (
          <g>
            <ellipse
              cx={0}
              cy={-118 + 10 * yawn}
              rx={10 + 12 * yawn}
              ry={2 + 22 * yawn}
              fill={C.mouth}
            />
            <ellipse
              cx={0}
              cy={-104 + 18 * yawn}
              rx={7 + 6 * yawn}
              ry={3 + 7 * yawn}
              fill={C.tongue}
            />
          </g>
        ) : (
          <path
            d="M -10 -122 Q 0 -114 10 -122"
            stroke={C.ink}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
        )}
        <ellipse cx={0} cy={-146 + 2 * yawn} rx={11} ry={8} fill={C.ink} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- living room
/** Sofa, seat line at (x, y) (people sit with their hips there). */
export const Sofa: React.FC<{ x: number; y: number; w?: number }> = ({
  x,
  y,
  w = 640,
}) => {
  const sh = useSh();
  const hw = w / 2;
  return (
    <g transform={`translate(${x} ${y})`} filter={sh}>
      <rect x={-hw} y={-262} width={w} height={280} rx={48} fill={C.mustard} />
      <rect
        x={-hw + 30}
        y={-236}
        width={110}
        height={100}
        rx={22}
        fill={C.teal}
        transform={`rotate(-8 ${-hw + 85} -186)`}
      />
      <rect
        x={hw - 140}
        y={-236}
        width={110}
        height={100}
        rx={22}
        fill={C.coral}
        transform={`rotate(8 ${hw - 85} -186)`}
      />
      <rect
        x={-hw - 10}
        y={-4}
        width={w + 20}
        height={100}
        rx={26}
        fill={C.mustardDark}
      />
      <rect
        x={-hw + 10}
        y={-36}
        width={hw - 14}
        height={58}
        rx={24}
        fill={C.mustardLight}
      />
      <rect
        x={4}
        y={-36}
        width={hw - 14}
        height={58}
        rx={24}
        fill={C.mustardLight}
      />
      <rect
        x={-hw - 72}
        y={-150}
        width={100}
        height={244}
        rx={42}
        fill={C.mustard}
      />
      <rect
        x={hw - 28}
        y={-150}
        width={100}
        height={244}
        rx={42}
        fill={C.mustard}
      />
      <rect x={-hw - 40} y={92} width={24} height={36} rx={6} fill={C.ink} />
      <rect x={hw + 16} y={92} width={24} height={36} rx={6} fill={C.ink} />
    </g>
  );
};

const Cloud: React.FC<{ x: number; y: number; s?: number }> = ({
  x,
  y,
  s = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={C.cloud}>
    <ellipse cx={0} cy={0} rx={70} ry={34} />
    <circle cx={-26} cy={-22} r={32} />
    <circle cx={24} cy={-30} r={40} />
  </g>
);

/** Afternoon living room (wall, window with sky, picture, lamp, plant, wooden floor, rug). Floor line at FLOOR_Y. */
export const FLOOR_Y = 1440;
export const LivingRoom: React.FC<{ drift?: number }> = ({ drift = 0 }) => {
  const sh = useSh();
  return (
    <g>
      <rect
        x={-400}
        y={-400}
        width={1880}
        height={FLOOR_Y + 400}
        fill={C.wall}
      />
      <rect
        x={-400}
        y={FLOOR_Y - 330}
        width={1880}
        height={330}
        fill={C.wallDark}
      />
      <rect x={-400} y={FLOOR_Y} width={1880} height={900} fill={C.floor} />
      {[FLOOR_Y + 90, FLOOR_Y + 210, FLOOR_Y + 360].map((ly) => (
        <rect
          key={ly}
          x={-400}
          y={ly}
          width={1880}
          height={6}
          fill={C.floorLine}
        />
      ))}
      <rect x={-400} y={FLOOR_Y - 18} width={1880} height={20} fill={C.frame} />
      {/* window */}
      <g filter={sh}>
        <rect x={620} y={470} width={380} height={440} rx={14} fill={C.frame} />
      </g>
      <rect x={644} y={494} width={332} height={392} rx={6} fill={C.sky} />
      <circle cx={900} cy={790} r={46} fill="#ffd98a" />
      <Cloud x={720 + drift * 30} y={590} s={0.9} />
      <Cloud x={890 + drift * 20} y={690} s={0.6} />
      <rect x={804} y={494} width={12} height={392} fill={C.frame} />
      <rect x={644} y={684} width={332} height={12} fill={C.frame} />
      {/* picture */}
      <g filter={sh}>
        <rect x={110} y={560} width={250} height={200} rx={8} fill={C.frame} />
      </g>
      <rect x={128} y={578} width={214} height={164} fill="#cfe8f2" />
      <path
        d="M 128 742 L 190 650 L 236 708 L 280 640 L 342 742 Z"
        fill={C.leaf}
      />
      <circle cx={300} cy={612} r={16} fill={C.orange} />
      {/* plant */}
      <g filter={sh}>
        <path
          d="M 80 1180 Q 40 1080 70 1000 Q 100 1090 96 1180 Z"
          fill={C.leaf}
        />
        <path
          d="M 96 1180 Q 120 1060 180 1010 Q 160 1110 112 1184 Z"
          fill={C.green}
        />
        <path
          d="M 90 1180 Q 0 1110 -20 1050 Q 60 1080 100 1170 Z"
          fill={C.green}
        />
        <path d="M 40 1170 L 150 1170 L 136 1290 L 54 1290 Z" fill={C.coral} />
      </g>
      {/* floor lamp */}
      <g filter={sh}>
        <rect x={986} y={980} width={14} height={460} fill={C.ink} />
        <ellipse cx={993} cy={1440} rx={46} ry={12} fill={C.ink} />
        <path d="M 930 980 L 1056 980 L 1030 880 L 956 880 Z" fill={C.orange} />
      </g>
      {/* rug */}
      <ellipse
        cx={540}
        cy={FLOOR_Y + 170}
        rx={430}
        ry={90}
        fill={C.teal}
        opacity={0.85}
      />
    </g>
  );
};

// ---------------------------------------------------------------- labels and HUD
/** White pill label with dark text (pops in at `at`, optional fade at `until`). Centre (x, y). */
export const Pill: React.FC<{
  x: number;
  y: number;
  text: string;
  at: number;
  until?: number;
  size?: number;
  bg?: string;
  color?: string;
  tail?: "down" | "up" | "left" | "right";
}> = ({
  x,
  y,
  text,
  at,
  until,
  size = 44,
  bg = C.white,
  color = C.ink,
  tail,
}) => {
  const frame = useCurrentFrame();
  const sh = useSh();
  if (frame < at || (until !== undefined && frame > until + 6)) return null;
  const k =
    pop(frame, at) *
    (until !== undefined
      ? interpolate(frame, [until, until + 6], [1, 0], clamp)
      : 1);
  const w = text.length * size * 0.68 + size * 1.3;
  const h = size * 1.7;
  const t = h / 2;
  const tails = {
    down: `M -16 ${t - 2} L 0 ${t + 22} L 16 ${t - 2} Z`,
    up: `M -16 ${-t + 2} L 0 ${-t - 22} L 16 ${-t + 2} Z`,
    left: `M ${-w / 2 + 2} -14 L ${-w / 2 - 22} 0 L ${-w / 2 + 2} 14 Z`,
    right: `M ${w / 2 - 2} -14 L ${w / 2 + 22} 0 L ${w / 2 - 2} 14 Z`,
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} filter={sh}>
      {tail ? <path d={tails[tail]} fill={bg} /> : null}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={bg} />
      <text
        x={0}
        y={size * 0.36}
        textAnchor="middle"
        fontFamily={SANS}
        fontWeight={700}
        fontSize={size}
        letterSpacing={size * 0.04}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
};

/** Big flat question mark (pops in at `at`, bobs). */
export const Question: React.FC<{
  x: number;
  y: number;
  at: number;
  size?: number;
  color?: string;
  rot?: number;
}> = ({ x, y, at, size = 150, color = C.orange, rot = 0 }) => {
  const frame = useCurrentFrame();
  const sh = useSh();
  if (frame < at) return null;
  const k = pop(frame, at, 9);
  const bob = Math.sin((frame - at) / 7) * 8;
  return (
    <g
      transform={`translate(${x} ${y + bob}) rotate(${rot + Math.sin((frame - at) / 9) * 5}) scale(${k})`}
      filter={sh}
    >
      <text
        x={0}
        y={size * 0.36}
        textAnchor="middle"
        fontFamily={SANS}
        fontWeight={800}
        fontSize={size}
        fill={color}
      >
        ?
      </text>
    </g>
  );
};

/** Contagion waves: arcs travelling from a to b between frames at and at+len. */
export const Waves: React.FC<{
  a: [number, number];
  b: [number, number];
  at: number;
  len?: number;
  color?: string;
}> = ({ a, b, at, len = 16, color = C.cyan }) => {
  const frame = useCurrentFrame();
  const sh = useSh();
  if (frame < at || frame > at + len + 14) return null;
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return (
    <g filter={sh}>
      {[0, 1, 2].map((i) => {
        const t = (frame - at - i * 4) / len;
        if (t < 0 || t > 1) return null;
        const px = lerp(a[0], b[0], t),
          py = lerp(a[1], b[1], t);
        const r = 22 + 26 * Math.sin(Math.PI * t);
        return (
          <path
            key={i}
            d={`M ${-r * 0.5} ${-r} Q ${r * 0.5} 0 ${-r * 0.5} ${r}`}
            transform={`translate(${px} ${py}) rotate(${ang})`}
            stroke={color}
            strokeWidth={11}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

/** Video progress bar heading to a FIN flag. */
export const ProgressBar: React.FC<{
  x: number;
  y: number;
  w: number;
  at: number;
  from?: number;
  to?: number;
}> = ({ x, y, w, at, from = 0.18, to = 0.42 }) => {
  const frame = useCurrentFrame();
  const sh = useSh();
  if (frame < at) return null;
  const k = pop(frame, at);
  const p = lerp(
    from,
    to,
    ease(frame, at + 4, at + 70, Easing.inOut(Easing.quad)),
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} filter={sh}>
      <rect
        x={-w / 2 - 26}
        y={-44}
        width={w + 52}
        height={88}
        rx={44}
        fill={C.navy}
      />
      <rect
        x={-w / 2 + 70}
        y={-9}
        width={w - 200}
        height={18}
        rx={9}
        fill="#3a4556"
      />
      <rect
        x={-w / 2 + 70}
        y={-9}
        width={(w - 200) * p}
        height={18}
        rx={9}
        fill={C.red}
      />
      <circle cx={-w / 2 + 70 + (w - 200) * p} cy={0} r={17} fill="#fff" />
      <path
        d={`M ${-w / 2 + 14} -20 L ${-w / 2 + 46} 0 L ${-w / 2 + 14} 20 Z`}
        fill="#fff"
      />
      <text
        x={w / 2 - 66}
        y={13}
        textAnchor="middle"
        fontFamily={SANS}
        fontWeight={800}
        fontSize={36}
        fill={C.yellow}
      >
        FIN
      </text>
    </g>
  );
};

/** Running stopwatch pill (HTML). t = seconds shown; stopped flashes it. */
export const Stopwatch: React.FC<{
  t: number;
  x: number;
  y: number;
  scale?: number;
  stopped?: boolean;
  flash?: number;
}> = ({ t, x, y, scale = 1, stopped = false, flash = 0 }) => {
  const mm = Math.floor(t / 60);
  const ss = Math.floor(t % 60);
  const cs = Math.floor((t * 100) % 100);
  const txt = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  const hand = (t % 1) * 360;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 26px 12px 16px",
        borderRadius: 999,
        background: stopped ? (flash > 0.5 ? C.yellow : C.green) : C.red,
        boxShadow: `9px 8px 0 ${C.shadow}`,
        color: stopped && flash > 0.5 ? C.ink : "#fff",
      }}
    >
      <svg width={52} height={58} viewBox="-26 -32 52 58">
        <rect x={-6} y={-32} width={12} height={8} rx={2} fill="currentColor" />
        <circle
          cx={0}
          cy={0}
          r={22}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
        />
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={-14}
          stroke="currentColor"
          strokeWidth={5}
          strokeLinecap="round"
          transform={`rotate(${stopped ? 0 : hand})`}
        />
      </svg>
      <span
        style={{
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 46,
          letterSpacing: "0.02em",
        }}
      >
        {txt}
      </span>
    </div>
  );
};

/** Big challenge headline (HTML), e.g. TE RETO: / NO BOSTECES. */
export const HookText: React.FC<{
  kicker: string;
  title: string;
  y: number;
  out?: number;
}> = ({ kicker, title, y, out = 0 }) => {
  const frame = useCurrentFrame();
  const inK = interpolate(frame, [0, 6], [1.18, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const wob = Math.sin(frame / 3.2) * 1.6;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        display: "grid",
        justifyItems: "center",
        gap: 6,
        transform: `scale(${inK * (1 + out * 0.6)}) rotate(${wob * (1 - out)}deg)`,
        opacity: 1 - out,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 58,
          color: "#fff",
          background: C.red,
          padding: "4px 30px",
          borderRadius: 999,
          boxShadow: `8px 7px 0 ${C.shadow}`,
          letterSpacing: "0.03em",
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 112,
          lineHeight: 1.05,
          color: C.yellow,
          textShadow: `9px 8px 0 ${C.shadow}`,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
    </div>
  );
};

/** Circular reveal of its children from a point (HTML clip-path), r in px. */
export const Iris: React.FC<{
  r: number;
  cx?: number;
  cy?: number;
  children: React.ReactNode;
}> = ({ r, cx = 540, cy = 960, children }) => (
  <AbsoluteFill
    style={{ clipPath: `circle(${Math.max(0, r)}px at ${cx}px ${cy}px)` }}
  >
    {children}
  </AbsoluteFill>
);

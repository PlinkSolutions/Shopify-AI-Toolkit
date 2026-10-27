import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { beat, CONTACT, LEAN, SceneBrain, SceneHeart, SceneLean, SceneTimer, TIMER } from "./scenes";
import { Cam, CYAN, GOLD, HoloStage, NAVY, toScreen, V3 } from "./stage";

// 5-second test clip in the "holographic science explainer" style:
// "¿Por qué basta con apoyar la cabeza en su pecho para quedarte dormido en minutos?"
// Four new scenes, karaoke captions on top with the keyword in a gold box,
// light-flash cuts, typed HUD labels and a soft synthesized ambience.
// The narration is added later; caption timings follow a ~160 wpm read.

export const HOLO_FPS = 30;
export const HOLO_FRAMES = 150;

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SANS = "Poppins, 'Segoe UI', sans-serif";

const SCENES = [
  { from: 0, dur: 48 },
  { from: 48, dur: 39 },
  { from: 87, dur: 33 },
  { from: 120, dur: 30 },
];
const CALM_AT = 14; // scene 3: rest mode switches on

const CAMS: Cam[] = [
  { from: [0.35, 2.5, 14.2], to: [0.2, 2.4, 12.8], target: [-0.2, 1.6, 0], orbit: 0.16, dur: 48 },
  { from: [1.6, 2.7, 8.8], to: [1.35, 2.6, 7.9], target: [0.45, 2.3, 0], orbit: 0.12, dur: 39 },
  { from: [0, 2.6, 10.4], to: [0, 2.55, 9.2], target: [0, 1.8, 0], orbit: 0.22, dur: 33 },
  { from: [0.5, 4.0, 13.6], to: [0.4, 3.8, 12.4], target: [0.2, 1.95, 0.3], orbit: 0.14, dur: 30 },
];

type Word = { w: string; f: number; key?: boolean };
const PAGES: Word[][] = [
  [{ w: "¿Por", f: 2 }, { w: "qué", f: 8 }, { w: "basta", f: 14, key: true }, { w: "con", f: 25 }, { w: "apoyar", f: 31 }],
  [{ w: "la", f: 48 }, { w: "cabeza", f: 53 }, { w: "en", f: 63 }, { w: "su", f: 67 }, { w: "pecho", f: 72, key: true }],
  [{ w: "para", f: 87 }, { w: "quedarte", f: 93 }, { w: "dormido", f: 104, key: true }],
  [{ w: "en", f: 120 }, { w: "minutos?", f: 125, key: true }],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------- captions
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const page = [...PAGES].reverse().find((p) => frame >= p[0].f) ?? PAGES[0];
  return (
    <div style={{ position: "absolute", top: 196, left: 60, right: 60, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 16px", fontFamily: SANS, fontWeight: 500, fontSize: 50, lineHeight: 1.25 }}>
      {page.map((wd, i) => {
        const on = frame >= wd.f;
        const pop = interpolate(frame, [wd.f, wd.f + 4], [0.9, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
        return (
          <span
            key={i}
            style={{
              color: on ? "#ffffff" : "rgba(214,224,255,0.28)",
              transform: `scale(${on ? pop : 1})`,
              display: "inline-block",
              padding: wd.key ? "0 12px" : 0,
              borderRadius: 6,
              border: wd.key && on ? `2px solid ${GOLD}` : "2px solid transparent",
              background: wd.key && on ? "rgba(245,184,61,0.12)" : "transparent",
              boxShadow: wd.key && on ? "0 0 22px rgba(245,184,61,0.35)" : "none",
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            }}
          >
            {wd.w}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- HUD
/** Annotation: dot on a 3D point, elbow leader line, typed monospace label. */
const Label: React.FC<{ anchor: V3; cam: Cam; dx: number; dy: number; text: string; at: number; tone?: string }> = ({ anchor, cam, dx: dx0, dy, text, at, tone = GOLD }) => {
  let dx = dx0;
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const [ax, ay] = toScreen(anchor, cam, frame);
  // flip the label to the other side when its text would leave the frame
  const width = text.length * 18 + 40;
  if (dx >= 0 && ax + dx + width > 1050) dx = -dx;
  if (dx < 0 && ax + dx - width < 30) dx = -dx;
  const lx = ax + dx, ly = ay + dy;
  const grow = interpolate(frame, [at, at + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const typed = text.slice(0, Math.max(0, Math.floor((frame - at - 4) * 1.8)));
  const ex = ax + dx * grow * 0.4, ey = ay + dy * grow;
  const right = dx >= 0;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={ax} cy={ay} r={6} fill={tone} style={{ filter: `drop-shadow(0 0 8px ${tone})` }} />
        <circle cx={ax} cy={ay} r={14 + (frame - at) * 0.6} fill="none" stroke={tone} strokeOpacity={Math.max(0, 0.6 - (frame - at) * 0.04)} />
        <polyline points={`${ax},${ay} ${ex},${ey} ${ex + (lx - ex) * grow},${ly}`} fill="none" stroke="rgba(220,232,255,0.7)" strokeWidth={1.6} />
      </svg>
      <div
        style={{
          position: "absolute",
          top: ly - 40,
          left: right ? lx + 10 : undefined,
          right: right ? undefined : 1080 - lx + 10,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: "0.14em",
          color: "#e2ebff",
          whiteSpace: "nowrap",
          textShadow: "0 0 10px rgba(120,160,255,0.6)",
        }}
      >
        <span style={{ display: "inline-block", width: 10, height: 10, background: tone, marginRight: 10, boxShadow: `0 0 8px ${tone}` }} />
        {typed}
      </div>
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ x: number; y: number; at: number; children: React.ReactNode }> = ({ x, y, at, children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 5], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, transform: `translate(-50%, ${(1 - o) * 14}px)`, opacity: o,
        display: "flex", alignItems: "center", gap: 16, padding: "14px 22px", borderRadius: 14,
        background: "rgba(9,15,32,0.78)", border: "1px solid #2b3c66", boxShadow: "0 0 30px rgba(60,90,180,0.25)",
        fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: "0.12em", color: "#dfe8ff", whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};

const Toggle: React.FC<{ on: number }> = ({ on }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
    <span style={{ position: "relative", width: 64, height: 32, borderRadius: 16, background: on > 0.5 ? "rgba(245,184,61,0.85)" : "#26324f" }}>
      <span style={{ position: "absolute", top: 4, left: 4 + on * 32, width: 24, height: 24, borderRadius: 12, background: "#fff", boxShadow: on > 0.5 ? `0 0 12px ${GOLD}` : "none" }} />
    </span>
    <span style={{ color: on > 0.5 ? GOLD : "#7d8bb0", minWidth: 44 }}>{on > 0.5 ? "ON" : "OFF"}</span>
  </span>
);

/** ECG trace drawn left to right, spikes in sync with the 3D heartbeat. */
const Ecg: React.FC<{ dur: number; y: number }> = ({ dur, y }) => {
  const frame = useCurrentFrame();
  const x0 = 150, w = 780;
  const head = interpolate(frame, [0, dur], [0, w], clamp);
  const pts: string[] = [];
  for (let x = 0; x <= head; x += 3) {
    const f = (x / w) * dur;
    const p = (f % 26) / 26;
    const v = Math.exp(-(((p - 0.05) * 60) ** 2)) - 0.35 * Math.exp(-(((p - 0.085) * 60) ** 2)) + 0.45 * Math.exp(-(((p - 0.24) * 40) ** 2));
    pts.push(`${x0 + x},${y - v * 90}`);
  }
  const last = pts[pts.length - 1]?.split(",").map(Number) ?? [x0, y];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <line x1={x0} y1={y} x2={x0 + w} y2={y} stroke="rgba(245,184,61,0.15)" strokeWidth={1} />
      <polyline points={pts.join(" ")} fill="none" stroke={GOLD} strokeWidth={3.5} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${GOLD})` }} />
      <circle cx={last[0]} cy={last[1]} r={6} fill="#fff" style={{ filter: `drop-shadow(0 0 10px ${GOLD})` }} />
    </svg>
  );
};

/** Brain-wave trace slowing from fast waves to slow delta waves. */
const Waves: React.FC<{ dur: number; y: number }> = ({ dur, y }) => {
  const frame = useCurrentFrame();
  const x0 = 140, w = 800;
  const head = interpolate(frame, [0, dur - 4], [0, w], clamp);
  let phase = 0;
  const pts: string[] = [];
  for (let x = 0; x <= head; x += 2) {
    const k = interpolate(x / w, [0.25, 0.75], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    phase += 0.16 * (1 - k) + 0.035 * k;
    pts.push(`${x0 + x},${y + Math.sin(phase) * (12 + 26 * k)}`);
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <polyline points={pts.join(" ")} fill="none" stroke={CYAN} strokeWidth={3} style={{ filter: `drop-shadow(0 0 6px ${CYAN})` }} />
      <text x={x0} y={y - 54} fill="#7f93c4" fontFamily={MONO} fontSize={18} letterSpacing="0.14em">BETA</text>
      <text x={x0 + w} y={y - 54} fill={CYAN} fontFamily={MONO} fontSize={18} letterSpacing="0.14em" textAnchor="end">DELTA</text>
    </svg>
  );
};

const Zzz: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {[0, 1, 2].map((i) => {
        const t = (frame - at - i * 6) / 24;
        if (t < 0 || t > 1) return null;
        return (
          <div key={i} style={{ position: "absolute", left: x + i * 26 + t * 30, top: y - i * 34 - t * 70, opacity: Math.sin(t * Math.PI), fontFamily: SANS, fontWeight: 600, fontSize: 34 + i * 10, color: "#e8f0ff", textShadow: "0 0 14px rgba(160,190,255,0.9)" }}>
            z
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- scenes + HUD
const S1: React.FC = () => (
  <AbsoluteFill>
    <HoloStage cam={CAMS[0]}>
      <SceneLean dur={48} />
    </HoloStage>
    <Label anchor={CONTACT} cam={CAMS[0]} dx={170} dy={-190} text="CONTACTO · PECHO" at={33} tone={CYAN} />
  </AbsoluteFill>
);

const S2: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HoloStage cam={CAMS[1]} platform={false} bloom={0.7}>
        <SceneHeart />
      </HoloStage>
      <Label anchor={[LEAN.goldX + 0.15, 2.0, 0.3]} cam={CAMS[1]} dx={-150} dy={-300} text={`LATIDO · ${60 + Math.round(beat(frame) * 4)} BPM`} at={5} />
      <Ecg dur={39} y={1560} />
    </AbsoluteFill>
  );
};

const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [CALM_AT, CALM_AT + 4], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <HoloStage cam={CAMS[2]} bloom={0.6}>
        <SceneBrain calmAt={CALM_AT} />
      </HoloStage>
      <Label anchor={[0.75, 2.55, 0.3]} cam={CAMS[2]} dx={130} dy={-230} text="ONDAS CEREBRALES" at={3} tone={CYAN} />
      <Chip x={540} y={1330} at={2}>
        MODO DESCANSO <Toggle on={on} />
      </Chip>
      <Waves dur={33} y={1560} />
    </AbsoluteFill>
  );
};

const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const [tx, ty] = toScreen(TIMER, CAMS[3], frame);
  const [zx, zy] = toScreen([-0.35, 1.35, 0.9], CAMS[3], frame);
  const o = interpolate(frame, [2, 8], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <HoloStage cam={CAMS[3]} bloom={0.7}>
        <SceneTimer dur={30} />
      </HoloStage>
      <div style={{ position: "absolute", left: tx, top: ty, transform: "translate(-50%,-50%)", textAlign: "center", opacity: o }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 78, color: GOLD, letterSpacing: "0.04em", textShadow: `0 0 24px rgba(245,184,61,0.7)` }}>05:00</div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 20, color: "#cfdbff", letterSpacing: "0.3em", marginTop: 4 }}>MIN</div>
      </div>
      <Zzz x={zx} y={zy} at={4} />
      <Chip x={540} y={1560} at={6}>
        <span style={{ color: GOLD }}>●</span> DORMIDO EN 5 MIN
      </Chip>
    </AbsoluteFill>
  );
};

/** 2-frame light flash on every cut, as in the reference. */
const Flashes: React.FC = () => {
  const frame = useCurrentFrame();
  let o = interpolate(frame, [0, 6], [1, 0], clamp) * 0.9; // fade in from black handled below
  const black = o;
  o = 0;
  for (const s of SCENES.slice(1)) {
    const d = frame - s.from;
    if (d >= 0 && d < 3) o = Math.max(o, [0.38, 0.13, 0.04][d]);
  }
  return (
    <>
      <AbsoluteFill style={{ background: "#dfe8ff", opacity: o, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
    </>
  );
};

export const HoloClip: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: NAVY }}>
    {[S1, S2, S3, S4].map((S, i) => (
      // premount so each WebGL scene (and its bloom pass) is ready on its first visible frame
      <Sequence key={i} from={SCENES[i].from} durationInFrames={SCENES[i].dur} premountFor={12}>
        <S />
      </Sequence>
    ))}
    {/* soft vignette */}
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 55%, transparent 55%, rgba(3,6,14,0.75) 100%)" }} />
    <Captions />
    <Flashes />
    <Audio src={staticFile("holo/sfx/pad.wav")} volume={() => 0.55} />
    {SCENES.slice(1).map((s) => (
      <Sequence key={s.from} from={s.from - 3} layout="none">
        <Audio src={staticFile("holo/sfx/whoosh.wav")} volume={() => 0.35} />
      </Sequence>
    ))}
    {[33, 53, 89, 126].map((f) => (
      <Sequence key={`b${f}`} from={f} layout="none">
        <Audio src={staticFile("holo/sfx/blip.wav")} volume={() => 0.25} />
      </Sequence>
    ))}
    {[49, 55, 75, 81].map((f, i) => (
      <Sequence key={`h${f}`} from={f} layout="none">
        <Audio src={staticFile("holo/sfx/thump.wav")} volume={() => (i % 2 ? 0.35 : 0.6)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

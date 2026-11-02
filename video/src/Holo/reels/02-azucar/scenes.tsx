import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Cam, V3 } from "../../stage";
import {
  Arrow3D,
  Balance,
  Balloon,
  BallKid,
  Calendar,
  CandyPile,
  Cloche,
  Confetti,
  ContactShadow,
  Cup,
  GlassesOverlay,
  GlossyStage,
  Gauge,
  LabCard,
  LineChart,
  Magnifier,
  Packet,
  Pill,
  Plate,
  QuestionMark3D,
  SpotCone,
  Stamp,
  SugarCube,
  Tag,
  ThoughtCloud,
  WrappedCandy,
} from "../../kit/glossy";
import { Phone } from "../../kit/hud";
import { beat, Scene } from "../../kit/timeline";
import { kidHop } from "./motion";

// One scene per narration segment, in the glossy 3D icon art direction:
// candy-bright objects, caramel pink (what we believe) vs mint blue (what
// really happens). Every change is keyed to the word that triggers it.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = (f: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });
const cam = (sc: Scene, from: V3, to: V3, target: V3, orbit = 0.14): Cam => ({ from, to, target, orbit, dur: sc.dur });

type P = { sc: Scene };
const PINK = "#ff4fa3";
const RED = "#ff3b5c";

// 1 — "¿Por qué los niños se vuelven locos después de comer dulces?"
export const S01: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.1, 1.7, 10.4], [0.05, 1.55, 9.2], [0.15, 1.0, -0.4], 0.12);
  const crazy = beat(sc, "locos");
  const k = kidHop(frame, crazy);
  const look: [number, number] = frame < crazy ? [0.9, -0.3] : [0, 0];
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="caramelo" glow={[0.5, 0.45]}>
        <CandyPile position={[1.0, 0, -0.9]} radius={1.45} rise={frame / 30} />
        <ContactShadow position={[k.x, 0.003, 0.4]} size={1.4 - k.y * 0.35} opacity={0.5 - k.y * 0.2} />
        <BallKid position={[k.x, k.y, 0.4]} rotation={[0, 0.3 * (frame < crazy ? 1 : 0), k.tilt]} scale={0.62} squash={k.squash} look={look} dizzy={frame >= crazy ? 1 : 0} />
      </GlossyStage>
      <Tag anchor={[k.x, k.y + 1.45, 0.4]} cam={c} at={crazy} text="HIPERACTIVO" tone={PINK} />
    </AbsoluteFill>
  );
};

// 2 — "Casi todo el mundo te dirá que es el azúcar."
// mostly vertical: a 9:16 frame is only ~1.3 units wide at this distance
const ARROWS = [50, 90, 130, 240, 300];
const CUBE: V3 = [0, 1.05, 0];

const Accused: React.FC<{ frame: number; arrowsIn: number; shrink?: number; drop?: number }> = ({ frame, arrowsIn, shrink = 0, drop = 0 }) => (
  <>
    <ContactShadow position={[0, 0.003, 0]} size={2.6 * (1 - shrink * 0.4)} opacity={0.45} />
    <SugarCube position={[CUBE[0], CUBE[1] + Math.sin(frame / 14) * 0.06 - shrink * 0.45, CUBE[2]]} rotation={[0.18, -0.6 + frame * 0.006, 0.05]} scale={0.8 * (1 - shrink * 0.42)} />
    {ARROWS.map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const t = ease(arrowsIn - i * 4, 0, 10, Easing.out(Easing.back(1.4)));
      if (t <= 0) return null;
      const dist = 0.85 + (1 - t) * 3.5 + Math.sin(frame * 0.6 + i) * 0.04;
      const fall = drop * (1.5 + i * 0.3);
      return <Arrow3D key={deg} position={[Math.cos(a) * (dist + 0.85), CUBE[1] + Math.sin(a) * (dist + 0.85) - fall, 0.3]} rotation={[0, 0, a + Math.PI + drop * (i % 2 ? 1 : -1)]} length={0.85} color={RED} />;
    })}
  </>
);

export const S02: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.1, 1.6, 9.0], [0, 1.5, 7.8], [0, 1.25, 0], 0.1);
  const sugar = beat(sc, "azúcar.");
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="caramelo" glow={[0.5, 0.5]}>
        <Accused frame={frame} arrowsIn={frame - 2} />
      </GlossyStage>
      <Tag anchor={[0, 2.0, 0]} cam={c} at={sugar} text="CULPABLE" tone={RED} swing />
    </AbsoluteFill>
  );
};

// 3 — "Pues no."
export const S03: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0, 1.5, 7.8], [0, 1.5, 7.5], [0, 1.25, 0], 0.02);
  const no = beat(sc, "no.");
  const hit = ease(frame, no, no + 8, Easing.out(Easing.cubic));
  const shake = frame >= no && frame < no + 6 ? Math.sin(frame * 3) * 10 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <GlossyStage cam={c} palette="caramelo" toPalette="menta" mixPalette={hit} glow={[0.5, 0.5]}>
        <Accused frame={frame + 40} arrowsIn={999} shrink={hit} drop={hit} />
      </GlossyStage>
      <Tag anchor={[0, 2.0 - hit * 0.5, 0]} cam={c} at={-20} text="CULPABLE" tone={RED} />
      <Stamp x={540} y={1060} at={no} text="FALSO" />
    </AbsoluteFill>
  );
};

// 4–5 — the blind diet study: three covered plates, three weeks each
const MINT = "#2fd3c0";
const DISH_X = [-0.7, 0, 0.7];

const DishContent: React.FC<{ i: number }> = ({ i }) =>
  i === 0 ? (
    <>
      {[[-0.15, 0.13, 0.05], [0.15, 0.13, -0.05], [0, 0.35, 0]].map((p, k) => (
        <SugarCube key={k} position={p as V3} rotation={[0.2, k, 0.1]} scale={0.13} tint="#ffd0e6" />
      ))}
    </>
  ) : (
    <>
      <Packet position={[-0.12, 0.25, 0]} rotation={[0, 0.3, 0.25]} scale={0.7} />
      <Packet position={[0.14, 0.22, 0.08]} rotation={[0, -0.4, -0.2]} scale={0.7} />
    </>
  );

/** Three plates; order maps slot → plate during the shuffle (pos: current x of each plate). */
const Dishes: React.FC<{ frame: number; appear: number; lift: number; calendars: number; xs?: number[]; zs?: number[] }> = ({ frame, appear, lift, calendars, xs = DISH_X, zs = [0, 0, 0] }) => (
  <>
    {DISH_X.map((_, i) => {
      const a = ease(frame - appear - i * 4, 0, 10, Easing.out(Easing.back(1.6)));
      if (a <= 0) return null;
      const x = xs[i], z = zs[i];
      const c = ease(frame - calendars - i * 4, 0, 8, Easing.out(Easing.back(2)));
      return (
        <group key={i} position={[x, 0, z]} scale={a}>
          <ContactShadow size={1.1} opacity={0.4} />
          <Plate scale={0.44} />
          <group position={[0, 0.06, 0]} scale={0.95}>
            {lift > 0.05 ? <DishContent i={i} /> : null}
          </group>
          <Cloche position={[0, 0.03, 0]} scale={0.44} lift={lift} tilt={i === 1 ? 0 : i === 0 ? 0.25 : -0.25} />
          {c > 0 ? <Calendar position={[0, 1.45 + lift * 0.3, -0.1]} scale={0.6 * c} label={String(i + 1)} tone={i === 0 ? "#ff3b8f" : "#13a59a"} /> : null}
        </group>
      );
    })}
  </>
);

export const S04: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0, 1.75, 7.0], [0, 1.65, 6.3], [0, 0.85, 0], 0.08);
  const lift = ease(frame, beat(sc, "dietas"), beat(sc, "dietas") + 10, Easing.out(Easing.back(1.4)));
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="menta" glow={[0.5, 0.48]}>
        <Dishes frame={frame} appear={0} lift={lift} calendars={beat(sc, "semanas")} />
      </GlossyStage>
    </AbsoluteFill>
  );
};

// shell game: two swaps of 11 frames each (slot positions follow arcs)
function shuffle(t: number) {
  const xs = [...DISH_X], zs = [0, 0, 0];
  const swap = (k: number, a: number, b: number) => {
    const u = ease(t - k * 11, 0, 11);
    const xa = xs[a], xb = xs[b];
    xs[a] = xa + (xb - xa) * u;
    xs[b] = xb + (xa - xb) * u;
    zs[a] += Math.sin(u * Math.PI) * 0.7;
    zs[b] -= Math.sin(u * Math.PI) * 0.7;
  };
  swap(0, 0, 2);
  swap(1, 1, 0);
  swap(2, 2, 1);
  return { xs, zs };
}

export const S05: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0, 1.65, 6.3], [0, 1.6, 6.0], [0, 0.85, 0], 0.05);
  const nadie = beat(sc, "Nadie");
  const lift = 1 - ease(frame, nadie, nadie + 8, Easing.in(Easing.quad));
  const { xs, zs } = shuffle(frame - nadie - 9);
  const q = beat(sc, "tocaba");
  const qs = ease(frame, q - 4, q + 6, Easing.out(Easing.back(2)));
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="menta" glow={[0.5, 0.48]}>
        <Dishes frame={frame + 60} appear={0} lift={lift} calendars={-99} xs={xs} zs={zs} />
        {qs > 0 ? <QuestionMark3D position={[0, 1.55 + Math.sin(frame * 0.2) * 0.05, 0.6]} rotation={[0, Math.sin(frame * 0.1) * 0.4, 0]} scale={0.55 * qs} /> : null}
      </GlossyStage>
      <Tag anchor={[DISH_X[0], 1.1, 0]} cam={c} at={beat(sc, "azúcar")} until={nadie} text="AZÚCAR" tone={PINK} size={34} />
      <Tag anchor={[DISH_X[1], 1.1, 0]} cam={c} at={beat(sc, "endulzantes")} until={nadie} text="ENDULZANTE" tone={MINT} size={30} dy={70} />
      <Tag anchor={[DISH_X[2], 1.1, 0]} cam={c} at={beat(sc, "endulzantes") + 3} until={nadie} text="ENDULZANTE" tone={MINT} size={30} />
    </AbsoluteFill>
  );
};

// 6 — "Ni los niños que, según sus papás, eran sensibles al azúcar… se portaron distinto."
const KIDS = [
  { x: -0.72, color: "#3d8bff", base: "#ff8cc6" },
  { x: 0, color: "#2fd37f", base: "#8ff0e2" },
  { x: 0.72, color: "#9b5cff", base: "#8ff0e2" },
];
export const S06: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0, 1.6, 7.1], [0, 1.55, 6.4], [0, 0.95, 0], 0.06);
  const same = beat(sc, "distinto");
  const conv = ease(frame, same - 6, same + 8);
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="menta" glow={[0.5, 0.5]}>
        {KIDS.map((k, i) => {
          const a = ease(frame - i * 4, 0, 10, Easing.out(Easing.back(1.6)));
          const hop = Math.abs(Math.sin(frame * 0.18 + i)) * 0.08 * (1 - conv);
          const v = 0.4 + 0.32 * Math.sin(frame * 0.22 + i * 2.1) * (1 - conv);
          return (
            <group key={i} position={[k.x, 0, 0]} scale={a}>
              <ContactShadow size={1.1} opacity={0.4} />
              <Plate scale={0.45} color={k.base} />
              <BallKid position={[0, 0.06 + hop, 0]} costume="plain" color={k.color} scale={0.38} />
              <Gauge position={[0, 1.45, 0]} scale={0.38} value={v} />
            </group>
          );
        })}
      </GlossyStage>
      <Pill x={540} y={1380} at={beat(sc, "sensibles")} until={same} text="SENSIBLES AL AZÚCAR" tone={PINK} size={36} />
      <Pill x={540} y={1380} at={same + 4} text="39 MEDICIONES · SIN CAMBIOS" tone={MINT} size={34} />
    </AbsoluteFill>
  );
};

// 7 — "Entonces, ¿qué está pasando?"
const MOM = { color: "#b98cff", bun: "#6a3fa0" };
export const S07: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0, 1.5, 8.2], [0, 1.45, 7.6], [0.1, 0.85, 0], 0.06);
  const t = ease(frame, 2, Math.min(sc.dur - 8, beat(sc, "pasando") + 4), Easing.inOut(Easing.cubic));
  const mx = 1.3 + (-0.42 - 1.3) * t;
  const my = 2.2 + (0.9 - 2.2) * t + Math.sin(t * Math.PI) * 0.6;
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="menta" glow={[0.45, 0.5]}>
        <ContactShadow position={[-0.42, 0.003, 0]} size={1.5} opacity={0.45} />
        <BallKid position={[-0.42, 0, 0]} costume="plain" color={MOM.color} bun={MOM.bun} glasses="clear" scale={0.62} look={[0.8, -0.2]} />
        <ContactShadow position={[0.78, 0.003, 0.2]} size={1.0} opacity={0.4} />
        <BallKid position={[0.78, Math.abs(Math.sin(frame * 0.2)) * 0.08, 0.2]} scale={0.4} rotation={[0, -0.3, 0]} />
        <Magnifier position={[mx, my, 1.1]} rotation={[0, 0, -0.1]} scale={0.75} />
      </GlossyStage>
    </AbsoluteFill>
  );
};

// 8 — "Otros científicos les dijeron a unas mamás que sus hijos habían tomado mucha azúcar."
export const S08: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0, 1.65, 8.6], [0, 1.6, 7.8], [0, 1.05, 0], 0.08);
  const cupIn = ease(frame, beat(sc, "dijeron"), beat(sc, "dijeron") + 12, Easing.out(Easing.back(1.3)));
  const cloud = ease(frame, beat(sc, "mamás"), beat(sc, "mamás") + 10, Easing.out(Easing.back(2)));
  const cubes = [beat(sc, "mucha"), beat(sc, "mucha") + 4, beat(sc, "azúcar"), beat(sc, "azúcar") + 4];
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="caramelo" glow={[0.45, 0.5]}>
        <ContactShadow position={[-0.55, 0.003, 0]} size={1.5} opacity={0.45} />
        <BallKid position={[-0.55, 0, 0]} costume="plain" color={MOM.color} bun={MOM.bun} glasses="clear" scale={0.6} look={[0.9, -0.3]} />
        <ContactShadow position={[0.85, 0.003, 0.1]} size={1.0} opacity={0.4} />
        <BallKid position={[0.85, 0, 0.1]} scale={0.4} rotation={[0, -0.35, 0]} />
        <group position={[0.2 + (1 - cupIn) * 2.2, 0, 0.55]}>
          <ContactShadow size={0.8} opacity={0.4} />
          <Cup scale={0.48} frontText="AZÚCAR" frontColor="#ff3b8f" />
        </group>
        <ThoughtCloud position={[-0.15, 2.35, -0.2]} scale={0.62} grow={cloud}>
          {cubes.map((f, i) => {
            const s = ease(frame, f, f + 6, Easing.out(Easing.back(2.5)));
            return s > 0 ? <SugarCube key={i} position={[(i - 1.5) * 0.28, i % 2 ? 0.12 : -0.05, 0]} rotation={[0.3, i, 0.2]} scale={0.13 * s} tint="#ffc2e0" /> : null;
          })}
        </ThoughtCloud>
      </GlossyStage>
    </AbsoluteFill>
  );
};

// 9 — "Era mentira: todos tomaron un endulzante sin azúcar."
export const S09: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0, 1.2, 5.6], [0, 1.15, 5.0], [0, 0.75, 0], 0.12);
  const lie = beat(sc, "mentira");
  const peel = ease(frame, lie, lie + 14, Easing.inOut(Easing.cubic));
  const pk = ease(frame, beat(sc, "endulzante"), beat(sc, "endulzante") + 8, Easing.out(Easing.back(2)));
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="caramelo" toPalette="menta" mixPalette={peel} glow={[0.5, 0.52]}>
        <ContactShadow size={1.6} opacity={0.45} />
        <Cup scale={1.05} frontText="AZÚCAR" frontColor="#ff3b8f" backText="SIN AZÚCAR" backColor="#13a59a" peel={peel} />
        {pk > 0 ? <Packet position={[-0.42, 1.3 + Math.sin(frame * 0.15) * 0.05, 0.8]} rotation={[0, 0.4, 0.5]} scale={0.7 * pk} /> : null}
      </GlossyStage>
      <Tag anchor={[-0.42, 0.9, 0.8]} cam={c} at={beat(sc, "endulzante")} text="ENDULZANTE" tone={MINT} size={34} />
    </AbsoluteFill>
  );
};

// 10 — split screen: what mom expects (pink glasses) vs what happens
const HalfStage: React.FC<{ sc: Scene; top: boolean; children: React.ReactNode; palette: "caramelo" | "menta" }> = ({ sc, top, children, palette }) => {
  // top half: subjects centred at ~640 px (below the captions); bottom half: at ~1350 px
  const tgt = top ? -0.15 : 1.45;
  const c = cam(sc, [0, 1.3, 8.8], [0, 1.25, 8.4], [0, tgt, 0], 0.03);
  return (
    <AbsoluteFill style={{ clipPath: top ? "inset(0 0 50% 0)" : "inset(50% 0 0 0)" }}>
      <GlossyStage cam={c} palette={palette} glow={[0.5, top ? 0.72 : 0.28]}>
        {children}
      </GlossyStage>
    </AbsoluteFill>
  );
};

export const S10: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const restless = ease(frame, beat(sc, "inquietos"), beat(sc, "inquietos") + 12);
  const close = ease(frame, beat(sc, "vigilaban"), beat(sc, "cerca") + 4, Easing.out(Easing.cubic));
  const k = kidHop(frame + 20, 0);
  return (
    <AbsoluteFill>
      <HalfStage sc={sc} top palette="caramelo">
        <ContactShadow position={[-0.68 + k.x * 0.25, 0.003, 0]} size={1.0} opacity={0.45} />
        <BallKid position={[-0.68 + k.x * 0.25, k.y * 0.55, 0]} rotation={[0, 0, k.tilt]} scale={0.42} squash={k.squash} dizzy={1} />
        <Gauge position={[0.68, 0.6, 0]} scale={0.42} value={0.35 + restless * 0.6 + Math.sin(frame * 0.5) * 0.03 * restless} />
      </HalfStage>
      <HalfStage sc={sc} top={false} palette="menta">
        <ContactShadow position={[0.2, 0.003, 0]} size={1.0} opacity={0.45} />
        <BallKid position={[0.2, Math.abs(Math.sin(frame * 0.12)) * 0.05, 0]} scale={0.42} look={[-0.5 * close, 0]} />
        <Gauge position={[0.95, 0.75, 0]} scale={0.38} value={0.3 + Math.sin(frame * 0.1) * 0.03} />
        <ContactShadow position={[-2.4 + close * 1.75, 0.003, 0]} size={1.2} opacity={0.45 * close} />
        <BallKid position={[-2.4 + close * 1.75, 0, 0]} costume="plain" color={MOM.color} bun={MOM.bun} glasses="rosa" scale={0.5} look={[1, -0.3]} />
        {close > 0.3 ? <SpotCone position={[-0.25, 0, 0]} radius={1.1} height={3.0} opacity={0.14 * close} /> : null}
      </HalfStage>
      <GlassesOverlay drop={1} y={640} tint={0.1} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 957, height: 6, background: "rgba(255,255,255,0.85)", boxShadow: "0 0 18px rgba(255,255,255,0.6)" }} />
      <Pill x={540} y={905} at={0} text="LO QUE VE MAMÁ" tone={PINK} size={30} />
      <Pill x={540} y={1020} at={2} text="LO QUE PASA" tone={MINT} size={30} />
      <Pill x={320} y={1520} at={beat(sc, "cerca")} text="CONTROL +" tone="#ffcc1f" size={34} />
    </AbsoluteFill>
  );
};

// 11 — "Y al juntar todos los experimentos, el azúcar no cambió la conducta de los niños."
export const S11: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0, 1.7, 8.4], [0, 1.6, 7.6], [0, 1.15, 0], 0.08);
  const join = beat(sc, "juntar");
  const level = beat(sc, "cambió");
  const settle = ease(frame, join, level + 4, Easing.out(Easing.quad));
  const tilt = (frame < join ? 0.18 : 0.22 * Math.cos((frame - join) * 0.35)) * (1 - settle);
  const chart = ease(frame, level, level + 22, Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="menta" glow={[0.5, 0.45]}>
        {Array.from({ length: 9 }, (_, i) => {
          const f0 = join + i * 3;
          const d = ease(frame, f0, f0 + 9, Easing.in(Easing.quad));
          if (frame < f0) return null;
          return <LabCard key={i} position={[-0.25 + (i % 2) * 0.08, 0.05 + i * 0.035 + (1 - d) * 4, -1.2]} rotation={[-Math.PI / 2 + 0.05, 0, (i - 4) * 0.07]} scale={0.9} />;
        })}
        <ContactShadow size={1.8} opacity={0.4} />
        <Balance
          scale={0.78}
          tilt={tilt}
          left={<SugarCube position={[0, 0.13, 0]} rotation={[0.2, 0.6, 0]} scale={0.16} tint="#ffd0e6" />}
          right={<Packet position={[0, 0.05, 0]} rotation={[-Math.PI / 2 + 0.2, 0, 0.3]} scale={0.75} />}
        />
      </GlossyStage>
      <LineChart x={540} y={1300} at={level} progress={chart} title="CONDUCTA" result="SIN CAMBIOS" />
    </AbsoluteFill>
  );
};

// 12–13 — back to the opening: the party, the costumes, the other kids… and our pink glasses
const FRIENDS = [
  { x: -1.0, color: "#3d8bff", cape: "#ffcc1f", from: -2.6 },
  { x: 1.05, color: "#9b5cff", cape: "#2fd37f", from: 2.6 },
  { x: 0.55, color: "#2fd37f", cape: "#ff3b5c", from: 2.8, z: -0.9 },
];
const BALLOONS = [
  { x: -1.15, color: "#ff3b5c", d: 0 },
  { x: -0.45, color: "#ffcc1f", d: 5 },
  { x: 0.3, color: "#3d8bff", d: 2 },
  { x: 0.95, color: "#9b5cff", d: 7 },
  { x: 1.3, color: "#2fd37f", d: 4 },
];
const Party: React.FC<{ f: number; fiesta: number; disfraces: number; otros: number }> = ({ f, fiesta, disfraces, otros }) => {
  const hop = Math.abs(Math.sin(f * 0.21)) * 0.45;
  const costume = f >= disfraces;
  return (
    <>
      <CandyPile position={[0.9, 0, -1.6]} radius={1.2} rise={f / 30 + 2} />
      {BALLOONS.map((b, i) => {
        const r = ease(f, fiesta + b.d, fiesta + b.d + 30, Easing.out(Easing.cubic));
        return r > 0 ? <Balloon key={i} position={[b.x, -1.6 + r * 4.1 + Math.sin(f * 0.07 + i) * 0.06, -1.3]} color={b.color} sway={Math.sin(f * 0.06 + i) * 0.12} scale={0.95} /> : null;
      })}
      <Confetti at={fiesta} area={[1.6, 1.2]} top={4.4} />
      <ContactShadow position={[0, 0.003, 0.3]} size={1.4 - hop * 0.4} opacity={0.5} />
      <BallKid position={[0, hop, 0.3]} scale={0.6} squash={hop < 0.05 ? 0.88 : 1.05} mask={costume} cape={costume ? "#ff3b5c" : undefined} />
      {FRIENDS.map((fr, i) => {
        const t = ease(f, otros + i * 4, otros + i * 4 + 14, Easing.out(Easing.cubic));
        if (t <= 0) return null;
        const h = Math.abs(Math.sin(f * 0.23 + i * 1.3)) * 0.4;
        const x = fr.from + (fr.x - fr.from) * t;
        return (
          <group key={i}>
            <ContactShadow position={[x, 0.003, fr.z ?? 0.1]} size={1.0} opacity={0.4} />
            <BallKid position={[x, h, fr.z ?? 0.1]} costume="plain" color={fr.color} scale={0.42} mask={i !== 1} cape={fr.cape} />
          </group>
        );
      })}
    </>
  );
};

export const S12: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.1, 1.75, 10.2], [0.05, 1.6, 9.0], [0.05, 1.05, -0.4], 0.12);
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="caramelo" glow={[0.5, 0.45]}>
        <Party f={frame} fiesta={beat(sc, "fiesta")} disfraces={beat(sc, "disfraces")} otros={beat(sc, "otros")} />
      </GlossyStage>
      <Pill x={540} y={1450} at={beat(sc, "dulces")} until={beat(sc, "fiesta")} text="NO SON LOS DULCES" tone={MINT} size={34} />
    </AbsoluteFill>
  );
};

export const S13: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.05, 1.6, 9.0], [0.05, 1.55, 8.6], [0.05, 1.05, -0.4], 0.05);
  const drop = ease(frame, beat(sc, "esperamos") - 6, beat(sc, "esperamos") + 8, Easing.out(Easing.bounce));
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="caramelo" glow={[0.5, 0.45]}>
        <Party f={frame + 400} fiesta={0} disfraces={0} otros={0} />
      </GlossyStage>
      <AbsoluteFill style={{ background: "#ff4fa3", opacity: 0.22 * drop, mixBlendMode: "multiply" }} />
      <GlassesOverlay drop={drop} y={1000} tint={0.26} />
    </AbsoluteFill>
  );
};

// 14 — "Envíaselo a quien no deja que los niños coman dulces porque se ponen locos."
export const S14: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0, 1.4, 8.4], [0, 1.4, 8.0], [0, 1.2, 0], 0.08);
  const deco: [V3, string][] = [[[-1.2, 2.9, -1], "#ff3b5c"], [[1.25, 2.4, -1.2], "#ffcc1f"], [[-1.3, 0.2, -0.8], "#3d8bff"], [[1.2, -0.2, -0.6], "#9b5cff"]];
  return (
    <AbsoluteFill>
      <GlossyStage cam={c} palette="caramelo" glow={[0.5, 0.5]}>
        {deco.map(([p, col], i) => (
          <WrappedCandy key={i} position={[p[0], p[1] + Math.sin(frame * 0.08 + i) * 0.1, p[2]]} rotation={[frame * 0.02 + i, frame * 0.03, i]} color={col} scale={0.32} />
        ))}
      </GlossyStage>
      <Phone at={0} pickAt={beat(sc, "quien")} sendAt={beat(sc, "ponen")} question="¿El azúcar pone locos a los niños?" keyword="azúcar" people={[["T", "Tía"], ["M", "Mamá"], ["A", "Abuela"], ["P", "Primo"]]} pick={0} />
      <Stamp x={540} y={760} at={beat(sc, "locos")} text="FALSO" rotate={-10} />
    </AbsoluteFill>
  );
};

export const SCENE_COMPONENTS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14];

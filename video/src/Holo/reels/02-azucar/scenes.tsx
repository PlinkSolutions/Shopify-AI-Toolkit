import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Capsule, Cam, HoloStage, V3 } from "../../stage";
import { Arrow3D, BallKid, CandyPile, ContactShadow, GlossyStage, Stamp, SugarCube, Tag } from "../../kit/glossy";
import { Chip } from "../../kit/hud";
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

// Scenes 4–14: still placeholders until the voice is in.
const placeholder = (n: number, word: string): React.FC<P> => {
  const Scene: React.FC<P> = ({ sc }) => {
    const frame = useCurrentFrame();
    const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
    return (
      <AbsoluteFill>
        <HoloStage cam={c}>
          <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
        </HoloStage>
        <Chip x={540} y={1450} at={beat(sc, word)}>
          ESCENA {n}
        </Chip>
      </AbsoluteFill>
    );
  };
  return Scene;
};

export const SCENE_COMPONENTS = [
  S01,
  S02,
  S03,
  placeholder(4, "En"),
  placeholder(5, "una"),
  placeholder(6, "Ni"),
  placeholder(7, "Entonces,"),
  placeholder(8, "Otros"),
  placeholder(9, "Era"),
  placeholder(10, "Aun"),
  placeholder(11, "Y"),
  placeholder(12, "Así"),
  placeholder(13, "y"),
  placeholder(14, "Envíaselo"),
];

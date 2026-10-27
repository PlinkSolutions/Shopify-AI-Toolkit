import React, { useMemo } from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { Capsule, CYAN, GLASS, GOLD, rimMaterial, V3 } from "./stage";

// The four 3D scenes of the clip (contents only; HoloStage adds the world).

const ease = (f: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

// Shared pose: he leans in and rests his head on her upper chest.
export const LEAN = { glassX: -1.45, goldX: 0.7, goldScale: 1.2, tilt: 0.5 };
export const CONTACT: V3 = [0.08, 2.3, 0.25];

/** Expanding cyan ring at a point (facing the camera). */
const Pulse: React.FC<{ at: V3; start: number; color?: string }> = ({ at, start, color = CYAN }) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  const rings = [0, 8];
  return (
    <group position={at}>
      {rings.map((d) => {
        const t = (frame - start - d) / 20;
        if (t < 0 || t > 1) return null;
        return (
          <mesh key={d} scale={0.2 + t * 0.9}>
            <ringGeometry args={[0.38, 0.42, 64]} />
            <meshBasicMaterial color={color} transparent opacity={(1 - t) * 0.9} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
};

/** 1 — "¿Por qué basta con apoyar…": he leans in until his head rests on her chest. */
export const SceneLean: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const t = ease(frame, 2, dur * 0.72);
  return (
    <>
      <Capsule kind="gold" position={[LEAN.goldX, 0, 0]} scale={LEAN.goldScale} />
      <Capsule kind="glass" position={[LEAN.glassX, 0, 0.05]} rotation={[0, 0, -LEAN.tilt * t]} />
      <Pulse at={CONTACT} start={Math.round(dur * 0.7)} />
    </>
  );
};

function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-0.25, -0.6, -1.0, -0.2, -1.0, 0.35);
  s.bezierCurveTo(-1.0, 0.88, -0.42, 1.08, 0, 0.62);
  s.bezierCurveTo(0.42, 1.08, 1.0, 0.88, 1.0, 0.35);
  s.bezierCurveTo(1.0, -0.2, 0.25, -0.6, 0, -0.9);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.16, bevelSegments: 8, curveSegments: 32 });
  g.center();
  return g;
}

/** Lub-dub envelope for a heartbeat (period in frames). */
export const beat = (frame: number, period = 26) => {
  const p = (frame % period) / period;
  return Math.exp(-(((p - 0.05) * 14) ** 2)) + 0.6 * Math.exp(-(((p - 0.24) * 14) ** 2));
};

/** 2 — "…la cabeza en su pecho": inside her chest a gold heart beats under his head. */
export const SceneHeart: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useMemo(heartGeometry, []);
  const core = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f2a531", emissive: "#c9790f", emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.25 }), []);
  const shell = useMemo(() => rimMaterial("#ffd27a", { fill: 0.0, power: 1.6, intensity: 1.4 }), []);
  const b = beat(frame);
  const s = 0.3 * (1 + 0.14 * b);
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[1.5, 3, 3]} intensity={20} color="#fff3d6" />
      <Capsule kind="gold" position={[LEAN.goldX, 0, 0]} scale={LEAN.goldScale} opacity={0.75} />
      <Capsule kind="glass" position={[LEAN.glassX, 0, 0.05]} rotation={[0, 0, -LEAN.tilt]} />
      <group position={[LEAN.goldX, 1.92, 0.12]} rotation={[0.1, -0.25 + Math.sin(frame / 30) * 0.08, 0]} scale={s}>
        <mesh geometry={geo} material={core} />
        <mesh geometry={geo} material={shell} scale={1.08} />
      </group>
      {/* warm glow pulsing with the beat */}
      <mesh position={[LEAN.goldX, 1.92, 0.3]}>
        <sphereGeometry args={[0.55 + b * 0.08, 32, 32]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.03 + b * 0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
};

/** Point-cloud brain: two hemispheres with folds, plus a sparse neural mesh. */
function brainGeometry() {
  const pts: number[] = [];
  const n = 5600;
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const u = random(`bu${i}`) * 2 - 1;
    const th = random(`bt${i}`) * Math.PI * 2;
    const r0 = Math.sqrt(1 - u * u);
    let x = r0 * Math.cos(th), y = u, z = r0 * Math.sin(th);
    const fold = 1 + 0.06 * Math.sin(x * 11 + z * 7) * Math.sin(y * 10 + z * 3);
    const shell = (1 - 0.08 * random(`br${i}`) ** 3) * fold;
    x = side * 0.48 + x * 0.6 * shell;
    y = y * 0.8 * shell;
    z = z * 1.12 * shell;
    if (y < -0.45 && Math.abs(x) < 0.25) continue; // gap between hemispheres underneath
    pts.push(x, Math.max(y, -0.62 + 0.1 * Math.abs(z)), z);
  }
  // cerebellum
  for (let i = 0; i < 500; i++) {
    const u = random(`cu${i}`) * 2 - 1, th = random(`ct${i}`) * Math.PI * 2, r0 = Math.sqrt(1 - u * u);
    pts.push(r0 * Math.cos(th) * 0.55, -0.55 + u * 0.22, -0.75 + r0 * Math.sin(th) * 0.3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  // sparse links between nearby points
  const idx: number[] = [];
  const m = 700;
  for (let a = 0; a < m; a++) {
    const ia = Math.floor(random(`la${a}`) * (pts.length / 3));
    let best = -1, bestD = 0.09, second = -1;
    for (let k = 0; k < 160; k++) {
      const ib = Math.floor(random(`lb${a}-${k}`) * (pts.length / 3));
      const d = (pts[ia * 3] - pts[ib * 3]) ** 2 + (pts[ia * 3 + 1] - pts[ib * 3 + 1]) ** 2 + (pts[ia * 3 + 2] - pts[ib * 3 + 2]) ** 2;
      if (d > 0.0004 && d < bestD) { second = best; bestD = d; best = ib; }
    }
    if (best >= 0) idx.push(ia, best);
    if (second >= 0) idx.push(ia, second);
  }
  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", g.getAttribute("position"));
  lines.setIndex(idx);
  return { points: g, lines };
}

/** 3 — "para quedarte dormido": the brain calms, its colour cools to warm gold. */
export const SceneBrain: React.FC<{ dur: number; calmAt: number }> = ({ dur, calmAt }) => {
  const frame = useCurrentFrame();
  const { points, lines } = useMemo(brainGeometry, []);
  const calm = ease(frame, calmAt, calmAt + 14);
  const color = new THREE.Color("#bfe6ff").lerp(new THREE.Color("#ffd68a"), calm);
  const jitter = (1 - calm) * Math.sin(frame * 1.7) * 0.01;
  return (
    <group position={[0, 2.0 + jitter, 0]} rotation={[0.42, 0.3 + frame * 0.01, 0]} scale={1.05}>
      <points geometry={points}>
        <pointsMaterial size={0.019} color={color} transparent opacity={0.72} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
};

export const TIMER: V3 = [0.4, 2.75, 0.2];

/** 4 — "en minutos?": a holographic timer fills above the couple asleep. */
export const SceneTimer: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const t = ease(frame, 2, dur - 4, Easing.out(Easing.cubic));
  const arc = useMemo(() => new THREE.TorusGeometry(1.0, 0.035, 12, 200, Math.max(0.001, t * Math.PI * 2)), [t]);
  const ticks = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  return (
    <>
      {/* couple asleep on a glass bed */}
      <mesh position={[0.6, 0.12, 0.45]}>
        <boxGeometry args={[4.4, 0.06, 2.3]} />
        <meshBasicMaterial color="#9fb4ff" transparent opacity={0.035} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <group position={[-0.45, 0, 0]} rotation={[0, 0.3, 0]}>
        <Capsule kind="gold" position={[-1.2, 0.77, 0]} rotation={[0, 0, -Math.PI / 2]} scale={0.9} />
        <Capsule kind="glass" position={[2.45, 0.77, 0.85]} rotation={[0, 0, Math.PI / 2]} scale={0.9} />
      </group>
      {/* timer ring */}
      <group position={[TIMER[0], TIMER[1], TIMER[2]]}>
        <mesh>
          <torusGeometry args={[1.0, 0.01, 8, 200]} />
          <meshBasicMaterial color={GLASS} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh geometry={arc} rotation={[0, Math.PI, Math.PI / 2]}>
          <meshBasicMaterial color={GOLD} transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {ticks.map((i) => {
          const a = (i / 60) * Math.PI * 2;
          const long = i % 5 === 0;
          return (
            <mesh key={i} position={[Math.sin(a) * 1.15, Math.cos(a) * 1.15, 0]} rotation={[0, 0, -a]}>
              <planeGeometry args={[0.012, long ? 0.12 : 0.05]} />
              <meshBasicMaterial color={i / 60 <= t ? GOLD : GLASS} transparent opacity={long ? 0.8 : 0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
          );
        })}
      </group>
    </>
  );
};

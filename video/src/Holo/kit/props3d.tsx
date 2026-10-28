import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { Capsule, CYAN, GLASS, GOLD, rimMaterial, V3 } from "../stage";

// Library of 3D props in the holographic look (first built for the tickle
// reel): emissive edges, additive glow, no faces, no hands. Sizes are in scene
// units (capsule = 2 tall). Add new props here when a story needs them.

const additive = (color: string, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });

// ---------------------------------------------------------------- feather
function featherParts() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.34, 0.28, 0.34, 1.05, 0.02, 1.62);
  s.bezierCurveTo(-0.28, 1.1, -0.36, 0.32, 0, 0);
  const vane = new THREE.ShapeGeometry(s, 32);
  const outline = new THREE.BufferGeometry().setFromPoints(s.getPoints(64).map((p) => new THREE.Vector3(p.x, p.y, 0)));
  const barbs: number[] = [];
  for (let i = 1; i < 16; i++) {
    const y = 0.1 + i * 0.095;
    const w = Math.sin((y / 1.62) * Math.PI) * 0.3;
    barbs.push(0, y, 0, w, y + 0.12, 0, 0, y, 0, -w, y + 0.12, 0);
  }
  const barbGeo = new THREE.BufferGeometry();
  barbGeo.setAttribute("position", new THREE.Float32BufferAttribute(barbs, 3));
  const shaft = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.35, 0), new THREE.Vector3(0.02, 0.6, 0), new THREE.Vector3(0.01, 1.6, 0)]), 32, 0.018, 6);
  return { vane, outline, barbGeo, shaft };
}

/** Glowing feather (vane, barbs, shaft). Base at the origin, tip up. */
export const Feather: React.FC<{ position?: V3; rotation?: V3; scale?: number; color?: string; opacity?: number }> = ({ position, rotation, scale = 0.6, color = GLASS, opacity = 1 }) => {
  const p = useMemo(featherParts, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={p.vane} material={additive(color, 0.16 * opacity)} />
      <lineLoop geometry={p.outline}>
        <lineBasicMaterial color={color} transparent opacity={0.95 * opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineLoop>
      <lineSegments geometry={p.barbGeo}>
        <lineBasicMaterial color={color} transparent opacity={0.45 * opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <mesh geometry={p.shaft} material={additive(color, 0.9 * opacity)} />
    </group>
  );
};

// ---------------------------------------------------------------- hex shield
/** Curved hexagon force field around a capsule; `impact` 0..1 drives a ripple from `hitY`. */
export const HexShield: React.FC<{ position?: V3; radius?: number; impact: number; hitX?: number; hitY?: number; opacity?: number }> = ({ position, radius = 0.95, impact, hitX = 0.88, hitY = 0.55, opacity = 1 }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uImpact: { value: 0 }, uHit: { value: new THREE.Vector2(0.5, 0.55) }, uOpacity: { value: 1 }, uColor: { value: new THREE.Color(CYAN) } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform float uImpact; uniform vec2 uHit; uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv;
          float hexDist(vec2 p){ p = abs(p); return max(dot(p, normalize(vec2(1.0,1.73))), p.x); }
          void main(){
            vec2 uv = vUv * vec2(9.0, 7.0);
            vec2 r = vec2(1.0, 1.73); vec2 h = r * 0.5;
            vec2 a = mod(uv, r) - h; vec2 b = mod(uv - h, r) - h;
            vec2 g = dot(a,a) < dot(b,b) ? a : b;
            float edge = 1.0 - smoothstep(0.0, 0.05, 0.5 - hexDist(g));
            float fade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y) * smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
            float d = distance(vUv * vec2(1.6, 1.0), uHit * vec2(1.6, 1.0));
            float ring = exp(-pow((d - uImpact * 0.9) * 9.0, 2.0)) * (1.0 - uImpact);
            float glow = exp(-d * 6.0) * (1.0 - uImpact) * step(0.001, uImpact);
            float a2 = (edge * (0.16 + ring * 1.6 + glow) + ring * 0.25) * fade * uOpacity;
            gl_FragColor = vec4(uColor * (1.0 + ring * 2.0), a2);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );
  mat.uniforms.uImpact.value = impact;
  mat.uniforms.uHit.value.set(hitX, hitY);
  mat.uniforms.uOpacity.value = opacity;
  return (
    <mesh position={position} material={mat}>
      <cylinderGeometry args={[radius, radius, 2.6, 48, 1, true, -Math.PI * 0.55, Math.PI * 1.1]} />
    </mesh>
  );
};

// ---------------------------------------------------------------- brain
/** Point-cloud brain parts in local units (~2.2 long), with node anchors. */
export const BRAIN = { hypothalamus: [0, -0.22, 0.18] as V3, cerebellum: [0, -0.5, -0.78] as V3 };

function brainParts() {
  const hemi: number[] = [];
  for (let i = 0; i < 6000; i++) {
    const side = i % 2 ? 1 : -1;
    const u = random(`hu${i}`) * 2 - 1, th = random(`ht${i}`) * Math.PI * 2, r0 = Math.sqrt(1 - u * u);
    let x = r0 * Math.cos(th), y = u, z = r0 * Math.sin(th);
    const fold = 1 + 0.06 * Math.sin(x * 11 + z * 7) * Math.sin(y * 10 + z * 3);
    const shell = (1 - 0.08 * random(`hr${i}`) ** 3) * fold;
    x = side * 0.48 + x * 0.6 * shell;
    y = y * 0.8 * shell;
    z = z * 1.12 * shell;
    if (y < -0.45 && Math.abs(x) < 0.25) continue;
    hemi.push(x, Math.max(y, -0.62 + 0.1 * Math.abs(z)), z);
  }
  const cereb: number[] = [];
  for (let i = 0; i < 900; i++) {
    const u = random(`cu${i}`) * 2 - 1, th = random(`ct${i}`) * Math.PI * 2, r0 = Math.sqrt(1 - u * u);
    const fold = 1 + 0.08 * Math.sin(u * 22);
    cereb.push(r0 * Math.cos(th) * 0.58 * fold, -0.5 + u * 0.24, -0.78 + r0 * Math.sin(th) * 0.32 * fold);
  }
  const mk = (arr: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    return g;
  };
  const hemiGeo = mk(hemi);
  const idx: number[] = [];
  const n = hemi.length / 3;
  for (let a = 0; a < 900; a++) {
    const ia = Math.floor(random(`la${a}`) * n);
    let best = -1, bestD = 0.08;
    for (let k = 0; k < 140; k++) {
      const ib = Math.floor(random(`lb${a}-${k}`) * n);
      const d = (hemi[ia * 3] - hemi[ib * 3]) ** 2 + (hemi[ia * 3 + 1] - hemi[ib * 3 + 1]) ** 2 + (hemi[ia * 3 + 2] - hemi[ib * 3 + 2]) ** 2;
      if (d > 0.0004 && d < bestD) { bestD = d; best = ib; }
    }
    if (best >= 0) idx.push(ia, best);
  }
  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", hemiGeo.getAttribute("position"));
  lines.setIndex(idx);
  return { hemi: hemiGeo, cereb: mk(cereb), lines };
}

/** Glowing node (e.g. hypothalamus) with halo. */
export const Node: React.FC<{ position: V3; glow: number; color?: string; size?: number }> = ({ position, glow, color = GOLD, size = 0.09 }) => (
  <group position={position}>
    <mesh scale={size * (0.6 + glow * 0.6)}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.35 + glow * 0.65} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
    <mesh scale={size * (1.5 + glow * 2.8)}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshBasicMaterial color={color} transparent opacity={glow * 0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  </group>
);

export const Brain: React.FC<{ position?: V3; rotation?: V3; scale?: number; tint?: string; cerebGlow?: number; hypoGlow?: number; dim?: number }> = ({
  position, rotation, scale = 1, tint = "#cdd8ff", cerebGlow = 0, hypoGlow = 0, dim = 1,
}) => {
  const p = useMemo(brainParts, []);
  const cerebColor = new THREE.Color(tint).lerp(new THREE.Color(GOLD), Math.min(1, cerebGlow));
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <points geometry={p.hemi}>
        <pointsMaterial size={0.018} color={tint} transparent opacity={0.7 * dim} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <lineSegments geometry={p.lines}>
        <lineBasicMaterial color={tint} transparent opacity={0.1 * dim} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <points geometry={p.cereb}>
        <pointsMaterial size={0.02 + cerebGlow * 0.008} color={cerebColor} transparent opacity={(0.7 + cerebGlow * 0.3) * dim} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {hypoGlow > 0 ? <Node position={BRAIN.hypothalamus} glow={hypoGlow} /> : null}
    </group>
  );
};

// ---------------------------------------------------------------- glass bust
export const BUST = { headY: 3.32, headR: 1.12, brainScale: 0.68 };

/** Capsule body with an oversized glass head showing the brain inside (side cutaway look). */
export const GlassBust: React.FC<{ position?: V3; rotation?: V3; cerebGlow?: number; hypoGlow?: number; shake?: number; brainYaw?: number }> = ({
  position, rotation, cerebGlow = 0, hypoGlow = 0, shake = 0, brainYaw = Math.PI / 2,
}) => {
  const frame = useCurrentFrame();
  const [front, back] = useMemo(() => [rimMaterial(GLASS, { fill: 0.012, power: 3.2, intensity: 1.15 }), rimMaterial(GLASS, { fill: 0.0, power: 3.2, intensity: 0.35, side: THREE.BackSide })], []);
  const sx = Math.sin(frame * 1.9) * shake * 0.06;
  return (
    <group position={position} rotation={rotation}>
      <Capsule kind="glass" head={null} />
      <group position={[sx, BUST.headY, 0]}>
        <mesh material={back}>
          <sphereGeometry args={[BUST.headR, 64, 48]} />
        </mesh>
        <mesh material={front}>
          <sphereGeometry args={[BUST.headR, 64, 48]} />
        </mesh>
        <Brain rotation={[0.1, brainYaw, 0]} scale={BUST.brainScale} cerebGlow={cerebGlow} hypoGlow={hypoGlow} />
      </group>
    </group>
  );
};

/** World position of a brain-local point inside a GlassBust at `bustPos` (brain yawed by brainYaw). */
export function bustPoint(local: V3, bustPos: V3 = [0, 0, 0], brainYaw = Math.PI / 2): V3 {
  const v = new THREE.Vector3(...local).multiplyScalar(BUST.brainScale).applyEuler(new THREE.Euler(0.1, brainYaw, 0));
  return [bustPos[0] + v.x, bustPos[1] + BUST.headY + v.y, bustPos[2] + v.z];
}

// ---------------------------------------------------------------- signal
/** Cyan nerve signal drawn along a curve; `progress` 0..1. */
export const Signal: React.FC<{ points: V3[]; progress: number; color?: string }> = ({ points, progress, color = CYAN }) => {
  const { geo, curve } = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return { geo: new THREE.TubeGeometry(c, 120, 0.028, 8), curve: c };
  }, [points]);
  const count = geo.index ? geo.index.count : 0;
  geo.setDrawRange(0, Math.floor((count * Math.min(1, progress)) / 6) * 6);
  const head = curve.getPoint(Math.min(1, Math.max(0, progress)));
  return (
    <group>
      <mesh geometry={geo} material={additive(color, 0.95)} />
      {progress > 0 && progress < 1 ? (
        <mesh position={head} scale={0.09}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- laughter rings
/** Rings expanding from a point, facing the camera (laughter / sound). */
export const Rings: React.FC<{ position: V3; start: number; every?: number; count?: number; color?: string; size?: number; life?: number }> = ({
  position, start, every = 9, count = 6, color = GOLD, size = 1, life = 26,
}) => {
  const frame = useCurrentFrame();
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => {
        const t = (frame - start - i * every) / life;
        if (t < 0 || t > 1) return null;
        return (
          <mesh key={i} scale={size * (0.35 + t * 1.3)}>
            <ringGeometry args={[0.92, 1.0, 72]} />
            <meshBasicMaterial color={color} transparent opacity={(1 - t) * 0.8} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- MRI scanner
export const Mri: React.FC<{ slide: number; position?: V3; rotation?: V3 }> = ({ slide, position, rotation }) => {
  const frame = useCurrentFrame();
  const ring = useMemo(() => rimMaterial(GLASS, { fill: 0.02, power: 2.4, intensity: 1.2 }), []);
  return (
    <group position={position} rotation={rotation}>
      <group position={[0, 1.7, 0]}>
        <mesh material={ring}>
          <torusGeometry args={[1.45, 0.42, 32, 96]} />
        </mesh>
        <mesh rotation={[0, 0, frame * 0.01]}>
          <torusGeometry args={[1.45, 0.43, 12, 48]} />
          <meshBasicMaterial color="#9fb4ff" wireframe transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.02, 0.012, 8, 120]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.6 + 0.4 * Math.sin(frame / 6)} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      {/* bed */}
      <mesh position={[0, 0.95, 1.7]} material={additive("#9fb4ff", 0.08)}>
        <boxGeometry args={[0.9, 0.08, 4.2]} />
      </mesh>
      <group position={[0, 1.36, 2.9 - slide * 2.6]} rotation={[Math.PI / 2, 0, 0]} scale={0.7}>
        <Capsule kind="glass" position={[0, -1.3, 0]} />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- question mark
export const QuestionMark: React.FC<{ position?: V3; rotation?: V3; scale?: number }> = ({ position, rotation, scale = 1 }) => {
  const { tube, dot, shell } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = Math.PI * 1.05 - (i / 40) * Math.PI * 1.55; // hook arc
      pts.push(new THREE.Vector3(Math.cos(a) * 0.62, 2.55 + Math.sin(a) * 0.62, 0));
    }
    const last = pts[pts.length - 1];
    pts.push(new THREE.Vector3(last.x * 0.3, 1.72, 0), new THREE.Vector3(0, 1.45, 0), new THREE.Vector3(0, 1.22, 0));
    const curve = new THREE.CatmullRomCurve3(pts);
    return {
      tube: new THREE.TubeGeometry(curve, 160, 0.17, 24),
      dot: new THREE.SphereGeometry(0.2, 32, 32),
      shell: rimMaterial("#ffd27a", { fill: 0.0, power: 1.8, intensity: 1.2 }),
    };
  }, []);
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f2a531", emissive: "#d48a14", emissiveIntensity: 0.65, roughness: 0.25, metalness: 0.6 }), []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={tube} material={gold} />
      <mesh geometry={tube} material={shell} scale={1.0} />
      <mesh geometry={dot} material={gold} position={[0, 0.78, 0]} />
    </group>
  );
};

// ---------------------------------------------------------------- robot arm
const L1 = 1.35, L2 = 1.15;
function ik(base: THREE.Vector2, target: THREE.Vector2) {
  const d = Math.min(L1 + L2 - 0.001, base.distanceTo(target));
  const ang = Math.atan2(target.y - base.y, target.x - base.x);
  const a = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const shoulder = ang + a; // elbow up
  const elbow = new THREE.Vector2(base.x + Math.cos(shoulder) * L1, base.y + Math.sin(shoulder) * L1);
  const fore = Math.atan2(target.y - elbow.y, target.x - elbow.x);
  return { shoulder, elbow, fore };
}

/** Minimal two-link robot arm with a foam pad, reaching `target` (x,y in the arm's plane). */
export const RobotArm: React.FC<{ base: V3; target: [number, number]; buzz?: number }> = ({ base, target, buzz = 0 }) => {
  const frame = useCurrentFrame();
  const shell = useMemo(() => rimMaterial(GLASS, { fill: 0.03, power: 2.2, intensity: 1.3 }), []);
  const jitter = buzz ? Math.sin(frame * 2.3) * 0.02 * buzz : 0;
  const b = new THREE.Vector2(base[0], base[1] + 0.35);
  const { shoulder, elbow, fore } = ik(b, new THREE.Vector2(target[0], target[1] + jitter));
  const seg = (from: THREE.Vector2, angle: number, len: number, w: number, key: string) => (
    <group key={key} position={[from.x, from.y, base[2]]} rotation={[0, 0, angle - Math.PI / 2]}>
      <mesh position={[0, len / 2, 0]} material={shell}>
        <capsuleGeometry args={[w, len - w * 2, 8, 24]} />
      </mesh>
    </group>
  );
  return (
    <group>
      <mesh position={[base[0], base[1] + 0.12, base[2]]} material={shell}>
        <cylinderGeometry args={[0.42, 0.5, 0.24, 48]} />
      </mesh>
      {seg(b, shoulder, L1, 0.12, "upper")}
      {seg(elbow, fore, L2, 0.1, "fore")}
      <Node position={[b.x, b.y, base[2]]} glow={0.6} size={0.1} />
      <Node position={[elbow.x, elbow.y, base[2]]} glow={0.6} size={0.09} />
      {/* foam pad at the tip */}
      <group position={[target[0], target[1] + jitter, base[2]]} rotation={[0, 0, fore]}>
        <mesh>
          <boxGeometry args={[0.18, 0.42, 0.42]} />
          <meshStandardMaterial color="#ffd9e8" emissive="#ff9fc4" emissiveIntensity={0.35} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- rat
/** Capsule-style rat: pill body, round head with ears, curled tail. No face. */
export const Rat: React.FC<{ position?: V3; rotation?: V3; scale?: number; jump?: number; dim?: number }> = ({ position, rotation, scale = 1, jump = 0, dim = 1 }) => {
  const frame = useCurrentFrame();
  const [front, back] = useMemo(() => [rimMaterial(GOLD, { fill: 0.08, power: 2.0, intensity: 1.7 }), rimMaterial(GOLD, { fill: 0.0, power: 2.0, intensity: 0.5, side: THREE.BackSide })], []);
  const tail = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.85, 0.35, 0), new THREE.Vector3(-1.35, 0.25, 0.1), new THREE.Vector3(-1.7, 0.55, 0.05), new THREE.Vector3(-1.85, 0.9, 0)]), 48, 0.03, 8), []);
  const y = jump * Math.abs(Math.sin(frame / 5)) * 0.45;
  const squash = 1 - jump * 0.08 * Math.cos(frame / 2.5);
  front.uniforms.uOpacity.value = dim;
  back.uniforms.uOpacity.value = dim;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, y, 0]} scale={[1, squash, 1]}>
        <group position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={back}><capsuleGeometry args={[0.38, 0.9, 12, 32]} /></mesh>
          <mesh material={front}><capsuleGeometry args={[0.38, 0.9, 12, 32]} /></mesh>
        </group>
        <group position={[0.92, 0.62, 0]}>
          <mesh material={back}><sphereGeometry args={[0.3, 32, 24]} /></mesh>
          <mesh material={front}><sphereGeometry args={[0.3, 32, 24]} /></mesh>
          {[-1, 1].map((k) => (
            <group key={k} position={[-0.05, 0.27, k * 0.17]} rotation={[k * 0.3, 0, 0]}>
              <mesh material={front} scale={[0.14, 0.14, 0.05]}><sphereGeometry args={[1, 24, 16]} /></mesh>
            </group>
          ))}
          <mesh position={[0.3, -0.04, 0]} scale={0.06}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color="#ff9fc4" transparent opacity={0.8 * dim} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
        <mesh geometry={tail} material={front} />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- dome
/** Golden safety dome rising around the subjects (`rise` 0..1). */
export const Dome: React.FC<{ rise: number; radius?: number }> = ({ rise, radius = 2.5 }) => {
  const shell = useMemo(() => rimMaterial(GOLD, { fill: 0.025, power: 2.6, intensity: 1.1 }), []);
  if (rise <= 0) return null;
  return (
    <group scale={[1, Math.max(0.001, rise), 1]}>
      <mesh material={shell}>
        <sphereGeometry args={[radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.002, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color={GOLD} wireframe transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { Extruded, Glyph, Mat } from "./studio";

// Original 3D icon models built from primitives. Each fits roughly in a
// 2.8-unit box centred on the origin, facing +z (the camera).

export const LIME = "#c8ec34";
export const PURPLE = "#8b6cf0";
export const LILAC = "#cdbcff";
export const PINK = "#ff7fb6";
export const GOLD = "#ffbf2e";
export const INK = "#22222a";
export const RED = "#ff3b4f";

const R = Math.PI;

const Eyes: React.FC<{ y: number; dx: number; z: number; s?: number }> = ({ y, dx, z, s = 1 }) => (
  <>
    {[-1, 1].map((k) => (
      <group key={k} position={[k * dx, y, z]}>
        <mesh scale={[0.11 * s, 0.17 * s, 0.07 * s]}>
          <sphereGeometry args={[1, 24, 24]} />
          <Mat color="#16161c" rough={0.2} />
        </mesh>
        <mesh position={[0.035 * s, 0.06 * s, 0.06 * s]} scale={0.035 * s}>
          <sphereGeometry args={[1, 12, 12]} />
          <Mat color="#ffffff" glow={1} emissive="#ffffff" />
        </mesh>
      </group>
    ))}
  </>
);

export const Ghost: React.FC = () => {
  const profile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * (R / 2);
      pts.push(new THREE.Vector2(Math.sin(a) * 1.0, 0.25 + Math.cos(a) * 1.0));
    }
    pts.push(new THREE.Vector2(1.0, -0.85));
    return pts.reverse();
  }, []);
  return (
    <group position={[0, 0.1, 0]}>
      <mesh>
        <latheGeometry args={[profile, 64]} />
        <Mat color="#f6f3ff" rough={0.25} />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh key={i} position={[Math.cos((i / 8) * 2 * R) * 0.78, -0.88, Math.sin((i / 8) * 2 * R) * 0.78]} scale={[0.34, 0.3, 0.34]}>
          <sphereGeometry args={[1, 24, 24]} />
          <Mat color="#f6f3ff" rough={0.25} />
        </mesh>
      ))}
      <Eyes y={0.45} dx={0.33} z={0.93} s={1.3} />
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 0.58, 0.12, 0.8]} scale={[0.16, 0.09, 0.05]}>
          <sphereGeometry args={[1, 16, 16]} />
          <Mat color={PINK} />
        </mesh>
      ))}
      <mesh position={[0, 0.08, 0.98]} scale={[0.1, 0.13, 0.05]}>
        <sphereGeometry args={[1, 16, 16]} />
        <Mat color="#2a1a2a" />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 1.05, -0.1, 0.1]} rotation={[0, 0, k * -0.7]} scale={[0.2, 0.42, 0.2]}>
          <sphereGeometry args={[1, 20, 20]} />
          <Mat color="#f6f3ff" rough={0.25} />
        </mesh>
      ))}
    </group>
  );
};

export const Coin: React.FC<{ ch?: string; r?: number }> = ({ ch = "$", r = 1.15 }) => (
  <group>
    <mesh rotation={[R / 2, 0, 0]}>
      <cylinderGeometry args={[r, r, 0.26, 64]} />
      <Mat color={GOLD} metal />
    </mesh>
    <mesh>
      <torusGeometry args={[r, 0.08, 16, 64]} />
      <Mat color="#d99a1e" metal />
    </mesh>
    <Glyph ch={ch} size={r * 1.05} depth={0.12} position={[0, 0, 0.17]} color="#ffd970" metal rough={0.18} />
    <Glyph ch={ch} size={r * 1.05} depth={0.12} position={[0, 0, -0.17]} rotation={[0, R, 0]} color="#ffd970" metal rough={0.18} />
  </group>
);

export const Camera: React.FC = () => (
  <group>
    <RoundedBox args={[2.3, 1.5, 0.95]} radius={0.22} smoothness={6}>
      <Mat color="#2d2d36" />
    </RoundedBox>
    <RoundedBox args={[0.8, 0.4, 0.7]} radius={0.12} position={[-0.5, 0.85, 0]}>
      <Mat color="#2d2d36" />
    </RoundedBox>
    <mesh position={[0.15, -0.05, 0.62]} rotation={[R / 2, 0, 0]}>
      <cylinderGeometry args={[0.6, 0.66, 0.42, 48]} />
      <Mat color="#18181d" />
    </mesh>
    <mesh position={[0.15, -0.05, 0.84]}>
      <torusGeometry args={[0.58, 0.06, 16, 48]} />
      <Mat color={LIME} />
    </mesh>
    <mesh position={[0.15, -0.05, 0.82]} scale={[0.47, 0.47, 0.16]}>
      <sphereGeometry args={[1, 32, 32]} />
      <Mat color="#2b4fb8" rough={0.05} emissive="#203a8a" glow={0.4} />
    </mesh>
    <mesh position={[0.32, 0.12, 0.93]} scale={0.1}>
      <sphereGeometry args={[1, 12, 12]} />
      <Mat color="#ffffff" emissive="#ffffff" glow={1.5} />
    </mesh>
    <mesh position={[0.72, 0.82, 0]}>
      <cylinderGeometry args={[0.15, 0.15, 0.16, 24]} />
      <Mat color={RED} />
    </mesh>
    <RoundedBox args={[0.42, 0.24, 0.06]} radius={0.04} position={[-0.75, 0.45, 0.49]}>
      <Mat color="#ffffff" emissive="#fff4d6" glow={0.8} />
    </RoundedBox>
  </group>
);

export const Clapper: React.FC = () => {
  const stripes = (y: number, rot: number, open: number) => (
    <group position={[-1.1, y, 0]} rotation={[0, 0, rot + open]}>
      <RoundedBox args={[2.25, 0.38, 0.22]} radius={0.05} position={[1.12, 0, 0]}>
        <Mat color="#1c1c22" />
      </RoundedBox>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0.28 + i * 0.44, 0, 0.115]} rotation={[0, 0, 0.6]}>
          <boxGeometry args={[0.16, 0.5, 0.02]} />
          <Mat color={i % 2 === 0 ? "#ffffff" : LIME} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group position={[0.05, -0.15, 0]} rotation={[0, -0.35, 0]}>
      <RoundedBox args={[2.3, 1.55, 0.24]} radius={0.08} position={[0, -0.35, 0]}>
        <Mat color="#26262e" />
      </RoundedBox>
      {[0.05, -0.35, -0.75].map((y, i) => (
        <RoundedBox key={i} args={[1.9, 0.05, 0.03]} radius={0.01} position={[0, y, 0.13]}>
          <Mat color="#f1eff7" />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.6, 0.22, 0.03]} radius={0.04} position={[-0.55, -0.55, 0.13]}>
        <Mat color={PINK} />
      </RoundedBox>
      {stripes(0.62, 0, 0)}
      {stripes(1.02, 0, 0.32)}
      <mesh position={[-1.1, 0.8, 0.12]} rotation={[R / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
        <Mat color="#c9ccd6" metal />
      </mesh>
    </group>
  );
};

const star = (outer: number, inner: number, n = 5): [number, number][] =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = R / 2 + (i * R) / n;
    const r = i % 2 === 0 ? outer : inner;
    return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
  });

export const Star: React.FC = () => (
  <group>
    <Extruded points={star(1.2, 0.52)} depth={0.32} bevel={0.1} color={GOLD} metal />
    <Eyes y={0.12} dx={0.22} z={0.32} s={0.9} />
    <mesh position={[0, -0.12, 0.33]} rotation={[0, 0, R]} scale={[1, 1, 0.5]}>
      <torusGeometry args={[0.13, 0.035, 10, 24, R]} />
      <Mat color="#3a2410" />
    </mesh>
    {[
      [1.15, 0.95, 0.22],
      [-1.2, 0.7, 0.16],
      [0.95, -1.0, 0.13],
    ].map(([x, y, s], i) => (
      <Extruded key={i} points={star(s, s * 0.32, 4)} depth={0.05} bevel={0.02} position={[x, y, 0.2]} color="#ffffff" emissive="#ffffff" glow={1.2} />
    ))}
  </group>
);

export const Stairs: React.FC<{ stepAt?: number[] }> = ({ stepAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = [PURPLE, "#9d7df3", "#b48df2", "#bfd84a", LIME];
  return (
    <group position={[0.1, -0.1, 0]} rotation={[0, -0.35, 0]}>
      {colors.map((c, i) => {
        const at = stepAt?.[i] ?? 0;
        const s = stepAt ? spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 200 } }) : 1;
        const h = 0.38 * (i + 1);
        return (
          <group key={i} position={[-1.05 + i * 0.52, -1.1 + h / 2, 0]} scale={[1, Math.max(0.001, s), 1]}>
            <RoundedBox args={[0.5, h, 0.9]} radius={0.07}>
              <Mat color={c} />
            </RoundedBox>
            <Glyph ch={String(i + 1)} size={0.3} depth={0.06} position={[0, h / 2 - 0.25, 0.47]} color="#ffffff" />
          </group>
        );
      })}
    </group>
  );
};

export const GradCap: React.FC = () => (
  <group rotation={[0.35, 0, 0.08]}>
    <RoundedBox args={[2.1, 0.12, 2.1]} radius={0.04} rotation={[0, R / 4, 0]} position={[0, 0.25, 0]}>
      <Mat color={INK} />
    </RoundedBox>
    <mesh position={[0, -0.08, 0]}>
      <cylinderGeometry args={[0.66, 0.74, 0.62, 48]} />
      <Mat color={INK} />
    </mesh>
    <mesh position={[0, 0.34, 0]}>
      <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
      <Mat color={LIME} />
    </mesh>
    <mesh position={[0.52, 0.32, 0.52]} rotation={[0, -R / 4, R / 2]}>
      <cylinderGeometry args={[0.025, 0.025, 1.45, 8]} />
      <Mat color={LIME} />
    </mesh>
    <mesh position={[1.03, -0.12, 1.03]}>
      <cylinderGeometry args={[0.025, 0.025, 0.85, 8]} />
      <Mat color={LIME} />
    </mesh>
    <mesh position={[1.03, -0.62, 1.03]}>
      <cylinderGeometry args={[0.05, 0.13, 0.32, 16]} />
      <Mat color={LIME} />
    </mesh>
  </group>
);

const PlusBadge: React.FC<{ position: [number, number, number]; color?: string }> = ({ position, color = LIME }) => (
  <group position={position}>
    <mesh rotation={[R / 2, 0, 0]}>
      <cylinderGeometry args={[0.4, 0.4, 0.16, 40]} />
      <Mat color={color} />
    </mesh>
    <RoundedBox args={[0.42, 0.11, 0.08]} radius={0.03} position={[0, 0, 0.09]}>
      <Mat color="#ffffff" />
    </RoundedBox>
    <RoundedBox args={[0.11, 0.42, 0.08]} radius={0.03} position={[0, 0, 0.09]}>
      <Mat color="#ffffff" />
    </RoundedBox>
  </group>
);

export const PersonPlus: React.FC = () => (
  <group>
    <mesh position={[0, 0.55, 0]}>
      <sphereGeometry args={[0.55, 48, 48]} />
      <Mat color={LILAC} />
    </mesh>
    <mesh position={[0, -1.05, 0]} scale={[1, 0.9, 0.65]}>
      <sphereGeometry args={[1.0, 48, 24, 0, 2 * R, 0, R / 2]} />
      <Mat color={PURPLE} />
    </mesh>
    <Eyes y={0.6} dx={0.18} z={0.52} s={0.8} />
    <PlusBadge position={[0.9, 0.8, 0.35]} />
  </group>
);

export const PromptCard: React.FC = () => (
  <group rotation={[0, 0, 0.06]}>
    <RoundedBox args={[1.9, 2.3, 0.14]} radius={0.1}>
      <Mat color="#ffffff" />
    </RoundedBox>
    <RoundedBox args={[1.5, 0.28, 0.06]} radius={0.06} position={[0, 0.8, 0.08]}>
      <Mat color={LIME} />
    </RoundedBox>
    {[0.35, 0.05, -0.25, -0.55].map((y, i) => (
      <RoundedBox key={i} args={[[1.4, 1.1, 1.3, 0.8][i], 0.12, 0.05]} radius={0.04} position={[-0.05 - (1.4 - [1.4, 1.1, 1.3, 0.8][i]) / 2, y, 0.08]}>
        <Mat color={i === 1 ? LILAC : "#d9d6e2"} />
      </RoundedBox>
    ))}
    <group position={[0.6, -0.55, 0.35]} rotation={[0, 0, -0.75]}>
      <mesh>
        <cylinderGeometry args={[0.13, 0.13, 1.6, 6]} />
        <Mat color="#ffcd3c" />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.135, 0.135, 0.18, 24]} />
        <Mat color="#c9ccd6" metal />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.2, 24]} />
        <Mat color={PINK} />
      </mesh>
      <mesh position={[0, -0.98, 0]} rotation={[R, 0, 0]}>
        <coneGeometry args={[0.13, 0.36, 6]} />
        <Mat color="#f2c896" />
      </mesh>
      <mesh position={[0, -1.12, 0]} rotation={[R, 0, 0]}>
        <coneGeometry args={[0.045, 0.1, 12]} />
        <Mat color="#2a2a30" />
      </mesh>
    </group>
  </group>
);

export const Phone: React.FC = () => (
  <group rotation={[0, 0, -0.1]}>
    <RoundedBox args={[1.35, 2.6, 0.16]} radius={0.16} smoothness={6}>
      <Mat color="#1d1d24" />
    </RoundedBox>
    <RoundedBox args={[1.2, 2.44, 0.02]} radius={0.12} position={[0, 0, 0.085]}>
      <Mat color="#ffb3d9" emissive="#ff9ccc" glow={0.35} />
    </RoundedBox>
    <mesh position={[0.25, 0.55, 0.1]}>
      <cylinderGeometry args={[0.2, 0.2, 0.02, 32]} />
      <meshBasicMaterial color={LIME} />
    </mesh>
    <Extruded points={[[-0.6, -0.55], [-0.15, 0.25], [0.15, -0.15], [0.35, 0.1], [0.6, -0.55]]} depth={0.02} bevel={0.005} position={[0, -0.2, 0.1]} color={PURPLE} />
    <RoundedBox args={[0.36, 0.09, 0.03]} radius={0.04} position={[0, 1.08, 0.1]}>
      <Mat color="#101014" />
    </RoundedBox>
    <mesh position={[0, -0.95, 0.1]}>
      <torusGeometry args={[0.15, 0.03, 10, 32]} />
      <Mat color="#ffffff" />
    </mesh>
  </group>
);

export const PlayButton: React.FC = () => (
  <group>
    <RoundedBox args={[2.1, 1.6, 0.5]} radius={0.38} smoothness={6}>
      <Mat color={RED} />
    </RoundedBox>
    <Extruded points={[[-0.32, -0.42], [0.46, 0], [-0.32, 0.42]]} depth={0.12} bevel={0.06} position={[0.05, 0, 0.32]} color="#ffffff" />
  </group>
);

export const Mic: React.FC = () => (
  <group rotation={[0, 0, -0.35]}>
    <mesh position={[0, 0.65, 0]}>
      <sphereGeometry args={[0.6, 48, 48]} />
      <Mat color="#3b3b44" rough={0.55} metal />
    </mesh>
    <mesh position={[0, 0.42, 0]} rotation={[R / 2, 0, 0]}>
      <torusGeometry args={[0.55, 0.07, 16, 48]} />
      <Mat color={LIME} />
    </mesh>
    <mesh position={[0, -0.45, 0]}>
      <cylinderGeometry args={[0.22, 0.16, 1.6, 32]} />
      <Mat color="#26262c" />
    </mesh>
    <RoundedBox args={[0.14, 0.3, 0.1]} radius={0.04} position={[0, -0.2, 0.21]}>
      <Mat color={LIME} />
    </RoundedBox>
  </group>
);

export const Scissors: React.FC = () => (
  <group rotation={[0, 0, 0.5]}>
    {[-1, 1].map((k) => (
      <group key={k} rotation={[0, 0, k * 0.28]}>
        <mesh position={[0, -0.95, 0]}>
          <torusGeometry args={[0.36, 0.11, 16, 40]} />
          <Mat color={k < 0 ? PURPLE : PINK} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[0.16, 0.5, 0.12]} />
          <Mat color={k < 0 ? PURPLE : PINK} />
        </mesh>
        <Extruded points={[[-0.09, 0], [0.09, 0], [0.02, 1.55], [-0.04, 1.5]]} depth={0.04} bevel={0.015} position={[0, 0.7, 0.04 * k]} color="#d9dce6" metal rough={0.15} />
      </group>
    ))}
    <mesh position={[0, -0.08, 0.1]} rotation={[R / 2, 0, 0]}>
      <cylinderGeometry args={[0.09, 0.09, 0.2, 20]} />
      <Mat color={GOLD} metal />
    </mesh>
  </group>
);

export const CoinStack: React.FC = () => (
  <group position={[0.15, -0.1, 0]}>
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} position={[(i % 2) * 0.06 - 0.03, -0.95 + i * 0.22, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.2, 48]} />
        <Mat color={GOLD} metal />
      </mesh>
    ))}
    <group position={[-0.7, -0.2, 0.75]} rotation={[0, 0.35, 0.1]} scale={0.62}>
      <Coin ch="¢" r={1.0} />
    </group>
  </group>
);

const tri = (r: number): [number, number][] => [0, 1, 2].map((i) => [Math.cos(R / 2 + (i * 2 * R) / 3) * r, Math.sin(R / 2 + (i * 2 * R) / 3) * r] as [number, number]);

export const Warning: React.FC = () => (
  <group position={[0, -0.05, 0]}>
    <Extruded points={tri(1.45)} depth={0.3} bevel={0.14} color={RED} />
    <Extruded points={tri(1.12)} depth={0.34} bevel={0.1} position={[0, -0.04, 0.06]} color="#ffcf24" />
    <Glyph ch="!" size={1.05} depth={0.16} position={[0, -0.18, 0.34]} color="#18181d" />
  </group>
);

const Face: React.FC<{ position: [number, number, number]; color: string }> = ({ position, color }) => (
  <group position={position}>
    <mesh>
      <sphereGeometry args={[0.6, 48, 48]} />
      <Mat color={color} />
    </mesh>
    <Eyes y={0.1} dx={0.2} z={0.56} s={0.75} />
    <mesh position={[0, -0.15, 0.57]} rotation={[0, 0, R]} scale={[1, 1, 0.5]}>
      <torusGeometry args={[0.14, 0.035, 10, 24, R]} />
      <Mat color="#2a1a2a" />
    </mesh>
  </group>
);

export const SameFace: React.FC = () => (
  <group>
    <Face position={[-0.85, 0, 0]} color={LILAC} />
    <Face position={[0.85, 0, 0]} color={LILAC} />
    {[0.11, -0.11].map((y) => (
      <RoundedBox key={y} args={[0.36, 0.1, 0.12]} radius={0.04} position={[0, y, 0.3]}>
        <Mat color={LIME} />
      </RoundedBox>
    ))}
    <group position={[1.25, 0.65, 0.4]} scale={0.8}>
      <mesh rotation={[R / 2, 0, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.14, 40]} />
        <Mat color="#2fbf5b" />
      </mesh>
      <Extruded points={[[-0.18, 0.0], [-0.08, -0.12], [0.2, 0.16], [0.12, 0.22], [-0.08, 0.02], [-0.12, 0.06]]} depth={0.05} bevel={0.02} position={[0, 0, 0.1]} color="#ffffff" />
    </group>
  </group>
);

export const Robot: React.FC = () => (
  <group>
    <RoundedBox args={[1.75, 1.45, 1.3]} radius={0.3} smoothness={6}>
      <Mat color="#e3e5ee" />
    </RoundedBox>
    <RoundedBox args={[1.38, 0.62, 0.12]} radius={0.12} position={[0, 0.08, 0.64]}>
      <Mat color="#121218" rough={0.08} />
    </RoundedBox>
    {[-1, 1].map((k) => (
      <mesh key={k} position={[k * 0.33, 0.08, 0.72]} scale={[0.15, 0.15, 0.05]}>
        <sphereGeometry args={[1, 20, 20]} />
        <Mat color="#5ef2ff" emissive="#5ef2ff" glow={2.2} />
      </mesh>
    ))}
    {[-0.3, 0, 0.3].map((x) => (
      <RoundedBox key={x} args={[0.14, 0.1, 0.05]} radius={0.03} position={[x, -0.45, 0.66]}>
        <Mat color="#4a4c56" />
      </RoundedBox>
    ))}
    <mesh position={[0, 0.98, 0]}>
      <cylinderGeometry args={[0.04, 0.04, 0.4, 10]} />
      <Mat color="#9a9daa" metal />
    </mesh>
    <mesh position={[0, 1.22, 0]}>
      <sphereGeometry args={[0.12, 20, 20]} />
      <Mat color={RED} emissive={RED} glow={0.8} />
    </mesh>
    {[-1, 1].map((k) => (
      <mesh key={k} position={[k * 0.95, 0, 0]} rotation={[0, 0, R / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.2, 24]} />
        <Mat color={LIME} />
      </mesh>
    ))}
  </group>
);

export const Retry: React.FC = () => {
  const arc = 1.55 * R;
  const a0 = 0.35 * R;
  const end = a0 + arc;
  return (
    <group rotation={[0, 0, 0]}>
      <mesh rotation={[0, 0, a0]}>
        <torusGeometry args={[0.95, 0.2, 20, 80, arc]} />
        <Mat color={LIME} />
      </mesh>
      <mesh position={[0.95 * Math.cos(end), 0.95 * Math.sin(end), 0]} rotation={[0, 0, end]}>
        <coneGeometry args={[0.42, 0.62, 32]} />
        <Mat color={LIME} />
      </mesh>
      <Glyph ch="1" size={0.85} depth={0.2} position={[0, 0, 0]} color={PURPLE} />
    </group>
  );
};

export const Target: React.FC = () => (
  <group rotation={[0, -0.35, 0]}>
    {[1.15, 0.9, 0.65, 0.4, 0.17].map((r, i) => (
      <mesh key={r} position={[0, 0, i * 0.03]} rotation={[R / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, 0.25, 64]} />
        <Mat color={i % 2 === 0 ? RED : "#ffffff"} />
      </mesh>
    ))}
    <group position={[0.02, 0.02, 0.2]} rotation={[-0.55, 0.65, 0]}>
      <mesh position={[0, 0, 0.62]} rotation={[R / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.1, 12]} />
        <Mat color="#c9ccd6" metal />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0, 1.12]} rotation={[0, 0, (i * 2 * R) / 3]}>
          <boxGeometry args={[0.02, 0.36, 0.34]} />
          <Mat color={LIME} />
        </mesh>
      ))}
    </group>
  </group>
);

export const Compass: React.FC = () => (
  <group>
    <mesh rotation={[R / 2, 0, 0]}>
      <cylinderGeometry args={[1.1, 1.1, 0.3, 64]} />
      <Mat color={GOLD} metal />
    </mesh>
    <mesh position={[0, 0, 0.04]} rotation={[R / 2, 0, 0]}>
      <cylinderGeometry args={[0.92, 0.92, 0.3, 64]} />
      <Mat color="#fbfaf7" />
    </mesh>
    {[0, 1, 2, 3].map((i) => (
      <RoundedBox key={i} args={[0.08, 0.2, 0.04]} radius={0.02} position={[Math.sin((i * R) / 2) * 0.72, Math.cos((i * R) / 2) * 0.72, 0.2]} rotation={[0, 0, (-i * R) / 2]}>
        <Mat color="#3a3a44" />
      </RoundedBox>
    ))}
    <group position={[0, 0, 0.24]} rotation={[0, 0, -0.5]}>
      <mesh position={[0, 0.32, 0]} scale={[1, 1, 0.35]}>
        <coneGeometry args={[0.15, 0.64, 4]} />
        <Mat color={RED} />
      </mesh>
      <mesh position={[0, -0.32, 0]} rotation={[0, 0, R]} scale={[1, 1, 0.35]}>
        <coneGeometry args={[0.15, 0.64, 4]} />
        <Mat color={PURPLE} />
      </mesh>
    </group>
    <mesh position={[0, 0, 0.27]}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <Mat color={GOLD} metal />
    </mesh>
    <mesh position={[0, 1.2, 0]}>
      <torusGeometry args={[0.16, 0.06, 12, 32]} />
      <Mat color={GOLD} metal />
    </mesh>
  </group>
);

export const PlinkBadge: React.FC = () => (
  <group>
    <RoundedBox args={[2.1, 2.1, 0.5]} radius={0.48} smoothness={8}>
      <Mat color={LIME} />
    </RoundedBox>
    <Glyph ch="P" size={1.45} depth={0.24} position={[-0.05, -0.05, 0.32]} color="#16161a" />
    <group position={[0.78, 0.95, 0.25]} scale={0.42} rotation={[0.3, 0.4, -0.25]}>
      <GradCap />
    </group>
  </group>
);

export const ChatBubble: React.FC = () => (
  <group>
    <RoundedBox args={[2.3, 1.55, 0.45]} radius={0.42} smoothness={6}>
      <Mat color="#ffffff" />
    </RoundedBox>
    <mesh position={[-0.65, -0.9, 0]} rotation={[0, 0, 2.6]}>
      <coneGeometry args={[0.28, 0.6, 24]} />
      <Mat color="#ffffff" />
    </mesh>
    {[-0.55, 0, 0.55].map((x) => (
      <mesh key={x} position={[x, 0, 0.25]}>
        <sphereGeometry args={[0.17, 24, 24]} />
        <Mat color={PURPLE} />
      </mesh>
    ))}
    <PlusBadge position={[1.05, 0.7, 0.3]} color={LIME} />
  </group>
);

export const PaperPlane: React.FC<{ rot?: [number, number, number] }> = ({ rot = [1.1, -0.45, 0.2] }) => {
  const geom = useMemo(() => {
    // dart plane flying towards +x: wings in a shallow V, centre valley fold, keel below
    const N = [1.6, 0.05, 0], L = [-1.0, 0.42, 1.05], Rr = [-1.0, 0.42, -1.05], C = [-0.9, 0.0, 0], K = [-0.95, -0.55, 0];
    const v = [...N, ...C, ...L, ...N, ...Rr, ...C, ...N, ...K, ...C, ...N, ...C, ...K];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group rotation={rot} position={[0.15, 0.1, 0]}>
      <mesh geometry={geom}>
        <meshPhysicalMaterial color="#ffffff" roughness={0.45} clearcoat={0.5} side={THREE.DoubleSide} flatShading />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-1.35 - i * 0.42, -0.05 - i * 0.05, 0]} scale={0.11 - i * 0.025}>
          <sphereGeometry args={[1, 16, 16]} />
          <Mat color={LIME} />
        </mesh>
      ))}
    </group>
  );
};

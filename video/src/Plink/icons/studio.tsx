import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { GLYPHS } from "./glyphs";

// Shared look for the 3D icons: studio lighting with procedural light panels
// for reflections (no HDR download), glossy clear-coated plastics and metals,
// and a pop-in / sway / float animation.

export type MatProps = { color: string; metal?: boolean; rough?: number; emissive?: string; glow?: number; opacity?: number };

/** Glossy clear-coated plastic, or polished metal with `metal`. */
export const Mat: React.FC<MatProps> = ({ color, metal, rough, emissive, glow = 0, opacity }) => (
  <meshPhysicalMaterial
    color={color}
    metalness={metal ? 0.9 : 0}
    roughness={rough ?? (metal ? 0.2 : 0.32)}
    // metals reflect the grey studio room; boost them so gold reads as gold
    envMapIntensity={metal ? 2.6 : 1}
    clearcoat={metal ? 0.3 : 1}
    clearcoatRoughness={0.12}
    emissive={emissive ?? "#000000"}
    emissiveIntensity={glow}
    transparent={opacity !== undefined}
    opacity={opacity ?? 1}
  />
);

/** Extruded, bevelled glyph from GLYPHS (centred; `size` = em height in units). */
export const Glyph: React.FC<{ ch: string; size: number; depth?: number } & MatProps & { position?: [number, number, number]; rotation?: [number, number, number] }> = ({
  ch,
  size,
  depth = 0.18,
  position,
  rotation,
  ...mat
}) => {
  const geom = useMemo(() => {
    const g = GLYPHS[ch];
    const paths = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${g.d}"/></svg>`).paths;
    const shapes = paths.flatMap((p) => SVGLoader.createShapes(p));
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: depth / size,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.018,
      bevelSegments: 4,
      curveSegments: 10,
    });
    geo.center();
    return geo;
  }, [ch, depth, size]);
  // SVG is y-down: flip y so the glyph reads correctly
  return (
    <mesh geometry={geom} scale={[size, -size, size]} position={position} rotation={rotation}>
      <Mat {...mat} />
    </mesh>
  );
};

/** Extruded flat shape from a list of 2D points (closed polygon), centred. */
export const Extruded: React.FC<{ points: [number, number][]; depth: number; bevel?: number } & MatProps & { position?: [number, number, number]; rotation?: [number, number, number] }> = ({
  points,
  depth,
  bevel = 0.06,
  position,
  rotation,
  ...mat
}) => {
  const geom = useMemo(() => {
    const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5 });
    geo.center();
    return geo;
  }, [points, depth, bevel]);
  return (
    <mesh geometry={geom} position={position} rotation={rotation}>
      <Mat {...mat} />
    </mesh>
  );
};

// Studio reflections for metals and clear coats, built synchronously so the
// very first rendered frame already has them (no HDR download).
const StudioEnv: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.7;
    pmrem.dispose();
  }, [gl, scene]);
  return null;
};

const Lights: React.FC = () => (
  <>
    <StudioEnv />
    <ambientLight intensity={0.25} />
    <directionalLight position={[3, 5, 6]} intensity={2.2} />
    <directionalLight position={[-5, 1, 2]} intensity={0.8} color="#f3d4ff" />
    <directionalLight position={[0, -3, -5]} intensity={1.4} color="#ffffff" />
  </>
);

export type AnimProps = {
  /** frame (relative to the enclosing Sequence) when the icon pops in */
  enterAt?: number;
  /** frame when it starts leaving; undefined = stays */
  exitAt?: number;
  /** base yaw in radians (turn it a bit towards the speaker) */
  yaw?: number;
  /** continuous spin speed (rad/frame), e.g. for coins */
  spin?: number;
  /** skip the entrance (for galleries) */
  settled?: boolean;
};

/** Pop / sway / float wrapper; returns null before enterAt and after the exit. */
const Animated: React.FC<AnimProps & { children: React.ReactNode }> = ({ enterAt = 0, exitAt, yaw = 0, spin = 0, settled, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - enterAt;
  const pop = settled ? 1 : spring({ frame: t, fps, config: { damping: 9, stiffness: 170, mass: 0.7 } });
  const out = exitAt === undefined ? 0 : interpolate(frame, [exitAt, exitAt + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s = Math.max(0, pop * (1 - out));
  const ry = yaw + Math.sin(frame / 22) * 0.28 + (settled ? 0 : (1 - pop) * 1.6) + spin * frame;
  const rx = 0.12 + Math.sin(frame / 31) * 0.06;
  const y = Math.sin(frame / 17) * 0.08;
  return (
    <group scale={s} rotation={[rx, ry, 0]} position={[0, y, 0]}>
      {children}
    </group>
  );
};

/** A transparent square three.js canvas hosting one icon model. */
export const IconStage: React.FC<AnimProps & { size: number; zoom?: number; children: React.ReactNode }> = ({ size, zoom = 1, children, ...anim }) => {
  const frame = useCurrentFrame();
  if (!anim.settled && frame < (anim.enterAt ?? 0)) {
    return null;
  }
  return (
    <ThreeCanvas
      width={size}
      height={size}
      camera={{ position: [0, 0, 7 / zoom], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      // neutral tone mapping keeps the lime / purple / red brand colours saturated
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
      }}
    >
      <Lights />
      <Animated {...anim}>{children}</Animated>
    </ThreeCanvas>
  );
};

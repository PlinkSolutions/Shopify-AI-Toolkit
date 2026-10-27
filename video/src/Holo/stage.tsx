import { useFrame, useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// "Holographic science explainer" stage: navy void, perspective grid floor,
// volumetric spotlight, gold-ringed platform, floating dust and bloom.
// Characters are fresnel-shaded capsules (glass white / emissive gold).

export const NAVY = "#0A0F1C";
export const GOLD = "#F5B83D";
export const CYAN = "#4FD1E8";
export const GLASS = "#e8f0ff";

export type V3 = [number, number, number];

/** Fresnel rim shader: bright edges, faint body — the hologram look. */
export function rimMaterial(color: string, { fill = 0.06, power = 2.2, intensity = 1.8, opacity = 1, side = THREE.FrontSide as THREE.Side } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uFill: { value: fill },
      uPower: { value: power },
      uIntensity: { value: intensity },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uFill; uniform float uPower; uniform float uIntensity; uniform float uOpacity;
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
        vec3 c = uColor * (uFill + f * uIntensity);
        gl_FragColor = vec4(c, clamp(uFill + f, 0.0, 1.0) * uOpacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side,
  });
}

const CAPSULE = new THREE.CapsuleGeometry(0.5, 1.0, 16, 40);
const HEAD = new THREE.SphereGeometry(0.42, 48, 32);

/** Capsule character: pill body (bottom at y=0) and a floating sphere head. */
export const Capsule: React.FC<{
  kind: "glass" | "gold";
  position?: V3;
  rotation?: V3;
  scale?: number;
  /** head position relative to the group (default: floating above the body) */
  head?: V3;
  opacity?: number;
}> = ({ kind, position, rotation, scale = 1, head = [0, 2.62, 0], opacity = 1 }) => {
  const [front, back] = useMemo(() => {
    const opts = kind === "gold" ? { fill: 0.07, power: 2.3, intensity: 1.5, opacity } : { fill: 0.018, power: 2.8, intensity: 1.35, opacity };
    const color = kind === "gold" ? GOLD : GLASS;
    return [rimMaterial(color, opts), rimMaterial(color, { ...opts, intensity: opts.intensity * 0.3, side: THREE.BackSide })];
  }, [kind, opacity]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={CAPSULE} material={back} position={[0, 1, 0]} />
      <mesh geometry={CAPSULE} material={front} position={[0, 1, 0]} />
      <mesh geometry={HEAD} material={back} position={head} />
      <mesh geometry={HEAD} material={front} position={head} />
    </group>
  );
};

const Floor: React.FC = () => {
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(80, 96, "#3a5494", "#26386a");
    const m = g.material as THREE.LineBasicMaterial;
    m.transparent = true;
    m.opacity = 0.7;
    m.depthWrite = false;
    return g;
  }, []);
  return <primitive object={grid} />;
};

/** Soft radial texture for light pools and halos. */
function radialTexture(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const Spot: React.FC<{ x?: number; height?: number; radius?: number }> = ({ x = 0, height = 10, radius = 2.9 }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color("#a9b8ff") } },
        vertexShader: `
          varying vec3 vN; varying vec3 vV; varying float vY;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = uv.y;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform vec3 uColor; varying vec3 vN; varying vec3 vV; varying float vY;
          void main() {
            float facing = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
            float a = 0.03 * facing * (0.35 + 0.65 * (1.0 - vY)) * smoothstep(1.0, 0.85, vY);
            gl_FragColor = vec4(uColor, a);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const pool = useMemo(() => radialTexture("rgba(150,170,255,0.16)", "rgba(150,170,255,0)"), []);
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, height / 2, 0]} material={mat}>
        <cylinderGeometry args={[0.25, radius, height, 64, 1, true]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[radius * 2.2, radius * 2.2]} />
        <meshBasicMaterial map={pool} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

const Ring: React.FC<{ r: number; w: number; color: string; opacity: number; y?: number }> = ({ r, w, color, opacity, y = 0.01 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
    <ringGeometry args={[r, r + w, 160]} />
    <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
  </mesh>
);

export const Platform: React.FC<{ x?: number; scale?: number }> = ({ x = 0, scale = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <group position={[x, 0, 0]} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[2.75, 96]} />
        <meshBasicMaterial color="#0b1222" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <Ring r={2.62} w={0.05} color={GOLD} opacity={0.95} />
      <Ring r={2.36} w={0.014} color="#ff9b42" opacity={0.75} />
      <Ring r={1.78} w={0.01} color={GOLD} opacity={0.45} />
      <Ring r={2.86} w={0.008} color={GOLD} opacity={0.3} />
      {/* slow dashed ring */}
      <group rotation={[0, frame * 0.004, 0]}>
        {Array.from({ length: 48 }, (_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, (i / 48) * Math.PI * 2]} position={[Math.cos((i / 48) * Math.PI * 2) * 2.08, 0.012, -Math.sin((i / 48) * Math.PI * 2) * 2.08]}>
            <planeGeometry args={[0.012, 0.09]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useMemo(() => {
    const n = 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (random(`dx${i}`) - 0.5) * 9;
      pos[i * 3 + 1] = random(`dy${i}`) * 6;
      pos[i * 3 + 2] = (random(`dz${i}`) - 0.5) * 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} position={[0, frame * 0.004, 0]} rotation={[0, frame * 0.002, 0]}>
      <pointsMaterial size={0.025} color="#9fb4ff" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

const Bloom: React.FC<{ strength: number }> = ({ strength }) => {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), strength, 0.4, 0.5));
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera, size.width, size.height, strength]);
  useLayoutEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, gl, size.width, size.height]);
  // priority 1 replaces r3f's own render with the composer
  useFrame(() => composer.render(), 1);
  return null;
};

export type Cam = { from: V3; to: V3; target: V3; orbit?: number; dur: number };

const ASPECT = 1080 / 1920;

/** Camera for a scene frame: slow cinematic push-in with a small orbit. */
export function camAt(cam: Cam, frame: number, into?: THREE.PerspectiveCamera) {
  const c = into ?? new THREE.PerspectiveCamera(32, ASPECT, 0.1, 120);
  const t = interpolate(frame, [0, cam.dur], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  const p = new THREE.Vector3(...cam.from).lerp(new THREE.Vector3(...cam.to), t);
  const tg = new THREE.Vector3(...cam.target);
  const a = (t - 0.5) * (cam.orbit ?? 0.15);
  const dx = p.x - tg.x, dz = p.z - tg.z;
  c.position.set(tg.x + dx * Math.cos(a) - dz * Math.sin(a), p.y, tg.z + dx * Math.sin(a) + dz * Math.cos(a));
  c.lookAt(tg);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
}

/** Screen position (px on the 1080x1920 frame) of a 3D point for HUD anchors. */
export function toScreen(v: V3, cam: Cam, frame: number): [number, number] {
  const p = new THREE.Vector3(...v).project(camAt(cam, frame));
  return [((p.x + 1) / 2) * 1080, ((1 - p.y) / 2) * 1920];
}

const CameraRig: React.FC<Cam> = (cam) => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  useLayoutEffect(() => {
    camAt(cam, frame, camera as THREE.PerspectiveCamera);
  }, [frame, camera, cam]);
  return null;
};

/** One full-frame holographic scene. */
export const HoloStage: React.FC<{
  cam: Cam;
  spot?: boolean;
  platform?: boolean;
  bloom?: number;
  children: React.ReactNode;
}> = ({ cam, spot = true, platform = true, bloom = 0.6, children }) => (
  <ThreeCanvas
    width={1080}
    height={1920}
    camera={{ fov: 32, position: cam.from, near: 0.1, far: 120 }}
    gl={{ antialias: true }}
    onCreated={({ gl }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 0.95;
    }}
  >
    <color attach="background" args={[NAVY]} />
    <fog attach="fog" args={[NAVY, 7, 26]} />
    <CameraRig {...cam} />
    <Floor />
    {spot ? <Spot /> : null}
    {platform ? <Platform /> : null}
    <Dust />
    {children}
    <Bloom strength={bloom} />
  </ThreeCanvas>
);

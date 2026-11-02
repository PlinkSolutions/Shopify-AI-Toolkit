import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Bloom, Cam, CameraRig, toScreen, V3 } from "../stage";
import { MONO, SANS } from "./hud";

// "Glossy 3D icons" art direction (FORMATO.md §10): candy-like objects with
// clearcoat reflections from a studio environment, saturated gradient
// backgrounds, soft contact shadows and a light bloom on highlights. Uses the
// same Cam / toScreen math as HoloStage, so HUD labels anchor the same way.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Background palettes: top, middle, bottom (sRGB). */
export const PALETTES = {
  caramelo: ["#ff5cab", "#b3125f", "#24041c"],
  menta: ["#5fe8d2", "#13879c", "#03202e"],
  noche: ["#5b6cff", "#2a1f7a", "#0a0820"],
} as const;
export type Palette = keyof typeof PALETTES;

// ---------------------------------------------------------------- stage
const BG_VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }`;
const BG_FRAG = `
  uniform vec3 a0, a1, a2, b0, b1, b2; uniform float mixAB; uniform vec2 glow; varying vec2 vUv;
  vec3 grad(vec3 t, vec3 m, vec3 b, float y) { return y > 0.5 ? mix(m, t, (y - 0.5) * 2.0) : mix(b, m, y * 2.0); }
  void main() {
    vec3 c = mix(grad(a0, a1, a2, vUv.y), grad(b0, b1, b2, vUv.y), mixAB);
    float d = distance(vec2(vUv.x, vUv.y * 1.78), vec2(glow.x, glow.y * 1.78));
    c += 0.10 * exp(-d * d * 2.5) * mix(a0, b0, mixAB);          // soft light behind the subject
    float v = distance(vUv, vec2(0.5)); c *= 1.0 - 0.55 * smoothstep(0.35, 0.85, v); // vignette
    gl_FragColor = vec4(c, 1.0);
  }`;

const lin = (hex: string) => new THREE.Color(hex);

const Background: React.FC<{ from: Palette; to: Palette; mixAB: number; glow: [number, number] }> = ({ from, to, mixAB, glow }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: BG_VERT,
        fragmentShader: BG_FRAG,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          a0: { value: lin(PALETTES[from][0]) }, a1: { value: lin(PALETTES[from][1]) }, a2: { value: lin(PALETTES[from][2]) },
          b0: { value: lin(PALETTES[to][0]) }, b1: { value: lin(PALETTES[to][1]) }, b2: { value: lin(PALETTES[to][2]) },
          mixAB: { value: 0 },
          glow: { value: new THREE.Vector2() },
        },
      }),
    [from, to],
  );
  mat.uniforms.mixAB.value = mixAB;
  mat.uniforms.glow.value.set(glow[0], glow[1]);
  return (
    <mesh renderOrder={-10} frustumCulled={false} material={mat}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
};

/** Studio reflections for every physical material in the scene. */
const StudioEnv: React.FC<{ intensity: number }> = ({ intensity }) => {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = rt.texture;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      rt.dispose();
      pm.dispose();
    };
  }, [gl, scene, intensity]);
  return null;
};

/** Full-frame glossy scene: gradient background (optionally blending to a second palette), studio light, bloom. */
export const GlossyStage: React.FC<{
  cam: Cam;
  palette?: Palette;
  /** second palette and 0–1 blend towards it (e.g. caramelo → menta on a reveal) */
  toPalette?: Palette;
  mixPalette?: number;
  glow?: [number, number];
  bloom?: number;
  children: React.ReactNode;
}> = ({ cam, palette = "caramelo", toPalette, mixPalette = 0, glow = [0.5, 0.42], bloom = 0.18, children }) => (
  <ThreeCanvas
    width={1080}
    height={1920}
    camera={{ fov: 32, position: cam.from, near: 0.1, far: 120 }}
    gl={{ antialias: true }}
    onCreated={({ gl }) => {
      // no filmic curve: keeps the saturated candy colours of the palette
      gl.toneMapping = THREE.NoToneMapping;
    }}
  >
    <CameraRig {...cam} />
    <Background from={palette} to={toPalette ?? palette} mixAB={mixPalette} glow={glow} />
    <StudioEnv intensity={0.45} />
    <ambientLight intensity={0.18} />
    <directionalLight position={[-3, 6, 5]} intensity={1.15} color="#fff4ea" />
    <directionalLight position={[4, 2, -4]} intensity={0.55} color="#ffd0f0" />
    {children}
    <Bloom strength={bloom} threshold={0.96} radius={0.35} />
  </ThreeCanvas>
);

// ---------------------------------------------------------------- materials
export function glossy(color: string, { roughness = 0.16, clearcoat = 1, opacity = 1, emissive = 0 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness: 0,
    clearcoat,
    clearcoatRoughness: 0.08,
    transparent: opacity < 1,
    opacity,
    emissive: color,
    emissiveIntensity: emissive,
  });
}

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const SHADOW_TEX = (() => {
  let t: THREE.Texture | null = null;
  return () =>
    (t ??= canvasTexture(128, (g, s) => {
      const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, "rgba(0,0,0,0.75)");
      r.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, s, s);
    }));
})();

/** Soft blurred shadow on the (invisible) floor. */
export const ContactShadow: React.FC<{ position?: V3; size?: number; opacity?: number }> = ({ position = [0, 0.002, 0], size = 1.6, opacity = 0.55 }) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: SHADOW_TEX(), transparent: true, depthWrite: false, opacity }), [opacity]);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
};

// ---------------------------------------------------------------- characters
/** Round glossy body with 8 soft ribs (pumpkin costume), flattened a little. */
function pumpkinGeometry() {
  const g = new THREE.SphereGeometry(1, 72, 48);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + 0.075 * Math.cos(8 * a) * (1 - y * y);
    p.setXYZ(i, x * k, y * 0.86, z * k);
  }
  g.computeVertexNormals();
  return g;
}
const PUMPKIN = pumpkinGeometry();
const EYE = new THREE.SphereGeometry(0.2, 32, 24);
const PUPIL = new THREE.SphereGeometry(0.1, 24, 16);
const SPARK = new THREE.SphereGeometry(0.03, 12, 8);
const STAR = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i <= 10; i++) {
    const r = i % 2 ? 0.07 : 0.17;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 3 });
  g.center();
  return g;
})();

/**
 * Ball character ("niño-bolita"): glossy body, big eyes, small smile.
 * squash: 1 = normal, <1 flattened (landing), >1 stretched (jumping).
 * look: pupil offset in eye units ([-1..1], [-1..1]); dizzy spins the pupils.
 */
export const BallKid: React.FC<{
  position?: V3;
  rotation?: V3;
  scale?: number;
  color?: string;
  costume?: "pumpkin" | "plain";
  squash?: number;
  look?: [number, number];
  dizzy?: number;
  opacity?: number;
}> = ({ position, rotation, scale = 1, color = "#ff7a1a", costume = "pumpkin", squash = 1, look = [0, 0], dizzy = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const mats = useMemo(
    () => ({
      body: glossy(color, { roughness: 0.22, opacity }),
      eye: glossy("#ffffff", { roughness: 0.1, opacity }),
      pupil: glossy("#141018", { roughness: 0.05, opacity }),
      stem: glossy("#3b8f3a", { roughness: 0.35, opacity }),
      spark: new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: opacity < 1, opacity }),
      mouth: glossy("#2a0d10", { roughness: 0.3, opacity }),
      star: glossy("#ffd21f", { roughness: 0.12, opacity, emissive: 0.25 }),
    }),
    [color, opacity],
  );
  const sx = 1 / Math.sqrt(squash);
  const spin = dizzy * frame * 0.5;
  const px = (s: number) => look[0] * 0.07 + Math.cos(spin + s) * 0.05 * dizzy;
  const py = (s: number) => look[1] * 0.07 + Math.sin(spin + s) * 0.05 * dizzy;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, 0.86 * squash, 0]} scale={[sx, squash, sx]}>
        <mesh geometry={costume === "pumpkin" ? PUMPKIN : EYE} material={mats.body} scale={costume === "pumpkin" ? 1 : 5} />
        {costume === "pumpkin" ? (
          <mesh material={mats.stem} position={[0.03, 0.9, 0]} rotation={[0, 0, -0.25]}>
            <cylinderGeometry args={[0.07, 0.12, 0.34, 16]} />
          </mesh>
        ) : null}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.3, 0.16, 0.95]}>
            <mesh geometry={EYE} material={mats.eye} />
            <mesh geometry={PUPIL} material={mats.pupil} position={[px(s), py(s), 0.13]} />
            <mesh geometry={SPARK} material={mats.spark} position={[px(s) + 0.035, py(s) + 0.04, 0.22]} />
          </group>
        ))}
        <mesh material={mats.mouth} position={[0, -0.22, 1.0]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.16, 0.035, 12, 24, Math.PI]} />
        </mesh>
      </group>
      {dizzy > 0
        ? [0, 1, 2].map((i) => {
            const a = frame * 0.22 + (i * Math.PI * 2) / 3;
            return <mesh key={i} geometry={STAR} material={mats.star} position={[Math.cos(a) * 0.75, 2.05 + Math.sin(a * 2) * 0.05, Math.sin(a) * 0.45]} rotation={[0, a, frame * 0.1]} scale={dizzy} />;
          })
        : null}
    </group>
  );
};

// ---------------------------------------------------------------- candy
const CANDY_COLORS = ["#ff3b5c", "#ffcc1f", "#3d8bff", "#9b5cff", "#2fd37f", "#ff7a1a"];

const stripes = (a: string, b: string) =>
  canvasTexture(128, (g, s) => {
    g.fillStyle = a;
    g.fillRect(0, 0, s, s);
    g.strokeStyle = b;
    g.lineWidth = s / 10;
    for (let i = -s; i < s * 2; i += s / 4) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i + s, s);
      g.stroke();
    }
  });

const swirl = (a: string, b: string) =>
  canvasTexture(256, (g, s) => {
    g.fillStyle = a;
    g.fillRect(0, 0, s, s);
    g.translate(s / 2, s / 2);
    g.fillStyle = b;
    for (let arm = 0; arm < 4; arm++) {
      g.beginPath();
      for (let t = 0; t <= 1; t += 0.01) {
        const r = t * s * 0.5;
        const ang = arm * (Math.PI / 2) + t * 6;
        g.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      for (let t = 1; t >= 0; t -= 0.01) {
        const r = t * s * 0.5;
        const ang = arm * (Math.PI / 2) + t * 6 + 0.55;
        g.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      g.fill();
    }
  });

const CANDY_BODY = new THREE.SphereGeometry(1, 40, 28);
const WRAP_END = new THREE.ConeGeometry(0.62, 0.7, 20, 1, true);

/** Wrapped hard candy: striped glossy body with two cellophane twists. */
export const WrappedCandy: React.FC<{ position?: V3; rotation?: V3; scale?: number; color: string; stripe?: string }> = ({ position, rotation, scale = 0.3, color, stripe = "#ffffff" }) => {
  const mats = useMemo(() => {
    const body = glossy("#ffffff", { roughness: 0.12 });
    body.map = stripes(color, stripe);
    return { body, wrap: glossy(color, { roughness: 0.05, opacity: 0.55 }) };
  }, [color, stripe]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={CANDY_BODY} material={mats.body} scale={[1.3, 0.85, 0.85]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={WRAP_END} material={mats.wrap} position={[s * 1.45, 0, 0]} rotation={[0, 0, (s * Math.PI) / 2]} />
      ))}
    </group>
  );
};

/** Lollipop: swirl disc on a white stick. */
export const Lollipop: React.FC<{ position?: V3; rotation?: V3; scale?: number; a: string; b: string }> = ({ position, rotation, scale = 1, a, b }) => {
  const mats = useMemo(() => {
    const cap = glossy("#ffffff", { roughness: 0.1 });
    cap.map = swirl(a, b);
    return [glossy(a, { roughness: 0.1 }), cap, cap];
  }, [a, b]);
  const stick = useMemo(() => glossy("#f6f1ea", { roughness: 0.4, clearcoat: 0.3 }), []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh material={mats} position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.14, 48]} />
      </mesh>
      <mesh material={stick} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 1.1, 12]} />
      </mesh>
    </group>
  );
};

/** Candy corn: three-band cone (white tip, orange, yellow base). */
const CORN = (() => {
  const g = new THREE.ConeGeometry(0.5, 1, 24, 6);
  const p = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) + 0.5;
    c.set(y > 0.68 ? "#fff6e6" : y > 0.34 ? "#ff8a1a" : "#ffd21f");
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.scale(1, 1, 0.55);
  return g;
})();
export const CandyCorn: React.FC<{ position?: V3; rotation?: V3; scale?: number }> = ({ position, rotation, scale = 0.45 }) => {
  const mat = useMemo(() => {
    const m = glossy("#ffffff", { roughness: 0.25 });
    m.vertexColors = true;
    return m;
  }, []);
  return <mesh geometry={CORN} material={mat} position={position} rotation={rotation} scale={scale} />;
};

/** A deterministic mound of mixed candy centred on `position`. */
export const CandyPile: React.FC<{ position?: V3; radius?: number; count?: number; seed?: string; rise?: number }> = ({ position = [0, 0, 0], radius = 1.3, count = 26, seed = "pile", rise = 1 }) => {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = Math.sqrt(random(`${seed}r${i}`)) * radius;
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const h = (1 - r / radius) * radius * 0.75 + 0.12;
        const kind = i % 7 === 0 ? "pop" : i % 3 === 0 ? "corn" : "candy";
        return {
          kind,
          pos: [Math.cos(a) * r, h, Math.sin(a) * r] as V3,
          rot: [random(`${seed}x${i}`) * 6, random(`${seed}y${i}`) * 6, random(`${seed}z${i}`) * 6] as V3,
          color: CANDY_COLORS[i % CANDY_COLORS.length],
          delay: i * 0.6,
        };
      }),
    [count, radius, seed],
  );
  return (
    <group position={position}>
      <ContactShadow size={radius * 3.2} opacity={0.5} />
      {items.map((it, i) => {
        const s = interpolate(rise * 30 - it.delay, [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
        if (s <= 0) return null;
        if (it.kind === "pop")
          return <Lollipop key={i} position={[it.pos[0], it.pos[1] - 0.3, it.pos[2]]} rotation={[it.rot[0] * 0.05, it.rot[1], (it.rot[2] - 3) * 0.08]} scale={0.75 * s} a={it.color} b="#ffffff" />;
        if (it.kind === "corn") return <CandyCorn key={i} position={it.pos} rotation={it.rot} scale={0.42 * s} />;
        return <WrappedCandy key={i} position={it.pos} rotation={it.rot} scale={0.3 * s} color={it.color} />;
      })}
    </group>
  );
};

// ---------------------------------------------------------------- sugar cube
const grain = () =>
  canvasTexture(512, (g, s) => {
    g.fillStyle = "#cdc5cd";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const v = Math.round(170 + random(`gv${i}`) * 85);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.save();
      g.translate(random(`gx${i}`) * s, random(`gy${i}`) * s);
      g.rotate(random(`gr${i}`) * Math.PI);
      const w = 4 + random(`gw${i}`) * 9;
      g.fillRect(-w / 2, -w / 2, w, w * (0.6 + random(`gh${i}`) * 0.8));
      g.restore();
    }
  });

/** Giant sugar cube: rounded, grainy, with twinkling crystal sparkles. */
export const SugarCube: React.FC<{ position?: V3; rotation?: V3; scale?: number; tint?: string }> = ({ position, rotation, scale = 1, tint = "#e9e2ea" }) => {
  const frame = useCurrentFrame();
  const { geo, mat, sparks } = useMemo(() => {
    const t = grain();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1.5, 1.5);
    const bump = t.clone();
    bump.colorSpace = THREE.NoColorSpace;
    const m = new THREE.MeshPhysicalMaterial({ color: tint, map: t, roughness: 0.62, bumpMap: bump, bumpScale: 3, clearcoat: 0.35, clearcoatRoughness: 0.2 });
    const pts = Array.from({ length: 40 }, (_, i) => {
      const face = i % 3;
      const u = random(`su${i}`) * 1.6 - 0.8, v = random(`sv${i}`) * 1.6 - 0.8;
      return (face === 0 ? [u, v, 0.92] : face === 1 ? [0.92, u, v] : [u, 0.92, v]) as V3;
    });
    return { geo: new RoundedBoxGeometry(1.8, 1.8, 1.8, 6, 0.16), mat: m, sparks: pts };
  }, [tint]);
  const sparkMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo} material={mat} />
      {sparks.map((p, i) => {
        const tw = Math.max(0, Math.sin(frame * 0.25 + i * 1.7)) ** 6;
        return tw > 0.05 ? <mesh key={i} geometry={SPARK} material={sparkMat} position={p} scale={0.25 + tw * 0.7} /> : null;
      })}
    </group>
  );
};

// ---------------------------------------------------------------- arrow
/** Glossy 3D arrow pointing along +x from its tail at the origin. */
export const Arrow3D: React.FC<{ position?: V3; rotation?: V3; length?: number; color?: string; scale?: number }> = ({ position, rotation, length = 1.2, color = "#ff3b5c", scale = 1 }) => {
  const mat = useMemo(() => glossy(color, { roughness: 0.14 }), [color]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh material={mat} position={[length / 2 - 0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, length - 0.3, 20]} />
      </mesh>
      <mesh material={mat} position={[length - 0.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.2, 0.36, 28]} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- HUD
/** Pill label in the reference style (dark pill, coloured border), anchored to a 3D point. */
export const Tag: React.FC<{ anchor: V3; cam: Cam; at: number; text: string; tone?: string; dy?: number; swing?: boolean; size?: number }> = ({ anchor, cam, at, text, tone = "#ff4fa3", dy = 0, swing = false, size = 42 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const [x0, y0] = toScreen(anchor, cam, frame);
  const x = Math.min(900, Math.max(180, x0)); // keep the pill inside the frame
  const y = Math.max(440, y0 + dy);
  const s = interpolate(frame, [at, at + 7], [0.3, 1], { ...clamp, easing: Easing.out(Easing.back(2.4)) });
  const rot = swing ? Math.sin((frame - at) * 0.35) * 14 * Math.exp(-(frame - at) / 14) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s}) rotate(${rot}deg)`,
        transformOrigin: "50% -40%",
        padding: "10px 28px",
        borderRadius: 999,
        background: "rgba(16,8,20,0.88)",
        border: `4px solid ${tone}`,
        boxShadow: `0 0 26px ${tone}88, 0 10px 30px rgba(0,0,0,0.35)`,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.06em",
        color: "#fff",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

/** Rubber stamp that slams onto the frame (e.g. FALSO). */
export const Stamp: React.FC<{ x: number; y: number; at: number; text: string; color?: string; rotate?: number }> = ({ x, y, at, text, color = "#ff2d4a", rotate = -12 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const s = interpolate(frame, [at, at + 4], [2.6, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const o = interpolate(frame, [at, at + 2], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${s})`, opacity: o, padding: "6px 34px", border: `10px solid ${color}`, borderRadius: 22, color, fontFamily: MONO, fontWeight: 700, fontSize: 120, letterSpacing: "0.12em", textShadow: `0 0 18px ${color}66`, mixBlendMode: "normal" }}>
      {text}
    </div>
  );
};

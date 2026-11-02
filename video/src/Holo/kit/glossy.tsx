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
 * Ball character ("niño-bolita", also the mom): glossy body, big eyes, small smile.
 * squash: 1 = normal, <1 flattened (landing), >1 stretched (jumping).
 * look: pupil offset in eye units ([-1..1], [-1..1]); dizzy spins the pupils and adds orbiting stars.
 * Extras: glasses (clear or pink-tinted), hair bun, eye mask, cape.
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
  glasses?: "clear" | "rosa";
  bun?: string;
  mask?: boolean;
  cape?: string;
}> = ({ position, rotation, scale = 1, color = "#ff7a1a", costume = "pumpkin", squash = 1, look = [0, 0], dizzy = 0, opacity = 1, glasses, bun, mask, cape }) => {
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
      frame: glossy(glasses === "rosa" ? "#ff4fa3" : "#2a2230", { roughness: 0.1 }),
      lens: new THREE.MeshPhysicalMaterial({ color: "#ff7cc0", transparent: true, opacity: 0.42, roughness: 0.05, clearcoat: 1, depthWrite: false }),
      bun: glossy(bun ?? "#000", { roughness: 0.3 }),
      mask: glossy("#17121c", { roughness: 0.2 }),
      cape: Object.assign(glossy(cape ?? "#000", { roughness: 0.25 }), { side: THREE.DoubleSide }),
    }),
    [color, opacity, glasses, bun, cape],
  );
  const sx = 1 / Math.sqrt(squash);
  const spin = dizzy * frame * 0.5;
  const px = (s: number) => look[0] * 0.07 + Math.cos(spin + s) * 0.05 * dizzy;
  const py = (s: number) => look[1] * 0.07 + Math.sin(spin + s) * 0.05 * dizzy;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, 0.86 * squash, 0]} scale={[sx, squash, sx]}>
        {costume === "pumpkin" ? <mesh geometry={PUMPKIN} material={mats.body} /> : <mesh geometry={EYE} material={mats.body} scale={[5, 4.3, 5]} />}
        {costume === "pumpkin" ? (
          <mesh material={mats.stem} position={[0.03, 0.9, 0]} rotation={[0, 0, -0.25]}>
            <cylinderGeometry args={[0.07, 0.12, 0.34, 16]} />
          </mesh>
        ) : null}
        {bun ? <mesh geometry={EYE} material={mats.bun} position={[0, 0.88, -0.22]} scale={1.5} /> : null}
        {cape ? (
          <mesh material={mats.cape} position={[0, -0.25, 0]} rotation={[0.12 + Math.sin(frame * 0.3) * 0.05, 0, 0]}>
            <cylinderGeometry args={[0.95, 1.3, 1.1, 32, 1, true, Math.PI * 0.62, Math.PI * 0.76]} />
          </mesh>
        ) : null}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.3, 0.16, 0.95]}>
            <mesh geometry={EYE} material={mats.eye} />
            <mesh geometry={PUPIL} material={mats.pupil} position={[px(s), py(s), 0.13]} />
            <mesh geometry={SPARK} material={mats.spark} position={[px(s) + 0.035, py(s) + 0.04, 0.22]} />
            {glasses ? (
              <>
                <mesh material={mats.frame} position={[0, 0, 0.17]}>
                  <torusGeometry args={[0.25, 0.035, 12, 40]} />
                </mesh>
                {glasses === "rosa" ? (
                  <mesh material={mats.lens} position={[0, 0, 0.18]}>
                    <circleGeometry args={[0.24, 32]} />
                  </mesh>
                ) : null}
              </>
            ) : null}
            {mask ? (
              <mesh material={mats.mask} position={[0, 0, 0.1]}>
                <torusGeometry args={[0.25, 0.08, 12, 32]} />
              </mesh>
            ) : null}
          </group>
        ))}
        {glasses ? (
          <mesh material={mats.frame} position={[0, 0.17, 1.13]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.12, 8]} />
          </mesh>
        ) : null}
        {mask ? (
          <mesh material={mats.mask} position={[0, 0.17, 1.06]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.16, 12]} />
          </mesh>
        ) : null}
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
export const Tag: React.FC<{ anchor: V3; cam: Cam; at: number; text: string; tone?: string; dy?: number; swing?: boolean; size?: number; until?: number }> = ({ anchor, cam, at, text, tone = "#ff4fa3", dy = 0, swing = false, size = 42, until }) => {
  const frame = useCurrentFrame();
  const [x0, y0] = toScreen(anchor, cam, frame);
  return <Pill x={x0} y={y0 + dy} at={at} text={text} tone={tone} swing={swing} size={size} until={until} />;
};

/** Pill label at a screen position (kept inside the frame and out of the caption band). */
export const Pill: React.FC<{ x: number; y: number; at: number; text: string; tone?: string; swing?: boolean; size?: number; until?: number }> = ({ x: x0, y: y0, at, text, tone = "#ff4fa3", swing = false, size = 42, until }) => {
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame > until + 6)) return null;
  const x = Math.min(900, Math.max(180, x0));
  const y = Math.max(440, y0);
  const fade = until !== undefined ? interpolate(frame, [until, until + 6], [1, 0], clamp) : 1;
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
        opacity: fade,
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

// ---------------------------------------------------------------- tableware & study props
function textTexture(text: string, { bg, fg, w = 512, h = 256, size = 110, weight = 800 }: { bg: string; fg: string; w?: number; h?: number; size?: number; weight?: number }) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  g.font = `${weight} ${size}px Poppins, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, w / 2, h / 2 + size * 0.05);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const PLATE = new THREE.LatheGeometry(
  [[0, 0], [0.6, 0], [0.68, 0.03], [0.78, 0.09], [0.82, 0.11], [0.79, 0.12], [0.66, 0.06], [0, 0.06]].map(([x, y]) => new THREE.Vector2(x, y)),
  56,
);
export const Plate: React.FC<{ position?: V3; scale?: number; color?: string }> = ({ position, scale = 1, color = "#ffffff" }) => {
  const mat = useMemo(() => glossy(color, { roughness: 0.12 }), [color]);
  return <mesh geometry={PLATE} material={mat} position={position} scale={scale} />;
};

const CLOCHE = new THREE.SphereGeometry(0.68, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
/** Silver serving dome; lift 0 = closed, 1 = raised. */
export const Cloche: React.FC<{ position?: V3; scale?: number; lift?: number; tilt?: number }> = ({ position = [0, 0, 0], scale = 1, lift = 0, tilt = 0 }) => {
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#e4ebf2", metalness: 0.95, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide }), []);
  return (
    <group position={[position[0], position[1] + lift * 1.1 * scale, position[2]]} rotation={[0, 0, tilt * lift]} scale={scale}>
      <mesh geometry={CLOCHE} material={mat} position={[0, 0.06, 0]} scale={[1, 0.85, 1]} />
      <mesh material={mat} position={[0, 0.68, 0]}>
        <sphereGeometry args={[0.08, 20, 14]} />
      </mesh>
    </group>
  );
};

/** Sweetener sachet. */
export const Packet: React.FC<{ position?: V3; rotation?: V3; scale?: number; color?: string }> = ({ position, rotation, scale = 1, color = "#3fd6c1" }) => {
  const { geo, mat } = useMemo(() => {
    const m = glossy("#ffffff", { roughness: 0.3, clearcoat: 0.6 });
    m.map = canvasTexture(128, (g, s) => {
      g.fillStyle = color;
      g.fillRect(0, 0, s, s);
      g.fillStyle = "#ffffff";
      g.fillRect(0, s * 0.38, s, s * 0.24);
      g.fillStyle = color;
      g.beginPath();
      g.arc(s / 2, s / 2, s * 0.09, 0, Math.PI * 2);
      g.fill();
    });
    return { geo: new RoundedBoxGeometry(0.42, 0.56, 0.05, 2, 0.02), mat: m };
  }, [color]);
  return <mesh geometry={geo} material={mat} position={position} rotation={rotation} scale={scale} />;
};

/** Small desk calendar card ("SEMANA 1"). */
export const Calendar: React.FC<{ position?: V3; rotation?: V3; scale?: number; label: string; tone?: string }> = ({ position, rotation, scale = 1, label, tone = "#ff3b5c" }) => {
  const { geo, mat } = useMemo(() => {
    const m = glossy("#ffffff", { roughness: 0.35, clearcoat: 0.5 });
    m.map = canvasTexture(256, (g, s) => {
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, s, s);
      g.fillStyle = tone;
      g.fillRect(0, 0, s, s * 0.3);
      g.fillStyle = "#ffffff";
      g.font = `800 ${s * 0.15}px Poppins, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("SEMANA", s / 2, s * 0.16);
      g.fillStyle = "#231a2b";
      g.font = `800 ${s * 0.5}px Poppins, sans-serif`;
      g.fillText(label, s / 2, s * 0.66);
    });
    return { geo: new RoundedBoxGeometry(0.6, 0.6, 0.06, 2, 0.03), mat: m };
  }, [label, tone]);
  return <mesh geometry={geo} material={mat} position={position} rotation={rotation} scale={scale} />;
};

/** Dial gauge facing the camera; value 0 (left, green) → 1 (right, red). */
export const Gauge: React.FC<{ position?: V3; scale?: number; value: number }> = ({ position, scale = 1, value }) => {
  const mats = useMemo(() => ({ back: glossy("#1d1526", { roughness: 0.2 }), g: glossy("#2fd37f", { roughness: 0.2 }), y: glossy("#ffcc1f", { roughness: 0.2 }), r: glossy("#ff3b5c", { roughness: 0.2 }), needle: glossy("#ffffff", { roughness: 0.1 }) }), []);
  const v = Math.max(0, Math.min(1, value));
  return (
    <group position={position} scale={scale}>
      <mesh material={mats.back} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.1, 56]} />
      </mesh>
      {(
        [
          ["g", (2 * Math.PI) / 3],
          ["y", Math.PI / 3],
          ["r", 0],
        ] as const
      ).map(([k, start]) => (
        <mesh key={k} material={mats[k]} position={[0, 0.02, 0.055]}>
          <ringGeometry args={[0.42, 0.6, 24, 1, start + 0.03, Math.PI / 3 - 0.06]} />
        </mesh>
      ))}
      <group position={[0, 0.02, 0.08]} rotation={[0, 0, Math.PI - v * Math.PI - Math.PI / 2]}>
        <mesh material={mats.needle} position={[0, 0.27, 0]}>
          <boxGeometry args={[0.05, 0.55, 0.03]} />
        </mesh>
      </group>
      <mesh material={mats.needle} position={[0, 0.02, 0.09]}>
        <sphereGeometry args={[0.07, 20, 14]} />
      </mesh>
    </group>
  );
};

const CUP = new THREE.LatheGeometry([[0, 0], [0.42, 0], [0.45, 0.04], [0.53, 1.15], [0.51, 1.15], [0.43, 0.08], [0, 0.08]].map(([x, y]) => new THREE.Vector2(x, y)), 56);
/** Drinking glass with a front label (frontText) that peels off (peel 0→1) to show backText. */
export const Cup: React.FC<{ position?: V3; scale?: number; drink?: string; frontText: string; frontColor: string; backText?: string; backColor?: string; peel?: number }> = ({
  position,
  scale = 1,
  drink = "#ff9ad0",
  frontText,
  frontColor,
  backText,
  backColor = "#13a59a",
  peel = 0,
}) => {
  const mats = useMemo(() => {
    const glass = new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.28, roughness: 0.03, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
    const liquid = glossy(drink, { roughness: 0.08, opacity: 0.9 });
    const front = glossy("#ffffff", { roughness: 0.3, clearcoat: 0.6 });
    front.map = textTexture(frontText, { bg: frontColor, fg: "#ffffff", w: 1024, h: 256, size: 130 });
    front.side = THREE.DoubleSide;
    front.transparent = true;
    const back = glossy("#ffffff", { roughness: 0.3, clearcoat: 0.6 });
    back.map = textTexture(backText ?? "", { bg: backColor, fg: "#ffffff", w: 1024, h: 256, size: 110 });
    return { glass, liquid, front, back };
  }, [drink, frontText, frontColor, backText, backColor]);
  mats.front.opacity = 1 - Math.max(0, peel - 0.6) / 0.4;
  return (
    <group position={position} scale={scale}>
      <mesh material={mats.liquid} position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.49, 0.44, 0.84, 48]} />
      </mesh>
      {backText ? (
        <mesh material={mats.back} position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.515, 0.5, 0.36, 48, 1, true, -0.95, 1.9]} />
        </mesh>
      ) : null}
      <group position={[peel * 1.3, 0.55 + peel * 0.9, peel * 0.6]} rotation={[0, -peel * 1.2, -peel * 0.9]}>
        <mesh material={mats.front}>
          <cylinderGeometry args={[0.525, 0.51, 0.38, 48, 1, true, -0.95, 1.9]} />
        </mesh>
      </group>
      <mesh geometry={CUP} material={mats.glass} />
    </group>
  );
};

/** Thought bubble: cloud of glossy spheres with a trail of small ones towards the thinker (lower left). */
export const ThoughtCloud: React.FC<{ position?: V3; scale?: number; grow?: number; children?: React.ReactNode }> = ({ position, scale = 1, grow = 1, children }) => {
  const mat = useMemo(() => glossy("#ffffff", { roughness: 0.25 }), []);
  const puffs: [number, number, number][] = [[0, 0, 0.5], [0.5, 0.08, 0.4], [-0.5, 0.04, 0.4], [0.24, 0.36, 0.38], [-0.24, 0.34, 0.36], [0.05, -0.2, 0.4]];
  const g = Math.max(0, grow);
  return (
    <group position={position} scale={scale * g}>
      {puffs.map(([x, y, r], i) => (
        <mesh key={i} material={mat} position={[x, y, -0.2]} scale={r}>
          <sphereGeometry args={[1, 32, 24]} />
        </mesh>
      ))}
      <mesh material={mat} position={[-0.55, -0.6, -0.1]} scale={0.13}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh material={mat} position={[-0.72, -0.85, -0.1]} scale={0.08}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      <group position={[0, 0.1, 0.35]}>{children}</group>
    </group>
  );
};

/** Magnifying glass (gold rim, faint lens, dark handle). */
export const Magnifier: React.FC<{ position?: V3; rotation?: V3; scale?: number }> = ({ position, rotation, scale = 1 }) => {
  const mats = useMemo(
    () => ({
      rim: new THREE.MeshPhysicalMaterial({ color: "#ffc93c", metalness: 0.85, roughness: 0.18, clearcoat: 1 }),
      lens: new THREE.MeshPhysicalMaterial({ color: "#cfefff", transparent: true, opacity: 0.22, roughness: 0.02, clearcoat: 1, depthWrite: false }),
      handle: glossy("#2a1d33", { roughness: 0.2 }),
    }),
    [],
  );
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh material={mats.rim}>
        <torusGeometry args={[0.55, 0.08, 20, 64]} />
      </mesh>
      <mesh material={mats.lens}>
        <circleGeometry args={[0.55, 48]} />
      </mesh>
      <mesh material={mats.handle} position={[0.68, -0.68, 0]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.09, 0.11, 0.9, 20]} />
      </mesh>
    </group>
  );
};

/** Two-pan balance; tilt in radians (positive lifts the right pan). Children: [left content, right content]. */
export const Balance: React.FC<{ position?: V3; scale?: number; tilt: number; left?: React.ReactNode; right?: React.ReactNode }> = ({ position, scale = 1, tilt, left, right }) => {
  const mats = useMemo(() => ({ metal: new THREE.MeshPhysicalMaterial({ color: "#ffd25a", metalness: 0.8, roughness: 0.2, clearcoat: 1 }), dark: glossy("#2a1d33", { roughness: 0.25 }) }), []);
  const ends = [-1, 1].map((s) => ({ s, x: s * 1.05 * Math.cos(tilt), y: 1.6 + s * 1.05 * Math.sin(tilt) }));
  return (
    <group position={position} scale={scale}>
      <mesh material={mats.dark} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.12, 40]} />
      </mesh>
      <mesh material={mats.metal} position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.6, 20]} />
      </mesh>
      <mesh material={mats.metal} position={[0, 1.6, 0]} rotation={[0, 0, tilt]}>
        <boxGeometry args={[2.2, 0.08, 0.08]} />
      </mesh>
      <mesh material={mats.metal} position={[0, 1.68, 0]}>
        <sphereGeometry args={[0.1, 20, 14]} />
      </mesh>
      {ends.map(({ s, x, y }) => (
        <group key={s} position={[x, y, 0]}>
          <mesh material={mats.metal} position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.7, 6]} />
          </mesh>
          <Plate position={[0, -0.72, 0]} scale={0.52} color="#ffe6a3" />
          <group position={[0, -0.66, 0]}>{s < 0 ? left : right}</group>
        </group>
      ))}
    </group>
  );
};

/** Lab sheet card (a stacked "experiment"). */
export const LabCard: React.FC<{ position?: V3; rotation?: V3; scale?: number; tone?: string }> = ({ position, rotation, scale = 1, tone = "#13a59a" }) => {
  const { geo, mat } = useMemo(() => {
    const m = glossy("#ffffff", { roughness: 0.4, clearcoat: 0.4 });
    m.map = canvasTexture(256, (g, s) => {
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, s, s);
      g.fillStyle = tone;
      g.fillRect(s * 0.1, s * 0.1, s * 0.5, s * 0.08);
      g.fillStyle = "#cfd6dd";
      for (let i = 0; i < 4; i++) g.fillRect(s * 0.1, s * (0.3 + i * 0.1), s * (0.8 - (i % 2) * 0.2), s * 0.04);
      g.strokeStyle = tone;
      g.lineWidth = s * 0.03;
      g.beginPath();
      g.moveTo(s * 0.1, s * 0.85);
      g.lineTo(s * 0.9, s * 0.85);
      g.stroke();
    });
    return { geo: new RoundedBoxGeometry(0.62, 0.8, 0.03, 2, 0.015), mat: m };
  }, [tone]);
  return <mesh geometry={geo} material={mat} position={position} rotation={rotation} scale={scale} />;
};

/** Party balloon with knot and string. */
export const Balloon: React.FC<{ position?: V3; color: string; scale?: number; sway?: number }> = ({ position, color, scale = 1, sway = 0 }) => {
  const mats = useMemo(() => ({ skin: glossy(color, { roughness: 0.12 }), string: glossy("#ffffff", { roughness: 0.5, clearcoat: 0 }) }), [color]);
  return (
    <group position={position} scale={scale} rotation={[0, 0, sway]}>
      <mesh material={mats.skin} scale={[0.34, 0.41, 0.34]}>
        <sphereGeometry args={[1, 36, 28]} />
      </mesh>
      <mesh material={mats.skin} position={[0, -0.43, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.06, 0.08, 12]} />
      </mesh>
      <mesh material={mats.string} position={[0, -1.05, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 1.2, 4]} />
      </mesh>
    </group>
  );
};

/** Falling confetti (instanced), started at `at` frames. */
export const Confetti: React.FC<{ at: number; count?: number; area?: [number, number]; top?: number }> = ({ at, count = 140, area = [3, 1.5], top = 4.2 }) => {
  const frame = useCurrentFrame();
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.07, 0.12), new THREE.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide }), count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) m.setColorAt(i, c.set(CANDY_COLORS[i % CANDY_COLORS.length]));
    return m;
  }, [count]);
  const t = Math.max(0, frame - at);
  const o = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const x = (random(`cfx${i}`) - 0.5) * area[0] * 2 + Math.sin(t * 0.08 + i) * 0.15;
    const y = top + random(`cfy${i}`) * 1.5 - t * (0.03 + random(`cfv${i}`) * 0.025);
    o.position.set(x, frame < at ? 99 : y, (random(`cfz${i}`) - 0.5) * area[1] * 2);
    o.rotation.set(t * 0.2 + i, t * 0.15 + i * 2, i);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

/** Glossy question mark. */
export const QuestionMark3D: React.FC<{ position?: V3; rotation?: V3; scale?: number; color?: string }> = ({ position, rotation, scale = 1, color = "#ffcc1f" }) => {
  const mat = useMemo(() => glossy(color, { roughness: 0.12, emissive: 0.1 }), [color]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh material={mat} position={[0, 0.55, 0]} rotation={[0, 0, -Math.PI * 0.45]}>
        <torusGeometry args={[0.32, 0.11, 20, 48, Math.PI * 1.45]} />
      </mesh>
      <mesh material={mat} position={[0.02, 0.05, 0]}>
        <capsuleGeometry args={[0.11, 0.22, 8, 20]} />
      </mesh>
      <mesh material={mat} position={[0.02, -0.4, 0]}>
        <sphereGeometry args={[0.13, 24, 16]} />
      </mesh>
    </group>
  );
};

/** Translucent light cone from above (spotlight on someone). */
export const SpotCone: React.FC<{ position?: V3; height?: number; radius?: number; opacity?: number; color?: string }> = ({ position, height = 3.2, radius = 1.1, opacity = 0.18, color = "#fff3c4" }) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), [color, opacity]);
  return (
    <mesh material={mat} position={[position?.[0] ?? 0, (position?.[1] ?? 0) + height / 2, position?.[2] ?? 0]}>
      <coneGeometry args={[radius, height, 40, 1, true]} />
    </mesh>
  );
};

// ---------------------------------------------------------------- 2D overlays
/** Giant pink glasses over the frame ("what we expect to see"); drop 0 = above the frame, 1 = in place. */
export const GlassesOverlay: React.FC<{ drop: number; y?: number; tint?: number }> = ({ drop, y = 960, tint = 0.3 }) => {
  if (drop <= 0) return null;
  const ty = (1 - drop) * -1400;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, transform: `translateY(${ty}px)` }}>
      <g transform={`translate(540 ${y})`}>
        {[-1, 1].map((s) => (
          <rect key={s} x={s < 0 ? -505 : 25} y={-210} width={480} height={420} rx={150} fill={`rgba(255,92,171,${tint})`} stroke="#ff2f92" strokeWidth={34} />
        ))}
        <path d="M -30 -60 Q 0 -100 30 -60" stroke="#ff2f92" strokeWidth={30} fill="none" />
        {[-1, 1].map((s) => (
          <ellipse key={s} cx={s * 300} cy={-120} rx={60} ry={26} fill="rgba(255,255,255,0.35)" transform={`rotate(-18 ${s * 300} -120)`} />
        ))}
      </g>
    </svg>
  );
};

/** White card with a line chart that draws itself (progress 0→1); flat = the line stays level. */
export const LineChart: React.FC<{ x: number; y: number; at: number; progress: number; title: string; result?: string; tone?: string }> = ({ x, y, at, progress, title, result, tone = "#13a59a" }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (o <= 0) return null;
  const w = 600, h = 150;
  const pts: string[] = [];
  for (let i = 0; i <= 60 * progress; i++) {
    const t = i / 60;
    pts.push(`${t * w},${h / 2 + Math.sin(i * 1.7) * 3}`);
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, ${(1 - o) * 30}px)`, opacity: o, padding: "22px 30px", borderRadius: 28, background: "rgba(255,255,255,0.94)", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: "0.06em", color: "#231a2b", marginBottom: 6 }}>
        <span>{title}</span>
        {result && progress > 0.98 ? <span style={{ color: tone }}>{result}</span> : null}
      </div>
      <svg width={w} height={h}>
        <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="#e3e7ec" strokeWidth={3} strokeDasharray="10 10" />
        <polyline points={pts.join(" ")} fill="none" stroke={tone} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Capsule, Cam, CYAN, GOLD, HoloStage, V3 } from "../stage";
import { ALERT, Badge, Bar, Checklist, Chip, Countdown, IdCard, Label, Meter, MONO, Notif, Phone, PredGraph, Slider, Toggle } from "./hud";
import { Brain, BRAIN, bustPoint, BUST, Dome, Feather, GlassBust, HexShield, Mri, QuestionMark, Rat, Rings, RobotArm, Signal } from "./props3d";
import { beat, Scene } from "./timeline";

// The 16 scenes, one per narration segment. Every beat (a label typing in, a
// toggle flipping, a signal travelling) is keyed to the word that triggers it.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (f: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });
const cam = (sc: Scene, from: V3, to: V3, target: V3, orbit = 0.14): Cam => ({ from, to, target, orbit, dur: sc.dur });

type P = { sc: Scene };

// 1 — "¿Por qué no puedes hacerte cosquillas a ti mismo?"
export const S01: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.15, 2.3, 10.6], [0.1, 2.2, 9.4], [0.25, 1.5, 0]);
  const hit = beat(sc, "cosquillas");
  const approach = ease(frame, 4, hit, Easing.in(Easing.quad));
  const back = ease(frame, hit, hit + 14, Easing.out(Easing.cubic));
  const fx = 1.42 - approach * 0.5 + back * 0.4;
  const impact = frame < hit ? 0 : Math.min(1, (frame - hit) / 22);
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.65}>
        <Capsule kind="glass" />
        <HexShield position={[0, 1.15, 0]} impact={impact} hitY={0.52} />
        <Feather position={[fx, 0.85 + Math.sin(frame / 9) * 0.06, 0.25]} rotation={[0, 0, 0.5 - back * 0.6]} scale={0.62} />
      </HoloStage>
      <Label anchor={[1.2, 1.55, 0.25]} cam={c} dx={-90} dy={-300} text="REMITENTE: TÚ" at={6} tone={CYAN} />
      <Chip x={540} y={1430} at={hit} tone={ALERT}>
        <span style={{ color: ALERT }}>⛨</span> BLOQUEADO
      </Chip>
    </AbsoluteFill>
  );
};

// 2 — "¿Y por qué basta con que alguien acerque la mano… para que te rías antes de que te toque?"
export const S02: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.3, 2.4, 12.4], [0.2, 2.3, 11.2], [0.15, 1.6, 0]);
  const near = beat(sc, "acerque");
  const laugh = beat(sc, "rías");
  const gx = 3.0 - ease(frame, 0, near + 10) * 1.75;
  const fx = gx - 0.75 - ease(frame, near, laugh + 6) * 0.45;
  const wob = frame > laugh ? Math.sin(frame * 0.9) * 0.06 : 0;
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.65}>
        <Capsule kind="glass" position={[-0.7, 0, 0]} rotation={[0, 0, wob + (frame > laugh ? 0.08 : 0)]} />
        <Capsule kind="gold" position={[gx, 0, 0]} />
        <Feather position={[fx, 1.2, 0.3]} rotation={[0, 0, 1.0]} scale={0.55} color="#ffd98a" />
        <Rings position={[-0.7, 2.62, 0.2]} start={laugh} every={7} count={8} color={GOLD} size={0.8} />
      </HoloStage>
      <Chip x={540} y={1430} at={near} tone="#ffb347">
        <span style={{ color: "#ffb347" }}>▲</span> ALERTA: CONTACTO
      </Chip>
      <Label anchor={[-0.7, 2.62, 0.2]} cam={c} dx={110} dy={-280} text="RISA ANTICIPADA" at={laugh + 4} />
    </AbsoluteFill>
  );
};

// 3 — "No es que tu piel falle. Es que tu cerebro sabe lo que vas a hacer… antes de que lo hagas."
export const S03: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [1.2, 3.0, 12.6], [0.9, 2.9, 11.2], [0, 2.3, 0], 0.18);
  const skin = beat(sc, "piel");
  const brain = beat(sc, "cerebro");
  const before = beat(sc, "antes");
  const pred = ease(frame, brain, before + 4);
  const act = ease(frame, before, before + 26);
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.6}>
        <GlassBust />
      </HoloStage>
      <Label anchor={[0.45, 1.1, 0.35]} cam={c} dx={120} dy={60} text="SENSORES DE PIEL: OK" at={skin} tone={CYAN} />
      {/* prediction races ahead of the action */}
      <div style={{ position: "absolute", left: 140, right: 140, top: 1440, display: "grid", gap: 22, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: "0.14em", opacity: ease(frame, brain - 4, brain + 4) }}>
        {[["PREDICCIÓN", pred, CYAN], ["ACCIÓN", act, "#e8f0ff"]].map(([label, v, color]) => (
          <div key={label as string} style={{ display: "grid", gap: 8 }}>
            <span style={{ color: color as string }}>{label as string}{(v as number) >= 1 ? " ✓" : ""}</span>
            <div style={{ height: 10, borderRadius: 5, background: "#1d2a4b" }}>
              <div style={{ height: "100%", width: `${(v as number) * 100}%`, borderRadius: 5, background: color as string, boxShadow: `0 0 12px ${color}` }} />
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// 4 — "Piénsalo así: cuando mueves la mano, tu cerebelo copia la orden, predice… y apaga la sensación."
export const S04: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0, 2.5, 10.2], [0, 2.45, 9.0], [0, 2.0, 0], 0.2);
  const cer = beat(sc, "cerebelo");
  const steps = [beat(sc, "copia"), beat(sc, "predice"), beat(sc, "apaga")];
  const glow = ease(frame, cer, cer + 8) * (0.75 + 0.25 * Math.sin(frame / 4));
  const brainRot: V3 = [0.15, Math.PI / 2 + 0.35 + frame * 0.004, 0];
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.65}>
        <Brain position={[0, 2.15, 0]} rotation={brainRot} scale={1.0} cerebGlow={glow} />
      </HoloStage>
      <Label anchor={[0.0, 1.65, -0.6]} cam={c} dx={150} dy={-380} text="CEREBELO" at={cer} />
      <Checklist x={150} y={1330} items={[{ text: "COPIA LA ORDEN", at: steps[0] }, { text: "PREDICE", at: steps[1] }, { text: "APAGA", at: steps[2] }]} />
    </AbsoluteFill>
  );
};

// 5 — "Tus propias cosquillas son un mensaje que tu cerebro ya leyó."
export const S05: React.FC<P> = ({ sc }) => {
  const c = cam(sc, [0, 2.0, 9.6], [0, 1.9, 8.6], [0, 1.3, 0]);
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.55}>
        <Capsule kind="glass" scale={0.9} />
      </HoloStage>
      <Notif x={540} y={560} at={beat(sc, "mensaje") - 6} readAt={beat(sc, "leyó")} />
    </AbsoluteFill>
  );
};

// 6 — "Pero si la mano es de otra persona, no hay predicción."
export const S06: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [2.4, 2.4, 9.4], [2.0, 2.3, 8.4], [0.3, 1.5, 0], 0.12);
  const fx = 1.6 - ease(frame, 0, sc.dur) * 0.6;
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.65}>
        <Capsule kind="glass" position={[-0.6, 0, 0]} />
        <Capsule kind="gold" position={[2.3, 0, -0.2]} />
        <Feather position={[fx, 1.3, 0.25]} rotation={[0, 0, 1.1]} scale={0.55} color="#ffd98a" />
      </HoloStage>
      <PredGraph x={540} y={1290} at={beat(sc, "otra") - 4} breakAt={beat(sc, "predicción")} />
    </AbsoluteFill>
  );
};

// 7 — "Y pasan tres cosas: la señal llega completa… el hipotálamo… se enciende… y tu cuerpo estalla en risa."
const SIGNAL: V3[] = [[0.45, 1.05, 0.35], [0.4, 1.75, 0.4], [0.18, 2.35, 0.3], [0.05, 2.8, 0.2], bustPoint(BRAIN.hypothalamus)];
export const S07: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [2.2, 3.1, 11.6], [1.7, 3.0, 10.2], [0, 2.4, 0], 0.16);
  const s1 = beat(sc, "señal"), s2 = beat(sc, "hipotálamo"), s3 = beat(sc, "risa"), lit = beat(sc, "enciende…");
  const prog = ease(frame, s1, s1 + 22);
  const hypo = ease(frame, s2, s2 + 8) * 0.6 + ease(frame, lit, lit + 6) * 0.4;
  const head: V3 = [0, BUST.headY, 0];
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.7}>
        <GlassBust hypoGlow={hypo} shake={frame > s3 ? 1 : 0} />
        <Signal points={SIGNAL} progress={prog} />
        <Rings position={[head[0], head[1], 0.2]} start={s3} every={6} count={10} size={1.55} color={GOLD} life={24} />
      </HoloStage>
      <Badge anchor={[0.45, 1.3, 0.35]} cam={c} n={1} at={s1} dx={70} />
      <Badge anchor={bustPoint(BRAIN.hypothalamus)} cam={c} n={2} at={s2} dx={80} dy={-40} />
      <Badge anchor={[0, BUST.headY + BUST.headR, 0]} cam={c} n={3} at={s3} dx={0} dy={-50} />
      <Label anchor={bustPoint(BRAIN.hypothalamus)} cam={c} dx={-200} dy={-150} text="HIPOTÁLAMO" at={s2 + 2} />
      <Label anchor={[0.42, 1.6, 0.4]} cam={c} dx={150} dy={120} text="SEÑAL COMPLETA" at={s1 + 6} tone={CYAN} />
    </AbsoluteFill>
  );
};

// 8 — "Investigadores de la Universidad de Friburgo lo vieron con resonancia magnética:"
export const S08: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [6.8, 4.4, 12.2], [5.9, 4.2, 11.0], [0, 1.7, 0.9], 0.12);
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.6}>
        <Mri slide={ease(frame, 4, sc.dur)} />
      </HoloStage>
      <Chip x={540} y={1450} at={beat(sc, "Universidad")}>
        <span style={{ color: GOLD }}>●</span> UNIVERSIDAD DE FRIBURGO · SUIZA
      </Chip>
      <Label anchor={[1.2, 2.9, 0]} cam={c} dx={-120} dy={-230} text="RESONANCIA MAGNÉTICA" at={beat(sc, "resonancia")} tone={CYAN} />
    </AbsoluteFill>
  );
};

// 9 — "el hipotálamo se activa incluso antes del contacto, solo con anticipar las cosquillas."
export const S09: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.9, 3.2, 15.2], [0.9, 3.1, 13.8], [0.9, 2.3, 0], 0.1);
  const startCount = beat(sc, "antes");
  const glow = ease(frame, beat(sc, "activa"), startCount + 20);
  const fx = 1.95 - ease(frame, 0, startCount + 10) * 0.75; // stops short of the body
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.7}>
        <GlassBust hypoGlow={glow} />
        <Capsule kind="gold" position={[2.35, 0, -0.3]} />
        <Feather position={[fx, 1.15, 0.35]} rotation={[0, 0, 1.15]} scale={0.55} color="#ffd98a" />
      </HoloStage>
      <Countdown x={540} y={1470} at={startCount - 6} step={14} />
      <Label anchor={bustPoint(BRAIN.hypothalamus)} cam={c} dx={-170} dy={-170} text="ANTICIPACIÓN" at={beat(sc, "anticipar") - 2} />
      <Chip x={540} y={1590} at={beat(sc, "contacto,")} tone="#2b3c66">
        CONTACTO: <span style={{ color: CYAN }}>0</span>
      </Chip>
    </AbsoluteFill>
  );
};

// 10 — "Pero aquí viene lo curioso."
export const S10: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0, 2.6, 11.2], [0, 2.5, 10.2], [0, 2.0, 0], 0.25);
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.75}>
        <QuestionMark position={[0, 0.2, 0]} rotation={[0, Math.sin(frame / 14) * 0.5, 0]} scale={0.88} />
      </HoloStage>
      <Chip x={540} y={1480} at={beat(sc, "curioso.") - 4} tone={GOLD}>
        <span style={{ color: GOLD, letterSpacing: "0.3em" }}>DATO CURIOSO</span>
      </Chip>
    </AbsoluteFill>
  );
};

// 11 — "En el University College London, … Sarah-Jayne Blakemore … con un robot."
export const S11: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.0, 2.3, 11.6], [-0.05, 2.2, 10.6], [-0.15, 1.4, 0]);
  const robot = beat(sc, "robot.");
  const reach = ease(frame, robot - 6, robot + 18);
  const tgt: [number, number] = [-0.95 + reach * 1.3, 0.85 + reach * 0.45];
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.6}>
        <Capsule kind="glass" position={[0.95, 0, 0]} />
        <RobotArm base={[-1.45, 0, 0.1]} target={tgt} />
      </HoloStage>
      <IdCard x={540} y={420} at={beat(sc, "neurocientífica") - 8} name="Sarah-Jayne Blakemore" role="NEUROCIENTÍFICA" org="University College London" />
    </AbsoluteFill>
  );
};

// 12 — "Si el robot copiaba su movimiento al instante … con un pequeño retraso, volvían. Cuanto más retraso, más cosquillas."
export const S12: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.1, 2.3, 11.6], [0.0, 2.2, 10.4], [-0.15, 1.4, 0]);
  const d1 = beat(sc, "retraso,"), back = beat(sc, "volvían."), d2 = beat(sc, "retraso,", 1), more = beat(sc, "cosquillas.");
  const delay = 0.04 + ease(frame, d1, d1 + 10) * 0.34 + ease(frame, d2, more + 10) * 0.6;
  const tickle = 0.15 + ease(frame, back - 4, back + 8) * 0.45 + ease(frame, d2, more + 8) * 0.4;
  const wob = Math.sin(frame * 0.8) * 0.05 * tickle;
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.62}>
        <Capsule kind="glass" position={[0.95, 0, 0]} rotation={[0, 0, wob]} />
        <RobotArm base={[-1.45, 0, 0.1]} target={[0.35, 1.3]} buzz={1} />
        {tickle > 0.5 ? <Rings position={[0.95, 2.62, 0.2]} start={back} every={8} count={12} size={0.8} /> : null}
      </HoloStage>
      <Slider x={470} y={1320} at={2} label="RETRASO DEL ROBOT" value={delay} text={delay < 0.1 ? "AL INSTANTE" : delay < 0.5 ? "PEQUEÑO" : "MÁS"} />
      <Meter x={930} y={1160} at={2} label="COSQUILLAS" value={Math.min(1, tickle)} />
    </AbsoluteFill>
  );
};

// 13 — "Y no somos los únicos. … las ratas también se ríen … con un sonido que no podemos oír…"
export const S13: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.0, 2.2, 11.4], [0.0, 2.1, 10.2], [0.0, 1.05, 0], 0.2);
  const rats = beat(sc, "ratas");
  const laugh = beat(sc, "ríen");
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.7}>
        <Rat position={[-0.05, 0, 0]} rotation={[0, -0.3, 0]} scale={0.82} jump={frame > laugh ? 1 : 0} />
        <Rings position={[0.75, 1.55, 0.1]} start={laugh} every={5} count={20} color={CYAN} size={0.5} life={22} />
      </HoloStage>
      <Chip x={540} y={1450} at={beat(sc, "Universidad")}>
        <span style={{ color: GOLD }}>●</span> UNIVERSIDAD HUMBOLDT · BERLÍN
      </Chip>
      <Label anchor={[0.75, 1.75, 0.1]} cam={c} dx={-140} dy={-300} text="50 kHz · INAUDIBLE" at={laugh + 4} tone={CYAN} />
      <Label anchor={[-0.2, 0.75, 0.2]} cam={c} dx={-120} dy={240} text="RATA" at={rats} />
    </AbsoluteFill>
  );
};

// 14 — "pero si tenían miedo, las cosquillas desaparecían."
export const S14: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.0, 2.1, 10.2], [0.0, 2.05, 9.4], [0.0, 1.05, 0], 0.12);
  const fear = beat(sc, "miedo,");
  const on = ease(frame, fear, fear + 4);
  const gone = ease(frame, beat(sc, "desaparecían."), sc.dur);
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.6}>
        <Rat position={[-0.05, 0, 0]} rotation={[0, -0.3, 0]} scale={0.82 - on * 0.12} jump={1 - on} dim={1 - on * 0.6} />
        {on < 1 ? <Rings position={[0.75, 1.55, 0.1]} start={-30} every={5} count={8} color={CYAN} size={0.5} life={22} /> : null}
      </HoloStage>
      <Chip x={420} y={1380} at={2} tone={on > 0.5 ? ALERT : "#2b3c66"}>
        MIEDO <Toggle on={on} tone={ALERT} />
      </Chip>
      <Meter x={900} y={1160} at={2} label="COSQUILLAS" value={Math.max(0, 0.9 - on * 0.5 - gone * 0.4)} tone={GOLD} />
    </AbsoluteFill>
  );
};

// 15 — "Los científicos creen… señal de confianza… alguien con quien se siente a salvo."
export const S15: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.3, 2.8, 14.2], [0.2, 2.5, 11.8], [0, 1.6, 0], 0.22);
  const conf = beat(sc, "confianza.");
  const safe = beat(sc, "salvo.");
  const rise = ease(frame, conf - 10, conf + 20);
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.7}>
        <Capsule kind="glass" position={[-0.72, 0, 0]} />
        <Capsule kind="gold" position={[0.72, 0, 0]} />
        <Dome rise={rise} radius={1.95} />
        {frame > safe ? <Rings position={[0, 1.4, 0]} start={safe} every={12} count={3} size={2.4} life={40} /> : null}
      </HoloStage>
      <Label anchor={[0, 1.95, 0]} cam={c} dx={150} dy={-420} text="ZONA SEGURA" at={conf + 8} />
      <Bar x={540} y={1450} at={beat(sc, "señal") - 4} label="CONFIANZA" value={ease(frame, conf - 6, safe)} />
    </AbsoluteFill>
  );
};

// 16 — "Mándaselo a esa persona que sabe exactamente dónde tienes cosquillas."
export const S16: React.FC<P> = ({ sc }) => {
  const c = cam(sc, [0, 2.0, 10], [0, 1.95, 9.2], [0, 1.2, 0], 0.1);
  return (
    <AbsoluteFill>
      <HoloStage cam={c} bloom={0.5}>
        <Capsule kind="glass" position={[-2.1, 0, -1.5]} scale={0.6} opacity={0.6} />
        <Capsule kind="gold" position={[2.1, 0, -1.5]} scale={0.6} opacity={0.6} />
      </HoloStage>
      <Phone at={0} pickAt={beat(sc, "persona")} sendAt={beat(sc, "cosquillas.") - 2} />
    </AbsoluteFill>
  );
};

export const SCENE_COMPONENTS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16];
export { MONO };

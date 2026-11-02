import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Capsule, Cam, HoloStage, V3 } from "../../stage";
import { Chip } from "../../kit/hud";
import { beat, Scene } from "../../kit/timeline";
import { C, camT, Dog, ease, FlatSvg, HookText, Iris, lerp, LEO, LEO_FIT, LivingRoom, Person, Pill, ProgressBar, Question, Sofa, SOFI, SOFI_FIT, Stopwatch, Waves } from "../../kit/flat";
import { TL } from "./timeline";

// One scene per narration segment, in the flat-illustration art direction:
// Leo (blue pajamas, messy hair) on his mustard sofa, his partner Sofi and
// their dog. A stopwatch runs from the first frame (the challenge: don't yawn)
// until «bostezaste». Every change is keyed to the word that triggers it.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const cam = (sc: Scene, from: V3, to: V3, target: V3, orbit = 0.14): Cam => ({ from, to, target, orbit, dur: sc.dur });

type P = { sc: Scene };

// world layout of the living room
const SEAT = 1250;
const LEO_X = 390;
const SOFI_X = 690;
const HEAD_Y = SEAT - 334;
/** Mouth centre of a seated person (world), for waves and zooms. */
const mouth = (x: number, yawn = 1): [number, number] => [x, HEAD_Y - 8 * yawn + 44 + 12 * yawn];

/** Yawn envelope: opens over `open` frames from `at`, holds, closes. */
const yawnAt = (f: number, at: number, hold = 12, open = 9, close = 14) =>
  interpolate(f, [at, at + open, at + open + hold, at + open + hold + close], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.sin) });

// ---------------------------------------------------------------- stopwatch overlay
const SW_STOP = (() => {
  const sc = TL.SCENES[12];
  return sc.from + beat(sc, "bostezaste");
})();

/** The challenge stopwatch: big under Leo's chin in the hook, then in the top-right corner until «bostezaste». */
export const StopwatchOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const move = ease(frame, 30, 50, Easing.inOut(Easing.cubic));
  const stopped = frame >= SW_STOP;
  const t = Math.min(frame, SW_STOP) / 30;
  const flash = stopped ? ((frame - SW_STOP) % 10 < 5 ? 1 : 0) : 0;
  return <Stopwatch t={t} x={interpolate(move, [0, 1], [540, 800])} y={interpolate(move, [0, 1], [1478, 452])} scale={interpolate(move, [0, 1], [1.25, 0.8])} stopped={stopped} flash={flash} />;
};

// 1 — "Apuesto a que vas a bostezar antes de que termine este video."
// Hook: close-up of sleepy Leo staring at you, TE RETO / NO BOSTECES and the
// stopwatch; at 0.3 s he yawns, the camera dives into his mouth and an iris
// opens on him finishing the yawn on the sofa.
export const S01: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const DIVE = 22;
  const IN = 37; // mouth fills the screen
  const yawnA = ease(frame, 8, 22, Easing.out(Easing.cubic));
  const dive = ease(frame, DIVE, IN, Easing.in(Easing.cubic));
  const [, my] = mouth(LEO_X);
  const z = 5 * Math.pow(9, dive) * (1 + 0.04 * ease(frame, 0, DIVE));
  const camA = camT(LEO_X, lerp(HEAD_Y - 30, my, dive), z);
  const blink = frame < 6 ? interpolate(frame, [0, 3, 6], [0.45, 1, 0.45]) : 0.45;

  const iris = interpolate(frame, [IN + 1, IN + 15], [0, 1250], { ...clamp, easing: Easing.out(Easing.cubic) });
  const yawnB = interpolate(frame, [IN, IN + 30], [0.95, 0], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const stretchB = interpolate(frame, [IN, IN + 18, IN + 40], [1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const doze = frame > IN + 46 ? Math.min(14, (frame - IN - 46) * 0.35) : 0;
  const bost = Math.max(beat(sc, "bostezar"), IN + 6);
  const end = beat(sc, "termine");
  // close on Leo, then pull back on «termine» to make room for the video's progress bar
  const back = ease(frame, end - 4, end + 12);
  const zB = lerp(1.5, 1.26, back) + 0.03 * ease(frame, IN, sc.dur);
  const camB = camT(lerp(450, 480, back), lerp(1060, 1070, back), zB);

  return (
    <AbsoluteFill style={{ background: C.mouth }}>
      {frame < IN + 2 ? (
        <FlatSvg>
          <g transform={camA}>
            <LivingRoom />
            <Sofa x={540} y={SEAT} />
            <Person x={LEO_X} y={SEAT} who={LEO} fit={LEO_FIT} yawn={yawnA} lids={yawnA > 0 ? 0.45 : blink} look={[0, 0.2]} />
          </g>
        </FlatSvg>
      ) : null}
      {frame < IN + 4 ? <HookText kicker="TE RETO:" title="NO BOSTECES" y={404} out={ease(frame, DIVE + 2, IN - 4)} /> : null}
      {frame > IN ? (
        <Iris r={iris} cx={540} cy={1000}>
          <FlatSvg>
            <g transform={camB}>
              <LivingRoom drift={frame / 300} />
              <Sofa x={540} y={SEAT} />
              <Dog x={SOFI_X - 10} y={SEAT + 24} s={0.95} wag={Math.sin(frame / 3.5)} lids={0.5} />
              <Person x={LEO_X} y={SEAT} who={LEO} fit={LEO_FIT} yawn={yawnB} stretch={stretchB} lids={yawnB > 0.1 ? 0.5 : 0.55} nod={doze} />
              <Pill x={LEO_X + 190} y={HEAD_Y - 100} text="BOSTEZO" at={bost} tail="left" />
            </g>
            <ProgressBar x={540} y={1500} w={760} at={end} />
          </FlatSvg>
        </Iris>
      ) : null}
    </AbsoluteFill>
  );
};


// 2 — "¿Pero por qué bostezamos… y por qué se contagia?"
// Leo yawns on the sofa; on «contagia» waves jump from his mouth to Sofi's and
// she yawns too. A question mark pops over each of them on each «qué».
export const S02: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const q1 = beat(sc, "qué", 0);
  const q2 = beat(sc, "qué", 1);
  const yb = beat(sc, "bostezamos");
  const cg = beat(sc, "contagia");
  const leoYawn = yawnAt(frame, yb - 3, 14);
  const sofiYawn = yawnAt(frame, cg + 10, 12);
  const z = 1.3 + 0.05 * ease(frame, 0, sc.dur);
  return (
    <AbsoluteFill>
      <FlatSvg>
        <g transform={camT(540, 1085, z)}>
          <LivingRoom drift={(frame + 130) / 300} />
          <Sofa x={540} y={SEAT} />
          <Person x={LEO_X} y={SEAT} who={LEO} fit={LEO_FIT} yawn={leoYawn} stretch={leoYawn} lids={0.5} />
          <Person x={SOFI_X} y={SEAT} who={SOFI} fit={SOFI_FIT} yawn={sofiYawn} stretch={sofiYawn * 0.8} lids={frame < cg ? 0.2 : 0.35} look={frame > yb ? [-1, 0] : [0, 0]} />
          <Waves a={mouth(LEO_X)} b={mouth(SOFI_X)} at={cg - 2} len={14} />
          <Question x={LEO_X - 165} y={HEAD_Y - 70} at={q1} rot={-12} />
          <Question x={SOFI_X + 165} y={HEAD_Y - 70} at={q2} rot={12} color={C.cyan} />
          <Pill x={540} y={HEAD_Y - 110} text="CONTAGIO" at={cg} />
        </g>
      </FlatSvg>
    </AbsoluteFill>
  );
};

// 3 — "Lo curioso es que lo hacemos desde antes de nacer… y la ciencia todavía no sabe para qué sirve."
// TODO: Una pizarra de laboratorio con la pregunta ¿PARA QUÉ SIRVE? y una científica rascándose la cabeza. En «nacer» se dibuja una cuna en la pizarra; en «no sabe» cae un sello SIN RESOLVER.
export const S03: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Lo");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 3
      </Chip>
    </AbsoluteFill>
  );
};

// 4 — "Con ecografías vieron bostezar a bebés de veinticuatro semanas… todavía dentro del vientre."
// TODO: Monitor de ecografía (abanico gris sobre fondo negro) con un bebé de perfil. En «bostezar» el bebé abre la boca; en «veinticuatro semanas» etiqueta 24 SEMANAS.
export const S04: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Con");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 4
      </Chip>
    </AbsoluteFill>
  );
};

// 5 — "No por sueño… ni por contagio."
// TODO: Dos íconos: una almohada con Zzz (SUEÑO) y dos bocas unidas por ondas (CONTAGIO). En «sueño» se tacha la almohada; en «contagio» se tachan las bocas.
export const S05: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "No");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 5
      </Chip>
    </AbsoluteFill>
  );
};

// 6 — "Los científicos creen que bostezar enfría el cerebro:"
// TODO: Cabeza de perfil con el cerebro a la vista y un termómetro rojo alto al lado. En «enfría» entra aire azul por la boca abierta y el termómetro baja.
export const S06: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Los");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 6
      </Chip>
    </AbsoluteFill>
  );
};

// 7 — "con algo frío en la frente, la gente bosteza menos."
// TODO: Leo con una bolsa de hielo azul en la frente. En «menos» un contador BOSTEZOS baja de 5 a 2.
export const S07: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "con");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 7
      </Chip>
    </AbsoluteFill>
  );
};

// 8 — "Pero aquí viene lo raro."
// TODO: Se apaga la luz y un foco ilumina un signo de interrogación gigante con la etiqueta DATO RARO.
export const S08: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Pero");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 8
      </Chip>
    </AbsoluteFill>
  );
};

// 9 — "En la Universidad de Pisa observaron a más de cien personas durante un año:"
// TODO: La torre inclinada de Pisa al fondo, un calendario que pasa sus hojas («un año») y una multitud de personitas que aparece fila a fila. Etiqueta UNIVERSIDAD DE PISA.
export const S09: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "En");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 9
      </Chip>
    </AbsoluteFill>
  );
};

// 10 — "el bostezo se contagiaba más entre familia y pareja… luego entre amigos… y mucho menos con desconocidos."
// TODO: Leo bosteza y a su lado tres grupos con su barra de CONTAGIO: en «familia y pareja» la barra se llena y bostezan; en «amigos» se llena a la mitad; en «desconocidos» apenas se mueve y el desconocido sigue serio.
export const S10: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "el");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 10
      </Chip>
    </AbsoluteFill>
  );
};

// 11 — "Y no solo pasa entre humanos: veintiuno de veintinueve perros bostezaron al ver bostezar a una persona."
// TODO: Leo bosteza frente a su perro y el perro bosteza también; luego una cuadrícula de 29 perritos donde 21 se iluminan bostezando. Etiqueta 21 DE 29.
export const S11: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Y");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 11
      </Chip>
    </AbsoluteFill>
  );
};

// 12 — "¿Es empatía? ¿O una alarma para que el grupo se mantenga despierto? Nadie lo sabe todavía."
// TODO: Pantalla partida: en «empatía» un corazón une las bocas de Leo y su pareja; en «alarma» una sirena gira sobre un grupo que se despierta; en «nadie lo sabe» aparece un signo de interrogación entre las dos mitades.
export const S12: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "¿Es");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 12
      </Chip>
    </AbsoluteFill>
  );
};

// 13 — "Así que si bostezaste viendo esto… quizá tu cerebro ya me tiene confianza."
// TODO: Vuelve el primer plano de Leo mirándote, como al inicio. En «bostezaste» el cronómetro se detiene; en «confianza» Leo guiña un ojo y aparece un corazón.
export const S13: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Así");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 13
      </Chip>
    </AbsoluteFill>
  );
};

// 14 — "Envíaselo a quien siempre te contagia los bostezos."
// TODO: Un móvil plano comparte el video con «Mi persona»; en «bostezos» las fotos de perfil de los dos contactos bostezan.
export const S14: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const c = cam(sc, [0.2, 2.4, 11.6], [0.1, 2.3, 10.4], [0, 1.6, 0]);
  const first = beat(sc, "Envíaselo");
  return (
    <AbsoluteFill>
      <HoloStage cam={c}>
        <Capsule kind="glass" rotation={[0, Math.sin(frame / 30) * 0.2, 0]} />
      </HoloStage>
      <Chip x={540} y={1450} at={first}>
        ESCENA 14
      </Chip>
    </AbsoluteFill>
  );
};

export const SCENE_COMPONENTS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14];

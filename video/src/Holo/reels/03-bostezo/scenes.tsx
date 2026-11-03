import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
} from "remotion";
import { beat, Scene } from "../../kit/timeline";
import {
  C,
  camT,
  Dog,
  DRA,
  DRA_FIT,
  ease,
  FlatSvg,
  Head,
  HookText,
  Iris,
  lerp,
  LEO,
  LEO_FIT,
  LivingRoom,
  Look,
  Outfit,
  Person,
  Pill,
  pop,
  ProgressBar,
  Question,
  Sofa,
  SOFI,
  SOFI_FIT,
  Stopwatch,
  useSh,
  Waves,
} from "../../kit/flat";
import {
  AirFlow,
  Board,
  Bust,
  CalendarFlip,
  Chalk,
  CounterCard,
  Cross,
  DogFace,
  Heart,
  IcePack,
  Lab,
  Magnifier,
  Meter,
  Mini,
  PisaTower,
  ProfileHead,
  Siren,
  Spotlight,
  Stamp,
  Thermo,
  Ultrasound,
  Zzz,
  FlatEndCard,
} from "../../kit/flatProps";
import { SANS } from "../../kit/hud";
import { TL } from "./timeline";

// One scene per narration segment, in the flat-illustration art direction:
// Leo (blue pajamas, messy hair) on his mustard sofa, his partner Sofi and
// their dog. A stopwatch runs from the first frame (the challenge: don't yawn)
// until «bostezaste». Every change is keyed to the word that triggers it.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type P = { sc: Scene };

// world layout of the living room
const SEAT = 1250;
const LEO_X = 390;
const SOFI_X = 690;
const HEAD_Y = SEAT - 334;
/** Mouth centre of a seated person (world), for waves and zooms. */
const mouth = (x: number, yawn = 1): [number, number] => [
  x,
  HEAD_Y - 8 * yawn + 44 + 12 * yawn,
];

/** Yawn envelope: opens over `open` frames from `at`, holds, closes. */
const yawnAt = (f: number, at: number, hold = 12, open = 9, close = 14) =>
  interpolate(
    f,
    [at, at + open, at + open + hold, at + open + hold + close],
    [0, 1, 1, 0],
    { ...clamp, easing: Easing.inOut(Easing.sin) },
  );

// ---------------------------------------------------------------- stopwatch overlay
const S13_FROM = TL.SCENES[12].from;
const S14_FROM = TL.SCENES[13].from;
const S15_FROM = TL.SCENES[14].from;
const SW_STOP = S13_FROM + beat(TL.SCENES[12], "bostezaste");

/** The challenge stopwatch: big under Leo's chin in the hook, then in the top-right corner, back under his chin for the loop, stops at «bostezaste». */
export const StopwatchOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const move =
    ease(frame, 30, 50, Easing.inOut(Easing.cubic)) -
    ease(frame, S13_FROM, S13_FROM + 14, Easing.inOut(Easing.cubic)) +
    ease(frame, S14_FROM, S14_FROM + 12, Easing.inOut(Easing.cubic));
  const stopped = frame >= SW_STOP;
  const t = Math.min(frame, SW_STOP) / 30;
  const flash = stopped ? ((frame - SW_STOP) % 10 < 5 ? 1 : 0) : 0;
  // the academy promo (scene 15) gets the screen to itself
  return (
    <AbsoluteFill style={{ opacity: 1 - ease(frame, S15_FROM, S15_FROM + 8) }}>
      <Stopwatch
        t={t}
        x={interpolate(move, [0, 1], [540, 800])}
        y={interpolate(move, [0, 1], [1478, 452])}
        scale={interpolate(move, [0, 1], [1.25, 0.8])}
        stopped={stopped}
        flash={flash}
      />
    </AbsoluteFill>
  );
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
  const blink =
    frame < 6 ? interpolate(frame, [0, 3, 6], [0.45, 1, 0.45]) : 0.45;

  const iris = interpolate(frame, [IN + 1, IN + 15], [0, 1250], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const yawnB = interpolate(frame, [IN, IN + 30], [0.95, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const stretchB = interpolate(frame, [IN, IN + 18, IN + 40], [1, 1, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
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
            <Person
              x={LEO_X}
              y={SEAT}
              who={LEO}
              fit={LEO_FIT}
              yawn={yawnA}
              lids={yawnA > 0 ? 0.45 : blink}
              look={[0, 0.2]}
            />
          </g>
        </FlatSvg>
      ) : null}
      {frame < IN + 4 ? (
        <HookText
          kicker="TE RETO:"
          title="NO BOSTECES"
          y={404}
          out={ease(frame, DIVE + 2, IN - 4)}
        />
      ) : null}
      {frame > IN ? (
        <Iris r={iris} cx={540} cy={1000}>
          <FlatSvg>
            <g transform={camB}>
              <LivingRoom drift={frame / 300} />
              <Sofa x={540} y={SEAT} />
              <Dog
                x={SOFI_X - 10}
                y={SEAT + 24}
                s={0.95}
                wag={Math.sin(frame / 3.5)}
                lids={0.5}
              />
              <Person
                x={LEO_X}
                y={SEAT}
                who={LEO}
                fit={LEO_FIT}
                yawn={yawnB}
                stretch={stretchB}
                lids={yawnB > 0.1 ? 0.5 : 0.55}
                nod={doze}
              />
              <Pill
                x={LEO_X + 190}
                y={HEAD_Y - 100}
                text="BOSTEZO"
                at={bost}
                tail="left"
              />
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
          <Person
            x={LEO_X}
            y={SEAT}
            who={LEO}
            fit={LEO_FIT}
            yawn={leoYawn}
            stretch={leoYawn}
            lids={0.5}
          />
          <Person
            x={SOFI_X}
            y={SEAT}
            who={SOFI}
            fit={SOFI_FIT}
            yawn={sofiYawn}
            stretch={sofiYawn * 0.8}
            lids={frame < cg ? 0.2 : 0.35}
            look={frame > yb ? [-1, 0] : [0, 0]}
          />
          <Waves a={mouth(LEO_X)} b={mouth(SOFI_X)} at={cg - 2} len={14} />
          <Question x={LEO_X - 165} y={HEAD_Y - 70} at={q1} rot={-12} />
          <Question
            x={SOFI_X + 165}
            y={HEAD_Y - 70}
            at={q2}
            rot={12}
            color={C.cyan}
          />
          <Pill x={540} y={HEAD_Y - 110} text="CONTAGIO" at={cg} />
        </g>
      </FlatSvg>
    </AbsoluteFill>
  );
};

// 3 — "Lo curioso es que lo hacemos desde antes de nacer… y la ciencia todavía no sabe para qué sirve."
// Lab: chalkboard ¿PARA QUÉ SIRVE? and a scientist scratching her head. She
// yawns on «hacemos»; on «nacer» a belly with a curled-up baby is chalked on the
// board; on «sabe» a SIN RESOLVER stamp; on «sirve» she shrugs.
export const S03: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const hac = beat(sc, "hacemos");
  const nac = beat(sc, "nacer");
  const cie = beat(sc, "ciencia");
  const sab = beat(sc, "sabe");
  const sir = beat(sc, "sirve");
  const yawn = yawnAt(frame, hac - 2, 10);
  const draw = (a: number, len = 12) =>
    ease(frame, nac - 2 + a, nac - 2 + a + len, Easing.inOut(Easing.quad));
  const point = ease(frame, nac - 4, nac + 4) - ease(frame, cie - 2, cie + 6);
  const shrug = ease(
    frame,
    Math.min(sab + 6, sir - 4),
    Math.min(sab + 14, sir + 4),
  );
  const scratch = Math.max(0, 1 - yawn * 2 - point - shrug);
  const z = 1 + 0.03 * ease(frame, 0, sc.dur);
  const shake = frame >= sab && frame < sab + 6 ? Math.sin(frame * 3) * 6 : 0;
  return (
    <AbsoluteFill>
      <FlatSvg>
        <g transform={`${camT(540, 1000, z)} translate(${shake} 0)`}>
          <Lab />
          <Board x={340} y={900} w={560} h={480}>
            <text
              x={0}
              y={-170}
              textAnchor="middle"
              fontFamily={SANS}
              fontWeight={700}
              fontSize={52}
              fill="#eef3ea"
              opacity={0.92}
            >
              ¿PARA QUÉ SIRVE?
            </text>
            <Chalk
              d="M -230 40 a 130 130 0 1 0 260 0 a 130 130 0 1 0 -260 0"
              p={draw(0, 12)}
            />
            <Chalk
              d="M -188 0 a 48 48 0 1 0 96 0 a 48 48 0 1 0 -96 0"
              p={draw(8, 8)}
            />
            <Chalk
              d="M -104 34 C -40 30 0 80 -20 120 C -40 150 -100 140 -120 110 C -128 96 -118 80 -104 78"
              p={draw(13, 9)}
            />
            <Chalk d="M -112 70 Q -140 84 -150 56" p={draw(18, 5)} width={7} />
            <Chalk
              d="M -164 -14 Q -156 -8 -148 -14"
              p={draw(20, 4)}
              width={6}
            />
            <Chalk
              d="M -170 18 m -8 0 a 8 11 0 1 0 16 0 a 8 11 0 1 0 -16 0"
              p={draw(23, 5)}
              width={6}
            />
            <Chalk
              d="M 110 -60 Q 150 -110 200 -64 Q 224 -30 176 -6 L 176 30 M 176 66 L 176 68"
              p={ease(frame, sab, sab + 10)}
              width={11}
            />
            <Chalk
              d="M 70 60 Q 98 30 128 60 Q 144 82 116 96 L 116 116 M 116 140 L 116 142"
              p={ease(frame, sab + 6, sab + 16)}
              width={8}
            />
          </Board>
          <Person
            x={800}
            y={1170}
            s={1.08}
            seated={false}
            who={DRA}
            fit={DRA_FIT}
            yawn={yawn}
            scratch={scratch}
            point={point}
            shrug={shrug}
            look={[-1, 0]}
            brows={frame > cie ? 0.7 : 0}
          />
          <Pill x={340} y={1245} text="ANTES DE NACER" size={38} at={nac} />
          <Stamp x={400} y={1050} text="SIN RESOLVER" at={sab} size={58} />
        </g>
      </FlatSvg>
    </AbsoluteFill>
  );
};

// 4 — "Con ecografías vieron bostezar a bebés de veinticuatro semanas… todavía dentro del vientre."
// Ultrasound monitor: the baby resolves on «ecografías» and yawns on
// «bostezar»; 24 SEMANAS on «veinticuatro»; on «vientre» the camera pulls back
// to the probe on the belly.
export const S04: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const eco = beat(sc, "ecografías");
  const bos = beat(sc, "bostezar");
  const vei = beat(sc, "veinticuatro");
  const vie = beat(sc, "vientre");
  const yawn = Math.max(
    yawnAt(frame, bos - 2, 14, 8, 12),
    yawnAt(frame, vei + 26, 12, 8, 12),
  );
  const back = ease(frame, vie - 6, vie + 12);
  const z = lerp(1.42, 1.0, back);
  return (
    <AbsoluteFill>
      <FlatSvg>
        <g transform={camT(540, lerp(840, 1010, back), z)}>
          <rect x={-400} y={-400} width={1880} height={2600} fill="#e4ecef" />
          <rect x={-400} y={1300} width={1880} height={900} fill="#c7d6dc" />
          <path
            d="M 640 1370 C 520 1440 260 1420 230 1180"
            stroke="#2a3240"
            strokeWidth={14}
            fill="none"
          />
          <Ultrasound
            x={540}
            y={830}
            baby={ease(frame, eco, eco + 12)}
            yawn={yawn}
          />
          <rect
            x={-200}
            y={1480}
            width={1480}
            height={500}
            rx={40}
            fill="#7fc3b6"
          />
          <ellipse cx={1010} cy={1430} rx={240} ry={190} fill="#b28ad8" />
          <ellipse cx={700} cy={1640} rx={430} ry={300} fill="#e9b48c" />
          <ellipse
            cx={660}
            cy={1420}
            rx={60}
            ry={18}
            fill="#cfe7f2"
            opacity={0.8}
          />
          <g transform="translate(650 1350) rotate(-24)">
            <rect
              x={-34}
              y={-90}
              width={68}
              height={130}
              rx={30}
              fill="#eef2f6"
            />
            <rect x={-34} y={-30} width={68} height={22} fill={C.blue} />
          </g>
          <Pill
            x={380}
            y={560}
            text="24 SEMANAS"
            size={44}
            at={vei}
            tail="down"
          />
          <Pill x={720} y={1280} text="VIENTRE" size={42} at={vie + 4} />
        </g>
      </FlatSvg>
    </AbsoluteFill>
  );
};

// 5 — "No por sueño… ni por contagio."
// Two cards: a pillow with Zzz (SUEÑO) and two yawning faces linked by waves
// (CONTAGIO); each gets a red cross on its word.
export const S05: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const sue = beat(sc, "sueño");
  const con = beat(sc, "contagio");
  const card = (y: number, at: number, children: React.ReactNode) => (
    <g transform={`translate(540 ${y}) scale(${pop(frame, at, 8)})`}>
      <rect x={-400} y={-200} width={800} height={400} rx={44} fill="#fff" />
      {children}
    </g>
  );
  const wobble = Math.sin(frame / 6) * 4;
  return (
    <AbsoluteFill>
      <FlatSvg bg="#f3e3c8">
        <circle cx={540} cy={1000} r={620} fill="#efd7b2" />
        <ShadowGroup>
          {card(
            760,
            0,
            <g>
              <path
                d={`M -170 ${-60 + wobble} Q -200 -10 -170 70 Q 0 110 170 70 Q 200 -10 170 ${-60 - wobble} Q 0 -100 -170 ${-60 + wobble} Z`}
                fill="#cfe0ff"
              />
              <path
                d="M -120 -20 Q 0 -40 120 -20"
                stroke="#aac4f2"
                strokeWidth={8}
                fill="none"
                strokeLinecap="round"
              />
              <g transform="translate(-30 -6) rotate(-72) scale(0.82)">
                <Head who={LEO} lids={1} />
              </g>
              <Zzz x={170} y={-50} size={62} />
            </g>,
          )}
          {card(
            1240,
            4,
            <g>
              <g transform="translate(-200 0) scale(0.95)">
                <Head who={LEO} yawn={0.9} />
              </g>
              <g transform="translate(200 0) scale(0.95) ">
                <Head who={SOFI} yawn={yawnAt(frame, 6, 30)} />
              </g>
              <Waves
                a={[-130, 50]}
                b={[130, 50]}
                at={Math.floor(frame / 24) * 24}
                len={14}
              />
            </g>,
          )}
        </ShadowGroup>
        <Pill x={540} y={575} text="SUEÑO" at={2} size={44} />
        <Pill x={540} y={1055} text="CONTAGIO" at={6} size={44} />
        <Cross x={540} y={770} size={330} at={sue} />
        <Cross x={540} y={1250} size={330} at={con} />
      </FlatSvg>
    </AbsoluteFill>
  );
};

/** Applies the kit's hard shadow to a group (cards, buildings). */
const ShadowGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <g filter={useSh()}>{children}</g>
);

// 6 — "Los científicos creen que bostezar enfría el cerebro:"
// Leo in profile with his brain showing, hot (red, heat lines) next to a high
// thermometer, HIPÓTESIS label. He yawns on «bostezar»; on «enfría» cold air
// runs through his mouth up to the brain, which turns blue as the thermometer drops.
export const S06: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const bos = beat(sc, "bostezar");
  const enf = beat(sc, "enfría");
  const yawn = interpolate(
    frame,
    [bos - 4, bos + 6, enf + 24, enf + 36],
    [0, 1, 1, 0.1],
    { ...clamp, easing: Easing.inOut(Easing.sin) },
  );
  const air = ease(frame, enf - 2, enf + 16, Easing.out(Easing.cubic));
  const cool = ease(frame, enf + 4, enf + 22);
  const bg = interpolateColor(cool);
  const heat = 1 - cool;
  return (
    <AbsoluteFill>
      <FlatSvg bg={bg}>
        <circle cx={500} cy={1020} r={470} fill="#fff" opacity={0.28} />
        <g opacity={heat}>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M ${400 + i * 70} ${700 - Math.sin(frame / 4 + i) * 8} q 15 -25 0 -50 q -15 -25 0 -50`}
              stroke={C.orange}
              strokeWidth={12}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </g>
        <ProfileHead x={460} y={1080} s={1.55} yawn={yawn} cool={cool} />
        <AirFlow
          d="M 1000 1190 Q 860 1150 712 1196 Q 620 1180 580 1080 Q 540 990 500 950"
          p={air}
        />
        <Thermo
          x={880}
          y={1270}
          s={1.15}
          level={lerp(0.88, 0.34, cool)}
          cold={cool}
        />
        <Pill x={400} y={560} text="HIPÓTESIS" at={2} size={44} />
        <Pill
          x={480}
          y={1490}
          text="CEREBRO MÁS FRÍO"
          at={enf + 18}
          size={38}
        />
      </FlatSvg>
    </AbsoluteFill>
  );
};

// 7 — "con algo frío en la frente, la gente bosteza menos."
// Leo on the sofa: an ice pack appears on «frío» and lands on his forehead on
// «frente»; he shivers and wakes up; the BOSTEZOS counter drops 5 → 2 on «menos».
export const S07: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const fri = beat(sc, "frío");
  const fre = beat(sc, "frente");
  const bos = beat(sc, "bosteza");
  const men = beat(sc, "menos");
  const drop = interpolate(frame, [fre - 2, fre + 6], [0, 1], {
    ...clamp,
    easing: Easing.bounce,
  });
  const packY =
    frame < fri
      ? -400
      : lerp(
          lerp(HEAD_Y - 150, HEAD_Y - 135, Math.sin(frame / 4) * 0.5 + 0.5),
          HEAD_Y - 52,
          drop,
        );
  const shiver =
    frame >= fre + 4 && frame < fre + 20 ? Math.sin(frame * 2.6) * 3 : 0;
  const tryYawn = interpolate(
    frame,
    [bos - 2, bos + 5, bos + 12],
    [0, 0.3, 0],
    clamp,
  );
  const lids =
    frame < fre + 6 ? 0.55 : lerp(0.55, 0.05, ease(frame, fre + 6, fre + 14));
  const ticks = [men, men + 4, men + 8];
  const value = 5 - ticks.filter((t) => frame >= t).length;
  return (
    <AbsoluteFill>
      <FlatSvg>
        <g transform={camT(450 + shiver, 1010, 1.95)}>
          <LivingRoom drift={(frame + 600) / 300} />
          <Sofa x={540} y={SEAT} />
          <Person
            x={LEO_X}
            y={SEAT}
            who={LEO}
            fit={LEO_FIT}
            yawn={tryYawn}
            lids={lids}
            brows={frame > fre + 4 ? 0.5 : 0}
          />
          <IcePack
            x={LEO_X}
            y={packY}
            s={0.62}
            rot={frame < fre ? Math.sin(frame / 5) * 8 : -4}
          />
          {frame > fre
            ? [0, 1, 2, 3].map((i) => {
                const t = (frame - fre + i * 6) % 24;
                return (
                  <path
                    key={i}
                    d="M 0 -16 L 4 -4 L 16 0 L 4 4 L 0 16 L -4 4 L -16 0 L -4 -4 Z"
                    transform={`translate(${LEO_X - 90 + i * 60} ${HEAD_Y - 90 - t * 2})`}
                    fill="#8fd0ff"
                    opacity={Math.sin((Math.PI * t) / 24)}
                  />
                );
              })
            : null}
        </g>
        <Pill x={790} y={640} text="FRÍO" at={fri} size={44} bg="#d8f0ff" />
        <CounterCard
          x={800}
          y={900}
          label="BOSTEZOS"
          value={value}
          bumpAt={ticks}
          at={4}
          color={value <= 2 ? C.green : C.red}
        />
      </FlatSvg>
    </AbsoluteFill>
  );
};

// 8 — "Pero aquí viene lo raro."
// Lights off: a spotlight clicks on and a giant question mark drops into it.
export const S08: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const aqu = beat(sc, "aquí");
  const rar = beat(sc, "raro");
  const on = frame < 3 ? 0 : 1;
  const qy = interpolate(frame, [aqu, aqu + 10], [-500, 1020], {
    ...clamp,
    easing: Easing.bounce,
  });
  return (
    <AbsoluteFill>
      <FlatSvg bg={C.navy}>
        <Spotlight x={540} y={1400} w={640} on={on} />
        {frame >= aqu ? <QuestionStatic x={540} y={qy} size={600} /> : null}
        <Pill
          x={540}
          y={1500}
          text="DATO RARO"
          at={rar}
          size={50}
          bg={C.yellow}
        />
      </FlatSvg>
    </AbsoluteFill>
  );
};

const QuestionStatic: React.FC<{ x: number; y: number; size: number }> = ({
  x,
  y,
  size,
}) => {
  const frame = useCurrentFrame();
  return (
    <ShadowGroup>
      <text
        x={x}
        y={y + size * 0.36}
        textAnchor="middle"
        fontFamily={SANS}
        fontWeight={800}
        fontSize={size}
        fill={C.yellow}
        transform={`rotate(${Math.sin(frame / 6) * 4} ${x} ${y})`}
      >
        ?
      </text>
    </ShadowGroup>
  );
};

// 9 — "En la Universidad de Pisa observaron a más de cien personas durante un año:"
// The leaning tower; UNIVERSIDAD DE PISA; on «observaron» rows of people fill the
// lawn while a magnifier sweeps over them; +100 PERSONAS; a calendar flips a year.
const CROWD_TOPS = [
  "#ef5a36",
  "#3f74d6",
  "#4caf72",
  "#f39a2e",
  "#8e6bd8",
  "#43c0e8",
  "#e86d9a",
];
const CROWD_SKIN = ["#eab58e", "#b97b53", "#f1c6a2", "#8d5a3b", "#d9a07a"];
const CROWD_HAIR = ["#3b2a22", "#1e1a1d", "#b8552e", "#6b4a2b", "#d8b26a"];
export const S09: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const uni = beat(sc, "Universidad");
  const obs = beat(sc, "observaron");
  const cie = beat(sc, "cien");
  const dur = beat(sc, "durante");
  const ano = beat(sc, "año");
  const rows = [
    { y: 1330, n: 7, s: 1.0 },
    { y: 1440, n: 8, s: 1.1 },
    { y: 1550, n: 9, s: 1.2 },
  ];
  const sweep = ease(frame, obs, obs + 40, Easing.inOut(Easing.sin));
  return (
    <AbsoluteFill>
      <FlatSvg bg={C.sky}>
        <ellipse cx={560} cy={660} rx={110} ry={44} fill={C.cloud} />
        <ellipse cx={980} cy={1000} rx={90} ry={36} fill={C.cloud} />
        <PisaTower
          x={790}
          y={1190}
          s={1.12}
          tilt={5 + Math.sin(frame / 20) * 0.4}
        />
        <rect x={-10} y={1180} width={1100} height={760} fill="#8cc66d" />
        <rect x={-10} y={1180} width={1100} height={18} fill="#77b25a" />
        {rows.map((r, ri) =>
          Array.from({ length: r.n }, (_, i) => {
            const at = obs + ri * 5 + i;
            if (frame < at) return null;
            const k = pop(frame, at, 6);
            const x = 100 + (i + (ri % 2) * 0.5) * (880 / (r.n - 0.5));
            const id = ri * 13 + i;
            return (
              <g
                key={`${ri}-${i}`}
                transform={`translate(${x} ${r.y}) scale(${k}) translate(${-x} ${-r.y})`}
              >
                <Mini
                  x={x}
                  y={r.y}
                  s={r.s}
                  body={CROWD_TOPS[id % 7]}
                  skin={CROWD_SKIN[id % 5]}
                  hair={CROWD_HAIR[(id * 3) % 5]}
                  seed={id}
                  lids={0.3}
                />
              </g>
            );
          }),
        )}
        {frame >= obs ? (
          <Magnifier
            x={lerp(140, 900, sweep)}
            y={1290 + Math.sin(sweep * Math.PI * 3) * 50}
            s={1.05}
          />
        ) : null}
        <Pill x={430} y={575} text="UNIVERSIDAD DE PISA" at={uni} size={42} />
        {frame >= dur ? (
          <g transform={`translate(220 800) scale(${pop(frame, dur, 8)})`}>
            <CalendarFlip x={0} y={0} at={dur + 2} s={0.82} />
          </g>
        ) : null}
        <Pill x={220} y={950} text="1 AÑO" at={ano} size={40} />
        <Pill
          x={330}
          y={1085}
          text="+100 PERSONAS"
          at={cie}
          size={40}
          bg={C.yellow}
        />
      </FlatSvg>
    </AbsoluteFill>
  );
};

// 10 — "el bostezo se contagiaba más entre familia y pareja… luego entre amigos… y mucho menos con desconocidos."
// Leo yawns at the left; three groups with a CONTAGIO meter: family and partner
// (full, both yawn), friends (half, one yawns), strangers (barely, stay serious).
const MOM: Look = {
  skin: "#e8b48f",
  shade: "#d4976f",
  hair: "#c9ccd1",
  style: "bun",
  blush: "#f08a7a",
  glasses: "round",
};
const AMIGO: Look = {
  skin: "#8d5a3b",
  shade: "#744628",
  hair: "#1e1a1d",
  style: "short",
};
const AMIGA: Look = {
  skin: "#f1c6a2",
  shade: "#dca27c",
  hair: "#d8b26a",
  style: "bun",
  blush: "#f08a7a",
};
const EXTRANO: Look = {
  skin: "#d9a07a",
  shade: "#c0855f",
  hair: "#4a4a4a",
  style: "bald",
  glasses: "sun",
};
const EXTRANA: Look = {
  skin: "#b97b53",
  shade: "#9c6240",
  hair: "#5a2d1a",
  style: "short",
};
const fit = (top: string): Outfit => ({
  top,
  trim: "#ffffff",
  bottom: C.navy,
  shoes: C.navy,
});
export const S10: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const fam = beat(sc, "familia");
  const lue = beat(sc, "luego");
  const ami = beat(sc, "amigos");
  const muc = beat(sc, "mucho");
  const des = beat(sc, "desconocidos");
  const leoYawn = Math.max(
    yawnAt(frame, fam - 8, 10),
    yawnAt(frame, ami - 8, 10),
    yawnAt(frame, des - 8, 10),
  );
  const LEO_MOUTH: [number, number] = [200, 1120];
  const rows = [
    {
      y: 720,
      at: 0,
      beatAt: fam,
      label: "FAMILIA Y PAREJA",
      value: 0.92,
      color: C.red,
      people: [
        [SOFI, SOFI_FIT.top],
        [MOM, "#8e6bd8"],
      ] as const,
      yawns: [true, true],
    },
    {
      y: 1030,
      at: lue,
      beatAt: ami,
      label: "AMIGOS",
      value: 0.55,
      color: C.orange,
      people: [
        [AMIGO, C.orange],
        [AMIGA, C.cyan],
      ] as const,
      yawns: [true, false],
    },
    {
      y: 1340,
      at: muc,
      beatAt: des,
      label: "DESCONOCIDOS",
      value: 0.12,
      color: C.grey,
      people: [
        [EXTRANO, "#5b6472"],
        [EXTRANA, "#a3746b"],
      ] as const,
      yawns: [false, false],
    },
  ];
  return (
    <AbsoluteFill>
      <FlatSvg bg={C.wall}>
        <rect x={0} y={1440} width={1080} height={480} fill={C.wallDark} />
        <Bust
          x={200}
          y={1240}
          s={1.1}
          who={LEO}
          fit={LEO_FIT}
          yawn={leoYawn}
          lids={0.4}
        />
        <Pill x={200} y={1440} text="LEO" at={0} size={36} />
        {rows.map((r, i) => {
          if (frame < r.at) return null;
          const fill =
            r.value *
            ease(frame, r.beatAt, r.beatAt + 16, Easing.out(Easing.cubic));
          return (
            <g
              key={i}
              transform={`translate(0 ${(1 - pop(frame, r.at, 8)) * 60})`}
              opacity={pop(frame, r.at, 8)}
            >
              <Pill x={700} y={r.y - 190} text={r.label} at={r.at} size={36} />
              {r.people.map(([who, top], j) => (
                <Bust
                  key={j}
                  x={470 + j * 145}
                  y={r.y}
                  s={0.62}
                  who={who}
                  fit={fit(top)}
                  yawn={
                    r.yawns[j] ? yawnAt(frame, r.beatAt + 8 + j * 5, 12) : 0
                  }
                  lids={r.yawns[j] ? 0.3 : 0}
                  brows={!r.yawns[j] && frame > r.beatAt + 6 ? 0.6 : 0}
                />
              ))}
              <Meter
                x={695}
                y={r.y - 30}
                w={265}
                value={fill}
                color={r.color}
                at={r.at}
              />
              <Waves
                a={LEO_MOUTH}
                b={[410, r.y - 70]}
                at={r.beatAt - 4}
                len={12}
              />
            </g>
          );
        })}
      </FlatSvg>
    </AbsoluteFill>
  );
};

// 11 — "Y no solo pasa entre humanos: veintiuno de veintinueve perros bostezaron al ver bostezar a una persona."
// Leo yawns in front of his dog and the dog yawns back; on «veintiuno» an iris
// opens a grid of 29 dogs, 21 of them light up yawning; 21 DE 29.
const LIT = (() => {
  const order = Array.from({ length: 29 }, (_, i) => i).sort(
    (a, b) => random(`d${a}`) - random(`d${b}`),
  );
  return new Map(order.slice(0, 21).map((d, k) => [d, k]));
})();
export const S11: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const hum = beat(sc, "humanos");
  const vei = beat(sc, "veintiuno");
  const vnt = beat(sc, "veintinueve");
  const bzr = beat(sc, "bostezaron");
  const per = beat(sc, "persona");
  const leoYawn = yawnAt(frame, hum - 10, 12);
  const dogYawn = yawnAt(frame, hum + 6, 12);
  const iris = interpolate(frame, [vei - 2, vei + 12], [0, 1250], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill>
      {frame < vei + 12 ? (
        <FlatSvg>
          <g transform={camT(560, 1160, 1.42)}>
            <LivingRoom drift={(frame + 900) / 300} />
            <Sofa x={540} y={SEAT} />
            <Person
              x={LEO_X}
              y={SEAT}
              who={LEO}
              fit={LEO_FIT}
              yawn={leoYawn}
              stretch={leoYawn}
              lids={0.4}
            />
            <Dog
              x={720}
              y={1530}
              s={1.05}
              yawn={dogYawn}
              wag={Math.sin(frame / 3)}
              lids={0.2}
            />
            <Waves a={mouth(LEO_X)} b={[720, 1400]} at={hum - 2} len={12} />
            <Pill x={720} y={1180} text="PERRO" at={hum + 2} size={42} />
          </g>
        </FlatSvg>
      ) : null}
      {frame >= vei - 2 ? (
        <Iris r={iris} cx={560} cy={1110}>
          <FlatSvg bg="#d7efe9">
            {Array.from({ length: 29 }, (_, i) => {
              const col = i % 6,
                row = Math.floor(i / 6);
              const x = 135 + col * 162 + (row === 4 ? 81 : 0);
              const y = 640 + row * 172;
              const k = LIT.get(i);
              const at = vei + 6 + (k ?? 0) * 1.6;
              const on = k === undefined ? 0 : ease(frame, at, at + 4);
              const yawn =
                k === undefined
                  ? 0
                  : Math.max(
                      yawnAt(frame, at, 10, 6, 10),
                      yawnAt(frame, bzr + (k % 7) * 2, 10, 6, 10),
                    );
              return (
                <DogFace
                  key={i}
                  x={x}
                  y={y}
                  s={0.82}
                  on={on}
                  yawn={yawn}
                  tone={["#d58a3c", "#b07a4a", "#e0b070", "#8a5a3a"][i % 4]}
                />
              );
            })}
            <Pill
              x={540}
              y={1480}
              text="21 DE 29"
              at={vnt}
              size={56}
              bg={C.yellow}
            />
            <Pill
              x={540}
              y={530}
              text="AL VER BOSTEZAR A UNA PERSONA"
              at={per}
              size={30}
            />
          </FlatSvg>
        </Iris>
      ) : null}
    </AbsoluteFill>
  );
};

// 12 — "¿Es empatía? ¿O una alarma para que el grupo se mantenga despierto? Nadie lo sabe todavía."
// Split screen. Top: a heart links Leo and Sofi, who yawn together (EMPATÍA).
// Bottom: a siren spins over a dozing group that wakes up (ALARMA). On «nadie» a
// big question mark lands on the divide.
export const S12: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const emp = beat(sc, "empatía");
  const ala = beat(sc, "alarma");
  const des = beat(sc, "despierto");
  const nad = beat(sc, "nadie");
  const sync = yawnAt(frame, emp + 4, 12);
  const awake = ease(frame, des - 2, des + 6);
  const dim = 1 - 0.45 * ease(frame, nad, nad + 8);
  return (
    <AbsoluteFill>
      <FlatSvg>
        <g opacity={dim}>
          <rect x={0} y={0} width={1080} height={990} fill="#fbe1dc" />
          <rect
            x={0}
            y={990}
            width={1080}
            height={930}
            fill="#26304a"
            opacity={frame < ala ? 0.45 : 1}
          />
          <Bust
            x={340}
            y={850}
            s={0.98}
            who={LEO}
            fit={LEO_FIT}
            yawn={sync}
            lids={0.3}
          />
          <Bust
            x={740}
            y={850}
            s={0.98}
            who={SOFI}
            fit={SOFI_FIT}
            yawn={sync}
            lids={0.3}
          />
          <Heart x={540} y={720} at={emp} size={1.3} />
          <Pill x={540} y={555} text="EMPATÍA" at={emp} size={42} />
          {frame >= ala - 2 ? (
            <g opacity={pop(frame, ala - 2, 6)}>
              <Siren x={540} y={1330} s={1.25} on={frame >= ala} />
              {[190, 350, 730, 890].map((x, i) => {
                const jump =
                  awake > 0
                    ? Math.max(
                        0,
                        Math.sin(Math.min(Math.PI, (frame - des - i * 2) / 4)),
                      ) * 34
                    : 0;
                return (
                  <Mini
                    key={x}
                    x={x}
                    y={1545 - jump}
                    s={1.6}
                    body={CROWD_TOPS[i + 1]}
                    skin={CROWD_SKIN[i]}
                    hair={CROWD_HAIR[i]}
                    lids={1 - awake}
                    seed={i}
                  />
                );
              })}
              {awake < 0.5 ? (
                <Zzz x={800} y={1240} size={52} color="#8fb0f0" />
              ) : null}
              <Pill
                x={830}
                y={1090}
                text="ALARMA"
                at={ala}
                size={42}
                bg={C.yellow}
              />
            </g>
          ) : null}
        </g>
        <rect x={0} y={984} width={1080} height={12} fill="#fff" />
        {frame >= nad ? (
          <g transform={`translate(540 990) scale(${pop(frame, nad, 9)})`}>
            <ShadowGroup>
              <circle cx={0} cy={0} r={150} fill={C.yellow} />
            </ShadowGroup>
            <text
              x={0}
              y={92}
              textAnchor="middle"
              fontFamily={SANS}
              fontWeight={800}
              fontSize={260}
              fill={C.ink}
            >
              ?
            </text>
          </g>
        ) : null}
      </FlatSvg>
    </AbsoluteFill>
  );
};

// 13 — "Así que si bostezaste viendo esto… quizá tu cerebro ya me tiene confianza."
// Back to the opening close-up of Leo looking at you; the stopwatch comes back
// under his chin and stops on «bostezaste»; on «confianza» he winks and a heart pops.
export const S13: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const bos = beat(sc, "bostezaste");
  const con = beat(sc, "confianza");
  const z = 4.6 + 0.5 * ease(frame, 0, sc.dur, Easing.out(Easing.quad));
  const smile = ease(frame, bos, bos + 8);
  const wink = interpolate(
    frame,
    [con, con + 3, con + 14, con + 18],
    [0, 1, 1, 0],
    clamp,
  );
  return (
    <AbsoluteFill>
      <FlatSvg>
        <g transform={camT(LEO_X, HEAD_Y - 30, z)}>
          <LivingRoom />
          <Sofa x={540} y={SEAT} />
          <Person
            x={LEO_X}
            y={SEAT}
            who={LEO}
            fit={LEO_FIT}
            lids={frame < bos ? 0.45 : 0.15}
            smile={smile}
            wink={wink}
            brows={smile * 0.5}
            look={[0, 0.2]}
          />
        </g>
        <Heart x={830} y={1180} size={1.5} at={con + 2} />
      </FlatSvg>
      {frame >= bos ? (
        <HookText kicker="TIEMPO:" title="¿BOSTEZASTE?" y={404} />
      ) : null}
    </AbsoluteFill>
  );
};

// 14 — "Envíaselo a quien siempre te contagia los bostezos."
// A phone share sheet: the video slides in, «Mi persona» gets picked, SEND, and
// on «bostezos» both profile pictures yawn.
export const S14: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const env = beat(sc, "Envíaselo");
  const qui = beat(sc, "quien");
  const con = beat(sc, "contagia");
  const bos = beat(sc, "bostezos");
  const slide = ease(frame, env, env + 10, Easing.out(Easing.back(1.4)));
  const press = interpolate(frame, [con, con + 3, con + 7], [1, 0.9, 1], clamp);
  const sent = ease(frame, con + 4, con + 20, Easing.in(Easing.cubic));
  const yawnAv = yawnAt(frame, bos, 30);
  const contacts: [Look, string][] = [
    [SOFI, "Mi persona"],
    [MOM, "Mamá"],
    [AMIGO, "Carlos"],
  ];
  return (
    <AbsoluteFill>
      <FlatSvg bg={C.wall}>
        <circle cx={540} cy={1000} r={560} fill="#efd7b2" />
        <g transform="translate(540 1015) scale(1.08) translate(-540 -1015)">
          <ShadowGroup>
            <rect
              x={270}
              y={540}
              width={540}
              height={950}
              rx={64}
              fill={C.navy}
            />
          </ShadowGroup>
          <rect x={294} y={564} width={492} height={902} rx={44} fill="#fff" />
          <rect x={480} y={578} width={120} height={22} rx={11} fill={C.navy} />
          <text
            x={330}
            y={660}
            fontFamily={SANS}
            fontWeight={800}
            fontSize={40}
            fill={C.ink}
          >
            Enviar a…
          </text>
          <g transform={`translate(${lerp(900, 540, slide)} 790)`}>
            <rect
              x={-210}
              y={-95}
              width={420}
              height={190}
              rx={24}
              fill="#f2e3c6"
            />
            <g transform="translate(-90 10) scale(0.6)">
              <Head who={LEO} yawn={yawnAt(frame % 60, 4, 20)} lids={0.4} />
            </g>
            <circle cx={80} cy={0} r={46} fill={C.red} />
            <path d="M 66 -24 L 66 24 L 104 0 Z" fill="#fff" />
          </g>
          {contacts.map(([who, name], i) => {
            const y = 980 + i * 128;
            const picked = i === 0 && frame >= qui;
            return (
              <g key={name}>
                {picked ? (
                  <rect
                    x={312}
                    y={y - 56}
                    width={456}
                    height={112}
                    rx={24}
                    fill="#dcecff"
                    opacity={pop(frame, qui, 6)}
                  />
                ) : null}
                <circle
                  cx={380}
                  cy={y}
                  r={54}
                  fill={["#fbe1dc", "#e8e0f8", "#dff2e9"][i]}
                />
                <g transform={`translate(380 ${y + 8}) scale(0.46)`}>
                  <Head
                    who={who}
                    yawn={i === 0 ? yawnAv : 0}
                    lids={i === 0 ? 0.3 : 0}
                    smile={i === 0 ? 0 : 0.6}
                  />
                </g>
                <text
                  x={450}
                  y={y + 13}
                  fontFamily={SANS}
                  fontWeight={700}
                  fontSize={36}
                  fill={C.ink}
                >
                  {name}
                </text>
                {picked ? (
                  <g
                    transform={`translate(728 ${y}) scale(${pop(frame, qui, 6)})`}
                  >
                    <circle r={24} fill={C.green} />
                    <path
                      d="M -11 0 L -3 9 L 12 -9"
                      stroke="#fff"
                      strokeWidth={6}
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                ) : null}
              </g>
            );
          })}
          <g transform={`translate(540 1370) scale(${press})`}>
            <rect
              x={-170}
              y={-44}
              width={340}
              height={88}
              rx={44}
              fill={frame >= con ? C.green : C.blue}
            />
            <text
              x={0}
              y={14}
              textAnchor="middle"
              fontFamily={SANS}
              fontWeight={800}
              fontSize={38}
              fill="#fff"
            >
              {frame >= con + 4 ? "ENVIADO" : "ENVIAR"}
            </text>
          </g>
          {frame >= con + 4 && sent < 1 ? (
            <g
              transform={`translate(${lerp(560, 1000, sent)} ${lerp(1300, 560, sent)}) rotate(-30)`}
            >
              <path d="M -40 0 L 40 -26 L 10 30 L 0 6 Z" fill={C.cyan} />
            </g>
          ) : null}
          <Heart x={768} y={980} size={0.42} at={qui + 4} />
        </g>
      </FlatSvg>
    </AbsoluteFill>
  );
};

// 15 — "¿Quieres aprender a crear videos como este? Síguenos… muy pronto revelamos el método."
// Academy promo: PLINK ACADEMY and a storyboard strip of this very video on
// «crear»; a SEGUIR button pressed on «Síguenos»; a locked folder EL MÉTODO
// on «pronto» that opens a crack of light on «revelamos»; MUY PRONTO stamp on «método».
export const S15: React.FC<P> = ({ sc }) => {
  const frame = useCurrentFrame();
  const cre = beat(sc, "crear");
  const sig = beat(sc, "Síguenos");
  const pro = beat(sc, "pronto");
  const rev = beat(sc, "revelamos");
  const met = beat(sc, "método");
  const pressed = frame >= sig + 8;
  const press = interpolate(
    frame,
    [sig + 6, sig + 8, sig + 12],
    [1, 0.9, 1],
    clamp,
  );
  const cursor = ease(frame, sig, sig + 7, Easing.out(Easing.cubic));
  const open = ease(frame, rev - 2, rev + 10, Easing.out(Easing.back(1.6)));
  const thumbs: React.ReactNode[] = [
    <g key="leo" transform="translate(0 20) scale(0.78)">
      <Head who={LEO} yawn={yawnAt(frame % 50, 4, 14)} lids={0.4} />
    </g>,
    <g key="eco" transform="scale(0.235)">
      <Ultrasound
        x={0}
        y={0}
        baby={1}
        yawn={yawnAt(frame % 46, 6, 12)}
        label=""
      />
    </g>,
    <g key="brain" transform="translate(-14 0) scale(0.4)">
      <ProfileHead x={0} y={0} yawn={0} cool={(Math.sin(frame / 10) + 1) / 2} />
    </g>,
    <g key="dog" transform="translate(0 10)">
      <DogFace x={0} y={0} s={1.1} yawn={yawnAt(frame % 40, 8, 10)} />
    </g>,
  ];
  const bgs = [C.wall, "#0c1016", "#f9d9bf", "#d7efe9"];
  return (
    <AbsoluteFill>
      <FlatSvg bg={C.wall}>
        <circle cx={540} cy={1060} r={600} fill="#efd7b2" />
        <Pill
          x={540}
          y={530}
          text="PLINK ACADEMY"
          at={2}
          size={50}
          bg={C.navy}
          color={C.yellow}
        />
        {thumbs.map((t, i) => {
          const at = Math.min(2 + i * 5, cre - 4 + i * 4);
          if (frame < at) return null;
          const x = 231 + i * 206;
          return (
            <g
              key={i}
              transform={`translate(${x} 770) scale(${pop(frame, at, 8)}) rotate(${(i - 1.5) * 3})`}
            >
              <ShadowGroup>
                <rect
                  x={-95}
                  y={-130}
                  width={190}
                  height={260}
                  rx={22}
                  fill="#fff"
                />
              </ShadowGroup>
              <rect
                x={-83}
                y={-118}
                width={166}
                height={236}
                rx={14}
                fill={bgs[i]}
              />
              {t}
              <text
                x={-70}
                y={104}
                fontFamily={SANS}
                fontWeight={800}
                fontSize={26}
                fill={i === 1 ? "#fff" : C.ink}
              >
                {i + 1}
              </text>
            </g>
          );
        })}
        {frame >= pro ? (
          <g transform={`translate(540 1330) scale(${pop(frame, pro, 8)})`}>
            <g opacity={open}>
              {[-40, -18, 0, 18, 40].map((a) => (
                <path
                  key={a}
                  d="M -30 -110 L 30 -110 L 80 -330 L -80 -330 Z"
                  fill={C.yellow}
                  opacity={0.35}
                  transform={`rotate(${a} 0 -110)`}
                />
              ))}
            </g>
            <ShadowGroup>
              <path
                d="M -220 -130 L -60 -130 L -36 -160 L 60 -160 L 84 -130 L 220 -130 L 220 130 L -220 130 Z"
                fill="#e0902e"
              />
            </ShadowGroup>
            <rect
              x={-200}
              y={-112}
              width={400}
              height={30}
              fill="#2a2015"
              opacity={open}
            />
            <g
              transform={`translate(0 130) scale(1 ${1 - 0.18 * open}) translate(0 -130)`}
            >
              <rect
                x={-230}
                y={-100}
                width={460}
                height={230}
                rx={18}
                fill="#f6c25e"
              />
              <text
                x={0}
                y={-30}
                textAnchor="middle"
                fontFamily={SANS}
                fontWeight={800}
                fontSize={50}
                fill={C.ink}
                letterSpacing={2}
              >
                EL MÉTODO
              </text>
              <g transform="translate(0 50)">
                <path
                  d="M -26 -10 L -26 -34 Q -26 -60 0 -60 Q 26 -60 26 -34 L 26 -10"
                  stroke="#5b6472"
                  strokeWidth={12}
                  fill="none"
                  transform={`translate(0 ${-14 * open})`}
                />
                <rect
                  x={-40}
                  y={-14}
                  width={80}
                  height={62}
                  rx={12}
                  fill="#5b6472"
                />
                <circle cx={0} cy={14} r={8} fill={C.ink} />
              </g>
            </g>
          </g>
        ) : null}
        {frame >= sig ? (
          <g
            transform={`translate(540 1040) scale(${pop(frame, sig, 7) * press})`}
          >
            <ShadowGroup>
              <rect
                x={-200}
                y={-52}
                width={400}
                height={104}
                rx={52}
                fill={pressed ? C.green : C.blue}
              />
            </ShadowGroup>
            <text
              x={0}
              y={16}
              textAnchor="middle"
              fontFamily={SANS}
              fontWeight={800}
              fontSize={46}
              fill="#fff"
              letterSpacing={2}
            >
              {pressed ? "SIGUIENDO" : "SEGUIR"}
            </text>
          </g>
        ) : null}
        {frame >= sig && frame < sig + 22 ? (
          <g
            transform={`translate(${lerp(820, 600, cursor)} ${lerp(1250, 1062, cursor)})`}
          >
            <ShadowGroup>
              <path
                d="M 0 0 L 0 64 L 16 50 L 28 76 L 40 70 L 28 46 L 48 44 Z"
                fill="#fff"
              />
            </ShadowGroup>
          </g>
        ) : null}
        <Stamp x={560} y={1450} text="MUY PRONTO" at={met} size={62} rot={-9} />
      </FlatSvg>
    </AbsoluteFill>
  );
};

/** Background colour of scene 6: warm (hot brain) → cool. */
const interpolateColor = (cool: number) => {
  const a = [0xf9, 0xd9, 0xbf],
    b = [0xd3, 0xe9, 0xf7];
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], cool))).join(",")})`;
};

/** End card: the closing question over Leo, who yawns once more and winks. */
export const EndCard03: React.FC<{
  question: string;
  keyword: string;
  cta: string;
}> = (props) => {
  const frame = useCurrentFrame();
  const yawn = yawnAt(frame, 30, 14);
  const wink = interpolate(frame, [70, 73, 84, 88], [0, 1, 1, 0], clamp);
  return (
    <FlatEndCard
      {...props}
      art={
        <FlatSvg>
          <Bust
            x={540}
            y={1610}
            s={1.3}
            who={LEO}
            fit={LEO_FIT}
            yawn={yawn}
            lids={0.2}
            wink={wink}
            smile={1}
          />
        </FlatSvg>
      }
    />
  );
};

export const SCENE_COMPONENTS = [
  S01,
  S02,
  S03,
  S04,
  S05,
  S06,
  S07,
  S08,
  S09,
  S10,
  S11,
  S12,
  S13,
  S14,
  S15,
];

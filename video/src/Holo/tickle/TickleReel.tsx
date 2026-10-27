import React from "react";
import { AbsoluteFill, Audio, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { NAVY } from "../stage";
import { Captions, EndCard } from "./hud";
import { SCENE_COMPONENTS } from "./scenes";
import { beat, END_DUR, END_FROM, PAGES, SCENES, TOTAL_FRAMES } from "./timeline";

// "¿Por qué no puedes hacerte cosquillas a ti mismo?" — full reel in the
// holographic science style, built scene by scene from the narration.
// Narration is not included yet: the captions run on estimated timings and
// the music sits where the voice will go (lower it ~20 dB under the voice).

export const TICKLE_FRAMES = TOTAL_FRAMES;

const GLITCH_FROM = END_FROM - 10;
const GLITCH_TO = END_FROM + 4;
const at = (i: number, word: string, nth = 0) => SCENES[i].from + beat(SCENES[i], word, nth);

type Cue = { src: string; at: number; vol: number };
const CUES: Cue[] = [
  ...SCENES.slice(1).map((s) => ({ src: "holo/sfx/whoosh.wav", at: s.from - 3, vol: 0.28 })),
  { src: "holo/tickle/zap.wav", at: at(0, "cosquillas"), vol: 0.45 },
  { src: "holo/tickle/laugh.wav", at: at(1, "rías"), vol: 0.4 },
  { src: "holo/sfx/blip.wav", at: at(2, "piel"), vol: 0.25 },
  ...["copia", "predice", "apaga"].map((w) => ({ src: "holo/sfx/blip.wav", at: at(3, w), vol: 0.3 })),
  { src: "holo/tickle/notif.wav", at: at(4, "mensaje") - 4, vol: 0.4 },
  { src: "holo/tickle/error.wav", at: at(5, "predicción."), vol: 0.35 },
  { src: "holo/tickle/zip.wav", at: at(6, "señal"), vol: 0.35 },
  { src: "holo/tickle/glow.wav", at: at(6, "hipotálamo"), vol: 0.35 },
  { src: "holo/tickle/laugh.wav", at: at(6, "risa."), vol: 0.45 },
  { src: "holo/tickle/scan.wav", at: SCENES[7].from + 4, vol: 0.3 },
  ...[0, 14, 28].map((d) => ({ src: "holo/sfx/blip.wav", at: at(8, "antes") - 6 + d, vol: 0.32 })),
  { src: "holo/tickle/glow.wav", at: SCENES[9].from + 2, vol: 0.4 },
  { src: "holo/sfx/whoosh.wav", at: at(10, "neurocientífica") - 8, vol: 0.3 },
  { src: "holo/tickle/servo.wav", at: at(10, "robot.") - 6, vol: 0.35 },
  { src: "holo/tickle/servo.wav", at: SCENES[11].from + 4, vol: 0.25 },
  { src: "holo/tickle/laugh.wav", at: at(11, "volvían."), vol: 0.35 },
  { src: "holo/tickle/laugh.wav", at: at(11, "cosquillas."), vol: 0.45 },
  { src: "holo/tickle/chirps.wav", at: at(12, "ríen"), vol: 0.35 },
  { src: "holo/tickle/fear.wav", at: at(13, "miedo,"), vol: 0.5 },
  { src: "holo/tickle/rise.wav", at: at(14, "confianza.") - 10, vol: 0.45 },
  { src: "holo/sfx/blip.wav", at: at(15, "persona"), vol: 0.35 },
  { src: "holo/tickle/sent.wav", at: at(15, "cosquillas.") - 2, vol: 0.45 },
  { src: "holo/tickle/glitch.wav", at: GLITCH_FROM, vol: 0.45 },
];

/** Light flash on every cut (as in the reference) and an RGB glitch at the end. */
const Overlays: React.FC = () => {
  const frame = useCurrentFrame();
  let flash = 0;
  for (const s of SCENES.slice(1)) {
    const d = frame - s.from;
    if (d >= 0 && d < 3) flash = Math.max(flash, [0.36, 0.13, 0.04][d]);
  }
  const black = interpolate(frame, [0, 6], [1, 0], { extrapolateRight: "clamp" });
  return (
    <>
      <AbsoluteFill style={{ background: "#dfe8ff", opacity: flash, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
    </>
  );
};

const glitchOn = (f: number) => f >= GLITCH_FROM && f < GLITCH_TO && (f - GLITCH_FROM) % 3 !== 2;

export const TickleReel: React.FC = () => {
  const frame = useCurrentFrame();
  const g = glitchOn(frame);
  const shift = g ? 10 + random(`g${frame}`) * 18 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="tk-rgb" x="-5%" y="0%" width="110%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={shift} dy={0} result="r2" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gg" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset in="b" dx={-shift} dy={0} result="b2" />
            <feBlend in="r2" in2="gg" mode="screen" result="rg" />
            <feBlend in="rg" in2="b2" mode="screen" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{ filter: g ? "url(#tk-rgb)" : undefined, transform: g ? `translateX(${(random(`gx${frame}`) - 0.5) * 30}px)` : undefined }}>
        {SCENES.map((s, i) => {
          const S = SCENE_COMPONENTS[i];
          return (
            // premounted so each WebGL scene and its bloom pass are ready on the first visible frame
            <Sequence key={i} from={s.from} durationInFrames={s.dur} premountFor={12}>
              <S sc={s} />
            </Sequence>
          );
        })}
        <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 55%, transparent 55%, rgba(3,6,14,0.75) 100%)" }} />
        <Captions pages={PAGES} />
      </AbsoluteFill>
      <Sequence from={END_FROM} durationInFrames={END_DUR}>
        <EndCard />
      </Sequence>
      <Overlays />
      <Audio src={staticFile("holo/tickle/music.wav")} volume={(f) => interpolate(f, [0, 20, TOTAL_FRAMES - 40, TOTAL_FRAMES], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {CUES.map((c, i) => (
        <Sequence key={i} from={Math.max(0, c.at)} layout="none">
          <Audio src={staticFile(c.src)} volume={() => c.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

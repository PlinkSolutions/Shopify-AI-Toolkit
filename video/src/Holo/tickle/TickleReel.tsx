import React from "react";
import { AbsoluteFill, Audio, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { NAVY } from "../stage";
import { Captions, EndCard } from "./hud";
import { SCENE_COMPONENTS } from "./scenes";
import { CUES, GLITCH_FROM, GLITCH_TO, MUSIC, MUSIC_ENV } from "./cues";
import { END_DUR, END_FROM, PAGES, SCENES, TOTAL_FRAMES } from "./timeline";

// "¿Por qué no puedes hacerte cosquillas a ti mismo?" — full reel in the
// holographic science style, built scene by scene from the narration.
// Narration is not included yet: the captions run on estimated timings and
// the music sits where the voice will go (lower it ~20 dB under the voice).

export const TICKLE_FRAMES = TOTAL_FRAMES;

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
      <Audio src={staticFile(MUSIC)} volume={(f) => interpolate(f, MUSIC_ENV[0], MUSIC_ENV[1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {CUES.map((c, i) => (
        <Sequence key={i} from={Math.max(0, c.at)} layout="none">
          <Audio src={staticFile(c.src)} volume={() => c.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

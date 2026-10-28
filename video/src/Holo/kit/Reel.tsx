import React from "react";
import { AbsoluteFill, Audio, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { NAVY } from "../stage";
import { Cue } from "./cues";
import { Guion } from "./guion";
import { Captions, EndCard } from "./hud";
import { Scene, Timeline } from "./timeline";

// Shell shared by every holographic reel: one premounted 3D scene per
// narration segment, karaoke captions, a light flash on every cut (as in the
// reference), an RGB glitch into the end card, and the soundtrack cues.

export type SceneComponent = React.FC<{ sc: Scene }>;

const Overlays: React.FC<{ tl: Timeline }> = ({ tl }) => {
  const frame = useCurrentFrame();
  let flash = 0;
  for (const s of tl.SCENES.slice(1)) {
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

export const HoloReel: React.FC<{ guion: Guion; tl: Timeline; scenes: SceneComponent[]; cues: Cue[] }> = ({ guion, tl, scenes, cues }) => {
  const frame = useCurrentFrame();
  const [g0, g1] = tl.GLITCH;
  const g = frame >= g0 && frame < g1 && (frame - g0) % 3 !== 2;
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
        {tl.SCENES.map((s, i) => {
          const S = scenes[i];
          return (
            // premounted so each WebGL scene and its bloom pass are ready on the first visible frame
            <Sequence key={i} from={s.from} durationInFrames={s.dur} premountFor={12}>
              <S sc={s} />
            </Sequence>
          );
        })}
        <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 55%, transparent 55%, rgba(3,6,14,0.75) 100%)" }} />
        <Captions pages={tl.PAGES} />
      </AbsoluteFill>
      <Sequence from={tl.END_FROM} durationInFrames={tl.END_DUR}>
        <EndCard question={guion.cierre.pregunta} keyword={guion.cierre.clave} cta={guion.cierre.cta} />
      </Sequence>
      <Overlays tl={tl} />
      {cues.map((c, i) => (
        <Sequence key={i} from={Math.max(0, c.at)} layout="none">
          <Audio src={staticFile(c.src)} volume={() => c.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export type ReelDef = { id: string; slug: string; frames: number; component: React.FC };

/** Composition entry for src/Holo/reels/index.ts. */
export function defineReel(guion: Guion, tl: Timeline, scenes: SceneComponent[], cues: Cue[]): ReelDef {
  if (scenes.length !== tl.SCENES.length) throw new Error(`${guion.slug}: ${scenes.length} scene components for ${tl.SCENES.length} segments`);
  const component: React.FC = () => <HoloReel guion={guion} tl={tl} scenes={scenes} cues={cues} />;
  return { id: `reel-${guion.slug}`, slug: guion.slug, frames: tl.TOTAL_FRAMES, component };
}

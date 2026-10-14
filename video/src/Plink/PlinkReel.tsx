import React from "react";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions } from "./Captions";
import { DATA } from "./data";
import { GlitchSlices, LightLeak, RgbSplitDefs, Strike, ThumbWall } from "./effects";
import * as M from "./icons/models";
import { IconStage } from "./icons/studio";

// Plink Academy reel: the four joined takes edited in the AvatarHype style.
// Layers, back to front: base video, thumbnail wall + 3D icons (behind the
// speaker), speaker cutout, glitch slices, light leak, caption scrim,
// captions. Music is added by the user afterwards.

export const PLINK_FRAMES = 923; // length of public/plink_joined.mp4 at 24 fps

const VIDEO = staticFile("plink_joined.mp4");
const PERSON = staticFile("plink_person.webm");
const TAKE_STARTS = [0, 229, 460, 686, PLINK_FRAMES];

const MODELS: Record<string, React.FC<{ stepAt?: number[] }>> = {
  Ghost: M.Ghost,
  Coin: () => <M.Coin />,
  Camera: M.Camera,
  Clapper: M.Clapper,
  Star: M.Star,
  Stairs: M.Stairs,
  GradCap: M.GradCap,
  PersonPlus: M.PersonPlus,
  PromptCard: M.PromptCard,
  Phone: M.Phone,
  PlayButton: M.PlayButton,
  Mic: M.Mic,
  Scissors: M.Scissors,
  CoinStack: M.CoinStack,
  Warning: M.Warning,
  SameFace: M.SameFace,
  Robot: M.Robot,
  Retry: M.Retry,
  Target: M.Target,
  Compass: M.Compass,
  PlinkBadge: M.PlinkBadge,
  ChatBubble: M.ChatBubble,
  PaperPlane: () => <M.PaperPlane />,
};

const glitchOn = (f: number) => DATA.glitches.some(([a, b]) => f >= a && f < b && (f - a) % 4 < 3);

/** Shared camera move for the video and the cutout so they stay registered. */
const useCamera = (): React.CSSProperties => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const take = TAKE_STARTS.findIndex((s, i) => frame >= s && frame < TAKE_STARTS[i + 1]);
  const t0 = TAKE_STARTS[take];
  // slow push-in through each take
  let scale = 1 + 0.04 * ((frame - t0) / (TAKE_STARTS[take + 1] - t0));
  // punch-in on the black-and-white beat ("pero, ojo")
  const { start, end } = DATA.bw;
  const inP = spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 240 } });
  const outP = spring({ frame: frame - end, fps, config: { damping: 15, stiffness: 240 } });
  scale += 0.1 * (inP - outP);
  // tiny shake while glitching
  const shake = glitchOn(frame) ? (random(`sh${frame}`) - 0.5) * 18 : 0;
  // black and white with a contrast boost, eased over two frames
  const g = interpolate(frame, [start, start + 2, end, end + 2], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return {
    transform: `translateX(${shake}px) scale(${scale})`,
    transformOrigin: "50% 26%",
    filter: g > 0 ? `grayscale(${g}) contrast(${1 + 0.25 * g}) brightness(${1 - 0.05 * g})` : undefined,
  };
};

const Icons: React.FC = () => (
  <>
    {DATA.icons.map((ev, i) => {
      const Model = MODELS[ev.icon];
      const dur = ev.end - ev.start;
      const strikeAt = "strikeAt" in ev ? ev.strikeAt - ev.start : undefined;
      return (
        <Sequence key={i} from={ev.start} durationInFrames={dur + 6} layout="none">
          <div style={{ position: "absolute", left: ev.x - ev.size / 2, top: ev.y - ev.size / 2, width: ev.size, height: ev.size }}>
            <IconStage size={ev.size} enterAt={0} exitAt={dur} yaw={ev.yaw} spin={"spin" in ev ? ev.spin : 0}>
              <Model stepAt={"steps" in ev ? [...ev.steps] : undefined} />
            </IconStage>
            {strikeAt !== undefined ? <Strike size={ev.size} at={strikeAt} exitAt={dur} seed={`st${i}`} /> : null}
          </div>
        </Sequence>
      );
    })}
  </>
);

type Cue = { src: string; at: number; vol: number };

const buildCues = (): Cue[] => {
  const cues: Cue[] = [];
  const add = (src: string, at: number, vol: number) => cues.push({ src, at, vol });
  for (const [a] of DATA.glitches) add("glitch", a, 0.45);
  for (const ev of DATA.icons) {
    const special: Record<string, [string, number]> = {
      Coin: ["coin", 0.3],
      CoinStack: ["coin", 0.3],
      PlinkBadge: ["chime", 0.4],
      PaperPlane: ["swoosh", 0.5],
      Phone: ["shutter", 0.55],
    };
    const [src, vol] = special[ev.icon] ?? ["pop", 0.4];
    add(src, ev.start, vol);
    if ("strikeAt" in ev) add("strike", ev.strikeAt, 0.45);
    if ("steps" in ev) {
      const seen = new Set<number>();
      for (const s of ev.steps) {
        if (s > 0 && !seen.has(s)) add("tick", ev.start + s, 0.35);
        seen.add(s);
      }
    }
  }
  add("boom", DATA.bw.start, 0.6);
  add("leak", DATA.lightLeak, 0.4);
  add("whoosh", DATA.thumbWall.start, 0.45);
  // soft tick on each keyword unless something else already sounds there
  for (const p of DATA.pages) {
    if (!cues.some((c) => Math.abs(c.at - p.keyAt) <= 3)) add("tick", p.keyAt, 0.14);
  }
  return cues;
};
const CUES = buildCues();

export const PlinkReel: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = useCamera();
  const glitch = glitchOn(frame);
  const shift = glitch ? 10 + random(`rgb${frame}`) * 16 : 0;
  const wall = DATA.thumbWall;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <RgbSplitDefs shift={shift} />
      <AbsoluteFill style={{ filter: glitch ? "url(#plink-rgb)" : undefined }}>
        <AbsoluteFill style={cam}>
          <OffthreadVideo src={VIDEO} style={{ width: "100%", height: "100%" }} />
        </AbsoluteFill>
        <Sequence from={wall.start} durationInFrames={wall.end - wall.start} layout="none">
          <ThumbWall duration={wall.end - wall.start} />
        </Sequence>
        <Icons />
        <AbsoluteFill style={cam}>
          <OffthreadVideo src={PERSON} transparent muted style={{ width: "100%", height: "100%" }} />
        </AbsoluteFill>
        {glitch ? <GlitchSlices src={VIDEO} frameKey={frame} videoStyle={cam} /> : null}
      </AbsoluteFill>
      <Sequence from={DATA.lightLeak} durationInFrames={22} layout="none">
        <LightLeak duration={22} />
      </Sequence>
      {/* soft dark band behind the captions so lime and white read on the white hoodie */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(to bottom, transparent 52%, rgba(12,8,18,0.38) 66%, rgba(12,8,18,0.42) 76%, transparent 90%)",
        }}
      />
      <Captions />
      {CUES.map((c, i) => (
        <Sequence key={i} from={c.at} layout="none">
          <Audio src={staticFile(`plink/sfx/${c.src}.wav`)} volume={() => c.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

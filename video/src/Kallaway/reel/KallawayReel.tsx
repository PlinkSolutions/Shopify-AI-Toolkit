import React from "react";
import { Sequence } from "remotion";
import { buildCaptionChunks, JumpCutVideo, SplitLayout } from "../SplitLayout";
import { FPS } from "../theme";
import { DURATION, SEGMENTS, WORDS } from "./data";
import {
  SceneBestTeaser,
  SceneBioPlan,
  SceneBlank,
  SceneComments,
  SceneConnect,
  SceneCta,
  SceneHook,
  SceneInstall,
  ScenePack,
  SceneReveal,
  SceneScore,
  SceneScript,
  SceneTrending,
  SceneWhy,
  SceneConvert,
} from "./scenes";

// "Claude se carga Instagram" reel: six clips joined, pauses cut, original
// motion graphics per beat on top, caption pill on the split line.

export const REEL_FRAMES = Math.ceil(DURATION * FPS);

// [start second on the edited timeline, scene]
const SCENES: [number, React.FC<{ start: number }>][] = [
  [0, SceneHook],
  [3.0, SceneConnect],
  [7.39, ScenePack],
  [14.92, SceneBestTeaser],
  [17.05, SceneScript],
  [22.39, SceneComments],
  [26.38, SceneScore],
  [27.91, SceneBioPlan],
  [30.84, SceneReveal],
  [33.67, SceneTrending],
  [35.77, SceneWhy],
  [37.27, SceneConvert],
  [41.01, SceneBlank],
  [44.42, SceneInstall],
  [46.36, SceneCta],
];

const captions = buildCaptionChunks(WORDS, FPS);

export const KallawayReel: React.FC = () => {
  const top = (
    <>
      {SCENES.map(([start, Scene], i) => {
        const from = Math.round(start * FPS);
        const end = i + 1 < SCENES.length ? Math.round(SCENES[i + 1][0] * FPS) : REEL_FRAMES;
        return (
          <Sequence key={i} from={from} durationInFrames={end - from} layout="none">
            <Scene start={start} />
          </Sequence>
        );
      })}
    </>
  );

  return (
    <SplitLayout
      top={top}
      captions={captions}
      bottom={<JumpCutVideo src="k_joined.mp4" segments={SEGMENTS} faceY="21%" />}
    />
  );
};

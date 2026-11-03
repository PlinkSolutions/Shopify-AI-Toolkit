import { defineReel } from "../../kit/Reel";
import { CUES } from "./cues";
import { EndCard03, SCENE_COMPONENTS, StopwatchOverlay } from "./scenes";
import { GUION, TL } from "./timeline";

export const reel = defineReel(GUION, TL, SCENE_COMPONENTS, CUES, {
  captions: { bar: true },
  overlay: StopwatchOverlay,
  vignette: false,
  flash: "#fff6e3",
  glitch: false,
  endCard: EndCard03,
});

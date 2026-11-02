import { defineReel } from "../../kit/Reel";
import { CUES } from "./cues";
import { SCENE_COMPONENTS } from "./scenes";
import { GUION, TL } from "./timeline";

export const reel = defineReel(GUION, TL, SCENE_COMPONENTS, CUES);

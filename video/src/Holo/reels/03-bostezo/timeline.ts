import { Guion } from "../../kit/guion";
import { makeTimeline } from "../../kit/timeline";
import guionJson from "./guion.json";
import { VOICE_WORDS } from "./voice";

export const GUION: Guion = guionJson;
export const TL = makeTimeline(GUION, VOICE_WORDS);

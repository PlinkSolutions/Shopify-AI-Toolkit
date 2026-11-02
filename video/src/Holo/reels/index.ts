// Every holographic reel, registered as composition "reel-<slug>" in Root.tsx.
// Add one import + one entry per new reel folder.
import { ReelDef } from "../kit/Reel";
import { reel as r01 } from "./01-cosquillas";
import { reel as r02 } from "./02-azucar";

export const REELS: ReelDef[] = [r01, r02];

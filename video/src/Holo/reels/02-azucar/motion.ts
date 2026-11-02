// Motion shared by scenes.tsx and cues.ts (React-free, so the audio mixer can
// place a "boing" on every landing of the hyperactive kid).

/** Frames per hop once the kid goes "loco". */
export const HOP = 13;

/** Kid position, squash and tilt at scene frame f; crazyAt = frame of «locos». */
export function kidHop(f: number, crazyAt: number) {
  if (f < crazyAt) {
    const b = Math.abs(Math.sin(f * 0.16)) * 0.14; // excited little hops while eyeing the candy
    return { x: -0.35, y: b, squash: b < 0.03 ? 0.93 : 1.03, tilt: 0 };
  }
  const t = (f - crazyAt) / HOP;
  const ph = t % 1;
  const y = 4 * ph * (1 - ph) * 1.1;
  const squash = ph < 0.1 || ph > 0.92 ? 0.84 : ph > 0.35 && ph < 0.65 ? 1.1 : 1;
  return { x: -0.15 + 0.48 * Math.sin(t * Math.PI), y, squash, tilt: 0.22 * Math.cos(t * Math.PI) };
}

/** Landing frames (scene-relative) between crazyAt and end. */
export const landings = (crazyAt: number, end: number) => {
  const out: number[] = [];
  for (let f = crazyAt + HOP; f < end; f += HOP) out.push(f);
  return out;
};

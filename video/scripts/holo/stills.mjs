// Render many stills of one composition with a single bundle.
// usage: node scripts/holo/stills.mjs <compositionId> <outDir> <frame> [frame...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

// same browser lookup as remotion.config.ts (Playwright's headless shell)
const dir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const shell = dir && existsSync(dir) ? readdirSync(dir).find((n) => n.startsWith("chromium_headless_shell")) : null;
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? (shell ? path.join(dir, shell, "chrome-linux", "headless_shell") : null);

const [, , id, outDir, ...frames] = process.argv;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), webpackOverride: enableTailwind, rspack: true });
const opts = { browserExecutable, chromiumOptions: { gl: "angle" } };
const composition = await selectComposition({ serveUrl, id, ...opts });
for (const f of frames) {
  await renderStill({ serveUrl, composition, frame: Number(f), output: path.join(outDir, `f${f}.png`), scale: 0.5, ...opts });
  console.log("frame", f);
}

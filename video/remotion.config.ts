// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig(enableTailwind);

// Use a pre-installed chrome-headless-shell if one is available (e.g. the
// Playwright browser bundled in this environment) instead of downloading
// Remotion's own headless Chrome. Set REMOTION_BROWSER_EXECUTABLE to override.
// Falls back to Remotion's default (auto-download) when nothing is found.
const resolveBrowserExecutable = (): string | null => {
  if (process.env.REMOTION_BROWSER_EXECUTABLE) {
    return process.env.REMOTION_BROWSER_EXECUTABLE;
  }
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (browsersPath && existsSync(browsersPath)) {
    // Match any chromium_headless_shell-<build>/chrome-linux/headless_shell
    const shellDir = readdirSync(browsersPath).find((name) =>
      name.startsWith("chromium_headless_shell"),
    );
    if (shellDir) {
      const candidate = join(
        browsersPath,
        shellDir,
        "chrome-linux",
        "headless_shell",
      );
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return null;
};

const browserExecutable = resolveBrowserExecutable();
if (browserExecutable) {
  Config.setBrowserExecutable(browserExecutable);
}

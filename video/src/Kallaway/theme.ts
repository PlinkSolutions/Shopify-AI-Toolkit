import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/jetbrains-mono/800.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/900.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/caveat/700.css";

// Kallaway-style split screen, measured on the reference reel and scaled to
// 1080x1920: motion graphics on grid paper in the top 35.9%, talking head
// below, caption pill centred on the split line.

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
export const SPLIT_Y = Math.round(HEIGHT * 0.359); // 690

export const GRID = 54; // grid paper cell size

export const colors = {
  paper: "#ebe9e5",
  gridLine: "#dedcd7",
  ink: "#1f1f1c",
  muted: "#77756f",
  card: "#ffffff",
  pill: "#272724",
  orange: "#d97757", // accent (numbers, mascot, locked tile)
  yellow: "#f5c842", // "LA SKILL"-style label
  blue: "#2f6be8", // tilted sticker
  red: "#c8322b", // handwritten notes, stamps
  green: "#2e9e4f", // positive stamps
  border: "#e4e2dd",
};

export const fonts = {
  mono: "'JetBrains Mono', monospace",
  sans: "Inter, sans-serif",
  serif: "'Source Serif 4', serif",
  hand: "Caveat, cursive",
};

export const shadow = "0 14px 40px rgba(30, 28, 24, 0.12), 0 2px 6px rgba(30, 28, 24, 0.06)";

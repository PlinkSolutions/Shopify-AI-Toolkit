import "@fontsource/bebas-neue/400.css";
import React from "react";
import { interpolate, random, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DATA } from "./data";

// AvatarHype-style captions: one big lime keyword typed in letter by letter,
// small white context words above it (left-aligned to the keyword) and below
// it (right-aligned). Keyword cap height is centred on DATA.captionY.

export const LIME = "#C8EC34";
const FONT = "'Bebas Neue', sans-serif";
// Bebas Neue: ascender 0.9, descender 0.3, cap height 0.7. With line-height
// 0.7em the line box hugs the caps once shifted down by 0.05em.
const LH = 0.7;
const SHADOW = "0 5px 18px rgba(0,0,0,0.55), 0 2px 3px rgba(0,0,0,0.45)";
const SCRAMBLE = "#%&*+<>?/\\=X01";

type Page = (typeof DATA.pages)[number];

const glitchActive = (absFrame: number) => DATA.glitches.some(([a, b]) => absFrame >= a && absFrame < b && (absFrame - a) % 4 < 3);

const Small: React.FC<{ text: string; size: number; at: number; align: "flex-start" | "flex-end"; gap: number; above: boolean; spacing?: string }> = ({
  text,
  size,
  at,
  align,
  gap,
  above,
  spacing,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 260 } });
  return (
    <div
      style={{
        alignSelf: align,
        height: LH * size,
        [above ? "marginBottom" : "marginTop"]: gap,
        fontSize: size,
        lineHeight: LH,
        color: "#ffffff",
        whiteSpace: "pre",
        letterSpacing: spacing,
        opacity: frame < at ? 0 : Math.min(1, p * 1.6),
        transform: `translateY(${(1 - p) * (above ? 14 : -14)}px)`,
        textShadow: SHADOW,
      }}
    >
      <span style={{ position: "relative", top: "0.05em" }}>{text}</span>
    </div>
  );
};

const Keyword: React.FC<{ page: Page; at: number }> = ({ page, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abs = frame + page.start;
  const glitch = page.style === "glitch" && glitchActive(abs);
  const letters = Array.from(page.key);
  const big = page.style === "num";
  const whole = big ? spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 220 } }) : 1;
  return (
    <div
      style={{
        height: LH * page.keySize,
        fontSize: page.keySize,
        lineHeight: LH,
        color: LIME,
        whiteSpace: "pre",
        // Bebas is a little lighter than the reference's display face
        WebkitTextStroke: `${Math.round(page.keySize * 0.012)}px ${LIME}`,
        transform: `translateX(${glitch ? (random(`gx${abs}`) - 0.5) * 34 : 0}px) scale(${big ? 0.75 + 0.25 * whole : 1})`,
        textShadow: glitch ? "-7px 0 rgba(255,30,80,0.85), 7px 0 rgba(0,235,255,0.85)" : SHADOW,
      }}
    >
      <span style={{ position: "relative", top: "0.05em" }}>
        {letters.map((ch, i) => {
          // one letter per frame, each popping in slightly larger
          const t = frame - at - i;
          const s = t < 0 ? 0 : interpolate(t, [0, 3], [1.28, 1], { extrapolateRight: "clamp" });
          const scrambling = page.style === "glitch" && t >= 0 && t < 4 && ch !== " ";
          const shown = scrambling ? SCRAMBLE[Math.floor(random(`s${i}-${abs}`) * SCRAMBLE.length)] : ch;
          return (
            <span key={i} style={{ display: "inline-block", opacity: t < 0 ? 0 : 1, transform: `scale(${s})`, transformOrigin: "50% 80%" }}>
              {shown}
            </span>
          );
        })}
      </span>
    </div>
  );
};

const CaptionPage: React.FC<{ page: Page }> = ({ page }) => {
  const frame = useCurrentFrame();
  const S = DATA.smallSize;
  const K = page.keySize;
  const k = K / 250;
  // accented capitals (Í, Ó, É…) rise above the cap height: leave them room
  const gapTop = 20 * k + (/[ÁÉÍÓÚÑ]/.test(page.key) ? 0.12 * K : 0);
  const gapBottom = 22 * k;
  const keyAt = page.keyAt - page.start;
  const bottomAt = ((page.bottomAt as number | null) ?? page.keyAt) - page.start;
  const top = DATA.captionY - (LH / 2) * K - (page.top ? LH * S + gapTop : 0);
  // quick fade at the very end so pages don't hard-cut into each other
  const out = interpolate(frame, [page.end - page.start - 1, page.end - page.start], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top, display: "flex", justifyContent: "center", fontFamily: FONT, opacity: out }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {page.top ? <Small text={page.top} size={S} at={0} align="flex-start" gap={gapTop} above /> : null}
        <Keyword page={page} at={keyAt} />
        {page.bottom ? (
          <Small
            text={page.bottom}
            size={page.style === "brand" ? S * 1.15 : S}
            spacing={page.style === "brand" ? "0.32em" : undefined}
            at={bottomAt}
            align="flex-end"
            gap={gapBottom}
            above={false}
          />
        ) : null}
      </div>
    </div>
  );
};

export const Captions: React.FC = () => (
  <>
    {DATA.pages.map((p, i) => (
      <Sequence key={i} from={p.start} durationInFrames={p.end - p.start} layout="none">
        <CaptionPage page={p} />
      </Sequence>
    ))}
  </>
);

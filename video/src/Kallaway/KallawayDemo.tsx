import { AbsoluteFill, Sequence } from "remotion";
import {
  BigTitle,
  Card,
  Chip,
  CtaCard,
  HandNote,
  Label,
  MacWindow,
  PixelMascot,
  Pop,
  ScoreRing,
  Stamp,
  Sticker,
  Tile,
  TypeText,
  UserBubble,
} from "./graphics";
import { CaptionChunk, SplitLayout } from "./SplitLayout";
import { colors, fonts, SPLIT_Y } from "./theme";

// Style check for the Kallaway kit: one scene per graphic type, with
// placeholder footage underneath. Not a deliverable.

const Center: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ height: SPLIT_Y - 60, alignItems: "center", justifyContent: "center" }}>{children}</AbsoluteFill>
);

const TILE_COLORS = ["#2e9e4f", "#2f6be8", "#7b4ce0", "#e0479e", "#d64545", "#25b5c2"];

const captions: CaptionChunk[] = [
  { text: "CLAUDE ACABA", startFrame: 0, endFrame: 30 },
  { text: "ES TOTALMENTE", startFrame: 30, endFrame: 60 },
  { text: "SON 13 SKILLS", startFrame: 60, endFrame: 120 },
  { text: "CON 26 FÓRMULAS", startFrame: 120, endFrame: 180 },
  { text: "LE PONE NOTA", startFrame: 180, endFrame: 240 },
  { text: "COMENTAME", startFrame: 240, endFrame: 300 },
];

export const KallawayDemo: React.FC = () => {
  const top = (
    <>
      <Sequence durationInFrames={60} layout="none">
        <Center>
          <Pop from="up">
            <Card style={{ width: 960 }}>
              <Label>LA SKILL</Label>
              <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 28 }}>
                <div style={{ width: 130, height: 130, borderRadius: 30, background: colors.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PixelMascot size={92} />
                </div>
                <div>
                  <div style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 54, color: colors.ink }}>
                    <TypeText text="instagram-agent-skill" delay={4} />
                  </div>
                  <div style={{ fontFamily: fonts.sans, fontSize: 32, color: colors.muted }}>de @autor</div>
                </div>
              </div>
              <div style={{ fontFamily: fonts.serif, fontSize: 40, color: colors.ink, margin: "30px 0 26px" }}>
                Conectás Claude a tu Instagram y te maneja la cuenta.
              </div>
              <Chip>13 skills</Chip>
              <Chip>Claude Code</Chip>
            </Card>
          </Pop>
          <div style={{ position: "absolute", right: 70, bottom: 40 }}>
            <Stamp text="GRATIS" color={colors.green} delay={30} />
          </div>
        </Center>
      </Sequence>

      <Sequence from={60} durationInFrames={60} layout="none">
        <Center>
          <BigTitle accent="13" text="SKILLS" />
          <div style={{ display: "flex", gap: 18, marginTop: 34 }}>
            {TILE_COLORS.map((c, i) => (
              <Tile key={c} delay={6 + i * 3} label={`ig-${["reel", "story", "dm", "plan", "audit", "reply"][i]}`} icon={<PixelMascot color={c} size={66} />} />
            ))}
            <Tile delay={26} locked />
          </div>
          <div style={{ position: "absolute", right: 40, bottom: 60 }}>
            <HandNote text="la mejor" delay={34} />
          </div>
        </Center>
      </Sequence>

      <Sequence from={120} durationInFrames={60} layout="none">
        <Center>
          <Pop from="up">
            <MacWindow style={{ width: 960 }}>
              <UserBubble delay={4}>Haceme un reel sobre crecer en Instagram</UserBubble>
              <div style={{ display: "flex", gap: 22, marginTop: 26, fontFamily: fonts.serif, fontSize: 34, color: colors.ink }}>
                <PixelMascot size={56} />
                <div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 22, color: colors.muted, marginBottom: 10 }}>● ig-reel · escribiendo el guion</div>
                  <TypeText text="Nadie te cuenta esto de crecer en Instagram." delay={14} cps={40} />
                </div>
              </div>
            </MacWindow>
          </Pop>
          <div style={{ position: "absolute", right: 70, top: 40 }}>
            <Sticker delay={20}>26 fórmulas de hook</Sticker>
          </div>
        </Center>
      </Sequence>

      <Sequence from={180} durationInFrames={60} layout="none">
        <Center>
          <Pop from="up">
            <Card style={{ width: 960, display: "flex", alignItems: "center", gap: 30 }}>
              <div style={{ width: 110, height: 110, borderRadius: 55, background: "#d9d6cf" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 44 }}>tu.cuenta</div>
                <div style={{ fontFamily: fonts.sans, fontSize: 30, color: colors.muted }}>Creador · cosas de IA</div>
              </div>
              <ScoreRing from={53} to={88} delay={8} />
            </Card>
          </Pop>
        </Center>
      </Sequence>

      <Sequence from={240} durationInFrames={60} layout="none">
        <Center>
          <CtaCard handle="tu.usuario" keyword="INSTAGRAM" />
        </Center>
      </Sequence>
    </>
  );

  return <SplitLayout top={top} video="joined.mp4" captions={captions} faceY="25%" />;
};

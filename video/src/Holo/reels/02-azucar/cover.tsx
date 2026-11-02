import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam } from "../../stage";
import { BallKid, CandyPile, ContactShadow, GlossyStage } from "../../kit/glossy";
import { SANS } from "../../kit/hud";

// Instagram cover: the dizzy pumpkin kid mid-jump among the candy, the giant
// sugar cube behind him, and the question big on top (inside the grid crop).

const cam: Cam = { from: [0.1, 1.7, 9.4], to: [0.1, 1.7, 9.4], target: [0.15, 1.55, -0.4], orbit: 0, dur: 60 };

const Word: React.FC<{ children: string; box?: boolean; color?: string }> = ({ children, box, color = "#fff" }) => (
  <span
    style={{
      position: "relative",
      display: "inline-block",
      color,
      padding: box ? "0 18px" : 0,
      margin: box ? "0 4px" : 0,
      border: box ? "4px solid #3d7bff" : "none",
      background: box ? "rgba(61,123,255,0.28)" : "transparent",
    }}
  >
    {children}
    {box
      ? [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ].map(([x, y], i) => <span key={i} style={{ position: "absolute", left: `calc(${x * 100}% - 9px)`, top: `calc(${y * 100}% - 9px)`, width: 16, height: 16, background: "#fff", border: "3px solid #3d7bff" }} />)
      : null}
  </span>
);

export const Cover: React.FC = () => (
  <AbsoluteFill>
    <GlossyStage cam={cam} palette="caramelo" glow={[0.5, 0.42]} bloom={0.2}>
      <CandyPile position={[0.75, 0, -1.7]} radius={1.25} rise={9} seed="portada" />
      <ContactShadow position={[-0.12, 0.003, 0.4]} size={1.2} opacity={0.4} />
      <BallKid position={[-0.12, 0.55, 0.4]} rotation={[0, 0.2, 0.18]} scale={0.64} squash={1.08} dizzy={1} />
    </GlossyStage>
    <div style={{ position: "absolute", top: 300, left: 60, right: 60, textAlign: "center", color: "#fff", fontFamily: SANS, fontWeight: 800, fontSize: 104, lineHeight: 1.12, letterSpacing: "-0.01em", textShadow: "0 6px 30px rgba(60,0,40,0.55), 0 2px 0 rgba(0,0,0,0.25)" }}>
      ¿El <Word box>AZÚCAR</Word>
      <br />
      pone <Word color="#ffd21f">LOCOS</Word>
      <br />a los niños?
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1540, display: "flex", justifyContent: "center" }}>
      <div style={{ padding: "16px 40px", borderRadius: 999, background: "rgba(16,8,20,0.88)", border: "5px solid #2fd3c0", boxShadow: "0 0 30px #2fd3c088", fontFamily: SANS, fontWeight: 800, fontSize: 46, letterSpacing: "0.08em", color: "#fff" }}>LA CIENCIA RESPONDE</div>
    </div>
  </AbsoluteFill>
);

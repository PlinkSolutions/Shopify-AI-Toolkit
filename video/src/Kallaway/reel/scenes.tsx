import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { HandNote, Label, MacWindow, PixelMascot, Pop, Stamp, Sticker, TypeText, useEnter } from "../graphics";
import { colors, fonts, shadow } from "../theme";
import {
  abs,
  at,
  Cable,
  CheckChip,
  ClaudeTile,
  CommentRow,
  CountBadge,
  DrawnArrow,
  FlipCard,
  Gauge,
  IgIcon,
  Notification,
  ProfileCard,
  ProgressBar,
  Rays,
  ReelThumb,
  RisingChart,
  ScriptPage,
  Shake,
  SkillCard,
  Toggle,
  Waveform,
  WeekStrip,
  XStrike,
} from "./parts";

// One component per beat of the script. `start` is the scene start on the
// edited timeline (seconds); every delay is keyed to the word it illustrates.

const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 640 }}>{children}</div>
);

// 0.00 "Vale, Claude acaba de cargarse Instagram. En serio,"
export const SceneHook: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const ko = useEnter(at(1.65, start), 12, 140);
  return (
    <Panel>
      <Pop delay={at(0.47, start)} from="right" style={abs(110, 150)}>
        <ClaudeTile size={220} />
      </Pop>
      <DrawnArrow delay={at(0.9, start)} d="M 370 250 C 450 170, 540 170, 610 240 M 610 240 L 580 200 M 610 240 L 566 248" />
      <div style={abs(660, 110, { transform: `translateY(${ko * 40}px) rotate(${ko * 16}deg)` })}>
        <Shake from={at(1.21, start)} to={at(1.65, start)}>
          <IgIcon size={290} ko={ko} />
        </Shake>
      </div>
      {frame >= at(1.65, start) ? (
        <div style={abs(700, 260)}>
          <Stamp text="K.O." size={96} rotate={-12} />
        </div>
      ) : null}
      <div style={abs(120, 470)}>
        <HandNote text="en serio..." delay={at(2.38, start)} size={70} />
      </div>
    </Panel>
  );
};

// 3.00 "lo conectas a tu cuenta y te la lleva entera, de principio a fin. Y lo hace todo"
export const SceneConnect: React.FC<{ start: number }> = ({ start }) => (
  <Panel>
    <Pop delay={0} from="right" style={abs(90, 40)}>
      <ClaudeTile size={170} />
    </Pop>
    <Pop delay={3} from="left" style={abs(620, 20)}>
      <ProfileCard width={400} />
    </Pop>
    <Cable x1={290} y1={130} x2={610} y2={130} delay={at(3.17, start)} />
    <div style={abs(80, 300)}>
      <Pop delay={at(4.3, start)}>
        <Toggle label="PILOTO AUTOMÁTICO" delay={at(4.69, start)} />
      </Pop>
    </div>
    <div style={abs(80, 410)}>
      <Pop delay={at(5.5, start)}>
        <ProgressBar width={480} label="de principio a fin" delay={at(5.63, start)} duration={18} color={colors.green} />
      </Pop>
    </div>
    <div style={abs(60, 520, { display: "flex", gap: 18 })}>
      <CheckChip text="publica" delay={at(6.56, start)} />
      <CheckChip text="responde" delay={at(6.75, start)} />
      <CheckChip text="analiza" delay={at(6.95, start)} />
    </div>
  </Panel>
);

const DECK = [
  ["#2e9e4f", "reel"],
  ["#2f6be8", "guion"],
  ["#7b4ce0", "gancho"],
  ["#e0479e", "coment."],
  ["#d64545", "dm"],
  ["#25b5c2", "perfil"],
  ["#d6a21e", "bio"],
  ["#2e9e4f", "plan"],
  ["#2f6be8", "story"],
  ["#7b4ce0", "carrusel"],
  ["#e0479e", "audit"],
  ["#25b5c2", "ideas"],
] as const;

// 7.39 "Con este pack gratis de 13 skills, Instagram Agent Skill. Cada una hace
//       algo distinto y la última que te voy a enseñar"
export const ScenePack: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const fan = useEnter(at(7.75, start), 15, 110); // fans open on "pack"
  const lift = useEnter(at(13.33, start), 12, 150);
  const appear = useEnter(0, 14, 180); // deck is there from the first frame
  const n = 13;
  return (
    <Panel>
      <div style={abs(0, 36, { width: 1080, textAlign: "center", fontFamily: fonts.mono, fontWeight: 800, fontSize: 58, color: colors.ink })}>
        <TypeText text="instagram-agent-skill" delay={at(9.35, start)} cps={22} />
      </div>
      {Array.from({ length: n }).map((_, i) => {
        const last = i === n - 1;
        const angle = (i - (n - 1) / 2) * 6.2 * fan;
        const rad = (angle * Math.PI) / 180;
        const R = 470;
        const x = 540 + R * Math.sin(rad) - 50;
        const y = 790 - R * Math.cos(rad) - 70 - (last ? lift * 90 : 0);
        // "cada una hace algo distinto": a wave runs through the fan
        const wave = Math.max(0, Math.sin(((frame - at(10.99, start)) / 18 - i * 0.12) * Math.PI));
        const waving = frame >= at(10.99, start) && frame < at(12.9, start);
        return (
          <div
            key={i}
            style={abs(x, y - (waving ? wave * 26 : 0), {
              transform: `rotate(${angle}deg) scale(${appear})`,
              transformOrigin: "50% 100%",
              opacity: appear,
              zIndex: last ? 20 : i,
            })}
          >
            {last ? (
              // the mystery skill stays locked until the reveal scene (keeps the curiosity loop)
              <SkillCard color={colors.orange} label="???" w={100} locked glow={lift} />
            ) : (
              <SkillCard color={DECK[i][0]} label={DECK[i][1]} w={100} />
            )}
          </div>
        );
      })}
      <div style={abs(40, 360, { zIndex: 30 })}>
        <CountBadge to={13} caption="SKILLS" delay={at(8.69, start)} size={150} />
      </div>
      <div style={abs(800, 470, { zIndex: 30 })}>
        <Stamp text="GRATIS" color={colors.green} delay={at(8.07, start)} size={54} rotate={8} />
      </div>
      <div style={abs(680, 140)}>
        <HandNote text="la última..." delay={at(13.45, start)} size={60} rotate={-6} />
      </div>
    </Panel>
  );
};

// 14.92 "es, con diferencia, la mejor."
export const SceneBestTeaser: React.FC<{ start: number }> = ({ start }) => (
  <Panel>
    <div style={abs(240, 10)}>
      <Rays size={600} />
    </div>
    <Pop from="scale" style={abs(430, 150)}>
      <SkillCard color={colors.orange} label="???" w={220} locked glow={1} />
    </Pop>
    <div style={abs(60, 470)}>
      <HandNote text="con diferencia" delay={at(15.23, start)} size={66} />
    </div>
    <div style={abs(730, 80)}>
      <Sticker delay={at(16.45, start)} rotate={8} style={{ fontSize: 44 }}>
        LA MEJOR
      </Sticker>
    </div>
  </Panel>
);

// 17.05 "Le pides un reel y te escribe el guion entero con 26 fórmulas de gancho probadas"
export const SceneScript: React.FC<{ start: number }> = ({ start }) => (
  <Panel>
    <Pop delay={0} from="up" style={abs(60, 30)}>
      <span style={{ display: "inline-block", background: "white", boxShadow: shadow, borderRadius: 22, padding: "16px 26px", fontFamily: fonts.sans, fontWeight: 600, fontSize: 32 }}>
        Hazme un reel 🎬
      </span>
    </Pop>
    <Pop delay={at(17.33, start)} from="up" style={abs(60, 150)}>
      <ReelThumb w={160} views="nuevo" tint="#d9a58e" />
    </Pop>
    <Pop delay={at(18.0, start)} from="left" style={abs(255, 130)}>
      <ScriptPage title="GUION · REEL #1" lines={["Gancho que engancha", "El problema", "Giro inesperado", "Cierre + CTA"]} delay={4} gap={9} width={500} />
    </Pop>
    <div style={abs(800, 70)}>
      <CountBadge to={26} caption="FÓRMULAS DE GANCHO" delay={at(19.89, start)} size={170} />
    </div>
    <div style={abs(500, 470)}>
      <Stamp text="PROBADAS ✓" color={colors.green} delay={at(21.37, start)} size={56} rotate={-6} />
    </div>
  </Panel>
);

// 22.39 "y encima te responde en los comentarios y hasta comenta por ti."
export const SceneComments: React.FC<{ start: number }> = ({ start }) => (
  <Panel>
    <div style={abs(30, 40)}>
      <CommentRow user="@laura" text="¿cómo lo instalo?" reply="Te lo mando por DM 😉" delay={0} replyDelay={at(22.79, start)} />
    </div>
    <div style={abs(30, 230)}>
      <CommentRow user="@dani" text="brutal 🔥" reply="¡Gracias, crack!" delay={at(23.98, start)} replyDelay={5} />
    </div>
    <div style={abs(40, 430)}>
      <Pop delay={at(24.5, start)} from="scale">
        <Label color={colors.green} style={{ color: "white", fontSize: 30 }}>
          ✓ TODOS RESPONDIDOS
        </Label>
      </Pop>
    </div>
    <Pop delay={at(25.23, start)} from="left" style={abs(630, 50)}>
      <div style={{ width: 410, background: "white", borderRadius: 26, boxShadow: shadow, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", fontFamily: fonts.sans, fontWeight: 800, fontSize: 26 }}>@cuenta_de_tu_nicho</div>
        <div style={{ height: 190, background: "linear-gradient(135deg,#f1c9b6,#c9d8f1)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", fontFamily: fonts.sans, fontSize: 26 }}>
          <PixelMascot size={40} />
          <TypeText text="Qué buen gancho 👏" delay={at(25.41, start) - at(25.23, start)} cps={24} />
        </div>
      </div>
    </Pop>
    <div style={abs(760, 470)}>
      <HandNote text="por ti" delay={at(25.81, start)} size={74} rotate={-8} />
    </div>
  </Panel>
);

// 26.38 "Te puntúa el perfil,"
export const SceneScore: React.FC<{ start: number }> = ({ start }) => (
  <Panel>
    <Pop from="right" style={abs(60, 70)}>
      <ProfileCard width={400} />
    </Pop>
    <Pop delay={at(26.53, start)} from="scale" style={abs(560, 90)}>
      <div style={{ background: "white", borderRadius: 30, boxShadow: shadow, padding: "30px 30px 10px" }}>
        <div style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 26, color: colors.muted, textAlign: "center", marginBottom: 6 }}>NOTA DEL PERFIL</div>
        <Gauge to={86} delay={at(26.7, start) - at(26.53, start)} size={400} />
      </div>
    </Pop>
  </Panel>
);

// 27.91 "te reescribe la bio y te planifica la semana,"
export const SceneBioPlan: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame - at(28.03, start), [0, 8], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Panel>
      <Pop from="up" style={abs(60, 30)}>
        <div style={{ width: 960, background: "white", borderRadius: 30, boxShadow: shadow, padding: "26px 36px" }}>
          <Label>BIO</Label>
          <div style={{ position: "relative", display: "inline-block", marginTop: 16, fontFamily: fonts.serif, fontSize: 36, color: colors.muted }}>
            Hago cosas en internet 🤷
            <div style={{ position: "absolute", left: 0, top: "52%", height: 6, width: `${strike}%`, background: colors.red, borderRadius: 3 }} />
          </div>
          <div style={{ marginTop: 10, fontFamily: fonts.serif, fontSize: 38, color: colors.ink, minHeight: 50 }}>
            <TypeText text="Te enseño a crecer en Instagram con IA 🚀" delay={at(28.57, start)} cps={34} />
          </div>
        </div>
      </Pop>
      <div style={abs(91, 330)}>
        <Pop delay={at(29.47, start)} from="up">
          <WeekStrip delay={at(29.61, start) - at(29.47, start)} />
        </Pop>
      </div>
      <div style={abs(640, 520)}>
        <HandNote text="semana lista ✓" delay={at(30.2, start)} size={56} rotate={-4} />
      </div>
    </Panel>
  );
};

// 30.84 "pero la mejor es la de viralidad."
export const SceneReveal: React.FC<{ start: number }> = ({ start }) => (
  <Panel>
    <div style={abs(240, 10)}>
      <Rays size={600} delay={at(31.73, start)} color="rgba(214,69,69,0.28)" />
    </div>
    <div style={abs(410, 120, { width: 260, height: 370 })}>
      <FlipCard
        flipAt={at(31.73, start)}
        front={<SkillCard color={colors.orange} label="???" w={240} locked glow={1} />}
        back={
          <div style={{ width: 240, height: 336, borderRadius: 22, background: "white", border: "5px solid white", boxShadow: `${shadow}, 0 0 40px 14px rgba(214,69,69,0.4)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <span style={{ fontSize: 110, lineHeight: 1 }}>🔥</span>
            <span style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 34, color: colors.ink }}>ig-viral</span>
          </div>
        }
      />
    </div>
    <div style={abs(740, 70)}>
      <Sticker delay={at(31.03, start)} rotate={8} style={{ fontSize: 44 }}>
        LA MEJOR
      </Sticker>
    </div>
    <div style={abs(60, 470)}>
      <Pop delay={at(32.67, start)} from="scale">
        <Label color={colors.red} style={{ color: "white", fontSize: 44 }}>
          VIRALIDAD
        </Label>
      </Pop>
    </div>
  </Panel>
);

// 33.67 "Encuentra los reels que petan,"
export const SceneTrending: React.FC<{ start: number }> = ({ start }) => (
  <Panel>
    <Pop from="down" style={abs(60, 30)}>
      <div style={{ width: 960, display: "flex", alignItems: "center", gap: 18, background: "white", borderRadius: 999, boxShadow: shadow, padding: "18px 30px", fontFamily: fonts.sans, fontSize: 32, color: colors.ink }}>
        <span>🔍</span>
        <TypeText text="reels que petan en tu nicho" delay={2} cps={30} />
      </div>
    </Pop>
    <Pop delay={at(34.0, start)} from="up" style={abs(60, 150)}>
      <RisingChart delay={4} width={590} height={340} />
    </Pop>
    {["120K", "890K", "2,3M"].map((v, i) => (
      <Pop key={v} delay={at(34.19, start) + i * 4} from="up" style={abs(690 + i * 120, 170 - i * 30)}>
        <ReelThumb w={112} views={v} tint={["#b8c9a6", "#a6b8c9", "#c9a6b8"][i]} />
      </Pop>
    ))}
    <div style={abs(700, 440)}>
      <Stamp text="PETANDO 🔥" delay={at(34.65, start)} size={56} rotate={-7} />
    </div>
  </Panel>
);

// 35.77 "te dice por qué funcionan"
export const SceneWhy: React.FC<{ start: number }> = ({ start }) => (
  <Panel>
    <Pop from="scale" style={abs(440, 40)}>
      <ReelThumb w={200} views="2,3M" tint="#c9a6b8" />
    </Pop>
    <DrawnArrow delay={at(36.15, start)} d="M 330 120 C 380 120, 410 110, 450 110" />
    <div style={abs(40, 70)}>
      <HandNote text="gancho en 1s ✓" delay={at(36.15, start)} size={50} rotate={-4} />
    </div>
    <DrawnArrow delay={at(36.41, start)} d="M 760 270 C 720 270, 690 260, 650 250" />
    <div style={abs(770, 230)}>
      <HandNote text="ritmo rápido ✓" delay={at(36.41, start)} size={50} rotate={4} />
    </div>
    <DrawnArrow delay={at(36.55, start)} d="M 330 420 C 380 420, 410 400, 450 390" />
    <div style={abs(30, 390)}>
      <HandNote text="final con pregunta ✓" delay={at(36.55, start)} size={50} rotate={-3} />
    </div>
  </Panel>
);

// 37.27 "y te los convierte en guiones con tu voz."
export const SceneConvert: React.FC<{ start: number }> = ({ start }) => (
  <Panel>
    <Pop from="right" style={abs(60, 70)}>
      <ReelThumb w={170} views="2,3M" tint="#c9a6b8" />
    </Pop>
    <DrawnArrow delay={at(37.6, start)} d="M 260 230 L 390 230 M 390 230 L 362 206 M 390 230 L 362 254" color={colors.ink} />
    <Pop delay={at(37.73, start)} from="left" style={abs(420, 40)}>
      <ScriptPage title="GUION ORIGINAL" lines={["Tu gancho, tu estilo", "Tus ejemplos", "Tu cierre"]} delay={4} gap={8} width={600} />
    </Pop>
    <div style={abs(430, 380)}>
      <Waveform delay={at(39.57, start)} bars={30} />
    </div>
    <div style={abs(70, 470)}>
      <Pop delay={at(39.57, start)} from="scale">
        <Label color={colors.orange} style={{ color: "white", fontSize: 40 }}>
          🎙 CON TU VOZ
        </Label>
      </Pop>
    </div>
  </Panel>
);

// 41.01 "Así que olvídate de quedarte en blanco pensando qué subir."
export const SceneBlank: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const caret = Math.floor(frame / 12) % 2 === 0;
  return (
    <Panel>
      <Pop from="up" style={abs(300, 40)}>
        <div style={{ position: "relative", width: 480, height: 380, background: "white", borderRadius: 26, boxShadow: shadow, padding: 34 }}>
          <span style={{ fontFamily: fonts.serif, fontSize: 44, color: colors.orange, opacity: caret ? 1 : 0 }}>|</span>
          <XStrike w={480} h={380} delay={at(41.59, start)} />
        </div>
      </Pop>
      <div style={abs(40, 70)}>
        <HandNote text="¿qué subo hoy?" delay={6} size={52} color={colors.muted} rotate={-6} />
      </div>
      <div style={abs(800, 160)}>
        <HandNote text="¿y mañana?" delay={14} size={48} color={colors.muted} rotate={5} />
      </div>
      <div style={abs(330, 470)}>
        <Stamp text="¡NUNCA MÁS!" delay={at(42.85, start)} size={64} rotate={-5} />
      </div>
    </Panel>
  );
};

// 44.42 "Se instala pegando un link en Claude."
export const SceneInstall: React.FC<{ start: number }> = ({ start }) => (
  <Panel>
    <Pop from="up" style={abs(60, 30)}>
      <MacWindow title="Claude" style={{ width: 960 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, border: `3px solid ${colors.border}`, borderRadius: 18, padding: "18px 22px", fontFamily: fonts.mono, fontWeight: 700, fontSize: 30, color: colors.ink }}>
          <span style={{ flex: 1 }}>
            <TypeText text="github.com/…/instagram-agent-skill" delay={at(44.93, start)} cps={60} />
          </span>
          <span style={{ width: 56, height: 56, borderRadius: 14, background: colors.orange, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>↑</span>
        </div>
      </MacWindow>
    </Pop>
    <div style={abs(120, 330)}>
      <Pop delay={at(45.3, start)} from="up">
        <ProgressBar width={840} label="instalando 13 skills" delay={at(45.4, start) - at(45.3, start)} duration={10} color={colors.green} />
      </Pop>
    </div>
    <div style={abs(560, 460)}>
      <Stamp text="INSTALADO ✓" color={colors.green} delay={at(45.89, start)} size={58} rotate={-6} />
    </div>
  </Panel>
);

// 46.36 "¿Quieres la guía completa? Coméntame AGENTE y te la paso."
export const SceneCta: React.FC<{ start: number }> = ({ start }) => (
  <Panel>
    <Pop from="scale" style={abs(60, 50)}>
      <div style={{ width: 290, height: 380, background: "white", borderRadius: 24, boxShadow: shadow, padding: 28, position: "relative" }}>
        <Label color={colors.red} style={{ color: "white" }}>PDF</Label>
        <div style={{ fontFamily: fonts.sans, fontWeight: 900, fontSize: 46, lineHeight: 1.05, marginTop: 20, color: colors.ink }}>Guía completa</div>
        {[0.9, 0.75, 0.85, 0.6].map((w, i) => (
          <div key={i} style={{ height: 14, width: `${w * 100}%`, background: "#eceae5", borderRadius: 7, marginTop: 18 }} />
        ))}
      </div>
    </Pop>
    <Pop delay={at(47.0, start)} from="left" style={abs(400, 90)}>
      <div style={{ width: 620, display: "flex", alignItems: "center", gap: 16, background: "white", borderRadius: 22, boxShadow: shadow, padding: "20px 24px" }}>
        <span style={{ width: 54, height: 54, borderRadius: 27, background: "#d8d4cc", flex: "none" }} />
        <div style={{ flex: 1, border: `3px solid ${colors.border}`, borderRadius: 14, padding: "12px 18px", fontFamily: fonts.mono, fontWeight: 800, fontSize: 34, color: colors.ink, minHeight: 44 }}>
          <TypeText text="AGENTE" delay={at(48.13, start) - at(47.0, start)} cps={14} />
        </div>
        <span style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 28, color: colors.blue }}>Publicar</span>
      </div>
    </Pop>
    <div style={abs(400, 300)}>
      <Notification title="Instagram" body="📩 Te he enviado la guía completa" delay={at(48.69, start)} width={620} />
    </div>
    <div style={abs(470, 500)}>
      <HandNote text="¡te la paso por DM!" delay={at(48.95, start)} size={60} rotate={-4} />
    </div>
  </Panel>
);

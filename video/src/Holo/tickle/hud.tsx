import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Cam, CYAN, GOLD, toScreen, V3 } from "../stage";
import { Page } from "./timeline";

// HUD layer in the reference style: tiny monospace uppercase labels with
// leader lines, dark glass chips, karaoke captions with gold keyword boxes.

export const MONO = "'JetBrains Mono', ui-monospace, monospace";
export const SANS = "Poppins, 'Segoe UI', sans-serif";
export const ALERT = "#ff6b4a";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ink = "#e2ebff";

const appear = (frame: number, at: number, len = 6) => interpolate(frame, [at, at + len], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

// ---------------------------------------------------------------- captions
export const Captions: React.FC<{ pages: Page[] }> = ({ pages }) => {
  const frame = useCurrentFrame();
  const page = pages.find((p) => frame >= p.from && frame < p.to);
  if (!page) return null;
  return (
    <div style={{ position: "absolute", top: 190, left: 70, right: 70, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px 16px", fontFamily: SANS, fontWeight: 500, fontSize: 52, lineHeight: 1.3 }}>
      {page.words.map((w, i) => {
        const at = Math.round(w.start * 30);
        const on = frame >= at;
        const pop = interpolate(frame, [at, at + 4], [0.9, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              color: on ? "#ffffff" : "rgba(214,224,255,0.28)",
              transform: `scale(${on ? pop : 1})`,
              padding: w.key ? "0 12px" : 0,
              borderRadius: 7,
              border: w.key && on ? `2px solid ${GOLD}` : "2px solid transparent",
              background: w.key && on ? "rgba(245,184,61,0.12)" : "transparent",
              boxShadow: w.key && on ? "0 0 24px rgba(245,184,61,0.35)" : "none",
              textShadow: "0 2px 14px rgba(0,0,0,0.65)",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- labels
/** Dot on a 3D point, elbow leader line and a typed monospace label. */
export const Label: React.FC<{ anchor: V3; cam: Cam; dx: number; dy: number; text: string; at: number; tone?: string; until?: number }> = ({ anchor, cam, dx: dx0, dy, text, at, tone = GOLD, until }) => {
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame > until + 6)) return null;
  const fade = until !== undefined ? interpolate(frame, [until, until + 6], [1, 0], clamp) : 1;
  const [ax, ay] = toScreen(anchor, cam, frame);
  let dx = dx0;
  const width = text.length * 18 + 40;
  if (dx >= 0 && ax + dx + width > 1050) dx = -dx;
  if (dx < 0 && ax + dx - width < 30) dx = -dx;
  const lx = ax + dx, ly = ay + dy;
  const grow = appear(frame, at);
  const typed = text.slice(0, Math.max(0, Math.floor((frame - at - 4) * 1.8)));
  const ex = ax + dx * grow * 0.4, ey = ay + dy * grow;
  const right = dx >= 0;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={ax} cy={ay} r={6} fill={tone} style={{ filter: `drop-shadow(0 0 8px ${tone})` }} />
        <circle cx={ax} cy={ay} r={14 + (frame - at) * 0.6} fill="none" stroke={tone} strokeOpacity={Math.max(0, 0.6 - (frame - at) * 0.04)} />
        <polyline points={`${ax},${ay} ${ex},${ey} ${ex + (lx - ex) * grow},${ly}`} fill="none" stroke="rgba(220,232,255,0.7)" strokeWidth={1.6} />
      </svg>
      <div style={{ position: "absolute", top: ly - 40, left: right ? lx + 10 : undefined, right: right ? undefined : 1080 - lx + 10, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: "0.14em", color: ink, whiteSpace: "nowrap", textShadow: "0 0 10px rgba(120,160,255,0.6)" }}>
        <span style={{ display: "inline-block", width: 10, height: 10, background: tone, marginRight: 10, boxShadow: `0 0 8px ${tone}` }} />
        {typed}
      </div>
    </AbsoluteFill>
  );
};

/** Numbered marker (1, 2, 3) pinned to a 3D point. */
export const Badge: React.FC<{ anchor: V3; cam: Cam; n: number; at: number; dx?: number; dy?: number }> = ({ anchor, cam, n, at, dx = 0, dy = 0 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const [x, y] = toScreen(anchor, cam, frame);
  const s = interpolate(frame, [at, at + 6], [0.4, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <div style={{ position: "absolute", left: x + dx - 26, top: y + dy - 26, width: 52, height: 52, borderRadius: 26, border: `2px solid ${GOLD}`, background: "rgba(10,15,28,0.8)", color: GOLD, display: "grid", placeItems: "center", fontFamily: MONO, fontWeight: 700, fontSize: 26, transform: `scale(${s})`, boxShadow: `0 0 18px rgba(245,184,61,0.5)` }}>
      {n}
    </div>
  );
};

// ---------------------------------------------------------------- chips
export const Chip: React.FC<{ x: number; y: number; at: number; tone?: string; children: React.ReactNode; until?: number }> = ({ x, y, at, tone = "#2b3c66", children, until }) => {
  const frame = useCurrentFrame();
  const o = appear(frame, at, 5) * (until !== undefined ? interpolate(frame, [until, until + 5], [1, 0], clamp) : 1);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, ${(1 - o) * 14}px)`, opacity: o, display: "flex", alignItems: "center", gap: 16, padding: "14px 22px", borderRadius: 14, background: "rgba(9,15,32,0.8)", border: `1px solid ${tone}`, boxShadow: "0 0 30px rgba(60,90,180,0.25)", fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: "0.12em", color: "#dfe8ff", whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
};

export const Toggle: React.FC<{ on: number; tone?: string }> = ({ on, tone = GOLD }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
    <span style={{ position: "relative", width: 64, height: 32, borderRadius: 16, background: on > 0.5 ? tone : "#26324f" }}>
      <span style={{ position: "absolute", top: 4, left: 4 + on * 32, width: 24, height: 24, borderRadius: 12, background: "#fff", boxShadow: on > 0.5 ? `0 0 12px ${tone}` : "none" }} />
    </span>
    <span style={{ color: on > 0.5 ? tone : "#7d8bb0", minWidth: 44 }}>{on > 0.5 ? "ON" : "OFF"}</span>
  </span>
);

/** Step list whose items tick on in sync with the narration. */
export const Checklist: React.FC<{ x: number; y: number; items: { text: string; at: number }[] }> = ({ x, y, items }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "grid", gap: 14 }}>
      {items.map((it, i) => {
        const o = appear(frame, it.at, 5);
        if (o <= 0) return null;
        return (
          <div key={i} style={{ opacity: o, transform: `translateX(${(1 - o) * -20}px)`, display: "flex", alignItems: "center", gap: 16, padding: "14px 22px", borderRadius: 14, background: "rgba(9,15,32,0.8)", border: "1px solid #2b3c66", fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: "0.12em", color: ink }}>
            <span style={{ width: 34, height: 34, borderRadius: 8, display: "grid", placeItems: "center", background: GOLD, color: "#0A0F1C", fontSize: 22 }}>✓</span>
            <span style={{ color: "#7f93c4" }}>0{i + 1}</span> {it.text}
          </div>
        );
      })}
    </div>
  );
};

/** Notification from "TÚ", marked as read. */
export const Notif: React.FC<{ x: number; y: number; at: number; readAt: number }> = ({ x, y, at, readAt }) => {
  const frame = useCurrentFrame();
  const o = appear(frame, at, 8);
  const read = frame >= readAt;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 760, transform: `translate(-50%, ${(1 - o) * -60}px) perspective(1200px) rotateX(10deg)`, opacity: o, padding: "26px 30px", borderRadius: 26, background: "rgba(14,22,42,0.88)", border: "1px solid #34497e", boxShadow: "0 0 60px rgba(79,130,255,0.25)", display: "grid", gridTemplateColumns: "84px 1fr auto", gap: 22, alignItems: "center", fontFamily: SANS, color: "#fff" }}>
      <div style={{ width: 84, height: 84, borderRadius: 42, border: "3px solid #e8f0ff", boxShadow: "0 0 20px rgba(232,240,255,0.7) inset, 0 0 16px rgba(232,240,255,0.5)" }} />
      <div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: "0.14em", color: "#8fa3d6" }}>MENSAJE DE: TÚ</div>
        <div style={{ fontWeight: 600, fontSize: 38 }}>Cosquillas</div>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.12em", color: read ? CYAN : "#5d6c95" }}>{read ? "✓✓ LEÍDO · SILENCIADO" : "✓ ENVIADO"}</div>
      </div>
      <svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke={read ? "#7f93c4" : "#fff"} strokeWidth={1.6}>
        <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
        {read ? <path d="M3 3l18 18" stroke={ALERT} strokeWidth={2.2} /> : null}
      </svg>
    </div>
  );
};

/** Prediction graph that breaks into "SIN DATOS". */
export const PredGraph: React.FC<{ x: number; y: number; at: number; breakAt: number }> = ({ x, y, at, breakAt }) => {
  const frame = useCurrentFrame();
  const o = appear(frame, at, 6);
  const broken = frame >= breakAt;
  const w = 640, h = 190;
  const pts: string[] = [];
  const head = interpolate(frame, [at, breakAt], [0, 0.55], clamp);
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    if (!broken && t > head) break;
    let v = Math.sin(t * 9) * 0.25 + Math.sin(t * 3.1) * 0.18;
    if (broken && t > 0.55) v = (Math.round(Math.sin(i * 12.9898 + frame) * 43758.5453) % 2) * 0.08; // flatline noise
    pts.push(`${t * w},${h / 2 - v * h}`);
  }
  const blink = broken && Math.floor((frame - breakAt) / 6) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translateX(-50%)", opacity: o, padding: 22, borderRadius: 18, background: "rgba(9,15,32,0.82)", border: `1px solid ${broken ? ALERT : "#2b3c66"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: "0.14em", color: "#8fa3d6", marginBottom: 8 }}>
        <span>PREDICCIÓN</span>
        <span style={{ color: broken ? ALERT : CYAN, opacity: broken ? (blink ? 1 : 0.35) : 1 }}>{broken ? "⚠ SIN DATOS" : "● OK"}</span>
      </div>
      <svg width={w} height={h}>
        <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="rgba(143,163,214,0.2)" />
        <polyline points={pts.join(" ")} fill="none" stroke={broken ? ALERT : CYAN} strokeWidth={3.5} style={{ filter: `drop-shadow(0 0 6px ${broken ? ALERT : CYAN})` }} />
      </svg>
    </div>
  );
};

/** 3 · 2 · 1 countdown chip. */
export const Countdown: React.FC<{ x: number; y: number; at: number; step: number }> = ({ x, y, at, step }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const n = 3 - Math.floor((frame - at) / step);
  const k = ((frame - at) % step) / step;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", display: "flex", gap: 22, fontFamily: MONO, fontWeight: 700 }}>
      {[3, 2, 1].map((d) => (
        <span key={d} style={{ width: 92, height: 92, borderRadius: 18, display: "grid", placeItems: "center", fontSize: 48, border: `2px solid ${d === n ? GOLD : "#2b3c66"}`, color: d === n ? GOLD : d > n ? "#5d6c95" : "#3a4a74", background: "rgba(9,15,32,0.8)", transform: `scale(${d === n ? 1.12 - k * 0.12 : 1})`, boxShadow: d === n ? "0 0 24px rgba(245,184,61,0.5)" : "none" }}>
          {d}
        </span>
      ))}
    </div>
  );
};

/** Researcher card with a faceless silhouette; flips in with a 3D turn. */
export const IdCard: React.FC<{ x: number; y: number; at: number; name: string; role: string; org: string; stamp?: string; stampAt?: number }> = ({ x, y, at, name, role, org, stamp, stampAt = 1e9 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (t <= 0) return null;
  const st = interpolate(frame, [stampAt, stampAt + 6], [2, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 820, transform: `translate(-50%, 0) perspective(1400px) rotateY(${(1 - t) * 95}deg) rotateX(6deg)`, opacity: Math.min(1, t * 2), padding: 30, borderRadius: 26, background: "linear-gradient(160deg, rgba(22,34,64,0.95), rgba(10,16,32,0.95))", border: "1px solid #3a5190", boxShadow: "0 0 70px rgba(79,130,255,0.25)", fontFamily: SANS, color: "#fff" }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: "0.16em", color: "#7f93c4", marginBottom: 18 }}>INVESTIGADORA · ID</div>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        <svg width={150} height={150} viewBox="0 0 100 100">
          <rect width={100} height={100} rx={18} fill="#1c2a4f" />
          <circle cx={50} cy={38} r={17} fill="#4a5f96" />
          <path d="M18 92c4-20 18-30 32-30s28 10 32 30z" fill="#4a5f96" />
        </svg>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 44, lineHeight: 1.1 }}>{name}</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: "0.12em", color: GOLD }}>{role}</div>
          <div style={{ fontSize: 28, color: "#c3cde8" }}>{org}</div>
        </div>
      </div>
      {stamp && frame >= stampAt ? (
        <div style={{ position: "absolute", right: 30, bottom: 26, transform: `rotate(-10deg) scale(${st})`, border: `4px solid ${ALERT}`, color: ALERT, borderRadius: 10, padding: "6px 18px", fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: "0.16em" }}>{stamp}</div>
      ) : null}
    </div>
  );
};

/** Horizontal slider with a label and value. */
export const Slider: React.FC<{ x: number; y: number; at: number; label: string; value: number; text: string }> = ({ x, y, at, label, value, text }) => {
  const frame = useCurrentFrame();
  const o = appear(frame, at, 6);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translateX(-50%)", opacity: o, width: 720, padding: "18px 24px", borderRadius: 16, background: "rgba(9,15,32,0.82)", border: "1px solid #2b3c66", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", color: ink }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, marginBottom: 14 }}>
        <span>{label}</span>
        <span style={{ color: CYAN }}>{text}</span>
      </div>
      <div style={{ position: "relative", height: 10, borderRadius: 5, background: "#22335c" }}>
        <div style={{ position: "absolute", inset: 0, width: `${value * 100}%`, borderRadius: 5, background: CYAN, boxShadow: `0 0 12px ${CYAN}` }} />
        <div style={{ position: "absolute", top: -11, left: `calc(${value * 100}% - 16px)`, width: 32, height: 32, borderRadius: 16, background: "#fff", boxShadow: `0 0 16px ${CYAN}` }} />
      </div>
    </div>
  );
};

/** Vertical meter (e.g. COSQUILLAS) with segmented fill. */
export const Meter: React.FC<{ x: number; y: number; at: number; label: string; value: number; tone?: string }> = ({ x, y, at, label, value, tone = GOLD }) => {
  const frame = useCurrentFrame();
  const o = appear(frame, at, 6);
  const segs = 10;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translateX(-50%)", opacity: o, padding: "18px 16px", borderRadius: 16, background: "rgba(9,15,32,0.82)", border: "1px solid #2b3c66", display: "grid", gap: 8, justifyItems: "center", fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: "0.12em", color: ink }}>
      <div style={{ display: "grid", gap: 5 }}>
        {Array.from({ length: segs }, (_, i) => {
          const lit = (segs - i) / segs <= value + 0.001;
          return <div key={i} style={{ width: 70, height: 16, borderRadius: 4, background: lit ? tone : "#1d2a4b", boxShadow: lit ? `0 0 10px ${tone}` : "none" }} />;
        })}
      </div>
      <span>{label}</span>
      <span style={{ color: tone, fontSize: 24 }}>{Math.round(value * 100)}%</span>
    </div>
  );
};

/** Horizontal progress bar (e.g. CONFIANZA). */
export const Bar: React.FC<{ x: number; y: number; at: number; label: string; value: number }> = ({ x, y, at, label, value }) => {
  const frame = useCurrentFrame();
  const o = appear(frame, at, 6);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translateX(-50%)", opacity: o, width: 640, padding: "16px 22px", borderRadius: 14, background: "rgba(9,15,32,0.82)", border: "1px solid #2b3c66", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", color: ink }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, marginBottom: 10 }}>
        <span>{label}</span>
        <span style={{ color: GOLD }}>{Math.round(value * 100)}%</span>
      </div>
      <div style={{ height: 14, borderRadius: 7, background: "#1d2a4b", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value * 100}%`, background: `linear-gradient(90deg, #c98a1c, ${GOLD})`, boxShadow: `0 0 14px ${GOLD}` }} />
      </div>
    </div>
  );
};

/** Floating phone hologram: share sheet → contact selected → sent. */
export const Phone: React.FC<{ at: number; pickAt: number; sendAt: number }> = ({ at, pickAt, sendAt }) => {
  const frame = useCurrentFrame();
  const o = appear(frame, at, 10);
  const sheet = interpolate(frame, [at + 6, at + 18], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sent = frame >= sendAt;
  const people = [["A", "Ana"], ["♥", "Mi persona"], ["L", "Leo"], ["J", "Juli"]];
  return (
    <div style={{ position: "absolute", left: 540, top: 470, width: 560, height: 1060, transform: `translate(-50%, ${(1 - o) * 80}px) perspective(1600px) rotateX(8deg) rotateY(-10deg)`, opacity: o, borderRadius: 64, padding: 16, background: "linear-gradient(160deg, #2a3350, #0e1424)", boxShadow: "0 0 0 2px #3b4a78 inset, 0 40px 100px rgba(0,0,0,0.7), 0 0 120px rgba(79,130,255,0.25)" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 50, overflow: "hidden", background: "#0b1120", fontFamily: SANS, color: "#fff" }}>
        <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", width: 150, height: 36, borderRadius: 18, background: "#000" }} />
        {/* the reel being shared */}
        <div style={{ position: "absolute", top: 100, left: 40, right: 40, height: 470, borderRadius: 28, background: "radial-gradient(80% 60% at 50% 70%, rgba(79,209,232,0.25), transparent 70%), #0d1730", border: "1px solid #2b3c66", display: "grid", placeItems: "center", padding: 30, textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 36, lineHeight: 1.25 }}>¿Por qué no puedes hacerte <span style={{ border: `2px solid ${GOLD}`, borderRadius: 6, padding: "0 8px" }}>cosquillas</span>?</div>
        </div>
        {/* share sheet */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 420, transform: `translateY(${sheet * 100}%)`, borderRadius: "34px 34px 0 0", background: "rgba(22,30,54,0.98)", borderTop: "1px solid #34497e", padding: "26px 30px" }}>
          <div style={{ width: 70, height: 6, borderRadius: 3, background: "#3a4a74", margin: "0 auto 22px" }} />
          <div style={{ fontWeight: 600, fontSize: 30, marginBottom: 26 }}>Compartir con</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {people.map(([ini, name], i) => {
              const picked = i === 1 && frame >= pickAt;
              return (
                <div key={name} style={{ display: "grid", justifyItems: "center", gap: 10, width: 110 }}>
                  <div style={{ width: 92, height: 92, borderRadius: 46, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 34, background: i === 1 ? "rgba(245,184,61,0.18)" : "#22335c", color: i === 1 ? GOLD : "#cfdbff", border: picked ? `4px solid ${GOLD}` : "4px solid transparent", boxShadow: picked ? `0 0 24px ${GOLD}` : "none" }}>{ini}</div>
                  <span style={{ fontSize: 21, color: picked ? GOLD : "#aab6d8", whiteSpace: "nowrap" }}>{name}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 34, height: 86, borderRadius: 43, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 32, background: sent ? GOLD : frame >= pickAt ? "#2e4170" : "#1d2a4b", color: sent ? "#0A0F1C" : "#dfe8ff", boxShadow: sent ? `0 0 30px ${GOLD}` : "none" }}>
            {sent ? "Enviado ✓" : "Enviar"}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Closing card (no logo yet): engagement question + follow line. */
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const o = appear(frame, 2, 10);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(70% 45% at 50% 45%, rgba(79,209,232,0.12), transparent 70%), #0A0F1C", display: "grid", placeItems: "center", opacity: o }}>
      <div style={{ textAlign: "center", display: "grid", gap: 34, justifyItems: "center", padding: "0 90px" }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 76, lineHeight: 1.15, color: "#fff" }}>
          ¿Dónde tienes más <span style={{ border: `3px solid ${GOLD}`, borderRadius: 10, padding: "0 16px", boxShadow: "0 0 30px rgba(245,184,61,0.4)" }}>cosquillas</span>?
        </div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: "0.18em", color: CYAN }}>COMENTA ↓ · SÍGUENOS PARA MÁS CIENCIA DE LO COTIDIANO</div>
      </div>
    </AbsoluteFill>
  );
};

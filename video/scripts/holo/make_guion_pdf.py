"""PDF del guion de un reel, a partir de su guion.json: diálogo por bloques,
texto para la voz con sus ajustes, fuentes, tabla de escenas con tiempos y la
publicación de Instagram.

usage: make_guion_pdf.py <reel-dir> <out.pdf>
Los tiempos de escena salen de <reel-dir>/voice.ts (voz real) o, si aún no hay
voz, de una lectura estimada a ~160 palabras por minuto.
"""
import json, os, re, sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Table, TableStyle

F = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("Sans", F + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Bold", F + "DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Mono", F + "DejaVuSansMono.ttf"))
pdfmetrics.registerFont(TTFont("Mono-Bold", F + "DejaVuSansMono-Bold.ttf"))
pdfmetrics.registerFontFamily("Sans", normal="Sans", bold="Sans-Bold")
GLYPHS = set(TTFont("probe", F + "DejaVuSans.ttf").face.charToGlyph)

NAVY = colors.HexColor("#0A0F1C")
INK = colors.HexColor("#1b2238")
GOLD = colors.HexColor("#C98A1C")
GOLD_BG = colors.HexColor("#FFF4DC")
CYAN = colors.HexColor("#1B8FA3")
MIST = colors.HexColor("#5b6684")
LINE = colors.HexColor("#d9deea")

st = {
    "kicker": ParagraphStyle("k", fontName="Mono-Bold", fontSize=8.5, textColor=CYAN, leading=12, spaceAfter=4),
    "title": ParagraphStyle("t", fontName="Sans-Bold", fontSize=20, leading=24, textColor=NAVY, spaceAfter=6),
    "lead": ParagraphStyle("l", fontName="Sans", fontSize=10.5, leading=15.5, textColor=MIST, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName="Sans-Bold", fontSize=14, leading=18, textColor=NAVY, spaceBefore=14, spaceAfter=8),
    "block": ParagraphStyle("b", fontName="Mono-Bold", fontSize=8.2, leading=10.5, textColor=GOLD, spaceBefore=6, spaceAfter=2),
    "body": ParagraphStyle("body", fontName="Sans", fontSize=10.6, leading=15.4, textColor=INK),
    "voice": ParagraphStyle("v", fontName="Sans", fontSize=9.8, leading=14.2, textColor=INK, spaceAfter=5),
    "small": ParagraphStyle("s", fontName="Sans", fontSize=8.8, leading=12.5, textColor=INK),
    "smallmono": ParagraphStyle("sm", fontName="Mono", fontSize=8, leading=11, textColor=INK),
    "note": ParagraphStyle("n", fontName="Sans", fontSize=9, leading=13, textColor=MIST, spaceAfter=4),
}

BARE = re.compile(r"[¿?¡!.,:;…\"«»]")


def clean(text):
    """Escape for Paragraph markup and drop characters the font can't draw (emoji)."""
    return escape("".join(c for c in text if c == "\n" or ord(c) in GLYPHS)).replace("\n", "<br/>")


def bold_keywords(text, keys):
    return " ".join(f"<b>{clean(w)}</b>" if BARE.sub("", w.lower()) in keys else clean(w) for w in text.split())


def scene_starts(reel_dir, segments):
    """Start second of every scene: from voice.ts when it matches the script, else estimated."""
    counts = [len(s.split()) for s in segments]
    voice = []
    path = os.path.join(reel_dir, "voice.ts")
    if os.path.exists(path):
        voice = [float(m) for m in re.findall(r"\[([\d.]+), [\d.]+\],", open(path, encoding="utf8").read())]
    starts, k = [], 0
    if len(voice) == sum(counts):
        for c in counts:
            starts.append(voice[k]); k += c
        return starts, True, voice[-1]
    t = 0.35
    for c in counts:
        starts.append(t); t += c * 60 / 160
    return starts, False, t


def mmss(s):
    return f"{int(s // 60)}:{int(s % 60):02d}"


def build(reel_dir, out):
    g = json.load(open(os.path.join(reel_dir, "guion.json"), encoding="utf8"))
    voz = json.load(open(os.path.join(os.path.dirname(__file__), "voz.json"), encoding="utf8"))
    keys = {BARE.sub("", k.lower()) for k in g["palabras_clave"]}
    escenas = [e for b in g["bloques"] for e in b["escenas"]]
    segments = [e["texto"] for e in escenas]
    words = sum(len(s.split()) for s in segments)
    starts, real, total = scene_starts(reel_dir, segments)
    num = f"{g['numero']:02d}"
    short = g["slug"].split("-", 1)[-1].replace("-", " ").upper()

    def page(c, doc):
        c.saveState()
        c.setFillColor(NAVY)
        c.rect(0, A4[1] - 9 * mm, A4[0], 9 * mm, stroke=0, fill=1)
        c.setFillColor(GOLD)
        c.rect(0, A4[1] - 9 * mm, 38 * mm, 9 * mm, stroke=0, fill=1)
        c.setFont("Mono-Bold", 7.5)
        c.setFillColor(NAVY)
        c.drawString(6 * mm, A4[1] - 5.8 * mm, f"GUION {num}")
        c.setFillColor(colors.white)
        c.drawString(44 * mm, A4[1] - 5.8 * mm, f"CIENCIA HOLOGRÁFICA · {short}")
        c.setFont("Mono", 7.5)
        c.setFillColor(MIST)
        c.drawRightString(A4[0] - 14 * mm, 9 * mm, f"{doc.page}")
        c.restoreState()

    doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=20 * mm, bottomMargin=18 * mm,
                            title=f"Guion {num} · {g['titulo']}", author="Plink")
    s = []
    dur = f"{round(total)} SEGUNDOS" if real else f"~{round(total)} SEGUNDOS (ESTIMADO)"
    s.append(Paragraph(f"GUION PARA NARRACIÓN · {dur} · {words} PALABRAS · {len(escenas)} ESCENAS", st["kicker"]))
    s.append(Paragraph(clean(g["titulo"]), st["title"]))
    s.append(Paragraph(clean(g["por_que"]) + " Palabras en negrita: van en el recuadro dorado de los subtítulos.", st["lead"]))

    s.append(Paragraph("Diálogo por bloques", st["h2"]))
    for i, b in enumerate(g["bloques"], 1):
        text = " ".join(bold_keywords(e["texto"], keys) for e in b["escenas"])
        s.append(KeepTogether([Paragraph(f"{i} · {clean(b['nombre']).upper()}", st["block"]), Paragraph(text, st["body"])]))

    s.append(PageBreak())
    s.append(Paragraph("Texto para la voz (ElevenLabs)", st["h2"]))
    s.append(Paragraph("El mismo texto que se envía a ElevenLabs: un párrafo por bloque, los puntos suspensivos marcan las pausas.", st["note"]))
    box = Table([[Paragraph(clean(" ".join(e["texto"] for e in b["escenas"])), st["voice"])] for b in g["bloques"]], colWidths=[174 * mm])
    box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), GOLD_BG), ("BOX", (0, 0), (-1, -1), 0.8, GOLD), ("LEFTPADDING", (0, 0), (-1, -1), 10),
                             ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    s.append(box)
    s.append(Paragraph("Ajustes de voz", st["h2"]))
    vs = voz["voice_settings"]
    rows = [["Voz", voz["voz"]], ["Modelo", voz["model_id"]],
            ["Stability · Similarity · Style", f"{round(vs['stability'] * 100)} · {round(vs['similarity_boost'] * 100)} · {round(vs['style'] * 100)}"],
            ["Speaker boost · Velocidad", f"{'sí' if vs['use_speaker_boost'] else 'no'} · {vs['speed']:.2f}"], ["Formato", voz["output_format"]]]
    t = Table([[Paragraph(f"<b>{a}</b>", st["small"]), Paragraph(clean(b), st["small"])] for a, b in rows], colWidths=[60 * mm, 114 * mm])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    s.append(t)
    s.append(Paragraph("Fuentes verificadas", st["h2"]))
    for f in g["fuentes"]:
        urls = " · ".join(f'<link href="{escape(u)}" color="#1B8FA3">{escape(re.sub(r"^https?://(www\\.)?", "", u).rstrip("/"))}</link>' for u in f["urls"])
        s.append(Paragraph("• " + clean(f["texto"]) + (f"<br/>{urls}" if urls else ""), st["note"]))

    s.append(PageBreak())
    s.append(Paragraph(f"Escenas ({len(escenas)})", st["h2"]))
    s.append(Paragraph("Una escena por frase. " + ("Tiempos de la voz final." if real else "Tiempos estimados; se ajustan a la voz real."), st["note"]))
    data = [[Paragraph(f"<b>{h}</b>", st["small"]) for h in ("#", "Tiempo", "Narración", "Imagen")]]
    for i, (e, t0) in enumerate(zip(escenas, starts), 1):
        data.append([Paragraph(str(i), st["smallmono"]), Paragraph(mmss(t0), st["smallmono"]), Paragraph(clean(e["texto"]), st["small"]), Paragraph(clean(e["imagen"]), st["small"])])
    tab = Table(data, colWidths=[8 * mm, 18 * mm, 68 * mm, 80 * mm], repeatRows=1)
    tab.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), GOLD_BG), ("LINEBELOW", (0, 0), (-1, 0), 0.8, GOLD), ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE),
                             ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5)]))
    s.append(tab)

    ig = g["instagram"]
    s.append(PageBreak())
    s.append(Paragraph("Publicación de Instagram", st["h2"]))
    s.append(Paragraph("Texto listo para pegar (con emojis en el archivo descripcion-ig.txt de la entrega).", st["note"]))
    cap = Table([[Paragraph(clean(ig["descripcion"] + "\n\n" + " ".join(ig["hashtags"])), st["voice"])]], colWidths=[174 * mm])
    cap.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), GOLD_BG), ("BOX", (0, 0), (-1, -1), 0.8, GOLD), ("LEFTPADDING", (0, 0), (-1, -1), 10),
                             ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    s.append(cap)
    s.append(Paragraph("Comentario fijado", st["h2"]))
    s.append(Paragraph(clean(ig["comentario_fijado"]), st["body"]))

    doc.build(s, onFirstPage=page, onLaterPages=page)


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
    print("ok", sys.argv[2])

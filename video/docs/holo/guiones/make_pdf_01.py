"""PDF del guion 01 (cosquillas): diálogo, texto para la voz, escenas y fuentes.

usage: python3 make_pdf_01.py out.pdf
"""
import sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

F = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("Sans", F + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Bold", F + "DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Mono", F + "DejaVuSansMono.ttf"))
pdfmetrics.registerFont(TTFont("Mono-Bold", F + "DejaVuSansMono-Bold.ttf"))
pdfmetrics.registerFontFamily("Sans", normal="Sans", bold="Sans-Bold")

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
    "body": ParagraphStyle("body", fontName="Sans", fontSize=10.6, leading=15.4, textColor=INK, alignment=TA_LEFT),
    "voice": ParagraphStyle("v", fontName="Sans", fontSize=9.8, leading=14.2, textColor=INK, spaceAfter=5),
    "small": ParagraphStyle("s", fontName="Sans", fontSize=8.8, leading=12.5, textColor=INK),
    "smallmono": ParagraphStyle("sm", fontName="Mono", fontSize=8, leading=11, textColor=INK),
    "note": ParagraphStyle("n", fontName="Sans", fontSize=9, leading=13, textColor=MIST, spaceAfter=4),
}

BLOCKS = [
    ("1 · GANCHO DOBLE", "¿Por qué no puedes hacerte <b>cosquillas</b> a ti mismo? ¿Y por qué basta con que alguien acerque la mano… para que te rías <b>antes</b> de que te toque?"),
    ("2 · REENCUADRE", "No es que tu piel falle. Es que tu <b>cerebro</b> sabe lo que vas a hacer… antes de que lo hagas."),
    ("3 · PIÉNSALO ASÍ", "Piénsalo así: cuando mueves la mano, tu <b>cerebelo</b> copia la orden, predice lo que vas a sentir… y apaga la sensación. Tus propias cosquillas son un <b>mensaje</b> que tu cerebro ya leyó."),
    ("4 · PASAN TRES COSAS", "Pero si la mano es de otra persona, no hay <b>predicción</b>. Y pasan tres cosas: la señal llega completa… el <b>hipotálamo</b>, una zona que controla tus reacciones automáticas, se enciende… y tu cuerpo estalla en <b>risa</b>. Investigadores de la Universidad de Friburgo lo vieron con <b>resonancia</b> magnética: el hipotálamo se activa incluso antes del contacto, solo con anticipar las cosquillas."),
    ("5 · PERO AQUÍ VIENE LO CURIOSO", "Pero aquí viene lo <b>curioso</b>. En el University College London, la neurocientífica Sarah-Jayne Blakemore hizo que voluntarios se hicieran cosquillas con un <b>robot</b>. Si el robot copiaba su movimiento al instante, las sentían mucho menos… pero con un pequeño <b>retraso</b>, volvían. Cuanto más retraso, más cosquillas.<br/><br/>Y no somos los únicos. En la Universidad Humboldt de Berlín vieron que las <b>ratas</b> también se ríen con las cosquillas, con un sonido que no podemos oír… pero si tenían <b>miedo</b>, las cosquillas desaparecían."),
    ("6 · CIERRE EMOCIONAL", "Los científicos creen que en nosotros pasa algo parecido. Las cosquillas no son solo un juego… son una señal de <b>confianza</b>. Tu cerebro solo se deja sorprender por alguien con quien se siente a <b>salvo</b>."),
    ("7 · COMPARTIR", "Mándaselo a esa persona que sabe exactamente dónde tienes cosquillas."),
]

VOICE = [
    "¿Por qué no puedes hacerte cosquillas a ti mismo? ¿Y por qué basta con que alguien acerque la mano… para que te rías antes de que te toque?",
    "No es que tu piel falle. Es que tu cerebro sabe lo que vas a hacer… antes de que lo hagas.",
    "Piénsalo así: cuando mueves la mano, tu cerebelo copia la orden, predice lo que vas a sentir… y apaga la sensación. Tus propias cosquillas son un mensaje que tu cerebro ya leyó.",
    "Pero si la mano es de otra persona, no hay predicción. Y pasan tres cosas: la señal llega completa… el hipotálamo, una zona que controla tus reacciones automáticas, se enciende… y tu cuerpo estalla en risa. Investigadores de la Universidad de Friburgo lo vieron con resonancia magnética: el hipotálamo se activa incluso antes del contacto, solo con anticipar las cosquillas.",
    "Pero aquí viene lo curioso. En el University College London, la neurocientífica Sarah-Jayne Blakemore hizo que voluntarios se hicieran cosquillas con un robot. Si el robot copiaba su movimiento al instante, las sentían mucho menos… pero con un pequeño retraso, volvían. Cuanto más retraso, más cosquillas.",
    "Y no somos los únicos. En la Universidad Humboldt de Berlín vieron que las ratas también se ríen con las cosquillas, con un sonido que no podemos oír… pero si tenían miedo, las cosquillas desaparecían.",
    "Los científicos creen que en nosotros pasa algo parecido. Las cosquillas no son solo un juego… son una señal de confianza. Tu cerebro solo se deja sorprender por alguien con quien se siente a salvo.",
    "Mándaselo a esa persona que sabe exactamente dónde tienes cosquillas.",
]

SCENES = [
    ("0:00", "¿Por qué no puedes hacerte cosquillas…?", "Cápsula blanca; su propia pluma rebota contra un escudo hexagonal «BLOQUEADO»."),
    ("0:03", "…alguien acerque la mano…", "La cápsula dorada se acerca con una pluma; la blanca ya vibra de risa antes del contacto."),
    ("0:09", "No es que tu piel falle…", "Cabeza de cristal con el cerebro dentro; la barra «PREDICCIÓN» llega antes que «ACCIÓN»."),
    ("0:16", "Tu cerebelo copia, predice, apaga.", "Cerebro de puntos con el cerebelo dorado y la lista «COPIA / PREDICE / APAGA»."),
    ("0:24", "Un mensaje que ya leyó.", "Notificación «Mensaje de: TÚ» que pasa a «LEÍDO», campana silenciada."),
    ("0:28", "No hay predicción.", "La pluma dorada se acerca; la gráfica de predicción se rompe en «SIN DATOS»."),
    ("0:31", "Pasan tres cosas…", "Señal cian que sube (1), hipotálamo encendido (2), ondas de risa (3)."),
    ("0:41", "Universidad de Friburgo… resonancia.", "Escáner de resonancia de malla con la cápsula entrando."),
    ("0:46", "…antes del contacto.", "La pluma se queda sin tocar y el hipotálamo ya brilla; cuenta 3·2·1."),
    ("0:51", "Pero aquí viene lo curioso.", "Signo de interrogación dorado gigante y placa «DATO CURIOSO»."),
    ("0:53", "Blakemore… robot.", "Ficha de investigadora que entra girando; brazo robótico con espuma."),
    ("1:01", "Cuanto más retraso…", "Deslizador «RETRASO» y medidor «COSQUILLAS» que sube."),
    ("1:10", "Las ratas también se ríen…", "Rata estilo cápsula saltando de alegría, ondas «50 kHz · INAUDIBLE»."),
    ("1:20", "…si tenían miedo…", "Interruptor rojo «MIEDO: ON»; las ondas desaparecen."),
    ("1:23", "Señal de confianza… a salvo.", "Las dos cápsulas bajo una cúpula dorada «ZONA SEGURA», barra «CONFIANZA»."),
    ("1:36", "Mándaselo a esa persona…", "Móvil holográfico que comparte con «Mi persona» → «Enviado ✓»; glitch final."),
]

SOURCES = [
    "Cerebelo y cosquillas propias; experimento del robot con retraso (Sarah-Jayne Blakemore, University College London): scientificamerican.com/article/why-cant-a-person-tickle · sciencealert.com/the-scientific-reason-you-can-t-tickle-yourself",
    "Hipotálamo en la risa por cosquillas (Wattendorf et al., Universidad de Friburgo, Cerebral Cortex 2013) y activación al anticipar (mismo grupo, 2019): pubmed.ncbi.nlm.nih.gov/22508768 · pmc.ncbi.nlm.nih.gov/articles/PMC6847157",
    "Ratas que ríen a 50 kHz y pierden las cosquillas con miedo (Ishiyama & Brecht, Universidad Humboldt de Berlín, Science 2016): hu-berlin.de · smithsonianmag.com · sciencenews.org",
    "«Señal de confianza» en humanos: hipótesis, narrada como «los científicos creen».",
]


def page(c, doc):
    c.saveState()
    c.setFillColor(NAVY)
    c.rect(0, A4[1] - 9 * mm, A4[0], 9 * mm, stroke=0, fill=1)
    c.setFillColor(GOLD)
    c.rect(0, A4[1] - 9 * mm, 38 * mm, 9 * mm, stroke=0, fill=1)
    c.setFont("Mono-Bold", 7.5)
    c.setFillColor(NAVY)
    c.drawString(6 * mm, A4[1] - 5.8 * mm, "GUION 01")
    c.setFillColor(colors.white)
    c.drawString(44 * mm, A4[1] - 5.8 * mm, "CIENCIA HOLOGRÁFICA · COSQUILLAS")
    c.setFont("Mono", 7.5)
    c.setFillColor(MIST)
    c.drawRightString(A4[0] - 14 * mm, 9 * mm, f"{doc.page}")
    c.restoreState()


def build(out):
    doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=20 * mm, bottomMargin=18 * mm,
                            title="Guion 01 · ¿Por qué no puedes hacerte cosquillas a ti mismo?", author="Plink")
    s = []
    s.append(Paragraph("GUION PARA NARRACIÓN · ~100 SEGUNDOS · 267 PALABRAS", st["kicker"]))
    s.append(Paragraph("¿Por qué no puedes hacerte cosquillas a ti mismo?", st["title"]))
    s.append(Paragraph("Reel de curiosidades científicas en estilo holográfico. Estructura de 7 bloques: gancho doble, reencuadre, analogía, mecanismo, giro con estudios reales, cierre emocional y llamada a compartir. Palabras en negrita: van en el recuadro dorado de los subtítulos.", st["lead"]))

    s.append(Paragraph("Diálogo por bloques", st["h2"]))
    for label, text in BLOCKS:
        s.append(KeepTogether([Paragraph(label, st["block"]), Paragraph(text, st["body"])]))

    s.append(PageBreak())
    s.append(Paragraph("Texto limpio para la voz (ElevenLabs)", st["h2"]))
    s.append(Paragraph("Pégalo tal cual: los puntos suspensivos marcan las pausas.", st["note"]))
    box = Table([[Paragraph(p, st["voice"])] for p in VOICE], colWidths=[174 * mm])
    box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), GOLD_BG), ("BOX", (0, 0), (-1, -1), 0.8, GOLD), ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    s.append(box)
    s.append(Paragraph("Ajustes de voz", st["h2"]))
    rows = [["Modelo", "Eleven Multilingual v2 (o el multilingüe más nuevo)"], ["Voz", "Masculina, cálida, medio-grave, español"], ["Tono", "Documental íntimo, ritmo pausado"], ["Stability · Similarity · Style", "~50 · ~75 · ~20"], ["Velocidad", "0,9 – 1,0"], ["Formato", "MP3 o WAV"]]
    t = Table([[Paragraph(f"<b>{a}</b>", st["small"]), Paragraph(b, st["small"])] for a, b in rows], colWidths=[60 * mm, 114 * mm])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    s.append(t)
    s.append(Paragraph("Fuentes verificadas", st["h2"]))
    for src in SOURCES:
        s.append(Paragraph("• " + src, st["note"]))

    s.append(PageBreak())
    s.append(Paragraph("Escenas (16)", st["h2"]))
    s.append(Paragraph("Una escena por frase. Tiempos aproximados de la versión actual; se ajustan a la voz real.", st["note"]))
    data = [[Paragraph("<b>#</b>", st["small"]), Paragraph("<b>Tiempo</b>", st["small"]), Paragraph("<b>Narración</b>", st["small"]), Paragraph("<b>Imagen</b>", st["small"])]]
    for i, (tm, nar, img) in enumerate(SCENES, 1):
        data.append([Paragraph(str(i), st["smallmono"]), Paragraph(tm, st["smallmono"]), Paragraph(nar, st["small"]), Paragraph(img, st["small"])])
    tab = Table(data, colWidths=[8 * mm, 17 * mm, 52 * mm, 97 * mm], repeatRows=1)
    tab.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), GOLD_BG), ("LINEBELOW", (0, 0), (-1, 0), 0.8, GOLD), ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5)]))
    s.append(tab)

    doc.build(s, onFirstPage=page, onLaterPages=page)


build(sys.argv[1])
print("ok")

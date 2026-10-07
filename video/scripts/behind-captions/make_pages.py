"""Lay out captions as two 3D "walls" flanking the speaker.

Each caption page is split into a left part and a right part. Each part is
anchored at the frame edge and rotated so it recedes toward the speaker
(perspective), sized so its projected inner edge never reaches the person's
silhouette in any frame of the page. Placement comes from the person matte.

usage: make_pages.py words.json matte.mp4 ffmpeg out.ts anton.woff
"""
import json, re, subprocess, sys
import numpy as np
from fontTools.ttLib import TTFont

words_path, matte_path, ffmpeg, out_ts, font_path = sys.argv[1:6]
FPS, W, H, N = 24, 1080, 1920, 720
CUTS = [0, 240, 480, 720]

# Must match BehindCaptions.tsx
PERSPECTIVE = 1500
ANGLE_DEG = 48
MARGIN = 26          # outer edge distance from the frame edge
GAP = 18             # min distance between text and the person
SPAN_PCT = 15        # ignore the 15% most extreme frames (a hand swinging past is fine: the person is on top)
LINE_HEIGHT = 1.0
EXTRUDE_EM = 0.05    # extra width taken by the extruded shadow
MAX_FONT, MIN_FONT = 130, 62

_font = TTFont(font_path)
_cmap, _hmtx, _upm = _font.getBestCmap(), _font["hmtx"], _font["head"].unitsPerEm

def width_em(text, gap_em=0.22):
    em = 0.0
    for ch in text:
        if ch == " ":
            em += gap_em
            continue
        g = _cmap.get(ord(ch))
        em += (_hmtx[g][0] if g else _upm * 0.5) / _upm
    return em

def clean(t):
    return re.sub(r"[.,;:]", "", t).upper()

# ---------------------------------------------------------------- words
FIXES = {(14.42, "qué"): "que"}
words = []
for w in json.load(open(words_path)):
    text = FIXES.get((round(w["start"], 2), w["text"]), w["text"])
    start, end = w["start"], w["end"]
    if end - start > 0.6:            # long gap absorbed into a short word
        start = end - 0.45
    words.append({"text": text, "start": start, "end": end})

# ---------------------------------------------------------------- pages
def label_len(p):
    return sum(len(clean(x["text"])) for x in p) + len(p) - 1

pages, cur = [], []
for i, w in enumerate(words):
    cur.append(w)
    nxt = words[i + 1] if i + 1 < len(words) else None
    nxt_chars = label_len(cur + [nxt]) if nxt else 0
    if (nxt is None or re.search(r"[.,?!]$", w["text"]) or nxt["start"] - w["end"] > 0.35
            or len(cur) >= 2 or nxt_chars > 11):
        pages.append(cur); cur = []

merged, i = [], 0
while i < len(pages):                 # merge flash pages (< 7 frames)
    p = pages[i]
    if i + 1 < len(pages):
        if (pages[i + 1][0]["start"] - p[0]["start"]) * FPS < 7 and label_len(p + pages[i + 1]) <= 14:
            pages[i + 1] = p + pages[i + 1]; i += 1; continue
    merged.append(p); i += 1
pages = merged

# ---------------------------------------------------------------- free space
proc = subprocess.run([ffmpeg, "-v", "error", "-i", matte_path, "-vf", "scale=270:480",
                       "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True, check=True)
m = np.frombuffer(proc.stdout, np.uint8).reshape(-1, 480, 270) > 100
L = np.where(m.any(2), np.argmax(m, 2), 270) * 4                  # leftmost person x per row
R = np.where(m.any(2), 269 - np.argmax(m[:, :, ::-1], 2), 0) * 4  # rightmost person x per row

# top of the head per frame (topmost row with enough person pixels)
HEAD_TOP = np.array([(np.where(f.sum(axis=1) >= 6)[0][:1] * 4).tolist()[0] if f.any() else 400 for f in m])
BESIDE_HEAD = 140    # captions start this far below the top of the head (beside it, not above it)

a = np.radians(ANGLE_DEG)

def inner_x(w_px, side):
    """Projected x of the inner (speaker-side) edge of a block of width w_px."""
    s = PERSPECTIVE / (PERSPECTIVE + w_px * np.sin(a))
    if side == "left":
        return W / 2 + (MARGIN + w_px * np.cos(a) - W / 2) * s
    return W / 2 + (W - MARGIN - w_px * np.cos(a) - W / 2) * s

def fits(lines_em, fs, cy, f0, f1, side):
    h = fs * LINE_HEIGHT * len(lines_em)
    r0, r1 = int((cy - h / 2) // 4), int((cy + h / 2) // 4) + 1
    if r0 < 10 or r1 > 470:
        return False
    w_px = fs * (max(lines_em) + EXTRUDE_EM)
    x = inner_x(w_px, side)
    if side == "left":
        return x <= np.percentile(L[f0:f1, r0:r1].min(axis=1), SPAN_PCT) - GAP
    return x >= np.percentile(R[f0:f1, r0:r1].max(axis=1), 100 - SPAN_PCT) + GAP

def best_font(lines_em, cy, f0, f1, side):
    lo, hi = 0, MAX_FONT
    for _ in range(12):
        mid = (lo + hi) / 2
        if fits(lines_em, mid, cy, f0, f1, side): lo = mid
        else: hi = mid
    return lo

def splits(ws):
    """Ways to split a page's words into (left, right)."""
    if len(ws) == 1:
        return [(ws, []), ([], ws)]
    return [(ws[:k], ws[k:]) for k in range(1, len(ws))]

def arrangements(side_words):
    """One line, or one word per line (stacked)."""
    texts = [clean(x["text"]) for x in side_words]
    opts = [[" ".join(texts)]]
    if len(texts) > 1:
        opts.append(texts)
    return opts

out, prev_cy = [], None
for i, p in enumerate(pages):
    start = p[0]["start"]
    nxt_start = pages[i + 1][0]["start"] if i + 1 < len(pages) else 30.0
    end = min(nxt_start, p[-1]["end"] + 0.6)
    sf, ef = round(start * FPS), round(end * FPS)
    clip_lo = max(c for c in CUTS if c <= sf); clip_hi = min(c for c in CUTS if c > sf)
    f0, f1 = max(clip_lo, sf - 2), min(clip_hi, ef + 2)

    head_top = float(np.percentile(HEAD_TOP[f0:f1], 75))
    cy_lo = int(head_top + BESIDE_HEAD) // 10 * 10
    best = None
    for left, right in splits(p):
        for la in (arrangements(left) if left else [[]]):
            for ra in (arrangements(right) if right else [[]]):
                lem = [width_em(t) for t in la]; rem = [width_em(t) for t in ra]
                for cy in range(cy_lo, 1100, 10):
                    fs = min(best_font(lem, cy, f0, f1, "left") if lem else MAX_FONT,
                             best_font(rem, cy, f0, f1, "right") if rem else MAX_FONT)
                    score = fs - (0.12 * abs(cy - prev_cy) if prev_cy is not None else 0)
                    score -= 6 * (len(la) + len(ra) - (1 if la else 0) - (1 if ra else 0))  # prefer single lines
                    score -= 10 if (not left or not right) else 0                             # prefer both sides
                    if best is None or score > best[0]:
                        best = (score, fs, cy, left, right, la, ra)
    _, fs, cy, left, right, la, ra = best
    prev_cy = cy

    def side_words(side_ws, lines, side):
        res, k = [], 0
        for li, line in enumerate(lines):
            for _ in line.split(" "):
                w = side_ws[k]; k += 1
                res.append({"text": clean(w["text"]), "startFrame": round(w["start"] * FPS),
                            "side": side, "line": li})
        return res

    entry = {"startFrame": sf, "endFrame": ef, "fontSize": round(max(fs, MIN_FONT)), "centerY": cy,
             "words": side_words(left, la, "left") + side_words(right, ra, "right")}
    out.append(entry)

with open(out_ts, "w") as fh:
    fh.write("// Generated by scripts/behind-captions/make_pages.py from the Whisper\n"
             "// transcript and the person matte. Do not edit by hand.\n")
    fh.write('export type Side = "left" | "right";\n')
    fh.write("export type CaptionWord = { text: string; startFrame: number; side: Side; line: number };\n")
    fh.write("export type CaptionPage = {\n  startFrame: number;\n  endFrame: number;\n"
             "  fontSize: number;\n  centerY: number;\n  words: CaptionWord[];\n};\n\n")
    fh.write("export const PAGES: CaptionPage[] = " + json.dumps(out, ensure_ascii=False, indent=2) + ";\n")

for o in out:
    l = " / ".join(" ".join(w["text"] for w in o["words"] if w["side"] == "left" and w["line"] == k) for k in range(2))
    r = " / ".join(" ".join(w["text"] for w in o["words"] if w["side"] == "right" and w["line"] == k) for k in range(2))
    print(f"{o['startFrame']:4d}-{o['endFrame']:4d}  y={o['centerY']:4d} fs={o['fontSize']:3d}   [{l.strip(' /')}] | [{r.strip(' /')}]")

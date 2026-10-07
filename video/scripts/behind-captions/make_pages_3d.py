"""Lay out big bubbly 3D captions (1-2 lines) behind the speaker.

For every page, try 1- and 2-line layouts, font sizes and heights, and
measure with the person matte how much of each letter the speaker covers.
Keep layouts where every letter stays readable (<= MAX_LETTER_COVER hidden)
and pick the biggest one, preferring some overlap so the text clearly sits
behind the speaker. If nothing qualifies, take the layout whose most hidden
letter is hidden the least.

usage: make_pages_3d.py words.json matte.mp4 ffmpeg out.ts gluten-900.woff
"""
import io, json, re, subprocess, sys
from functools import lru_cache
import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

words_path, matte_path, ffmpeg, out_ts, font_path = sys.argv[1:6]
FPS, W, H, N = 24, 1080, 1920, 720
CUTS = [0, 240, 480, 720]

# Must match BehindCaptions3D.tsx
LINE_HEIGHT = 0.8          # em, tight like a poster title
LETTER_SPACING = -0.01     # em
SPACE_EM = 0.30            # gap between words, em

SIDE_MARGIN = 40
TOP_MARGIN = 120
MAX_FONT, MIN_FONT = 330, 80
MAX_LETTER_COVER = 0.30    # never hide more than this share of any letter's ink
MAX_ZONE_COVER = 0.50      # ...nor more than half of an ascender / descender (b, d, l, p, g, j...)
TARGET_COVER = 0.10        # overlap we aim for, so the text reads as "behind"
HIDDEN_SHARE = 0.1         # a pixel counts as hidden if the speaker covers it in >= 10% of the page's frames
MAX_CHARS = 16             # per page

font = TTFont(font_path)
cmap, hmtx, upm = font.getBestCmap(), font["hmtx"], font["head"].unitsPerEm
ASC, DESC = font["hhea"].ascent / upm, -font["hhea"].descent / upm
CAP = font["OS/2"].sCapHeight / upm
XH = font["OS/2"].sxHeight / upm
BASELINE_IN_LINE = (LINE_HEIGHT - (ASC + DESC)) / 2 + ASC   # baseline offset inside a line box

def word_em(t):
    em = sum((hmtx[cmap[ord(c)]][0] if ord(c) in cmap else upm * 0.5) / upm for c in t)
    return em + LETTER_SPACING * len(t)

def show(t):
    return re.sub(r"[.,;:]", "", t)

FIXES = {(14.42, "qué"): "que"}
words = []
for w in json.load(open(words_path)):
    text = FIXES.get((round(w["start"], 2), w["text"]), w["text"])
    start, end = w["start"], w["end"]
    if end - start > 0.6:
        start = end - 0.45
    words.append({"text": text, "start": start, "end": end})

def label(p):
    return " ".join(show(x["text"]) for x in p)

# pages: up to 3 words, break at sentence punctuation and pauses
pages, cur = [], []
for i, w in enumerate(words):
    cur.append(w)
    nxt = words[i + 1] if i + 1 < len(words) else None
    if (nxt is None or re.search(r"[.?!]$", w["text"]) or nxt["start"] - w["end"] > 0.4
            or len(cur) >= 3 or len(label(cur + [nxt])) > MAX_CHARS
            or (re.search(r",$", w["text"]) and len(label(cur)) >= 6)):
        pages.append(cur); cur = []

# never end a page on a function word: move it to the start of the next page
FUNCTION = {"el", "la", "los", "las", "un", "una", "a", "de", "y", "que", "os", "lo", "si", "yo", "no"}
changed = True
while changed:
    changed = False
    for i in range(len(pages) - 1):
        last = pages[i][-1]
        if (len(pages[i]) > 1 and show(last["text"]).lower() in FUNCTION
                and not re.search(r"[.,?!]$", last["text"])
                and len(label([last] + pages[i + 1])) <= MAX_CHARS + 2):
            pages[i + 1].insert(0, pages[i].pop()); changed = True

merged, i = [], 0
while i < len(pages):                 # merge flash pages (< 8 frames) into the next one
    p = pages[i]
    if i + 1 < len(pages) and (pages[i + 1][0]["start"] - p[0]["start"]) * FPS < 8 \
            and len(label(p + pages[i + 1])) <= MAX_CHARS + 2:
        pages[i + 1] = p + pages[i + 1]; i += 1; continue
    merged.append(p); i += 1
pages = merged

proc = subprocess.run([ffmpeg, "-v", "error", "-i", matte_path, "-vf", "scale=270:480",
                       "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True, check=True)
# low threshold: soft curly hair still hides the yellow text visually
matte = (np.frombuffer(proc.stdout, np.uint8).reshape(-1, 480, 270) > 40).astype(np.float32)

_ttf = io.BytesIO()
font.flavor = None
font.save(_ttf)

@lru_cache(maxsize=None)
def _pil_font(px):
    _ttf.seek(0)
    return ImageFont.truetype(io.BytesIO(_ttf.getvalue()), px)

@lru_cache(maxsize=None)
def glyph_ink(c, fs):
    """Ink pixels of one glyph at 1/4 resolution, relative to (left, baseline)."""
    f = _pil_font(max(4, round(fs / 4)))
    x0, y0, x1, y1 = f.getbbox(c, anchor="ls")
    if x1 <= x0 or y1 <= y0:
        return np.zeros(0, int), np.zeros(0, int)
    im = Image.new("L", (x1 - x0, y1 - y0))
    ImageDraw.Draw(im).text((-x0, -y0), c, font=f, fill=255, anchor="ls")
    ys, xs = np.nonzero(np.asarray(im) > 127)
    return ys + y0, xs + x0

def glyph_em(c):
    return (hmtx[cmap[ord(c)]][0] if ord(c) in cmap else upm * 0.5) / upm + LETTER_SPACING

def letter_covers(hidden, lines, fs, top):
    """Share of each letter's ink hidden by the speaker, the worst hidden
    share of its ascender/descender zones, and ink areas."""
    covs, zones, areas = [], [], []
    for li, line in enumerate(lines):
        texts = [show(w["text"]) for w in line]
        total = sum(word_em(t) for t in texts) * fs + SPACE_EM * fs * (len(line) - 1)
        x = (W - total) / 2
        base = top + li * LINE_HEIGHT * fs + BASELINE_IN_LINE * fs
        for t in texts:
            for c in t:
                gy, gx = glyph_ink(c, int(fs))
                if len(gy):
                    ys = gy + int(round(base / 4)); xs = gx + int(round(x / 4))
                    ok = (ys >= 0) & (ys < 480) & (xs >= 0) & (xs < 270)
                    hid = np.zeros(len(ys), np.float32)
                    hid[ok] = hidden[ys[ok], xs[ok]]
                    covs.append(float(hid.mean()))
                    xh = -XH * fs / 4                      # glyph y is relative to the baseline
                    worst = 0.0
                    for zone in (gy < xh * 1.05, gy > 1):  # ascender, descender
                        if zone.sum() >= 4:
                            worst = max(worst, float(hid[zone].mean()))
                    zones.append(worst)
                    areas.append(len(ys))
                x += glyph_em(c) * fs
            x += SPACE_EM * fs
    return covs, zones, areas

result = []
for pi, p in enumerate(pages):
    start = p[0]["start"]
    nxt_start = pages[pi + 1][0]["start"] if pi + 1 < len(pages) else 30.0
    end = min(nxt_start, p[-1]["end"] + 0.6)
    sf, ef = round(start * FPS), round(end * FPS)
    lo = max(c for c in CUTS if c <= sf); hi = min(c for c in CUTS if c > sf)
    hidden = (matte[max(lo, sf):min(hi, ef + 1)].mean(axis=0) >= HIDDEN_SHARE).astype(np.float32)

    layouts = [[p]] + [[p[:k], p[k:]] for k in range(1, len(p))]
    best = None
    fallback = None    # (max letter cover, -fs, top, lines, total)
    for lines in layouts:
        max_em = max(sum(word_em(show(w["text"])) for w in l) + SPACE_EM * (len(l) - 1) for l in lines)
        fs_cap = min(MAX_FONT, (W - 2 * SIDE_MARGIN) / max_em)
        for fs in np.arange(fs_cap, MIN_FONT - 1, -10):
            block_h = LINE_HEIGHT * fs * len(lines)
            for top in range(TOP_MARGIN, int(H * 0.6 - block_h), 10):
                covs, zones, areas = letter_covers(hidden, lines, fs, top)
                total = float(np.dot(covs, areas) / sum(areas))
                worst = max(max(covs) / MAX_LETTER_COVER, max(zones) / MAX_ZONE_COVER)
                cand = (worst, -float(fs), top, lines, total)
                if fallback is None or cand[:2] < fallback[:2]:
                    fallback = cand
                if worst > 1:
                    continue
                score = fs - 300 * abs(total - TARGET_COVER) - (25 if len(lines) == 2 and len(p) < 2 else 0)
                if best is None or score > best[0]:
                    best = (score, float(fs), top, lines, total, max(covs))
            if best is not None and best[1] >= fs + 60:
                break
    if best is None:   # nothing fully readable: least-hidden worst letter
        mx, nfs, top, lines, total = fallback
        best = (0, -nfs, top, lines, total, mx)
    _, fs, top, lines, total, mx = best
    result.append({
        "startFrame": sf, "endFrame": ef, "fontSize": round(fs), "top": int(top),
        "lines": [[{"text": show(w["text"]), "startFrame": round(w["start"] * FPS)} for w in l] for l in lines],
    })
    print(f"{sf:4d}-{ef:4d} fs={fs:5.0f} top={top:4d} cover={total:.2f} max={mx:.2f}  " +
          " / ".join(" ".join(w["text"] for w in l) for l in result[-1]["lines"]))

with open(out_ts, "w") as fh:
    fh.write("// Generated by scripts/behind-captions/make_pages_3d.py from the Whisper\n"
             "// transcript and the person matte. Do not edit by hand.\n")
    fh.write("export type CaptionWord = { text: string; startFrame: number };\n")
    fh.write("export type CaptionPage = {\n  startFrame: number;\n  endFrame: number;\n"
             "  fontSize: number;\n  top: number;\n  lines: CaptionWord[][];\n};\n\n")
    fh.write("export const PAGES: CaptionPage[] = " + json.dumps(result, ensure_ascii=False, indent=2) + ";\n")

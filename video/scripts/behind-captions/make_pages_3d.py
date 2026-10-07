"""Lay out big bubbly 3D captions (1-2 lines) behind the speaker.

For every page, try 1- and 2-line layouts, font sizes and heights, and
measure with the person matte how much of each word the speaker covers.
Keep layouts where every word stays readable (<= MAX_WORD_COVER hidden) and
pick the biggest one, preferring some overlap so the text clearly sits
behind the speaker.

usage: make_pages_3d.py words.json matte.mp4 ffmpeg out.ts gluten-900.woff
"""
import json, re, subprocess, sys
import numpy as np
from fontTools.ttLib import TTFont

words_path, matte_path, ffmpeg, out_ts, font_path = sys.argv[1:6]
FPS, W, H, N = 24, 1080, 1920, 720
CUTS = [0, 240, 480, 720]

# Must match BehindCaptions3D.tsx
LINE_HEIGHT = 0.8          # em, tight like a poster title
LETTER_SPACING = -0.01     # em
SPACE_EM = 0.22            # gap between words, em

SIDE_MARGIN = 40
TOP_MARGIN = 120
MAX_FONT, MIN_FONT = 330, 120
MAX_WORD_COVER = 0.40      # never hide more than this share of any word
TARGET_COVER = 0.22        # overlap we aim for, so the text reads as "behind"
MAX_CHARS = 16             # per page

font = TTFont(font_path)
cmap, hmtx, upm = font.getBestCmap(), font["hmtx"], font["head"].unitsPerEm
ASC, DESC = font["hhea"].ascent / upm, -font["hhea"].descent / upm
CAP = font["OS/2"].sCapHeight / upm
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
matte = (np.frombuffer(proc.stdout, np.uint8).reshape(-1, 480, 270) > 100).astype(np.float32)

def integral(a):
    s = np.zeros((a.shape[0] + 1, a.shape[1] + 1), np.float64)
    s[1:, 1:] = a.cumsum(0).cumsum(1)
    return s

def cover(ii, x0, y0, x1, y1):
    """Mean matte over a full-res rectangle, using the 1/4-res integral image."""
    c0, r0 = max(0, int(x0 // 4)), max(0, int(y0 // 4))
    c1, r1 = min(270, int(np.ceil(x1 / 4))), min(480, int(np.ceil(y1 / 4)))
    if c1 <= c0 or r1 <= r0:
        return 0.0
    tot = ii[r1, c1] - ii[r0, c1] - ii[r1, c0] + ii[r0, c0]
    return tot / ((c1 - c0) * (r1 - r0))

def boxes(lines, fs, top):
    """Word rectangles (x0, y0, x1, y1, area) for a centred block."""
    out = []
    for li, line in enumerate(lines):
        widths = [word_em(show(w["text"])) * fs for w in line]
        total = sum(widths) + SPACE_EM * fs * (len(line) - 1)
        x = (W - total) / 2
        base = top + li * LINE_HEIGHT * fs + BASELINE_IN_LINE * fs
        for wd in widths:
            out.append((x, base - CAP * fs * 1.05, x + wd, base + 0.04 * fs, wd * CAP * fs))
            x += wd + SPACE_EM * fs
    return out

result = []
for pi, p in enumerate(pages):
    start = p[0]["start"]
    nxt_start = pages[pi + 1][0]["start"] if pi + 1 < len(pages) else 30.0
    end = min(nxt_start, p[-1]["end"] + 0.6)
    sf, ef = round(start * FPS), round(end * FPS)
    lo = max(c for c in CUTS if c <= sf); hi = min(c for c in CUTS if c > sf)
    ii = integral(matte[max(lo, sf):min(hi, ef + 1)].mean(axis=0))

    layouts = [[p]] + [[p[:k], p[k:]] for k in range(1, len(p))]
    best = None
    for lines in layouts:
        max_em = max(sum(word_em(show(w["text"])) for w in l) + SPACE_EM * (len(l) - 1) for l in lines)
        fs_cap = min(MAX_FONT, (W - 2 * SIDE_MARGIN) / max_em)
        for fs in np.arange(fs_cap, MIN_FONT - 1, -10):
            block_h = LINE_HEIGHT * fs * len(lines)
            for top in range(TOP_MARGIN, int(H * 0.6 - block_h), 10):
                bx = boxes(lines, fs, top)
                covs = [cover(ii, *b[:4]) for b in bx]
                if max(covs) > MAX_WORD_COVER:
                    continue
                area = sum(b[4] for b in bx)
                total = sum(c * b[4] for c, b in zip(covs, bx)) / area
                score = fs - 300 * abs(total - TARGET_COVER) - (25 if len(lines) == 2 and len(p) < 2 else 0)
                if best is None or score > best[0]:
                    best = (score, float(fs), top, lines, total, max(covs))
            if best is not None and best[1] >= fs + 60:
                break
    if best is None:   # nothing readable: smallest size at the top
        lines = [p]; fs = float(MIN_FONT); best = (0, fs, TOP_MARGIN, lines, 0, 0)
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

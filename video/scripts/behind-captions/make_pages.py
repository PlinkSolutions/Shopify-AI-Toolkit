"""Group transcribed words into caption pages and place each page just above
the person's head (so the head/buns overlap the lower part of the letters)."""
import json, re, sys, subprocess
import numpy as np

words_path, matte_path, ffmpeg, out_ts, font_path = sys.argv[1:6]

# exact Anton advance widths, so every page fits the frame width
from fontTools.ttLib import TTFont
_font = TTFont(font_path)
_cmap, _hmtx, _upm = _font.getBestCmap(), _font["hmtx"], _font["head"].unitsPerEm
def width_em(label, gap_em=0.22):
    em = 0.0
    for ch in label:
        if ch == " ":
            em += gap_em
            continue
        g = _cmap.get(ord(ch))
        em += (_hmtx[g][0] if g else _upm * 0.5) / _upm
    return em
FPS, W, H, N = 24, 1080, 1920, 720

FIXES = {(14.08, "¿A"): "¿A", (14.42, "qué"): "que"}
words = []
for w in json.load(open(words_path)):
    text = FIXES.get((round(w["start"], 2), w["text"]), w["text"])
    start, end = w["start"], w["end"]
    if end - start > 0.6:            # long gap absorbed into a short word
        start = end - 0.45
    words.append({"text": text, "start": start, "end": end})

def clean(t):
    t = re.sub(r"[.,;:]", "", t)
    return t.upper()

pages, cur = [], []
for i, w in enumerate(words):
    cur.append(w)
    nxt = words[i + 1] if i + 1 < len(words) else None
    chars = sum(len(clean(x["text"])) for x in cur) + len(cur) - 1
    nxt_chars = chars + 1 + len(clean(nxt["text"])) if nxt else 0
    brk = (nxt is None or re.search(r"[.,?!]$", w["text"]) or nxt["start"] - w["end"] > 0.35
           or len(cur) >= 2 or nxt_chars > 11)
    if brk:
        pages.append(cur); cur = []

# merge flash pages (< 7 frames on screen) into the following page
def label_len(p):
    return sum(len(clean(x["text"])) for x in p) + len(p) - 1
merged = []
i = 0
while i < len(pages):
    p = pages[i]
    if i + 1 < len(pages):
        on_screen = (pages[i + 1][0]["start"] - p[0]["start"]) * FPS
        if on_screen < 7 and label_len(p + pages[i + 1]) <= 14:
            pages[i + 1] = p + pages[i + 1]
            i += 1
            continue
    merged.append(p)
    i += 1
pages = merged

# head-top track from the person matte (topmost row with enough person pixels)
if matte_path == "none":            # provisional layout before the matte exists
    head_top = np.full(N, 420, dtype=np.float32)
else:
    proc = subprocess.run([ffmpeg, "-v", "error", "-i", matte_path, "-vf", "scale=270:480",
                           "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True, check=True)
    m = np.frombuffer(proc.stdout, np.uint8).reshape(-1, 480, 270)
    head_top = []
    for f in m:
        rows = np.where((f > 128).sum(axis=1) >= 6)[0]
        head_top.append(rows[0] * 4 if len(rows) else 400)
    head_top = np.array(head_top, dtype=np.float32)

out = []
for i, p in enumerate(pages):
    start = p[0]["start"]
    nxt_start = pages[i + 1][0]["start"] if i + 1 < len(pages) else 30.0
    end = min(nxt_start, p[-1]["end"] + 0.6)
    f0, f1 = int(start * FPS), max(int(start * FPS) + 1, int(end * FPS))
    top = float(np.median(head_top[f0:min(f1, N)]))
    label = " ".join(clean(x["text"]) for x in p)
    font = float(min(250, 900 / width_em(label)))
    # text centre sits slightly below the head top -> head overlaps lower letters
    cy = max(font * 0.65 + 50, top + 0.12 * font)
    out.append({
        "startFrame": round(start * FPS), "endFrame": round(end * FPS),
        "fontSize": round(font), "centerY": round(cy),
        "tilt": 1 if i % 2 == 0 else -1,
        "words": [{"text": clean(x["text"]), "startFrame": round(x["start"] * FPS)} for x in p],
    })

with open(out_ts, "w") as fh:
    fh.write("// Generated from the Whisper transcript + person matte. Do not edit by hand.\n")
    fh.write("export type CaptionWord = { text: string; startFrame: number };\n")
    fh.write("export type CaptionPage = {\n  startFrame: number;\n  endFrame: number;\n  fontSize: number;\n"
             "  centerY: number;\n  tilt: 1 | -1;\n  words: CaptionWord[];\n};\n\n")
    fh.write("export const PAGES: CaptionPage[] = " + json.dumps(out, ensure_ascii=False, indent=2) + ";\n")
for o in out:
    print(f"{o['startFrame']:4d}-{o['endFrame']:4d}  y={o['centerY']:4d} fs={o['fontSize']:3d}  {' '.join(w['text'] for w in o['words'])}")

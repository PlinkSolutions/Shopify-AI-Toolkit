"""Build src/Plink/data.ts for the Plink Academy reel.

- Captions in the AvatarHype style: a big lime keyword with small white
  context words above (left-aligned) and below (right-aligned). Pages are
  chosen by hand below, consuming the transcript words in order; sizes come
  from real Bebas Neue glyph widths.
- 3D icon events keyed to words, placed automatically in the free space
  beside the speaker using the person matte (never over her face).

usage: make_plink_data.py words.json matte_small.npy bebas.woff out.ts
"""
import json, re, sys
import cv2
import numpy as np
from fontTools.ttLib import TTFont

words_path, matte_path, font_path, out_ts = sys.argv[1:5]
FPS, W, H = 24, 1080, 1920
SCALE = 6                       # matte_small is 180x320
CAPTION_Y = 0.72 * H            # keyword centre (as in the reference)
KEY_SIZE, NUM_SIZE, SMALL_SIZE = 250, 370, 88
MAX_KEY_W = 980

words = json.load(open(words_path))
# Whisper absorbs the leading silence of each take into its first word
ONSET = {0: 0.09, 31: 9.66, 59: 19.24, 89: 28.68}
for i, t in ONSET.items():
    words[i]["start"] = t
N = len(words)

font = TTFont(font_path)
cmap, hmtx, upm = font.getBestCmap(), font["hmtx"], font["head"].unitsPerEm
CAP = font["OS/2"].sCapHeight / upm

def width_em(text, spacing=0.0):
    return sum((hmtx[cmap[ord(c)]][0] if ord(c) in cmap else upm * 0.4) / upm + spacing for c in text)

def clean(ws):
    return " ".join(re.sub(r"[.,;:]", "", w["text"]) for w in ws).upper()

# (n_top, n_key, n_bottom, key override, style)
PAGES = [
    (1, 2, 0, None, "glitch"),        # YO / NO EXISTO
    (2, 1, 1, None, None),            # Y ESTE / VÍDEO / COSTÓ
    (2, 2, 0, "$1", "num"),           # MENOS DE / $1
    (1, 1, 0, None, None),            # SIN / CÁMARA
    (1, 1, 0, None, None),            # SIN / ESTUDIO
    (2, 1, 0, None, None),            # Y SIN / ACTRIZ
    (3, 1, 0, None, None),            # SOLO CON UN / PROCESO
    (1, 3, 1, "3 A 5", "num"),        # DE / 3 A 5 / PASOS
    (3, 1, 0, None, None),            # QUE CUALQUIERA PUEDE / APRENDER
    (1, 1, 0, None, None),            # PRIMERO / CREAS
    (2, 1, 0, None, None),            # A LA / PERSONA
    (2, 1, 0, None, None),            # CON UNA / DESCRIPCIÓN
    (1, 1, 0, None, None),            # SÚPER / DETALLADA
    (2, 1, 2, None, None),            # COMO UNA / FOTO / DE MÓVIL
    (1, 1, 0, None, None),            # LA / ANIMAS
    (2, 1, 0, None, None),            # LE PONES / VOZ
    (2, 1, 0, None, None),            # Y LO / EDITAS
    (2, 1, 0, None, None),            # Y CADA / PASO
    (1, 1, 0, None, None),            # CUESTA / CÉNTIMOS
    (1, 1, 0, None, None),            # PERO / OJO
    (2, 1, 2, None, None),            # QUE LA / CARA / NO CAMBIA
    (1, 1, 0, None, None),            # ENTRE / TOMAS
    (3, 1, 0, None, None),            # Y QUE LA / VOZ
    (3, 1, 0, None, None),            # NO SUENE A / ROBOT
    (4, 1, 0, None, None),            # NO SALE A LA / PRIMERA
    (2, 1, 0, None, None),            # ESO NECESITA / PRÁCTICA
    (3, 2, 0, None, None),            # Y ALGUIEN QUE / TE GUÍE
    (2, 1, 0, None, None),            # POR ESO / CREAMOS
    (0, 1, 1, None, "brand"),         # PLINK / ACADEMY
    (2, 3, 0, None, None),            # DONDE APRENDES / PASO A PASO
    (2, 1, 2, None, None),            # A CREAR / VÍDEOS / COMO ESTE
    (3, 2, 0, "$1", "num"),           # POR MENOS DE / $1
    (1, 1, 0, None, None),            # COMENTA / VÍDEO
    (3, 2, 0, None, None),            # Y TE MANDO / LA INFO
    (2, 2, 0, None, "glitch"),        # AUNQUE YO / NO EXISTA
]
assert sum(a + b + c for a, b, c, _, _ in PAGES) == N, (sum(a + b + c for a, b, c, _, _ in PAGES), N)

f = lambda t: int(round(t * FPS))
pages, i = [], 0
for n_top, n_key, n_bot, override, style in PAGES:
    top, key, bot = words[i:i + n_top], words[i + n_top:i + n_top + n_key], words[i + n_top + n_key:i + n_top + n_key + n_bot]
    i += n_top + n_key + n_bot
    key_text = override or clean(key)
    size = NUM_SIZE if style == "num" else KEY_SIZE
    size = min(size, MAX_KEY_W / width_em(key_text, 0.01))
    pages.append({
        "start": f((top or key)[0]["start"]),
        "keyAt": f(key[0]["start"]),
        "bottomAt": f(bot[0]["start"]) if bot else None,
        "top": clean(top), "key": key_text, "bottom": clean(bot),
        "keySize": round(size), "style": style,
    })
for k, p in enumerate(pages):
    p["end"] = pages[k + 1]["start"] if k + 1 < len(pages) else f(words[-1]["end"] + 0.6)

def wt(idx):
    return words[idx]["start"]

# --- 3D icon events -------------------------------------------------------
# (icon, start word, end time (s) or end word idx, extras)
EVENTS = [
    ("Ghost", 1, 1.10, {}),
    ("Coin", 7, 3.10, {"spin": 0.08}),
    ("Camera", 12, 6.20, {"strikeAt": 12, "group": "sin"}),
    ("Clapper", 14, 6.20, {"strikeAt": 14, "group": "sin"}),
    ("Star", 17, 6.20, {"strikeAt": 17, "group": "sin"}),
    ("Stairs", 21, 7.96, {"steps": [21, 21, 23, 24, 25]}),
    ("GradCap", 28, 9.50, {}),
    ("PersonPlus", 32, 11.08, {}),
    ("PromptCard", 38, 13.10, {}),
    ("Phone", 43, 14.56, {}),
    ("PlayButton", 47, 17.40, {"group": "process"}),
    ("Mic", 50, 17.40, {"group": "process"}),
    ("Scissors", 53, 17.40, {"group": "process"}),
    ("CoinStack", 57, 19.10, {}),
    ("Warning", 60, 20.19, {}),
    ("SameFace", 63, 21.99, {}),
    ("Robot", 71, 24.29, {"strikeAt": 75}),
    ("Retry", 76, 25.75, {}),
    ("Target", 83, 27.15, {}),
    ("Compass", 85, 28.56, {}),
    ("PlinkBadge", 92, 30.58, {"big": True}),
    ("Stairs", 96, 31.92, {"steps": [96, 96, 97, 98, 98]}),
    ("Coin", 105, 34.84, {"spin": 0.08}),
    ("ChatBubble", 109, 35.72, {}),
    ("PaperPlane", 113, 37.08, {}),
    ("Ghost", 116, 38.46, {}),
]
THUMB_WALL = (100, 33.28)   # "crear vídeos (como este)"

m = np.load(matte_path) > 100
NF = len(m)
total = pages[-1]["end"]

def union(f0, f1):
    return m[max(0, f0):min(NF, f1)].mean(0) > 0.15

def place(un, size, prefer, taken, y_pref):
    """Best centre for an icon canvas of `size` px; returns (score, cx, cy, overlap).

    The model fills ~72% of its canvas, so the transparent margin may run off
    the frame edge; only the model disc (radius 0.36*size) must stay on screen
    and (mostly) off the speaker.
    """
    r = 0.36 * size
    rs = max(1, int(round(r / SCALE)))
    k = np.zeros((2 * rs + 1, 2 * rs + 1), np.float32)
    cv2.circle(k, (rs, rs), rs, 1.0, -1)
    k /= k.sum()
    ovmap = cv2.filter2D(un.astype(np.float32), -1, k, borderType=cv2.BORDER_CONSTANT)
    ys = np.arange(int(r) + 40, int(1110 - r), 12)
    xs = np.arange(int(r) + 10, int(W - r - 10), 12)
    cy, cx = np.meshgrid(ys, xs, indexing="ij")
    ov = ovmap[np.clip(cy // SCALE, 0, 319), np.clip(cx // SCALE, 0, 179)]
    ok = ov <= 0.15
    for tx, ty, tr in taken:
        ok &= np.hypot(cx - tx, cy - ty) >= (r + tr) * 0.95
    side_pen = np.where((cx < W / 2) == (prefer == "L"), 0, 0.7)
    score = ov * 10 + np.abs(cy - y_pref) / 600 + side_pen - size / 1500
    score = np.where(ok, score, np.inf)
    i = np.unravel_index(np.argmin(score), score.shape)
    if not np.isfinite(score[i]):
        return None
    return (float(score[i]), int(cx[i]), int(cy[i]), float(ov[i]))

icons, taken_by_group, side = [], {}, "L"
for name, w0, end, extra in EVENTS:
    start_f = f(wt(w0))
    end_f = f(end if isinstance(end, float) else wt(end))
    grp = extra.get("group")
    if grp and grp in taken_by_group:
        g = taken_by_group[grp]
        un, taken, y_pref = g["un"], g["taken"], g["y_pref"]
    else:
        # the whole group window shares one union so later members avoid earlier ones
        gend = max(f(e if isinstance(e, float) else wt(e)) for n2, _, e, x2 in EVENTS if x2.get("group") == grp) if grp else end_f
        un = union(start_f, gend)
        rows = np.where(un.sum(1) > 3)[0]
        head_top = rows[0] * SCALE if len(rows) else 200
        y_pref = head_top + 230
        taken = []
        if grp:
            taken_by_group[grp] = {"un": un, "taken": taken, "y_pref": y_pref}
    # try every size and keep the best score, so alternating sides beats a
    # slightly bigger icon on the same side as the previous one
    best = None
    sizes = [520, 480] if extra.get("big") else [460, 420, 380, 340, 300, 270]
    for sz in sizes:
        cand = place(un, sz, side, taken, y_pref + (len(taken) * 300 if grp else 0))
        if cand and (best is None or cand[0] < best[0]):
            best, size = cand, sz
    if best is None:
        raise SystemExit(f"no room for {name} at {wt(w0):.2f}s")
    _, cx, cy, ov = best
    taken.append((cx, cy, 0.36 * size))
    ev = {"icon": name, "start": start_f, "end": end_f, "x": cx, "y": cy, "size": size,
          "yaw": 0.45 if cx < W / 2 else -0.45}
    if "strikeAt" in extra:
        ev["strikeAt"] = f(wt(extra["strikeAt"]) + 0.2)
    if "spin" in extra:
        ev["spin"] = extra["spin"]
    if "steps" in extra:
        ev["steps"] = [f(wt(k)) - start_f + (0 if j < 2 else 0) + j * 2 for j, k in enumerate(extra["steps"])]
    icons.append(ev)
    print(f"{name:11s} {start_f/FPS:5.2f}-{end_f/FPS:5.2f}s  at ({cx},{cy}) size {size}  overlap {ov:.2f}")
    side = "R" if side == "L" else "L"

out = {
    "fps": FPS, "frames": total,
    "pages": pages, "icons": icons,
    "thumbWall": {"start": f(wt(THUMB_WALL[0])), "end": f(THUMB_WALL[1])},
    "bw": {"start": f(wt(59)), "end": f(wt(61))},
    "glitches": [[f(wt(1)), f(wt(1)) + 12], [f(wt(118)), f(wt(118)) + 12]],
    "lightLeak": f(wt(89)) - 2,
    "captionY": CAPTION_Y, "smallSize": SMALL_SIZE, "capHeight": CAP,
}
with open(out_ts, "w") as fh:
    fh.write("// Generated by scripts/plink/make_plink_data.py. Do not edit by hand.\n")
    fh.write("export const DATA = " + json.dumps(out, ensure_ascii=False, indent=1) + " as const;\n")
for p in pages:
    print(f"{p['start']/FPS:5.2f}  {p['top']:22s} [{p['key']}] {p['bottom']}  size {p['keySize']}")

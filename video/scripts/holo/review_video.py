"""Objective checks of a rendered reel, for the reviewer agent.

usage: review_video.py <video.mp4> <slug> <out_dir>
writes <out_dir>/report.json and images to look at:
  hook.png     first 2 s, 6 frames (does it grab before the thumb scrolls?)
  scenes.png   one frame per scene at 60 % of it, with the scene number
  contact.png  a frame every 2 s
  end.png      last 4 s
report.json: duration, loudness (LUFS / true peak), dark frames, static
stretches (nothing moves for > 1.5 s), cut-to-cut timing from the timeline.
"""
import json, os, subprocess, sys

import numpy as np
from PIL import Image, ImageDraw

video, slug, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
FF = os.environ.get("FFMPEG", "ffmpeg")
FPS = 30
info = json.loads(subprocess.check_output(["node", "scripts/holo/reel_info.mjs", slug]))

# ---------------------------------------------------------------- frames
W, H = 54, 96
raw = subprocess.run([FF, "-v", "error", "-i", video, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True, check=True).stdout
g = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
n = len(g)
mean = g.mean((1, 2))
diff = np.r_[0, np.abs(np.diff(g, axis=0)).mean((1, 2))]
local = np.convolve(mean, np.ones(9) / 9, "same")
dark = [int(i) for i in np.where(mean < 0.55 * local)[0] if 6 < i < info["end_card_from_s"] * FPS - 2]

static, run = [], 0
for i in range(int(info["end_card_from_s"] * FPS)):  # the end card is meant to hold still
    run = run + 1 if diff[i] < 0.12 else 0
    if run == int(1.5 * FPS):
        static.append(round((i - run + 1) / FPS, 2))

# ---------------------------------------------------------------- audio
lufs = peak = None
r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", video, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
for line in r.splitlines():
    s = line.strip()
    if s.startswith("I:") and "LUFS" in s:
        lufs = float(s.split()[1])
    if s.startswith("Peak:") and "dBFS" in s:
        peak = float(s.split()[1])

# ---------------------------------------------------------------- images
def grab(frames, name, cols, label=None):
    frames = [min(max(0, f), n - 1) for f in frames]
    sel = "+".join(f"eq(n\\,{f})" for f in frames)
    tiles = subprocess.run([FF, "-v", "error", "-i", video, "-vf", f"select='{sel}',scale=216:384", "-vsync", "0", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    ims = np.frombuffer(tiles, np.uint8).reshape(-1, 384, 216, 3)
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 216, rows * 384), "black")
    d = ImageDraw.Draw(sheet)
    for k, im in enumerate(ims):
        x, y = (k % cols) * 216, (k // cols) * 384
        sheet.paste(Image.fromarray(im), (x, y))
        d.rectangle([x, y + 360, x + 216, y + 384], fill="black")
        d.text((x + 6, y + 365), label(k, frames[k]) if label else f"{frames[k] / FPS:.1f}s", fill="white")
    sheet.save(os.path.join(out, name))


grab([0, 6, 12, 24, 40, 59], "hook.png", 6)
mids = [round((s["from_s"] + s["dur_s"] * 0.6) * FPS) for s in info["scenes"]]
grab(mids, "scenes.png", 8, lambda k, f: f"#{k + 1}  {f / FPS:.1f}s")
grab(list(range(0, n, 2 * FPS)), "contact.png", 10)
grab(list(range(max(0, n - 4 * FPS), n, 20)), "end.png", 6)

durs = [s["dur_s"] for s in info["scenes"]]
report = {
    "video": video,
    "duration_s": round(n / FPS, 2),
    "timeline": {k: info[k] for k in ("titulo", "voice", "words", "words_per_minute", "first_word_at_s", "caption_pages", "end_card_from_s")},
    "scenes": len(durs),
    "scene_s": {"avg": round(sum(durs) / len(durs), 2), "min": min(durs), "max": max(durs), "longest": max(info["scenes"], key=lambda s: s["dur_s"])["n"]},
    "audio": {"integrated_lufs": lufs, "true_peak_dbfs": peak},
    "dark_frames": dark,
    "static_stretches_s": static,
    "images": ["hook.png", "scenes.png", "contact.png", "end.png"],
}
json.dump(report, open(os.path.join(out, "report.json"), "w"), ensure_ascii=False, indent=1)
print(json.dumps(report, ensure_ascii=False, indent=1))

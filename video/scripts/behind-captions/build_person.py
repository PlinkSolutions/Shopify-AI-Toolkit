"""Builds a person-only VP9+alpha WebM from the joined video.
Clips 1-2 (close-ups): MODNet. Clip 3 (top-down): ISNet outline gate + MODNet fill.
Temporal EMA smoothing per clip; resets at clip boundaries."""
import sys, subprocess, time, cv2, numpy as np
sys.path.insert(0, sys.argv[1])
from matting import MODNet, ISNet

models, src, out_webm, out_matte, ffmpeg = sys.argv[2:7]
W, H, FPS, N = 1080, 1920, 24, 720
CUTS = {240, 480}           # first frame of clip 2 and clip 3
TOPDOWN_START = 480

mod = MODNet(f"{models}/modnet.onnx")
isn = ISNet(f"{models}/isnet_medium.onnx")

reader = subprocess.Popen([ffmpeg, "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                          stdout=subprocess.PIPE)
writer = subprocess.Popen([ffmpeg, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba",
                           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "18",
                           "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", "-auto-alt-ref", "0",
                           out_webm], stdin=subprocess.PIPE)
matte = subprocess.Popen([ffmpeg, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray",
                          "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", out_matte], stdin=subprocess.PIPE)

def keep_main(a, thr=0.5, frac=0.12):
    """Zero out small blobs not connected to the main person."""
    core = (a > thr).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(core, 8)
    if n <= 2:
        return a
    areas = st[1:, cv2.CC_STAT_AREA]; big = areas.max()
    keep = np.isin(lab, [i + 1 for i, x in enumerate(areas) if x >= frac * big]).astype(np.uint8)
    keep = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
    return a * cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 4)

prev = None
t0 = time.time()
for i in range(N):
    raw = reader.stdout.read(W * H * 3)
    if len(raw) < W * H * 3:
        print("short read at", i, flush=True); break
    rgb = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
    m = mod(rgb)
    if i >= TOPDOWN_START:
        s = isn(rgb)
        gate = cv2.dilate((s > 0.3).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
        gate = cv2.GaussianBlur(gate.astype(np.float32), (0, 0), 5)
        a = np.maximum(s, m * gate)
    else:
        a = m
    a = keep_main(a)
    if i in CUTS or prev is None:
        prev = a
    else:
        prev = 0.65 * a + 0.35 * prev   # light temporal smoothing (reduces edge flicker)
    alpha = (np.clip(prev, 0, 1) * 255).astype(np.uint8)
    writer.stdin.write(np.dstack([rgb, alpha]).tobytes())
    matte.stdin.write(alpha.tobytes())
    if i % 24 == 0:
        el = time.time() - t0
        print(f"frame {i}/{N}  {el:.0f}s elapsed  eta {el / (i + 1) * (N - i - 1):.0f}s", flush=True)

for p in (writer, matte):
    p.stdin.close(); p.wait()
reader.wait()
print("DONE", time.time() - t0, flush=True)

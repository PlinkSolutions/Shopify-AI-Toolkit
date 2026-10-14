"""Person matte for the joined Plink video -> VP9+alpha webm + grayscale matte.
Resets temporal smoothing at shot changes (detected from frame differences).
usage: matte.py scripts_dir modnet.onnx src.mp4 out.webm out_matte.mp4 ffmpeg
"""
import sys, subprocess, time, numpy as np, cv2
sys.path.insert(0, sys.argv[1])
from matting import MODNet
model, src, out_webm, out_matte, ff = sys.argv[2:7]
W, H, FPS = 720, 1280, 24
mod = MODNet(model, ref=512)
reader = subprocess.Popen([ff, "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
writer = subprocess.Popen([ff, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "20", "-row-mt", "1",
                           "-deadline", "good", "-cpu-used", "4", "-auto-alt-ref", "0", out_webm], stdin=subprocess.PIPE)
matte = subprocess.Popen([ff, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", out_matte], stdin=subprocess.PIPE)

def keep_main(a, thr=0.5, frac=0.12):
    core = (a > thr).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(core, 8)
    if n <= 2:
        return a
    areas = st[1:, cv2.CC_STAT_AREA]; big = areas.max()
    keep = np.isin(lab, [i + 1 for i, x in enumerate(areas) if x >= frac * big]).astype(np.uint8)
    keep = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
    return a * cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 3)

prev, prev_small, i, t0, cuts = None, None, 0, time.time(), []
while True:
    raw = reader.stdout.read(W * H * 3)
    if len(raw) < W * H * 3:
        break
    rgb = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
    small = cv2.resize(rgb, (90, 160)).astype(np.int16)
    cut = prev_small is None or np.abs(small - prev_small).mean() > 10
    prev_small = small
    a = keep_main(mod(rgb))
    if cut or prev is None:
        prev = a
        cuts.append(i)
    else:
        prev = 0.65 * a + 0.35 * prev
    alpha = (np.clip(prev, 0, 1) * 255).astype(np.uint8)
    writer.stdin.write(np.dstack([rgb, alpha]).tobytes())
    matte.stdin.write(alpha.tobytes())
    if i % 48 == 0:
        print(f"frame {i}  {time.time() - t0:.0f}s", flush=True)
    i += 1
for p in (writer, matte):
    p.stdin.close(); p.wait()
reader.wait()
print("cuts at frames", cuts, flush=True)
print("DONE", i, "frames", round(time.time() - t0), "s", flush=True)

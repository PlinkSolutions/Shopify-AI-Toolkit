"""Join the four takes: drop generation glitches, tighten junctions, level take 3.

Keeps [start, end) seconds of each take (frame-aligned at 24 fps) and writes
public/plink_joined.mp4 plus segments.json (kept ranges and offsets) used to
remap the transcript.
usage: join.py ffmpeg uploads_dir out_mp4 out_json
"""
import glob, json, subprocess, sys

FF, U, OUT, OUTJ = sys.argv[1:5]
FPS = 24
# frame-aligned keep ranges per take: start skips the glitch frames (take 2: 1 frame,
# take 3: 7 frames of morphing zoom) and leading silence; end keeps ~0.13 s of air.
KEEP = [  # (take, start_frame, end_frame_exclusive)
    (1, 5, 234),    # 0.208 - 9.750 s
    (2, 7, 238),    # 0.292 - 9.917 s
    (3, 7, 233),    # 0.292 - 9.708 s
    (4, 3, 240),    # 0.125 - 10.000 s (full tail for the ending beat)
]
GAIN_DB = {3: 1.9}

inputs, filters, labels = [], [], []
for i, (take, f0, f1) in enumerate(KEEP):
    src = glob.glob(f"{U}/*toma_{take}_*.mp4")[0]
    inputs += ["-i", src]
    t0, t1 = f0 / FPS, f1 / FPS
    g = GAIN_DB.get(take, 0.0)
    filters.append(f"[{i}:v]trim=start_frame={f0}:end_frame={f1},setpts=PTS-STARTPTS[v{i}]")
    filters.append(f"[{i}:a]atrim={t0:.4f}:{t1:.4f},asetpts=PTS-STARTPTS,volume={g}dB,"
                   f"afade=t=in:d=0.02,afade=t=out:st={t1 - t0 - 0.02:.4f}:d=0.02[a{i}]")
    labels.append(f"[v{i}][a{i}]")
filters.append("".join(labels) + f"concat=n={len(KEEP)}:v=1:a=1[v][a]")
subprocess.run([FF, "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filters),
                "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "14",
                "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", OUT], check=True)
segs, at = [], 0.0
for take, f0, f1 in KEEP:
    d = (f1 - f0) / FPS
    segs.append({"take": take, "start": f0 / FPS, "end": f1 / FPS, "offset": at})
    at += d
json.dump({"segments": segs, "duration": at, "frames": sum(f1 - f0 for _, f0, f1 in KEEP)}, open(OUTJ, "w"), indent=1)
print(f"joined {at:.3f} s, {sum(f1 - f0 for _, f0, f1 in KEEP)} frames")

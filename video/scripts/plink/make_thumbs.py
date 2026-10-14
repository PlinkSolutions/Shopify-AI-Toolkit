"""Extract 9:16 thumbnails for the "vídeos como este" wall.

usage: make_thumbs.py ffmpeg out_dir video:time [video:time ...]
Writes thumb00.jpg, thumb01.jpg, ... (270x480) in argument order.
"""
import os, subprocess, sys

ffmpeg, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for k, spec in enumerate(sys.argv[3:]):
    video, t = spec.rsplit(":", 1)
    subprocess.run(
        [ffmpeg, "-loglevel", "error", "-y", "-ss", t, "-i", video, "-frames:v", "1",
         "-vf", "scale=270:480:force_original_aspect_ratio=increase,crop=270:480", "-q:v", "3",
         os.path.join(out, f"thumb{k:02d}.jpg")],
        check=True,
    )
print("wrote", len(sys.argv) - 3, "thumbnails")

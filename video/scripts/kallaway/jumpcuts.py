"""Find pauses in the audio and build a jump-cut list (segments to keep).

usage: jumpcuts.py audio.f32 words.json out.json
"""
import json, sys
import numpy as np

audio_path, words_path, out_path = sys.argv[1:4]
SR, HOP = 16000, 320                      # 20 ms frames
MIN_PAUSE, PAD = 0.25, 0.07               # cut pauses longer than this; keep PAD of air each side

a = np.fromfile(audio_path, np.float32)
fr = a[: len(a) // HOP * HOP].reshape(-1, HOP)
db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
floor = np.percentile(db, 10)
speech_db = np.percentile(db, 90)
thr = floor + 0.3 * (speech_db - floor)   # silence threshold between noise floor and speech
voiced = db > thr
# smooth: ignore isolated voiced/unvoiced blips shorter than 60 ms
k = 3
v = np.convolve(voiced.astype(float), np.ones(k) / k, mode="same") > 0.5

t = np.arange(len(v)) * HOP / SR
dur = len(a) / SR
keep, start = [], None
i = 0
silences = []
while i < len(v):
    if not v[i]:
        j = i
        while j < len(v) and not v[j]:
            j += 1
        s0, s1 = i * HOP / SR, j * HOP / SR
        if s1 - s0 >= MIN_PAUSE:
            silences.append((s0, s1))
        i = j
    else:
        i += 1

segs, cur = [], 0.0
for s0, s1 in silences:
    a0, a1 = s0 + PAD, s1 - PAD
    if s0 == 0:
        cur = max(0.0, s1 - PAD); continue
    if a0 > cur:
        segs.append((round(cur, 3), round(a0, 3)))
    cur = a1
if cur < dur - 0.05:
    segs.append((round(cur, 3), round(dur, 3)))
segs = [s for s in segs if s[1] - s[0] >= 0.15]   # drop slivers (trailing noise)

def to_out(tt):
    out = 0.0
    for s0, s1 in segs:
        if tt <= s0:
            return out
        if tt < s1:
            return out + tt - s0
        out += s1 - s0
    return out

words = json.load(open(words_path))
mapped = [{**w, "start": round(to_out(w["start"]), 3), "end": round(to_out(w["end"]), 3)} for w in words]
total = sum(s1 - s0 for s0, s1 in segs)
json.dump({"segments": segs, "duration": round(total, 3), "words": mapped}, open(out_path, "w"), ensure_ascii=False, indent=1)
print(f"threshold {thr:.1f} dB (floor {floor:.1f}, speech {speech_db:.1f})")
print(f"{len(silences)} pauses cut, {len(segs)} segments, {dur:.2f}s -> {total:.2f}s")
print("segments:", " ".join(f"{s0:.2f}-{s1:.2f}" for s0, s1 in segs))

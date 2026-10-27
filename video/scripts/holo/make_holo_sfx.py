"""Synthesize the holographic clip's ambience and UI sounds (no samples).

usage: make_holo_sfx.py out_dir   -> pad.wav, whoosh.wav, blip.wav, thump.wav (48 kHz mono)
"""
import os, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(3)
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
t = lambda s: np.arange(int(SR * s)) / SR


def save(name, x, peak=0.85):
    x = x / (np.abs(x).max() + 1e-9) * peak
    n = int(0.01 * SR)
    x[:n] *= np.linspace(0, 1, n)
    x[-n:] *= np.linspace(1, 0, n)
    with wave.open(os.path.join(out, name + ".wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def smooth_noise(sec, fc):
    x = rng.standard_normal(int(SR * sec))
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc; y[i] = acc
    return y

# ambient pad: soft minor-ninth chord, slow swell and shimmer, airy noise bed
tt = t(5.4)
pad = np.zeros_like(tt)
for f, g in [(110, 1.0), (164.8, 0.7), (220, 0.5), (261.6, 0.35), (329.6, 0.25), (493.9, 0.12)]:
    pad += g * np.sin(2 * np.pi * f * tt + 0.3 * np.sin(2 * np.pi * 0.2 * tt)) * (0.85 + 0.15 * np.sin(2 * np.pi * (0.13 + f / 5000) * tt))
pad += 0.25 * smooth_noise(5.4, 900)
pad *= np.minimum(1, tt / 0.6) * np.minimum(1, (5.4 - tt) / 0.5)
save("pad", pad, 0.6)

# airy whoosh into each cut
n = int(SR * 0.4)
fc = np.geomspace(400, 6000, n)
x = rng.standard_normal(n); y = np.empty(n); acc = 0.0
for i in range(n):
    a = np.exp(-2 * np.pi * fc[i] / SR); acc = (1 - a) * x[i] + a * acc; y[i] = acc
save("whoosh", y * np.sin(np.linspace(0, np.pi, n)) ** 2, 0.7)

# HUD blip
b = t(0.09)
save("blip", np.sin(2 * np.pi * 1760 * b) * np.exp(-b / 0.02) + 0.5 * np.sin(2 * np.pi * 2640 * b) * np.exp(-b / 0.012), 0.6)

# soft heartbeat thump
h = t(0.3)
save("thump", np.sin(2 * np.pi * (55 + 30 * np.exp(-h / 0.04)) * h) * np.exp(-h / 0.08), 0.9)
print("ok", sorted(os.listdir(out)))

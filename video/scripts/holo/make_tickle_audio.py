"""Music bed and sound effects for the tickle reel (all synthesized, no samples).

usage: make_tickle_audio.py out_dir
music.wav  ~112 s ambient bed: slow chord pads, soft plucked arpeggio, airy noise
sfx:       zap, laugh, notif, error, zip, glow, scan, servo, chirps, fear, rise, sent, glitch
"""
import os, sys, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(11)
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
T = lambda s: np.arange(int(SR * s)) / SR


def save(name, x, peak=0.85):
    x = np.asarray(x, np.float64)
    x = x / (np.abs(x).max() + 1e-9) * peak
    n = int(0.008 * SR)
    x[:n] *= np.linspace(0, 1, n)
    x[-n:] *= np.linspace(1, 0, n)
    with wave.open(os.path.join(out, name + ".wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def lp(x, fc):
    """One-pole low-pass (fc may be an array)."""
    fc = np.broadcast_to(np.asarray(fc, np.float64), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc; y[i] = acc
    return y


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)


# ------------------------------------------------------------------ music
DUR = 112.0
n = int(SR * DUR)
t = np.arange(n) / SR
mus = np.zeros(n)
chords = [  # Am9, Fmaj7, Cadd9, Em7 — calm, curious
    [110.0, 164.8, 196.0, 246.9, 261.6],
    [87.3, 130.8, 174.6, 220.0, 329.6],
    [130.8, 196.0, 261.6, 293.7, 329.6],
    [82.4, 123.5, 164.8, 196.0, 293.7],
]
SEG = 6.4
for k in range(int(DUR / SEG) + 1):
    c = chords[k % 4]
    s0 = k * SEG - 0.8
    i0, i1 = max(0, int(s0 * SR)), min(n, int((s0 + SEG + 1.6) * SR))
    if i0 >= n:
        break
    tt = t[i0:i1] - s0
    shape = np.minimum(1, tt / 1.6) * np.minimum(1, np.maximum(0, (SEG + 1.6 - tt)) / 1.6)
    seg = np.zeros_like(tt)
    for j, f in enumerate(c):
        for det in (-0.6, 0.6):
            seg += (0.9 if j == 0 else 0.45) * np.sin(2 * np.pi * (f + det) * tt + j)
    mus[i0:i1] += seg * shape * 0.22
# plucked arpeggio, every 0.4 s, quiet and sparse
step = 0.4
for k in range(int(DUR / step)):
    if k % 8 in (3, 7) or rng.random() < 0.2:
        continue
    c = chords[int(k * step / SEG) % 4]
    f = c[1 + (k * 3) % 4] * 2
    i0 = int(k * step * SR)
    m = min(int(0.9 * SR), n - i0)
    tt = np.arange(m) / SR
    mus[i0:i0 + m] += 0.12 * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.28)
# airy noise bed with a slow swell
air = lp(rng.standard_normal(n), 1200) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 25.6))
mus += air * 0.35
mus *= np.minimum(1, t / 2.0) * np.minimum(1, (DUR - t) / 3.0)
save("music", mus, 0.7)

# ------------------------------------------------------------------ sfx
# shield zap: bright descending chirp + crackle
m = int(0.35 * SR); tt = np.arange(m) / SR
f = 2400 * np.exp(-tt / 0.08) + 300
save("zap", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(m, 0.002, 0.09) + 0.3 * rng.standard_normal(m) * env(m, 0.001, 0.02))

# playful laugh: bouncy rising plucks (ha-ha-ha)
x = np.zeros(int(1.1 * SR))
for k, f in enumerate([660, 784, 880, 988, 880, 1047]):
    i0 = int(k * 0.13 * SR); mm = int(0.18 * SR); tt = np.arange(mm) / SR
    vib = 1 + 0.03 * np.sin(2 * np.pi * 18 * tt)
    x[i0:i0 + mm] += np.sin(2 * np.pi * f * vib * tt) * env(mm, 0.005, 0.06)
save("laugh", x, 0.7)

# notification ping (two notes)
x = np.zeros(int(0.6 * SR))
for i0, f in [(0, 1318.5), (int(0.11 * SR), 1760)]:
    mm = len(x) - i0; tt = np.arange(mm) / SR
    x[i0:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.15)
save("notif", x, 0.6)

# error buzz (two low beeps)
x = np.zeros(int(0.5 * SR))
for i0 in (0, int(0.22 * SR)):
    mm = int(0.15 * SR); tt = np.arange(mm) / SR
    x[i0:i0 + mm] += np.sign(np.sin(2 * np.pi * 220 * tt)) * 0.6 * env(mm, 0.003, 0.08)
save("error", lp(x, 2500), 0.6)

# signal zip: fast rising sweep
m = int(0.45 * SR); tt = np.arange(m) / SR
f = np.geomspace(300, 3200, m)
save("zip", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, m)) ** 2, 0.55)

# warm glow: soft major chord swell
m = int(1.2 * SR); tt = np.arange(m) / SR
x = sum(np.sin(2 * np.pi * f * tt) for f in (523.3, 659.3, 784, 1046.5)) * np.minimum(1, tt / 0.25) * np.exp(-tt / 0.5)
save("glow", x, 0.55)

# MRI scan: pulsing hum
m = int(2.0 * SR); tt = np.arange(m) / SR
x = np.sin(2 * np.pi * 180 * tt) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 6 * tt))) + 0.3 * np.sin(2 * np.pi * 540 * tt)
save("scan", lp(x, 1800) * np.minimum(1, tt / 0.2) * np.minimum(1, (2.0 - tt) / 0.3), 0.5)

# robot servo whir
m = int(0.9 * SR); tt = np.arange(m) / SR
f = 420 + 160 * np.sin(np.linspace(0, np.pi, m))
x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + 0.2 * rng.standard_normal(m)
save("servo", lp(x, 1500) * np.sin(np.linspace(0, np.pi, m)) ** 0.5, 0.5)

# rat chirps (ultrasound made audible: high quick sweeps)
x = np.zeros(int(1.6 * SR))
for k in range(9):
    i0 = int((k * 0.16 + rng.random() * 0.04) * SR); mm = int(0.07 * SR); tt = np.arange(mm) / SR
    f = np.linspace(3800, 5200, mm)
    x[i0:i0 + mm] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, mm))
save("chirps", x, 0.5)

# fear: low drop with a muffled hit
m = int(1.3 * SR); tt = np.arange(m) / SR
f = 120 * np.exp(-tt / 0.4) + 35
x = np.tanh(2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(m, 0.005, 0.5)) + 0.4 * lp(rng.standard_normal(m), 500) * env(m, 0.001, 0.1)
save("fear", x, 0.8)

# rise: shimmering riser into the dome
m = int(1.6 * SR); tt = np.arange(m) / SR
x = sum(np.sin(2 * np.pi * f * (1 + 0.5 * tt / 1.6) * tt) for f in (440, 660, 880)) * (tt / 1.6) ** 1.5
x += 0.3 * lp(rng.standard_normal(m), np.linspace(400, 6000, m)) * (tt / 1.6) ** 2
save("rise", x * np.minimum(1, (1.6 - tt) / 0.1), 0.6)

# sent: swoosh + ding
m = int(0.9 * SR); tt = np.arange(m) / SR
sw = lp(rng.standard_normal(m), np.geomspace(800, 7000, m)) * np.sin(np.linspace(0, np.pi, m)) ** 3 * (tt < 0.4)
ding = np.zeros(m); i0 = int(0.3 * SR); tt2 = np.arange(m - i0) / SR
ding[i0:] = (np.sin(2 * np.pi * 1568 * tt2) + 0.5 * np.sin(2 * np.pi * 2349 * tt2)) * np.exp(-tt2 / 0.25)
save("sent", sw * 0.6 + ding, 0.6)

# glitch: stepped digital noise
m = int(0.5 * SR); x = np.zeros(m); pos = 0
while pos < m:
    seg = int(SR * rng.uniform(0.01, 0.04)); f = rng.choice([110, 440, 1320, 2600])
    tt = np.arange(seg) / SR
    x[pos:pos + seg] = (np.sign(np.sin(2 * np.pi * f * tt)) if rng.random() < 0.6 else np.round(rng.standard_normal(seg) * 3) / 3)[: m - pos]
    pos += seg
save("glitch", np.round(x * 5) / 5 * env(m, 0.002, 0.35), 0.6)
print("ok", sorted(os.listdir(out)))

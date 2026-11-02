"""Shared sound-effect library for the holographic reels (all synthesized, no
samples). Reels pick them with sfx("<name>", frame, vol) in their cues.ts; add
a new sound here when a story needs one.

usage: make_sfx_library.py out_dir   (public/holo/sfx, next to make_holo_sfx.py's pad, whoosh, blip, thump)
sfx: zap, laugh, notif, error, zip, glow, scan, servo, chirps, fear, rise, sent, glitch, boing, pop, stamp,
     yawn, yawn2, tick, gulp, ding
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
# boing: springy rising-then-falling pitch with wobble (bouncy characters)
m = int(0.45 * SR); tt = np.arange(m) / SR
f = 180 + 260 * np.sin(np.pi * np.minimum(1, tt / 0.3)) + 25 * np.sin(2 * np.pi * 14 * tt)
save("boing", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(m, 0.004, 0.16), 0.6)

# pop: short bubbly pop (things appearing)
m = int(0.16 * SR); tt = np.arange(m) / SR
f = 900 * np.exp(-tt / 0.025) + 380
save("pop", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(m, 0.001, 0.035) + 0.15 * rng.standard_normal(m) * env(m, 0.0005, 0.006), 0.6)

# stamp: heavy rubber-stamp hit (low thud + paper slap)
m = int(0.5 * SR); tt = np.arange(m) / SR
thud = np.sin(2 * np.pi * (70 + 90 * np.exp(-tt / 0.03)) * tt) * env(m, 0.001, 0.12)
slap = lp(rng.standard_normal(m), 3000) * env(m, 0.0005, 0.03)
save("stamp", np.tanh(1.8 * thud) + 0.6 * slap, 0.85)

# ------------------------------------------------------------------ voice-like
def resonate(x, freq, bw):
    """Two-pole resonator with a time-varying centre frequency (formant)."""
    freq = np.broadcast_to(np.asarray(freq, np.float64), x.shape)
    r = np.exp(-np.pi * bw / SR)
    c = 2 * r * np.cos(2 * np.pi * freq / SR)
    y = np.empty_like(x); y1 = y2 = 0.0
    for i in range(len(x)):
        yi = (1 - r) * x[i] + c[i] * y1 - r * r * y2
        y[i] = yi; y2 = y1; y1 = yi
    return y


def yawn(dur, pitch, formant):
    """Cartoon yawn: breathy inhale, rising 'haaAA', falling sigh (glottal buzz through vowel formants)."""
    m = int(dur * SR); tt = np.arange(m) / SR; u = tt / dur
    f0 = pitch * np.interp(u, [0, 0.15, 0.38, 0.55, 0.85, 1], [0.95, 1.1, 1.75, 1.7, 0.85, 0.7])
    f0 *= 1 + 0.018 * np.sin(2 * np.pi * 5.5 * tt) + 0.006 * lp(rng.standard_normal(m), 30)
    ph = 2 * np.pi * np.cumsum(f0) / SR
    buzz = sum(np.sin(k * ph) / k ** 1.1 * (k * f0 < 9000) for k in range(1, 48))
    amp = np.interp(u, [0, 0.12, 0.3, 0.55, 0.8, 1], [0, 0.15, 1, 0.95, 0.35, 0])
    breath = np.interp(u, [0, 0.1, 0.25, 0.7, 0.9, 1], [0.05, 0.5, 0.12, 0.08, 0.35, 0])
    exc = buzz * amp + rng.standard_normal(m) * breath * 1.4
    F1 = formant * np.interp(u, [0, 0.3, 0.6, 1], [600, 820, 800, 560])
    F2 = formant * np.interp(u, [0, 0.3, 0.6, 1], [1050, 1250, 1180, 880])
    F3 = formant * 2550
    x = resonate(exc, F1, 90) * 1.0 + resonate(exc, F2, 120) * 0.55 + resonate(exc, F3, 180) * 0.25
    return x * np.minimum(1, (dur - tt) / 0.08)


save("yawn", yawn(1.7, 150, 1.0), 0.8)
save("yawn2", yawn(1.45, 235, 1.17), 0.8)

# tick: stopwatch ticking (tick-tock every 0.2 s, fades after 1.6 s)
m = int(2.4 * SR); x = np.zeros(m)
for k in range(12):
    i0 = int(k * 0.2 * SR); mm = int(0.03 * SR); tt = np.arange(mm) / SR
    f = 3300 if k % 2 == 0 else 2500
    click = (np.sin(2 * np.pi * f * tt) * 0.8 + rng.standard_normal(mm) * 0.5) * np.exp(-tt / 0.006)
    x[i0:i0 + mm] += click * (1 if k < 8 else 1 - (k - 7) / 5)
save("tick", x, 0.7)

# gulp: the camera is swallowed (plop with falling pitch + low thump)
m = int(0.45 * SR); tt = np.arange(m) / SR
f = 520 * np.exp(-tt / 0.07) + 110
gl = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(m, 0.004, 0.12)
th = np.sin(2 * np.pi * (60 + 60 * np.exp(-tt / 0.04)) * tt) * env(m, 0.002, 0.15)
save("gulp", gl + 0.8 * th, 0.8)

# ding: stopwatch stops (bright bell)
m = int(1.4 * SR); tt = np.arange(m) / SR
save("ding", sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, a, d in [(1760, 1, 0.5), (2637, 0.5, 0.3), (3520, 0.3, 0.2), (5274, 0.15, 0.1)]) * env(m, 0.002, 2), 0.6)
print("ok", sorted(os.listdir(out)))

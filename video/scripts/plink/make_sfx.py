"""Synthesize the Plink reel's sound effects (no samples, no downloads).

usage: make_sfx.py out_dir
Writes 48 kHz mono 16-bit WAVs: pop, tick, whoosh, swoosh, strike, glitch,
coin, chime, boom, shutter, leak.
"""
import os, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)
out = sys.argv[1]
os.makedirs(out, exist_ok=True)


def t(sec):
    return np.arange(int(SR * sec)) / SR


def env(n, attack, decay):
    """Linear attack then exponential decay (time constants in seconds)."""
    x = np.arange(n) / SR
    return np.minimum(1, x / max(attack, 1e-4)) * np.exp(-np.maximum(0, x - attack) / decay)


def noise(sec):
    return rng.standard_normal(int(SR * sec))


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def sweep_filter(x, f0, f1):
    """One-pole low-pass whose cutoff glides from f0 to f1 (whooshes)."""
    fc = np.geomspace(f0, f1, len(x))
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a[i]) * v + a[i] * acc
        y[i] = acc
    return y


def chirp(f0, f1, sec):
    f = np.geomspace(f0, f1, int(SR * sec))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def save(name, x, peak=0.9):
    x = x / (np.abs(x).max() + 1e-9) * peak
    fade = min(len(x), int(0.004 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(os.path.join(out, name + ".wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


# bubbly pop for icons popping in: fast upward chirp + soft click
n = int(SR * 0.16)
pop = chirp(380, 1100, 0.16) * env(n, 0.002, 0.035)
pop += 0.25 * lowpass(noise(0.16), 3000) * env(n, 0.0005, 0.006)
save("pop", pop)

# tiny tick for caption keywords / stair steps
n = int(SR * 0.05)
tick = np.sin(2 * np.pi * 2300 * t(0.05)) * env(n, 0.0005, 0.008)
tick += 0.4 * noise(0.05) * env(n, 0.0002, 0.002)
save("tick", tick, 0.7)

# airy whoosh: noise through a rising-then-falling filter, bell envelope
n = int(SR * 0.45)
x = noise(0.45)
w = np.sin(np.linspace(0, np.pi, n)) ** 2
wh = sweep_filter(x, 300, 4500) * w
save("whoosh", wh)

# short swoosh (paper plane, quick moves)
n = int(SR * 0.28)
sw = sweep_filter(noise(0.28), 1500, 7000) * np.sin(np.linspace(0, np.pi, n)) ** 3
save("swoosh", sw)

# marker strike: scratchy band of noise with a fast tremolo, ending in a tap
n = int(SR * 0.22)
x = sweep_filter(noise(0.22), 2500, 6000) - sweep_filter(noise(0.22), 600, 1200) * 0.6
trem = 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * t(0.22)))
strike = x * trem * env(n, 0.01, 0.12)
save("strike", strike)

# digital glitch: stepped square waves, bit-crushed noise bursts and dropouts
sec = 0.42
n = int(SR * sec)
g = np.zeros(n)
pos = 0
while pos < n:
    seg = int(SR * rng.uniform(0.012, 0.045))
    f = rng.choice([90, 160, 440, 880, 1320, 2400, 3100])
    kind = rng.integers(0, 3)
    tt = np.arange(seg) / SR
    if kind == 0:
        s = np.sign(np.sin(2 * np.pi * f * tt))
    elif kind == 1:
        s = np.round(rng.standard_normal(seg) * 3) / 3
    else:
        s = np.zeros(seg)
    g[pos:pos + seg] = s[: n - pos] * rng.uniform(0.4, 1)
    pos += seg
g = np.round(g * 6) / 6
save("glitch", g * env(n, 0.002, 0.3), 0.8)

# coin ding: two bright partials with a shimmer
n = int(SR * 0.9)
c = (np.sin(2 * np.pi * 1975 * t(0.9)) + 0.6 * np.sin(2 * np.pi * 2637 * t(0.9)) + 0.25 * np.sin(2 * np.pi * 3951 * t(0.9)))
c *= env(n, 0.001, 0.22)
c[: int(SR * 0.07)] *= 0.6  # first strike a bit softer
c2 = np.zeros(n)
d = int(SR * 0.07)
c2[d:] = (np.sin(2 * np.pi * 2637 * t(0.9)[: n - d]) + 0.5 * np.sin(2 * np.pi * 3520 * t(0.9)[: n - d])) * env(n - d, 0.001, 0.28)
save("coin", c + c2)

# brand chime: quick major arpeggio with soft bell partials
sec = 1.3
n = int(SR * sec)
ch = np.zeros(n)
for k, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
    d = int(SR * 0.06 * k)
    m = n - d
    tt = np.arange(m) / SR
    ch[d:] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2.76 * f * tt) * np.exp(-tt / 0.08)) * env(m, 0.002, 0.35)
save("chime", ch)

# dramatic boom for the black-and-white beat: sub drop + filtered noise hit
n = int(SR * 1.1)
tt = t(1.1)
f = 95 * np.exp(-tt / 0.25) + 38
boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.4)
boom += 0.5 * lowpass(noise(1.1), 900) * env(n, 0.001, 0.07)
boom = np.tanh(boom * 1.8)
save("boom", boom)

# phone camera shutter: two clicks with a little mechanical noise
n = int(SR * 0.22)
sh = np.zeros(n)
for d, a in [(0, 1.0), (int(SR * 0.085), 0.8)]:
    m = int(SR * 0.05)
    burst = noise(0.05) * env(m, 0.0003, 0.008) + 0.5 * np.sin(2 * np.pi * 1400 * t(0.05)) * env(m, 0.0003, 0.01)
    sh[d:d + m] += a * burst
save("shutter", sh, 0.8)

# soft riser for the light leak: noise + tone swelling, then a gentle fade
sec = 0.9
n = int(SR * sec)
x = sweep_filter(noise(sec), 200, 3500) * 0.7 + 0.3 * chirp(300, 900, sec)
shape = np.minimum(1, np.linspace(0, 1.6, n)) * np.exp(-np.maximum(0, np.linspace(-0.6, 0.6, n)) * 4)
save("leak", x * shape, 0.7)

print("wrote", sorted(os.listdir(out)))

"""Mix a music bed under the rendered Plink reel.

- Takes a 38.5 s window of the song starting at --offset (chosen so a natural
  break in the song lands on the black-and-white "pero, ojo" beat and the
  music slams back in when the colour returns).
- --cut A B: extra silence on the reel timeline (s), so the music drops exactly
  with the boom instead of a few frames later.
- --level P: music loudness as a fraction of the voice loudness (0.2 = 20 %,
  i.e. -14 dB), before ducking.
- Ducks the music by --duck dB while she speaks (voice-only track as the key),
  fades in/out, then a soft peak limiter at -1 dBFS.

usage: mix_music.py ffmpeg reel.mp4 voice.mp4 song.mp3 out.wav --offset S --level P [--cut A B] [--duck DB]
"""
import argparse, subprocess, wave
import numpy as np

SR = 48000

ap = argparse.ArgumentParser()
ap.add_argument("ffmpeg")
ap.add_argument("reel")
ap.add_argument("voice")
ap.add_argument("song")
ap.add_argument("out")
ap.add_argument("--offset", type=float, required=True)
ap.add_argument("--level", type=float, required=True)
ap.add_argument("--cut", type=float, nargs=2)
ap.add_argument("--duck", type=float, default=4.0)
ap.add_argument("--fade-out", type=float, default=1.2)
a = ap.parse_args()


def load(path, ss=0.0, dur=None, ch=2):
    cmd = [a.ffmpeg, "-v", "error", "-ss", str(ss), "-i", path]
    if dur:
        cmd += ["-t", str(dur)]
    cmd += ["-vn", "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return x.reshape(-1, ch).astype(np.float64)


def k_weight_loudness(x):
    """Rough integrated loudness (LUFS-like): RMS of 400 ms blocks above a -70/-10 gate."""
    m = x.mean(1)
    n = int(0.4 * SR)
    blocks = np.array([np.mean(m[i:i + n] ** 2) for i in range(0, len(m) - n, n // 4)])
    lk = 10 * np.log10(blocks + 1e-12)
    g = blocks[lk > -70]
    rel = 10 * np.log10(g.mean()) - 10
    g = g[10 * np.log10(g) > rel]
    return 10 * np.log10(g.mean())


reel = load(a.reel)
N = len(reel)
voice = load(a.voice, ch=1)[:N, 0]
voice = np.pad(voice, (0, N - len(voice)))
song = load(a.song, ss=a.offset, dur=N / SR + 0.1)[:N]
song = np.pad(song, ((0, N - len(song)), (0, 0)))

# music level relative to the voice
gain_db = k_weight_loudness(voice[:, None]) + 20 * np.log10(a.level) - k_weight_loudness(song)
music = song * 10 ** (gain_db / 20)

# duck under speech: 30 ms RMS follower on the voice, fast attack, slow release
hop = int(0.005 * SR)
v = voice[: len(voice) // hop * hop].reshape(-1, hop)
rms = np.sqrt((v ** 2).mean(1))
active = 20 * np.log10(rms + 1e-9) > -40
target = np.where(active, 10 ** (-a.duck / 20), 1.0)
g = np.empty_like(target)
acc = 1.0
for i, t in enumerate(target):
    k = 0.35 if t < acc else 0.025  # ~15 ms attack, ~200 ms release (per 5 ms hop)
    acc += (t - acc) * k
    g[i] = acc
duck = np.interp(np.arange(N), np.arange(len(g)) * hop + hop / 2, g)
music *= duck[:, None]

# fades and the extra cut
t = np.arange(N) / SR
env = np.clip(t / 0.05, 0, 1) * np.clip((N / SR - t) / a.fade_out, 0, 1)
if a.cut:
    c0, c1 = a.cut
    env *= np.clip(np.maximum((c0 - t) / 0.025, (t - c1) / 0.01), 0, 1)
music *= env[:, None]

mix = reel + music

# soft peak limiter (-1 dBFS) on 1 ms blocks with 5 ms lookahead
thr = 10 ** (-1 / 20)
blk = SR // 1000
nb = int(np.ceil(N / blk))
pk = np.abs(np.pad(mix, ((0, nb * blk - N), (0, 0)))).reshape(nb, blk, 2).max((1, 2))
need = np.minimum(1, thr / np.maximum(pk, 1e-9))
need = np.array([need[i:i + 6].min() for i in range(nb)])
gl = np.empty(nb)
acc = 1.0
for i, n_ in enumerate(need):
    acc = n_ if n_ < acc else acc + (n_ - acc) * 0.02
    gl[i] = acc
mix *= np.interp(np.arange(N), np.arange(nb) * blk + blk / 2, gl)[:, None]

with wave.open(a.out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print(f"music gain {gain_db:+.1f} dB, limiter min gain {20 * np.log10(gl.min()):.1f} dB -> {a.out}")

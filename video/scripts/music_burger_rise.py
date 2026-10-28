"""
Original music + sound design for the BurgerRise video (12.5 s), synthesised
from scratch with numpy only (no samples, so it is free to use).

Timing follows src/BurgerRise.jsx:
  0–2 s     riser + whoosh while the burger lifts, hit at 2 s
  2–9 s     120 BPM groove in A minor (Am – F – C – G)
  3.75–4.45 cheese drops ("bloop")
  5–9 s     steam sizzle
  9–10.6 s  music drops out, falling whoosh
  10.6 s    impact boom + crash
  10.95 s   title: final chord + shimmering bells, fade out

Usage: python3 scripts/music_burger_rise.py public/burger/music-rise.wav
"""
import sys, wave
import numpy as np

SR = 48000
DUR = 12.5
N = int(SR * DUR)
rng = np.random.default_rng(7)
t = np.arange(N) / SR

L = np.zeros(N)
R = np.zeros(N)


def add(sig, start, gain=1.0, pan=0.0):
    """Mix a mono signal in at `start` seconds, pan -1 (left) .. 1 (right)."""
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gain * gl * np.sqrt(2)
    R[i:i + len(sig)] += sig * gain * gr * np.sqrt(2)


def env(n, a, d, s=0.0, r=0.0, hold=0.0):
    """Attack / decay / sustain / release envelope in seconds, length n samples."""
    out = np.zeros(n)
    tt = np.arange(n) / SR
    out = np.where(tt < a, tt / max(a, 1e-4), 0)
    dec = (tt >= a) & (tt < a + d)
    out = np.where(dec, 1 - (1 - s) * (tt - a) / max(d, 1e-4), out)
    sus_end = a + d + hold
    out = np.where((tt >= a + d) & (tt < sus_end), s, out)
    rel = tt >= sus_end
    out = np.where(rel, s * np.exp(-(tt - sus_end) / max(r, 1e-4)) if r else 0, out)
    return out


def fft_filter(x, lo=None, hi=None, slope=6.0):
    """Static band filter in the frequency domain with soft edges."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1)) ** slope)
    if hi:
        g *= 1 / (1 + (f / hi) ** slope)
    return np.fft.irfft(X * g, len(x))


def sweep_filter(x, centre_hz, q=1.2, hop=512):
    """Time-varying band-pass via STFT. centre_hz: array (one value per sample)."""
    win = 2048
    w = np.hanning(win)
    pad = np.concatenate([np.zeros(win), x, np.zeros(win)])
    out = np.zeros_like(pad)
    norm = np.zeros_like(pad)
    f = np.fft.rfftfreq(win, 1 / SR)
    for s in range(0, len(pad) - win, hop):
        c = centre_hz[min(max(s - win + win // 2, 0), len(centre_hz) - 1)]
        g = np.exp(-0.5 * (np.log2(np.maximum(f, 1) / c) * q) ** 2)
        seg = np.fft.irfft(np.fft.rfft(pad[s:s + win] * w) * g, win)
        out[s:s + win] += seg * w
        norm[s:s + win] += w ** 2
    return (out / np.maximum(norm, 1e-6))[win:win + len(x)]


def saw(freq, n, detune=0.0):
    ph = np.cumsum(np.full(n, freq * (1 + detune)) / SR)
    return 2 * (ph % 1) - 1


def sine(freq, n):
    if np.isscalar(freq):
        return np.sin(2 * np.pi * freq * np.arange(n) / SR)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR)


def reverb(x, seconds=1.8, mix=0.25, seed=1):
    n = int(seconds * SR)
    ir = np.random.default_rng(seed).normal(0, 1, n) * np.exp(-np.arange(n) / (SR * seconds / 6))
    ir = fft_filter(ir, lo=200, hi=7000)
    ir /= np.sqrt(np.sum(ir ** 2))
    m = len(x) + n
    wet = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[: len(x)]
    return x * (1 - mix) + wet * mix


# ---------------- instruments ----------------
def kick(gain=1.0, sub=1.0):
    n = int(0.5 * SR)
    f = 48 + 110 * np.exp(-np.arange(n) / (SR * 0.035))
    body = sine(f, n) * np.exp(-np.arange(n) / (SR * 0.16 * sub))
    click = fft_filter(rng.normal(0, 1, n), lo=2000) * np.exp(-np.arange(n) / (SR * 0.004)) * 0.25
    return np.tanh((body + click) * 1.6) * gain


def clap():
    n = int(0.35 * SR)
    noise = fft_filter(rng.normal(0, 1, n), lo=900, hi=6000)
    e = np.zeros(n)
    for k, d in enumerate([0, 0.011, 0.022]):
        i = int(d * SR)
        e[i:] += np.exp(-np.arange(n - i) / (SR * (0.012 if k < 2 else 0.09)))
    return noise * e * 0.6


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    noise = fft_filter(rng.normal(0, 1, n), lo=7000)
    return noise * np.exp(-np.arange(n) / (SR * (0.07 if open_ else 0.012))) * 0.35


def pad(freqs, dur, cutoff=1800):
    n = int(dur * SR)
    x = sum(saw(f, n, d) for f in freqs for d in (-0.004, 0.0, 0.005))
    x = fft_filter(x, lo=80, hi=cutoff, slope=4) / (len(freqs) * 3)
    return x * env(n, 0.35, 0.3, 0.8, 0.6, max(0, dur - 1.3))


def bass(freq, dur):
    n = int(dur * SR)
    x = sine(freq, n) * 0.8 + saw(freq, n) * 0.25
    x = fft_filter(x, hi=420, slope=4)
    return np.tanh(x * 1.4) * env(n, 0.005, 0.12, 0.55, 0.05, dur - 0.2)


def pluck(freq, dur=0.22):
    n = int(dur * SR)
    x = saw(freq, n) * 0.6 + sine(freq * 2, n) * 0.3
    x = fft_filter(x, hi=3200, slope=3)
    return x * np.exp(-np.arange(n) / (SR * 0.07))


def bell(freq, dur=1.8):
    n = int(dur * SR)
    x = sum(a * sine(freq * m, n) * np.exp(-np.arange(n) / (SR * dur / (2 + m)))
            for m, a in [(1, 1), (2.01, 0.5), (3.02, 0.25), (4.97, 0.12)])
    return x * 0.35


def whoosh(dur, f0, f1, gain=1.0):
    n = int(dur * SR)
    noise = rng.normal(0, 1, n)
    centre = np.geomspace(f0, f1, n)
    x = sweep_filter(noise, centre, q=1.4)
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return x * e * gain


def bloop():
    n = int(0.16 * SR)
    f = 1100 * np.exp(-np.arange(n) / (SR * 0.035)) + 260
    return sine(f, n) * np.exp(-np.arange(n) / (SR * 0.05)) * 0.6


A2, F2, C3, G2 = 110.0, 87.31, 130.81, 98.0
CHORDS = [  # (start, end, bass root, pad notes, arpeggio notes)
    (2.0, 4.0, A2, [220.0, 261.63, 329.63], [440.0, 523.25, 659.25, 523.25]),
    (4.0, 6.0, F2, [174.61, 220.0, 261.63], [349.23, 440.0, 523.25, 440.0]),
    (6.0, 8.0, C3, [196.0, 261.63, 329.63], [392.0, 523.25, 659.25, 523.25]),
    (8.0, 9.0, G2, [196.0, 246.94, 293.66], [392.0, 493.88, 587.33, 493.88]),
]

# ---------------- 0–2 s: lift-off ----------------
add(kick(0.7, sub=2.2), 0.0, 0.9)
add(whoosh(2.1, 180, 7000, 1.0), 0.0, 0.5, pan=-0.2)
riser_n = int(2.0 * SR)
add(sine(np.geomspace(220, 880, riser_n), riser_n) * np.linspace(0, 1, riser_n) ** 2 * 0.25, 0.0, 0.6)
add(pad([220.0, 261.63, 329.63, 440.0], 2.2, cutoff=900), 0.0, 0.8)

# ---------------- 2–9 s: groove ----------------
for start, end, root, notes, arp in CHORDS:
    p = pad(notes, end - start + 0.4)
    add(p, start, 0.6, pan=-0.35)
    add(p, start + 0.012, 0.6, pan=0.35)
    for k, s in enumerate(np.arange(start, end, 0.25)):         # bass on 8ths
        add(bass(root * (2 if k % 4 == 3 else 1), 0.24), s, 0.55)
    for k, s in enumerate(np.arange(start, end, 0.125)):        # arpeggio on 16ths
        add(pluck(arp[k % 4]), s, 0.24, pan=0.45 if k % 2 else -0.45)

beats = np.arange(2.0, 9.0, 0.5)
for k, s in enumerate(beats):
    add(kick(), s, 0.55)
    if k % 2 == 1:
        add(clap(), s, 0.7, pan=0.05)
for k, s in enumerate(np.arange(2.0, 9.0, 0.25)):
    add(hat(open_=(k % 2 == 1 and k % 8 == 7)), s, 0.8, pan=0.25)
add(fft_filter(rng.normal(0, 1, int(2.2 * SR)), lo=4000) * np.exp(-np.arange(int(2.2 * SR)) / (SR * 0.5)) * 0.35, 2.0, 0.6)  # cymbal on the hit

# ---------------- cheese drops ----------------
for s in (3.75, 3.9, 4.45):
    add(bloop(), s, 0.55, pan=rng.uniform(-0.4, 0.4))

# ---------------- 5–9 s: steam sizzle ----------------
n = int(4.2 * SR)
siz = fft_filter(rng.normal(0, 1, n), lo=2500, hi=12000)
crackle = np.zeros(n)
idx = rng.integers(0, n, 900)
crackle[idx] = rng.uniform(-1, 1, 900)
crackle = fft_filter(crackle, lo=1500, hi=9000) * 6
siz_env = np.clip(np.minimum(np.arange(n) / (SR * 0.7), (n - np.arange(n)) / (SR * 0.8)), 0, 1)
siz_env *= 0.7 + 0.3 * np.sin(np.arange(n) / SR * 2 * np.pi * 0.7)
add((siz * 0.18 + crackle) * siz_env, 4.9, 0.45, pan=-0.1)

# ---------------- 9–10.6 s: the fall ----------------
fall_n = int(1.6 * SR)
add(whoosh(1.6, 6000, 160, 1.2), 9.0, 0.42, pan=0.15)
add(sine(np.geomspace(1300, 180, fall_n), fall_n) * np.linspace(0.2, 1, fall_n) * 0.12, 9.0, 0.5)
add(pad([196.0, 246.94, 293.66], 1.7, cutoff=600), 9.0, 0.35)

# ---------------- 10.6 s: impact ----------------
bn = int(2.0 * SR)
boom = sine(30 + 45 * np.exp(-np.arange(bn) / (SR * 0.12)), bn) * np.exp(-np.arange(bn) / (SR * 0.55))
add(np.tanh(boom * 2.2), 10.6, 0.95)
add(kick(1.0, sub=1.5), 10.6, 0.9)
cn = int(2.4 * SR)
add(fft_filter(rng.normal(0, 1, cn), lo=3500) * np.exp(-np.arange(cn) / (SR * 0.7)) * 0.4, 10.6, 0.7)

# ---------------- 10.95 s: title ----------------
add(pad([220.0, 261.63, 329.63, 493.88], 1.6, cutoff=2400), 10.95, 0.5)
add(bass(A2, 1.5), 10.95, 0.5)
for k, fr in enumerate([880.0, 1046.5, 1318.5, 1760.0, 1975.5]):
    add(bell(fr), 10.95 + k * 0.09, 0.32, pan=-0.5 + k * 0.25)

# ---------------- mix ----------------
L = reverb(L, 1.8, 0.22, seed=1)
R = reverb(R, 1.8, 0.22, seed=2)
fade = np.ones(N)
fade[:int(0.03 * SR)] = np.linspace(0, 1, int(0.03 * SR))
fade[-int(0.9 * SR):] = np.linspace(1, 0, int(0.9 * SR)) ** 1.5
L, R = L * fade, R * fade
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = np.tanh(L / peak * 1.25) * 0.89, np.tanh(R / peak * 1.25) * 0.89   # gentle limiter

out = sys.argv[1] if len(sys.argv) > 1 else "music-rise.wav"
data = (np.stack([L, R], 1) * 32767).astype("<i2")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(data.tobytes())
print("wrote", out, f"{DUR}s")

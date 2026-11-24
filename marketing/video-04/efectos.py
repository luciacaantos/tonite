# Genera en local los efectos de sonido del anuncio de Bosco y Borja (sin ElevenLabs).
# Uso: python3 efectos.py  → escribe los .wav en efectos/
import wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def guardar(nombre, x):
    x = np.clip(x, -1, 1)
    estereo = np.repeat((x * 32767).astype(np.int16)[:, None], 2, axis=1)
    with wave.open(f'efectos/{nombre}', 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(estereo.tobytes())


def tiempo(seg):
    return np.arange(int(seg * SR)) / SR


def paso_bajo(x, a):
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


# Riff de guitarra distorsionada (power chords E5-G5-A5-E5) con batería
def riff():
    t = tiempo(1.05)
    notas = [82.41, 98.0, 110.0, 82.41]
    f = np.array([notas[min(3, int(x / 0.25))] for x in t])
    fase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(fase) + 0.5 * np.sin(2 * fase) + 0.33 * np.sin(3 * fase) + 0.7 * np.sin(1.5 * fase) + 0.35 * np.sin(3 * 1.5 * fase)
    pm = 0.45 + 0.55 * np.exp(-9 * np.mod(t, 0.125))
    guit = 0.32 * np.tanh(6 * x) * pm
    m = np.mod(t, 0.25)
    bombo = 0.6 * np.sin(2 * np.pi * (50 + 110 * np.exp(-30 * m)) * m) * np.exp(-9 * m)
    m2 = np.mod(t - 0.125, 0.25)
    caja = 0.25 * rng.standard_normal(len(t)) * np.exp(-22 * m2) * (t > 0.125)
    return guit + bombo + caja


# Disco rayado
def rayado():
    t = tiempo(0.4)
    f = 1400 * np.exp(-6 * t) + 120
    fase = 2 * np.pi * np.cumsum(f) / SR
    ruido = paso_bajo(rng.standard_normal(len(t)), 0.25)
    return (0.35 * np.sin(fase) * np.sign(np.sin(2 * np.pi * 18 * t)) + 0.4 * ruido) * np.exp(-3 * t)


# Grillos: trinos cortos a 4,5 kHz
def grillos():
    t = tiempo(2.4)
    trino = (np.mod(t, 0.9) < 0.28) * (np.sin(2 * np.pi * 32 * t) > 0)
    x = 0.14 * np.sin(2 * np.pi * 4500 * t) * trino
    return x * np.minimum(1, t / 0.1) * np.minimum(1, (2.4 - t) / 0.3)


# Tintineo del vaso
def vaso():
    t = tiempo(0.8)
    return 0.3 * (np.sin(2 * np.pi * 2637 * t) * np.exp(-7 * t) + 0.6 * np.sin(2 * np.pi * 3951 * t) * np.exp(-10 * t) + 0.3 * np.sin(2 * np.pi * 5274 * t) * np.exp(-14 * t))


# Música pop animada (124 bpm) para La Terraza
def musica():
    dur = 4.3
    t = tiempo(dur)
    beat = 60 / 124
    m = np.mod(t, beat)
    bombo = 0.55 * np.sin(2 * np.pi * (48 + 120 * np.exp(-28 * m)) * m) * np.exp(-7 * m)
    mh = np.mod(t + beat / 2, beat)
    hihat = 0.12 * np.diff(np.concatenate([[0], rng.standard_normal(len(t))])) * np.exp(-40 * mh)
    acordes = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]]
    comp = np.zeros_like(t)
    idx = np.minimum(3, (t / (beat * 2)).astype(int) % 4)
    for k, ac in enumerate(acordes):
        sel = idx == k
        for f in ac:
            comp[sel] += np.sin(2 * np.pi * f * t[sel]) + 0.3 * np.sin(4 * np.pi * f * t[sel])
    ms = np.mod(t, beat / 2)
    comp = 0.05 * comp * (0.35 + 0.65 * np.exp(-6 * ms))
    bajo = 0.22 * np.sin(2 * np.pi * np.array([ac[0] / 2 for ac in acordes])[idx] * t)
    x = bombo + hihat + comp + bajo
    return x * np.minimum(1, t / 0.15) * np.minimum(1, (dur - t) / 0.6)


guardar('riff.wav', riff())
guardar('rayado.wav', rayado())
guardar('grillos.wav', grillos())
guardar('vaso.wav', vaso())
guardar('musica.wav', musica())
print('efectos listos')

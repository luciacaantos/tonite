# Mezcla voces y efectos del anuncio de Bosco y Borja en efectos/mezcla.wav
# Cada frase se iguala antes a -16 LUFS para que todas las voces suenen al mismo volumen.
import re
import subprocess
TOTAL = 42.9
# Frases: (archivo sin extensión, segundo en que empieza)
VOCES = [('voz-01', 0.8), ('voz-02', 3.4), ('voz-03', 9.6), ('voz-04', 12.7), ('voz-05', 16.6),
         ('voz-camarero', 22.35), ('voz-06', 25.9), ('voz-07', 28.5), ('voz-08', 33.7), ('voz-09', 37.3),
         ('grito-1', 7.85), ('grito-2', 8.45)]
OBJETIVO = -16.0


def igualar(nombre):
    origen, destino = f'efectos/{nombre}.mp3', f'efectos/{nombre}-n.wav'
    salida = subprocess.run(['ffmpeg', '-hide_banner', '-i', origen, '-af', 'ebur128', '-f', 'null', '-'],
                            capture_output=True, text=True).stderr
    medido = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', salida)[-1])
    ganancia = OBJETIVO - medido
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', origen, '-af',
                    f'volume={ganancia:.2f}dB,alimiter=limit=0.89:level=false', '-ar', '48000', destino], check=True)
    return medido, ganancia


for nombre, _ in VOCES:
    m, g = igualar(nombre)
    print(f'{nombre}: {m:.1f} LUFS → ganancia {g:+.1f} dB')

eventos = []  # (archivo, inicio, duración o None, volumen)
for t in [7.6, 16.2, 25.9, 27.9, 32.7, 36.7]:
    eventos.append(('whoosh.wav', t, None, 0.7))
eventos += [('riff_largo.wav', 7.6, None, 0.9), ('rayado.wav', 20.42, None, 1.0),
            ('vaso.wav', 18.2, None, 0.7), ('grillos.wav', 20.9, 1.35, 0.9), ('ding.wav', 27.7, None, 0.9),
            ('pop.wav', 29.5, None, 0.8), ('pop.wav', 30.3, None, 0.8), ('pop.wav', 30.8, None, 0.8),
            ('musica.wav', 32.7, None, 0.4), ('murmullo.wav', 32.7, 4.0, 0.5)]
for nombre, t in VOCES:
    vol = 0.6 if nombre.startswith('grito') else 1.0
    eventos.append((f'{nombre}-n.wav', t, None, vol))
entradas, filtros = [], []
for i, (f, t, d, v) in enumerate(eventos):
    entradas += ['-i', f]
    ms = int(t * 1000)
    recorte = f'atrim=0:{d},afade=t=out:st={max(0, d - 0.5)}:d=0.5,' if d else ''
    filtros.append(f'[{i}:a]{recorte}aresample=48000,aformat=channel_layouts=stereo,volume={v},adelay={ms}|{ms}[a{i}]')
mezcla = ''.join(f'[a{i}]' for i in range(len(eventos)))
filtros.append(f'{mezcla}amix=inputs={len(eventos)}:normalize=0:dropout_transition=0,atrim=0:{TOTAL},apad=whole_dur={TOTAL},loudnorm=I=-14:TP=-1.5:LRA=11[aud]')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *[x if not x.startswith('efectos/') else x for x in entradas], '-filter_complex', ';'.join(filtros),
                '-map', '[aud]', '-t', str(TOTAL), '-ar', '48000', '-ac', '2', 'mezcla.wav'], check=True, cwd='efectos')
print('mezcla lista')

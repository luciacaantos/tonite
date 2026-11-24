# Mezcla voces y efectos del anuncio de Bosco y Borja en efectos/mezcla.wav
# Cada frase se iguala antes a -16 LUFS para que todas las voces suenen al mismo volumen.
import re
import subprocess
TOTAL = 40.0
VOCES = [0.8, 3.4, 9.6, 12.7, 16.6, 23.0, 25.6, 30.8, 34.4]
OBJETIVO = -16.0


def igualar(i):
    origen, destino = f'efectos/voz-{i:02d}.mp3', f'efectos/voz-{i:02d}-n.wav'
    salida = subprocess.run(['ffmpeg', '-hide_banner', '-i', origen, '-af', 'ebur128', '-f', 'null', '-'],
                            capture_output=True, text=True).stderr
    medido = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', salida)[-1])
    ganancia = OBJETIVO - medido
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', origen, '-af',
                    f'volume={ganancia:.2f}dB,alimiter=limit=0.89:level=false', '-ar', '48000', destino], check=True)
    return medido, ganancia


for i in range(1, 10):
    m, g = igualar(i)
    print(f'voz-{i:02d}: {m:.1f} LUFS → ganancia {g:+.1f} dB')

eventos = []  # (archivo, inicio, duración o None, volumen)
for t in [7.6, 16.2, 23.0, 25.0, 29.8, 33.8]:
    eventos.append(('whoosh.wav', t, None, 0.7))
eventos += [('riff.wav', 7.6, None, 0.9), ('rayado.wav', 8.55, None, 0.9),
            ('murmullo.wav', 10.4, 5.6, 0.35), ('vaso.wav', 18.9, None, 0.7),
            ('grillos.wav', 20.4, None, 0.9), ('ding.wav', 24.8, None, 0.9),
            ('pop.wav', 26.6, None, 0.8), ('pop.wav', 27.4, None, 0.8), ('pop.wav', 27.9, None, 0.8),
            ('musica.wav', 29.8, None, 0.4), ('murmullo.wav', 29.8, 4.0, 0.5)]
for i, t in enumerate(VOCES, 1):
    eventos.append((f'voz-{i:02d}-n.wav', t, None, 1.0))
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

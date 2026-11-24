# Mezcla voces y efectos del anuncio de Bosco y Borja en efectos/mezcla.wav
import subprocess
TOTAL = 40.0
VOCES = [0.8, 3.4, 9.6, 12.7, 16.6, 23.0, 25.6, 30.8, 34.4]
eventos = []  # (archivo, inicio, duración o None, volumen)
for t in [7.6, 16.2, 23.0, 25.0, 29.8, 33.8]:
    eventos.append(('whoosh.wav', t, None, 0.8))
eventos += [('riff.wav', 7.6, None, 1.0), ('rayado.wav', 8.55, None, 1.0),
            ('murmullo.wav', 10.4, 5.6, 0.6), ('vaso.wav', 18.9, None, 0.8),
            ('grillos.wav', 20.4, None, 1.0), ('ding.wav', 24.8, None, 1.0),
            ('pop.wav', 26.6, None, 0.9), ('pop.wav', 27.4, None, 0.9), ('pop.wav', 27.9, None, 0.9),
            ('musica.wav', 29.8, None, 0.9), ('murmullo.wav', 29.8, 4.0, 1.4)]
for i, t in enumerate(VOCES, 1):
    eventos.append((f'voz-{i:02d}.mp3', t, None, 1.0))
entradas, filtros = [], []
for i, (f, t, d, v) in enumerate(eventos):
    entradas += ['-i', f]
    ms = int(t * 1000)
    recorte = f'atrim=0:{d},afade=t=out:st={max(0, d - 0.5)}:d=0.5,' if d else ''
    filtros.append(f'[{i}:a]{recorte}aresample=48000,aformat=channel_layouts=stereo,volume={v},adelay={ms}|{ms}[a{i}]')
mezcla = ''.join(f'[a{i}]' for i in range(len(eventos)))
filtros.append(f'{mezcla}amix=inputs={len(eventos)}:normalize=0:dropout_transition=0,atrim=0:{TOTAL},apad=whole_dur={TOTAL},loudnorm=I=-14:TP=-1.5:LRA=11[aud]')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *entradas, '-filter_complex', ';'.join(filtros),
                '-map', '[aud]', '-t', str(TOTAL), '-ar', '48000', '-ac', '2', 'mezcla.wav'], check=True, cwd='efectos')
print('mezcla lista')

# Vídeo 01 · TikTok e Instagram (con voz)

Hay dos versiones:
- **Próximamente** (`video.html`, la que se publica ahora): termina con «Llega muy pronto a Granada. Síguenos, y sé de los primeros en probarla».
- **Votación** (`video-votacion.html`, para más adelante): termina invitando a votar en la landing y desbloquear el ranking. Su frase final era «¿Dónde vas esta noche? Vota en el enlace de la bio, y desbloquea el ranking en directo».

Vídeo vertical de 32 s hecho entero por ordenador: capturas reales de la app en modo demo, animación en HTML y voz femenina generada con Kokoro (voz `ef_dora`, licencia Apache 2.0, se puede usar en publicidad).

## Cómo se vuelve a generar

Todo se ejecuta desde esta carpeta.

1. **Capturas de la app.** Arranca la app (`npx vite --port 5173` en la raíz) y ejecuta `node captura.mjs capturas`. El mapa necesita acceso a `tile.openstreetmap.org`.
2. **Voz.**
   - Instala Kokoro en un entorno de Python: `python3 -m venv venv && ./venv/bin/pip install kokoro-onnx soundfile`.
   - Descarga `kokoro-v1.0.onnx` y `voices-v1.0.bin` de las *releases* de `thewh1teagle/kokoro-onnx` en GitHub.
   - Ejecuta `./venv/bin/python locucion.py` (crea una frase por archivo) y luego `./venv/bin/python montar_audio.py` (crea `voz.wav` y `linea.json` con los tiempos).
   - El texto de la voz está en `locucion.py`. Se escribe «Tonáit» y «chéquin» para que la voz lo pronuncie bien.
3. **Datos para la animación.** Junta `linea.json` y `capturas/info.json` en `datos.js`: `const LINEA = …; const INFO = …;`.
4. **Fotogramas.** `node render.mjs fotogramas 30` dibuja `video.html` fotograma a fotograma. Los subtítulos y las escenas están en `video.html`.
5. **Montaje.** `ffmpeg -framerate 30 -i fotogramas/f%04d.jpg -i voz.wav -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart tonite-video01-es.mp4`

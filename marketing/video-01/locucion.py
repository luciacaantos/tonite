# Genera la locución del vídeo frase a frase con Kokoro (voz femenina en español «ef_dora»).
import json, sys
import soundfile as sf
from kokoro_onnx import Kokoro

FRASES = [
    ("gancho", "¿Te ha pasado? Propones tú el sitio... y está vacío."),
    ("problema", "En Granada, nadie sabe cuánta gente hay en un bar, hasta que llega a la puerta."),
    ("marca", "Por eso estamos creando Tonáit."),
    ("mapa", "Un mapa que te dice, en directo, si cada bar y discoteca está vacío, animado, o lleno."),
    ("checkin", "Lo ponen los que ya están dentro, con un chéquin de un toque. Ningún local puede maquillarlo."),
    ("ofertas", "Además, tienes ofertas que canjeas en la barra, y puntos para chupitos, copas y entradas."),
    ("llamada", "Llega muy pronto a Granada. Síguenos, y sé de los primeros en probarla."),
    ("cierre", "Tonáit. Granada de noche."),
]
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
duraciones = {}
for clave, texto in FRASES:
    muestras, sr = k.create(texto, voice="ef_dora", speed=1.08, lang="es")
    sf.write(f"frase-{clave}.wav", muestras, sr)
    duraciones[clave] = round(len(muestras) / sr, 3)
    print(clave, duraciones[clave])
json.dump(duraciones, open("duraciones.json", "w"), indent=1)

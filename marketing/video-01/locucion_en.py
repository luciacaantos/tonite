# Locución de guía en inglés (solo para medir los tiempos del vídeo en inglés; el audio final se hará con ElevenLabs).
import json
import soundfile as sf
from kokoro_onnx import Kokoro

FRASES = [
    ("gancho", "Ever had this happen? You pick the place... and it's empty."),
    ("problema", "In Granada, nobody knows how busy a bar is, until they get to the door."),
    ("marca", "That's why we're building Tonight."),
    ("mapa", "A map that shows you, live, whether every bar and club is empty, lively, or packed."),
    ("checkin", "It's updated by people who are already inside, with a one tap check in. No venue can fake it."),
    ("ofertas", "Plus, you get deals to redeem at the bar, and points for shots, drinks and tickets."),
    ("llamada", "Coming soon to Granada. Follow us, and be one of the first to try it."),
    ("cierre", "Tonight. Granada by night."),
]
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
for clave, texto in FRASES:
    muestras, sr = k.create(texto, voice="af_heart", speed=1.05, lang="en-us")
    sf.write(f"frase-{clave}.wav", muestras, sr)
    print(clave, round(len(muestras) / sr, 2))

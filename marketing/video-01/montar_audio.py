import json, subprocess
import soundfile as sf

ORDEN = ["gancho", "problema", "marca", "mapa", "checkin", "ofertas", "llamada", "cierre"]
PAUSA = {"problema": 0.6, "marca": 0.4, "cierre": 0.45}
recorte = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
linea = []
t = 0.12
for clave in ORDEN:
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", f"frase-{clave}.wav", "-af", recorte, f"corta-{clave}.wav"], check=True)
    info = sf.info(f"corta-{clave}.wav")
    t += PAUSA.get(clave, 0.0)
    linea.append({"clave": clave, "inicio": round(t, 3), "dur": round(info.duration, 3)})
    t += info.duration + 0.3
total = round(linea[-1]["inicio"] + linea[-1]["dur"] + 1.4, 2)
json.dump({"total": total, "frases": linea}, open("linea.json", "w"), indent=1)

entradas, filtros = [], []
for i, f in enumerate(linea):
    entradas += ["-i", f"corta-{f['clave']}.wav"]
    ms = int(f["inicio"] * 1000)
    filtros.append(f"[{i}:a]adelay={ms}|{ms}[a{i}]")
mezcla = "".join(f"[a{i}]" for i in range(len(linea)))
filtros.append(f"{mezcla}amix=inputs={len(linea)}:normalize=0,apad=whole_dur={total},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[voz]")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *entradas, "-filter_complex", ";".join(filtros), "-map", "[voz]", "-t", str(total), "-ac", "2", "voz.wav"], check=True)
print(json.dumps({"total": total, "frases": linea}, indent=1))

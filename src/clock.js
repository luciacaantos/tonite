// Hora de la app. En modo demo el reloj arranca el "jueves a la 01:00"
// (técnicamente viernes 01:00) y desde ahí avanza normal.
export const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export const DIAS_LARGO = { lun: 'lunes', mar: 'martes', 'mié': 'miércoles', jue: 'jueves', vie: 'viernes', 'sáb': 'sábado', dom: 'domingo' };

// Fecha del último jueves por la noche a la 01:00 (o el próximo si no hay).
function juevesALaUna() {
  const d = new Date();
  d.setHours(1, 0, 0, 0);
  const diasHastaViernes = (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diasHastaViernes);
  return d;
}

export function ahora(demo) {
  if (!demo?.activo) return new Date();
  const base = juevesALaUna().getTime() + (demo.horaOffsetMin || 0) * 60000;
  return new Date(base + (Date.now() - demo.desde));
}

// La noche "pertenece" al día en que empezó: hasta las 07:00 cuenta como la noche anterior.
export function diaDeNoche(fecha) {
  const d = new Date(fecha.getTime() - 7 * 3600000);
  return DIAS[d.getDay()];
}

// Minutos desde las 12:00 del mediodía del día de la noche (para comparar horas que cruzan medianoche).
export function minutosNoche(fecha) {
  const m = fecha.getHours() * 60 + fecha.getMinutes();
  return m < 12 * 60 ? m + 24 * 60 - 12 * 60 : m - 12 * 60;
}
const hhmmANoche = (s) => {
  const [h, m] = s.split(':').map(Number);
  return minutosNoche(new Date(2000, 0, 1, h, m));
};

export function abierto(local, fecha) {
  const { dias, abre, cierra } = local.horario;
  if (!dias.includes(diaDeNoche(fecha))) return false;
  const m = minutosNoche(fecha);
  return m >= hhmmANoche(abre) && m < hhmmANoche(cierra);
}

export const hhmm = (fecha) => fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

// Afluencia = SOLO check-ins de usuarios.
// En la demo se suman check-ins simulados (según día, hora y tipo de local)
// a los check-ins reales hechos desde este móvil. Los locales nunca la declaran.
import { abierto, diaDeNoche, minutosNoche } from './clock.js';
import { FIESTAS } from './data.js';

export const VIGENCIA_MIN = 25;

export const NIVELES = [
  { id: 0, nombre: 'Sin datos', corto: 'Sin datos', color: '#6B7280' },
  { id: 1, nombre: 'Vacío', corto: 'Vacío', color: '#4EA8FF' },
  { id: 2, nombre: 'Algo de gente', corto: 'Algo', color: '#3DDC97' },
  { id: 3, nombre: 'Animado', corto: 'Animado', color: '#FF9F1C' },
  { id: 4, nombre: 'Lleno', corto: 'Lleno', color: '#FF3B3B' },
];

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

// Curvas de ambiente: [hora desde el mediodía, intensidad 0-1]. 11 = 23:00, 13 = 01:00, 15 = 03:00.
const CURVAS = {
  previa: [[8.5, 0], [9.5, 0.2], [10.5, 0.55], [11.5, 0.95], [12.5, 0.9], [13.5, 0.55], [14.5, 0.2]],
  pub: [[9.5, 0], [10.5, 0.15], [11.5, 0.45], [12.5, 0.8], [13.5, 1], [14.5, 0.85], [15.5, 0.35]],
  discoteca: [[11.5, 0], [12.5, 0.15], [13.5, 0.55], [14.5, 0.95], [15.5, 1], [16.5, 0.75], [18, 0.2]],
};
const FACTOR_DIA = { lun: 0.35, mar: 0.45, 'mié': 0.7, jue: 1, vie: 0.95, 'sáb': 1, dom: 0.3 };

function curva(local) {
  if (local.tipo.includes('discoteca')) return CURVAS.discoteca;
  if (local.tipo.startsWith('bar') || local.ambiente.includes('previa')) return CURVAS.previa;
  return CURVAS.pub;
}

function interpolar(puntos, x) {
  if (x <= puntos[0][0]) return puntos[0][1];
  for (let i = 1; i < puntos.length; i++) {
    const [x1, y1] = puntos[i];
    if (x <= x1) {
      const [x0, y0] = puntos[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return puntos[puntos.length - 1][1];
}

const aNivel = (score) => (score < 0.22 ? 1 : score < 0.5 ? 2 : score < 0.8 ? 3 : 4);

function simulada(local, fecha) {
  const dia = diaDeNoche(fecha);
  const franja = Math.floor(fecha.getTime() / (15 * 60000)); // cambia cada 15 min
  const ruido = hash(local.id + franja) - 0.5;
  const universitario = local.ambiente.some((a) => /universitario|erasmus/i.test(a));
  let factorDia = FACTOR_DIA[dia];
  if (dia === 'jue') factorDia = universitario ? 1 : 0.8; // el jueves es de los universitarios
  const fiesta = FIESTAS.some((f) => f.localId === local.id && f.dia === dia) ? 0.15 : 0;

  const intensidad = interpolar(curva(local), minutosNoche(fecha) / 60);
  const score = intensidad * factorDia * (0.25 + local.popularidad) + fiesta + ruido * 0.25;

  const azar = hash(local.id + 'c' + franja);
  if (score < 0.3 && azar < 0.2) return { nivel: 0, checkins: 0, haceMin: null };
  return {
    nivel: aNivel(score),
    checkins: Math.max(1, Math.round(2 + Math.max(0, score) * 14 * (0.7 + azar * 0.6))),
    haceMin: Math.round(1 + azar * (score > 0.5 ? 7 : 19)),
  };
}

// misCheckins: [{localId, ts, nivel}] guardados en el móvil (hora real).
export function afluencia(local, fecha, misCheckins = []) {
  if (!abierto(local, fecha)) return { nivel: 0, checkins: 0, haceMin: null, cerrado: true, reales: 0 };
  const sim = simulada(local, fecha);
  const vigentes = misCheckins.filter((c) => c.localId === local.id && Date.now() - c.ts < VIGENCIA_MIN * 60000);
  if (!vigentes.length) return { ...sim, cerrado: false, reales: 0 };

  const suma = sim.nivel * sim.checkins + vigentes.reduce((s, c) => s + c.nivel, 0);
  const total = sim.checkins + vigentes.length;
  const ultimoReal = Math.floor((Date.now() - Math.max(...vigentes.map((c) => c.ts))) / 60000);
  return {
    nivel: Math.round(suma / total),
    checkins: total,
    haceMin: sim.haceMin == null ? ultimoReal : Math.min(sim.haceMin, ultimoReal),
    cerrado: false,
    reales: vigentes.length,
  };
}

export const textoHace = (min) => (min == null ? 'sin check-ins recientes' : min <= 0 ? 'ahora mismo' : `hace ${min} min`);

// Todo lo del usuario se guarda SOLO en este móvil (localStorage). No hay servidor.
import { useSyncExternalStore } from 'react';
import { VIGENCIA_MIN } from './afluencia.js';

const CLAVE = 'tonite-v1';
export const PUNTOS_CHECKIN = 10;
export const PUNTOS_SITIO_NUEVO = 15;

const inicial = {
  usuario: null,
  demo: { activo: true, desde: Date.now(), horaOffsetMin: 0 },
  checkins: [],
  movimientos: [], // historial de puntos
  planes: {},
};

function cargar() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE));
    if (!s) return inicial;
    // Cada vez que se abre la app, el reloj de la demo vuelve a empezar a la hora elegida.
    return { ...inicial, ...s, demo: { ...inicial.demo, ...s.demo, desde: Date.now() } };
  } catch {
    return inicial;
  }
}

let estado = cargar();
const oyentes = new Set();

function guardar(nuevo) {
  estado = nuevo;
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin espacio o modo privado */ }
  oyentes.forEach((f) => f());
}

export const useStore = () =>
  useSyncExternalStore((f) => (oyentes.add(f), () => oyentes.delete(f)), () => estado);
export const getEstado = () => estado;

export const puntosTotales = (s) => s.movimientos.reduce((t, m) => t + m.puntos, 0);

// ---------- Usuario ----------
async function huella(texto) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('tonite:' + texto));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 0;
    for (const c of texto) h = (h * 31 + c.charCodeAt(0)) | 0;
    return 'h' + h;
  }
}

export async function registrar({ nombre, email, password }) {
  guardar({ ...estado, usuario: { nombre: nombre.trim(), email: email.trim().toLowerCase(), clave: await huella(password), desde: Date.now() } });
}

export async function entrar({ email, password }) {
  const u = estado.usuario;
  if (!u || u.email !== email.trim().toLowerCase()) return 'No hay ninguna cuenta con ese email en este móvil.';
  if (u.clave !== (await huella(password))) return 'Contraseña incorrecta.';
  guardar({ ...estado, sesion: true });
  return null;
}

export const sesionAbierta = (s) => !!s.usuario && s.sesion !== false;
export const cerrarSesion = () => guardar({ ...estado, sesion: false });
export const abrirSesionTrasRegistro = () => guardar({ ...estado, sesion: true });

// ---------- Modo demo ----------
export const setDemo = (cambios) =>
  guardar({ ...estado, demo: { ...estado.demo, ...cambios, desde: Date.now() } });

// ---------- Check-ins ----------
export function minutosParaNuevoCheckin(s, localId) {
  const ultimo = s.checkins.filter((c) => c.localId === localId).sort((a, b) => b.ts - a.ts)[0];
  if (!ultimo) return 0;
  const faltan = VIGENCIA_MIN - (Date.now() - ultimo.ts) / 60000;
  return faltan > 0 ? Math.ceil(faltan) : 0;
}

export function hacerCheckin({ local, nivel, ambiente, simulado }) {
  if (minutosParaNuevoCheckin(estado, local.id) > 0) return null;
  const nuevoSitio = !estado.checkins.some((c) => c.localId === local.id);
  const ts = Date.now();
  const movs = [{ ts, puntos: PUNTOS_CHECKIN, motivo: `Check-in en ${local.nombre}` }];
  if (nuevoSitio) movs.push({ ts, puntos: PUNTOS_SITIO_NUEVO, motivo: `Sitio nuevo: ${local.nombre}` });
  guardar({
    ...estado,
    checkins: [...estado.checkins, { localId: local.id, ts, nivel, ambiente, simulado }],
    movimientos: [...movs, ...estado.movimientos],
  });
  return movs.reduce((t, m) => t + m.puntos, 0);
}

// ---------- Planes de grupo ----------
export function guardarPlan(plan) {
  const previo = estado.planes[plan.id];
  guardar({ ...estado, planes: { ...estado.planes, [plan.id]: { votos: {}, ...previo, ...plan } } });
}

export function votar(planId, quien, localId) {
  const p = estado.planes[planId];
  if (!p || p.cerrado) return;
  guardar({ ...estado, planes: { ...estado.planes, [planId]: { ...p, votos: { ...p.votos, [quien]: localId } } } });
}

export function cerrarPlan(planId) {
  const p = estado.planes[planId];
  if (p) guardar({ ...estado, planes: { ...estado.planes, [planId]: { ...p, cerrado: true } } });
}

export function borrarPlan(planId) {
  const { [planId]: _, ...resto } = estado.planes;
  guardar({ ...estado, planes: resto });
}

export function borrarTodo() {
  try { localStorage.removeItem(CLAVE); } catch { /* nada */ }
  estado = { ...inicial, demo: { ...inicial.demo, desde: Date.now() } };
  oyentes.forEach((f) => f());
}

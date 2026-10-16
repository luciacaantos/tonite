// Todo lo del usuario se guarda SOLO en este móvil (localStorage). No hay servidor.
import { useSyncExternalStore } from 'react';
import { VIGENCIA_MIN } from './afluencia.js';
import { HORAS_ENTRE_CANJES, nivelUsuario } from './data.js';
import { borrarTodasLasFotos } from './fotosGente.js';

const CLAVE = 'tonite-v1';
export const PUNTOS_CHECKIN = 10;
export const PUNTOS_SITIO_NUEVO = 15;
export const PUNTOS_FOTO = 15;

const inicial = {
  usuario: null,
  demo: { activo: true, desde: Date.now(), horaOffsetMin: 0 },
  checkins: [],
  movimientos: [], // historial de puntos (+ ganados, - gastados)
  canjes: [], // ofertas y recompensas canjeadas: { tipo, id, ts }
  fotosSubidas: [], // { localId, ts } de las fotos que ha subido (las imágenes van aparte, en IndexedDB)
  gustos: null, // respuestas del cuestionario (null = no contestado)
  cuestionarioVisto: true, // false justo después de crear la cuenta
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

// Saldo = lo que puedes gastar. Ganados = todo lo conseguido (decide el nivel).
export const puntosSaldo = (s) => s.movimientos.reduce((t, m) => t + m.puntos, 0);
export const puntosGanados = (s) => s.movimientos.reduce((t, m) => t + Math.max(0, m.puntos), 0);
export const nivelDe = (s) => nivelUsuario(puntosGanados(s));

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
  guardar({
    ...estado,
    usuario: { nombre: nombre.trim(), email: email.trim().toLowerCase(), clave: await huella(password), desde: Date.now() },
    gustos: null,
    cuestionarioVisto: false,
  });
}

export async function entrar({ email, password }) {
  const u = estado.usuario;
  if (!u || u.email !== email.trim().toLowerCase()) return 'No hay ninguna cuenta con ese email en este móvil.';
  if (u.clave !== (await huella(password))) return 'Contraseña incorrecta.';
  guardar({ ...estado, sesion: true });
  return null;
}

export const sesionAbierta = (s) => !!s.usuario && s.sesion !== false;

export function actualizarUsuario({ nombre, email }) {
  guardar({ ...estado, usuario: { ...estado.usuario, nombre: nombre.trim(), email: email.trim().toLowerCase() } });
}

// ---------- Gustos (cuestionario) ----------
export const guardarGustos = (gustos) => guardar({ ...estado, gustos, cuestionarioVisto: true });
export const saltarCuestionario = () => guardar({ ...estado, cuestionarioVisto: true });
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

// ---------- Fotos de la gente ----------
// Una foto por local cada VIGENCIA_MIN minutos (como el check-in), para que no se llene de repetidas.
export function minutosParaNuevaFoto(s, localId) {
  const ultima = (s.fotosSubidas || []).filter((f) => f.localId === localId).sort((a, b) => b.ts - a.ts)[0];
  if (!ultima) return 0;
  const faltan = VIGENCIA_MIN - (Date.now() - ultima.ts) / 60000;
  return faltan > 0 ? Math.ceil(faltan) : 0;
}

// ¿Ha hecho check-in aquí hace poco? Entonces ya sabemos que está en el local.
export const checkinReciente = (s, localId) =>
  s.checkins.some((c) => c.localId === localId && Date.now() - c.ts < VIGENCIA_MIN * 60000);

export function registrarFoto(local) {
  const ts = Date.now();
  guardar({
    ...estado,
    fotosSubidas: [...(estado.fotosSubidas || []), { localId: local.id, ts }],
    movimientos: [{ ts, puntos: PUNTOS_FOTO, motivo: `Foto en ${local.nombre}` }, ...estado.movimientos],
  });
  return PUNTOS_FOTO;
}

// ---------- Ofertas (locales adheridos) ----------
// Tras canjear una oferta, no se puede volver a usar hasta pasada HORAS_ENTRE_CANJES (hora real).
export function minutosParaOferta(s, ofertaId) {
  const ultimo = s.canjes.filter((c) => c.tipo === 'oferta' && c.id === ofertaId).sort((a, b) => b.ts - a.ts)[0];
  if (!ultimo) return 0;
  const faltan = HORAS_ENTRE_CANJES * 60 - (Date.now() - ultimo.ts) / 60000;
  return faltan > 0 ? Math.ceil(faltan) : 0;
}

export function canjearOferta(oferta) {
  if (minutosParaOferta(estado, oferta.id) > 0) return false;
  guardar({ ...estado, canjes: [...estado.canjes, { tipo: 'oferta', id: oferta.id, ts: Date.now() }] });
  return true;
}

// ---------- Recompensas (se pagan con puntos) ----------
export function puedeCanjear(s, recompensa) {
  if (nivelDe(s).actual.nivel < (recompensa.nivelMinimo || 0)) return 'nivel';
  if (puntosSaldo(s) < recompensa.puntos) return 'puntos';
  return null;
}

export function canjearRecompensa(recompensa) {
  if (puedeCanjear(estado, recompensa)) return false;
  const ts = Date.now();
  guardar({
    ...estado,
    canjes: [...estado.canjes, { tipo: 'recompensa', id: recompensa.id, ts }],
    movimientos: [{ ts, puntos: -recompensa.puntos, motivo: `Canjeado: ${recompensa.titulo}` }, ...estado.movimientos],
  });
  return true;
}

// Solo modo demo: regala puntos para poder enseñar los canjes y los niveles.
export function sumarPuntosDemo(n) {
  guardar({ ...estado, movimientos: [{ ts: Date.now(), puntos: n, motivo: 'Puntos de demo 🎬' }, ...estado.movimientos] });
}

export function borrarTodo() {
  try { localStorage.removeItem(CLAVE); } catch { /* nada */ }
  borrarTodasLasFotos();
  estado = { ...inicial, demo: { ...inicial.demo, desde: Date.now() } };
  oyentes.forEach((f) => f());
}

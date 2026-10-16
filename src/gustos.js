// Cuestionario de gustos y cálculo de "% para ti".
import { OFERTAS, ESTILOS, euroSimbolos } from './data.js';

// Cada pregunta guarda su respuesta en gustos[clave]. multi = se pueden marcar varias.
export const PREGUNTAS = [
  {
    clave: 'gente', titulo: '¿Cómo te gustan los sitios?',
    opciones: [
      { v: 2, emoji: '🤫', texto: 'Tranquilos, para poder hablar' },
      { v: 3, emoji: '🙂', texto: 'Ni muy llenos ni vacíos' },
      { v: 4, emoji: '🔥', texto: 'A tope, cuanto más lleno mejor' },
    ],
  },
  {
    clave: 'musica', titulo: '¿Qué música te mueve?', multi: true,
    opciones: [
      { v: 'reggaetón', emoji: '🍑', texto: 'Reggaetón', tags: ['reggaetón'] },
      { v: 'comercial', emoji: '📻', texto: 'Comercial / pop', tags: ['comercial', 'pop'] },
      { v: 'pop español', emoji: '🇪🇸', texto: 'Pop español', tags: ['pop español'] },
      { v: 'latino', emoji: '💃', texto: 'Latino', tags: ['latino'] },
      { v: 'indie', emoji: '🎧', texto: 'Indie', tags: ['indie'] },
      { v: 'rock', emoji: '🎸', texto: 'Rock', tags: ['rock'] },
      { v: 'electrónica', emoji: '🎛️', texto: 'Electrónica / house', tags: ['electrónica', 'house'] },
      { v: 'remember', emoji: '📼', texto: 'Remember 80-90', tags: ['remember', 'remember 80-90'] },
    ],
  },
  {
    clave: 'plan', titulo: '¿Qué buscas en una noche?', multi: true,
    opciones: [
      { v: 'previa', emoji: '🍻', texto: 'Una previa barata' },
      { v: 'tomar algo', emoji: '🗣️', texto: 'Tomar algo y charlar' },
      { v: 'bailar', emoji: '🕺', texto: 'Bailar' },
      { v: 'hasta tarde', emoji: '🌅', texto: 'Darlo todo hasta el cierre' },
    ],
  },
  {
    clave: 'publico', titulo: '¿Con qué gente estás más a gusto?', multi: true,
    opciones: [
      { v: 'universitario', emoji: '🎓', texto: 'Universitaria' },
      { v: 'Erasmus', emoji: '🌍', texto: 'Erasmus / internacional' },
      { v: 'alternativo', emoji: '🎸', texto: 'Alternativa' },
      { v: 'LGTBI-friendly', emoji: '🏳️‍🌈', texto: 'LGTBI-friendly' },
      { v: '+25', emoji: '🥂', texto: 'Algo más mayor (+25)' },
      { v: 'mixto', emoji: '🤝', texto: 'Me da igual, de todo' },
    ],
  },
  {
    clave: 'estilo', titulo: '¿Qué estilo de sitio te va más?',
    opciones: [
      { v: 'casual', emoji: '👟', texto: 'Casual, voy como quiera' },
      { v: 'arreglado', emoji: '✨', texto: 'Algo arreglado' },
      { v: 'pijo', emoji: '💎', texto: 'Pijo / exclusivo' },
    ],
  },
  {
    clave: 'bebida', titulo: '¿Qué sueles pedir?',
    opciones: [
      { v: 'copa', emoji: '🍸', texto: 'Copas' },
      { v: 'chupito', emoji: '🥃', texto: 'Chupitos' },
      { v: 'cerveza', emoji: '🍺', texto: 'Cerveza' },
      { v: 'todo', emoji: '🎲', texto: 'De todo un poco' },
    ],
  },
  {
    clave: 'presupuesto', titulo: '¿Cuánto sueles gastar en una noche?',
    opciones: [
      { v: 1, emoji: '🪙', texto: 'Menos de 15 €' },
      { v: 2, emoji: '💶', texto: 'Entre 15 y 30 €' },
      { v: 3, emoji: '💳', texto: 'Más de 30 €' },
    ],
  },
];

const PESOS = { musica: 30, plan: 20, publico: 15, estilo: 15, presupuesto: 10, bebida: 10 };
const respondida = (g, k) => (Array.isArray(g[k]) ? g[k].length > 0 : g[k] != null);

const tagsMusica = (g) =>
  PREGUNTAS[1].opciones.filter((o) => g.musica?.includes(o.v)).flatMap((o) => o.tags);

// Afinidad 0-100 entre los gustos y el local (sin contar cuánta gente hay ahora).
// Devuelve null si la persona no ha contestado nada.
export function afinidad(local, g) {
  if (!g) return null;
  let total = 0, puntos = 0;
  const razones = [];
  const suma = (k, valor, razon) => {
    if (!respondida(g, k)) return;
    total += PESOS[k];
    puntos += PESOS[k] * valor;
    if (valor >= 0.99 && razon) razones.push(razon);
  };

  const mus = tagsMusica(g).filter((t) => local.musica.includes(t));
  suma('musica', mus.length ? 1 : 0, mus.length && `🎵 Ponen ${mus[0]}`);

  const plan = (g.plan || []).filter((p) => local.plan.includes(p));
  suma('plan', plan.length ? 1 : 0, plan.length && `✅ Bueno para ${plan[0]}`);

  const pub = (g.publico || []).filter((p) => p === 'mixto' || local.publico.includes(p));
  suma('publico', pub.length ? 1 : 0, pub.length && pub[0] !== 'mixto' && `👥 Público ${pub[0]}`);

  if (g.estilo) {
    const d = Math.abs(ESTILOS.indexOf(g.estilo) - ESTILOS.indexOf(local.estilo));
    suma('estilo', d === 0 ? 1 : d === 1 ? 0.4 : 0, `${g.estilo === 'pijo' ? '💎' : g.estilo === 'arreglado' ? '✨' : '👟'} Ambiente ${local.estilo}`);
  }

  if (g.presupuesto) {
    const d = local.precio - g.presupuesto;
    suma('presupuesto', d <= 0 ? 1 : d === 1 ? 0.4 : 0, `💸 Precio ${euroSimbolos(local.precio)}, en tu presupuesto`);
  }

  if (g.bebida) {
    const tiene = g.bebida === 'todo' || OFERTAS.some((o) => o.localId === local.id && o.categoria === g.bebida) ||
      (g.bebida === 'chupito' && local.tipo.includes('chupito'));
    suma('bebida', tiene ? 1 : 0.5, g.bebida !== 'todo' && tiene && `🎟️ Ofertas de ${g.bebida}s`);
  }

  if (!total) return null;
  return { pct: Math.round((puntos / total) * 100), razones: razones.filter(Boolean) };
}

// ¿La gente que hay ahora es la que le gusta? (1 = justo, 0.5 = casi, 0 = no)
export function encajeAhora(estado, g) {
  if (!g?.gente || estado.cerrado || !estado.nivel) return null;
  const d = Math.abs(estado.nivel - g.gente);
  return d === 0 ? 1 : d === 1 ? 0.5 : 0;
}

// Puntuación para ordenar "Para ti ahora": afinidad + cómo está de gente.
export function puntuacionParaTi(local, estado, g) {
  const a = afinidad(local, g);
  if (!a || estado.cerrado) return -1;
  const e = encajeAhora(estado, g);
  return a.pct * 0.75 + (e == null ? 0.5 : e) * 25;
}

export const TEXTO_GENTE = { 2: 'tranquilo', 3: 'con algo de gente', 4: 'lleno' };
export const TEXTO_GENTE_PREFIERE = { 2: 'tranquilos', 3: 'ni muy llenos ni vacíos', 4: 'llenos' };

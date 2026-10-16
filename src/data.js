// Junta los archivos editables de /datos (locales, coordenadas, demo y ofertas).
import csvTexto from '../datos/locales_granada_seed.csv?raw';
import coordenadas from '../datos/coordenadas.json';
import demo from '../datos/demo.json';
import monetizacion from '../datos/ofertas.json';
import { parseCSV, etiquetas, slug } from './csv.js';

// Centro de cada zona: se usa si un local no tiene coordenadas.
const CENTRO_ZONA = {
  'Pedro Antonio': { lat: 37.1697, lon: -3.605 },
  Ganivet: { lat: 37.1735, lon: -3.597 },
  Elvira: { lat: 37.178, lon: -3.5985 },
  'Discotecas centro': { lat: 37.1715, lon: -3.601 },
};

export const ESTILOS = ['casual', 'arreglado', 'pijo'];

// Fotos: archivos en datos/fotos/ llamados como el id del local (ej. pata-palo.jpg, pata-palo-2.jpg).
// También vale poner enlaces (https://...) en la columna «foto» del CSV, separados por |.
const ARCHIVOS_FOTOS = import.meta.glob('../datos/fotos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' });
function fotosDe(id, columna) {
  const archivos = Object.entries(ARCHIVOS_FOTOS)
    .map(([ruta, url]) => ({ nombre: ruta.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase(), url }))
    .filter((f) => f.nombre === id || new RegExp(`^${id}-\\d+$`).test(f.nombre))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }))
    .map((f) => f.url);
  const enlaces = etiquetas(columna).filter((u) => /^https?:\/\//.test(u));
  return [...archivos, ...enlaces];
}

export const LOCALES = parseCSV(csvTexto).map((fila, i) => {
  const c = coordenadas[fila.nombre];
  const centro = CENTRO_ZONA[fila.zona] || CENTRO_ZONA['Discotecas centro'];
  const d = demo.locales[fila.nombre] || {};
  const sinDireccion = fila.direccion.includes('COMPLETAR');
  return {
    id: slug(fila.nombre),
    nombre: fila.nombre,
    zona: fila.zona,
    tipo: fila.tipo,
    direccion: fila.direccion.replace(/\[COMPLETAR dirección\]\s*/, '').trim(),
    sinDireccion,
    musica: etiquetas(fila.musica),
    ambiente: etiquetas(fila.ambiente),
    // Ambiente detallado (columnas del CSV, aproximadas: revisar).
    estilo: ESTILOS.includes(fila.estilo) ? fila.estilo : 'casual',
    precio: Math.min(3, Math.max(1, (fila.precio || '€').length)),
    publico: etiquetas(fila.publico),
    edad: fila.edad || '',
    plan: etiquetas(fila.plan),
    volumen: fila.volumen || '',
    notas: fila.notas,
    fotos: fotosDe(slug(fila.nombre), fila.foto),
    lat: c ? c.lat : centro.lat + ((i % 3) - 1) * 0.0003,
    lon: c ? c.lon : centro.lon + ((i % 2) ? 0.0003 : -0.0003),
    revisarPosicion: !c || c.revisar || sinDireccion,
    horario: d.horario || { dias: ['jue', 'vie', 'sáb'], abre: '22:00', cierra: '03:00' },
    copa: d.copa ?? null,
    chupito: d.chupito ?? null,
    entrada: d.entrada ?? null,
    adherido: monetizacion.adheridos.includes(fila.nombre),
    popularidad: d.popularidad ?? 0.5,
    demo: true,
  };
});

export const POR_ID = Object.fromEntries(LOCALES.map((l) => [l.id, l]));
export const POR_NOMBRE = Object.fromEntries(LOCALES.map((l) => [l.nombre, l]));
export const FIESTAS = demo.fiestas
  .map((f, i) => ({ ...f, id: `f${i}`, localId: POR_NOMBRE[f.local]?.id, adherido: !!POR_NOMBRE[f.local]?.adherido }))
  .filter((f) => f.localId);

// ---------- Monetización: ofertas, recompensas y niveles (datos/ofertas.json) ----------
export const HORAS_ENTRE_CANJES = monetizacion.horasEntreCanjes ?? 1;
export const CUOTA_MENSUAL = monetizacion.cuotaMensual ?? 22.99;
export const OFERTAS = monetizacion.ofertas
  .map((o) => ({ ...o, localId: POR_NOMBRE[o.local]?.id }))
  .filter((o) => o.localId && POR_ID[o.localId].adherido);
export const RECOMPENSAS = monetizacion.recompensas.map((r) => ({ ...r, localId: POR_NOMBRE[r.local]?.id || null }));
export const NIVELES_USUARIO = [...monetizacion.niveles].sort((a, b) => a.desde - b.desde);

// Nivel según los puntos GANADOS en total (gastar puntos no baja de nivel).
export function nivelUsuario(ganados) {
  const actual = [...NIVELES_USUARIO].reverse().find((n) => ganados >= n.desde) || NIVELES_USUARIO[0];
  const siguiente = NIVELES_USUARIO.find((n) => n.desde > ganados) || null;
  return { actual, siguiente };
}

export const CATEGORIAS = {
  chupito: { nombre: 'Chupitos', emoji: '🥃' },
  copa: { nombre: 'Copas', emoji: '🍸' },
  cerveza: { nombre: 'Cervezas', emoji: '🍺' },
  entrada: { nombre: 'Entradas', emoji: '🎟️' },
};

const unicos = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b, 'es'));
export const ZONAS = ['Pedro Antonio', 'Ganivet', 'Elvira', 'Discotecas centro'];
export const TIPOS = unicos(LOCALES.map((l) => l.tipo));
export const MUSICAS = unicos(LOCALES.flatMap((l) => l.musica));
export const AMBIENTES = unicos(LOCALES.flatMap((l) => l.ambiente));
export const PUBLICOS = unicos(LOCALES.flatMap((l) => l.publico));
export const PRECIOS = [1, 2, 3];
export const euroSimbolos = (n) => '€'.repeat(n);

// Distancia en metros entre dos puntos.
export function distancia(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const formatoDistancia = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);
export const euros = (n) => (n == null ? '—' : `${Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')} €`);

export const urlComoLlegar = (l) =>
  l.sinDireccion
    ? `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lon}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(l.nombre + ', ' + l.direccion)}`;

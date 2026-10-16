// Obtiene las coordenadas de los locales con Nominatim (OpenStreetMap).
// Uso:  npm run geocodificar
// Respeta el límite de Nominatim: 1 petición por segundo.
// Resultado: datos/coordenadas.json  +  datos/locales_para_revisar.txt
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCSV } from '../src/csv.js';

const CSV = new URL('../datos/locales_granada_seed.csv', import.meta.url);
const JSON_COORDS = new URL('../datos/coordenadas.json', import.meta.url);
const REVISAR = new URL('../datos/locales_para_revisar.txt', import.meta.url);

// Recuadro de Granada centro para que no devuelva calles de otras ciudades.
const VIEWBOX = '-3.625,37.19,-3.580,37.160';
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function limpiarDireccion(d) {
  return d
    .replace(/\(.*?\)/g, '')
    .replace(/\bC\.\s*/g, 'Calle ')
    .replace(/\bs\/n\b/gi, '')
    .replace(/\s+,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

async function buscar(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es&viewbox=${VIEWBOX}&bounded=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'TONITE-prototipo-UGR/0.1 (demo Ideas Factory)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const [r] = await res.json();
  return r ? { lat: +(+r.lat).toFixed(6), lon: +(+r.lon).toFixed(6) } : null;
}

const locales = parseCSV(readFileSync(CSV, 'utf8'));
const coords = JSON.parse(readFileSync(JSON_COORDS, 'utf8'));
const pendientes = [];

for (const l of locales) {
  if (l.direccion.includes('COMPLETAR')) {
    pendientes.push(`${l.nombre} — falta la dirección (colocado en el centro de ${l.zona})`);
    continue;
  }
  const q = limpiarDireccion(l.direccion);
  try {
    let r = await buscar(q);
    await esperar(1100);
    if (!r) { r = await buscar(`${l.nombre}, Granada`); await esperar(1100); }
    if (r) {
      coords[l.nombre] = { ...r, fuente: 'nominatim', revisar: false };
      console.log(`✓ ${l.nombre}  →  ${r.lat}, ${r.lon}`);
    } else {
      pendientes.push(`${l.nombre} — Nominatim no encontró "${q}"`);
      console.log(`✗ ${l.nombre}  (no encontrado)`);
    }
  } catch (e) {
    pendientes.push(`${l.nombre} — error: ${e.message}`);
    console.log(`✗ ${l.nombre}  (${e.message})`);
    await esperar(1100);
  }
}

writeFileSync(JSON_COORDS, JSON.stringify(coords, null, 2) + '\n');
writeFileSync(REVISAR, pendientes.length ? pendientes.join('\n') + '\n' : 'Todo encontrado.\n');
console.log(`\nListo. ${pendientes.length} locales para revisar → datos/locales_para_revisar.txt`);

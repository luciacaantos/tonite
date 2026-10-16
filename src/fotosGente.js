// Fotos que suben los usuarios desde el local ("cómo está ahora").
// Sin servidor: se guardan en este móvil (IndexedDB), reducidas para que ocupen poco.
import { useEffect, useState } from 'react';

const BD = 'tonite-fotos';
const TABLA = 'fotos';
const LADO_MAX = 1080; // px del lado largo
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f());

function abrir() {
  return new Promise((ok, mal) => {
    const req = indexedDB.open(BD, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(TABLA, { keyPath: 'id' }).createIndex('localId', 'localId');
    req.onsuccess = () => ok(req.result);
    req.onerror = () => mal(req.error);
  });
}

async function operar(modo, fn) {
  const bd = await abrir();
  return new Promise((ok, mal) => {
    const tx = bd.transaction(TABLA, modo);
    const r = fn(tx.objectStore(TABLA));
    tx.oncomplete = () => { bd.close(); ok(r?.result); };
    tx.onerror = () => { bd.close(); mal(tx.error); };
  });
}

export const leerFotos = (localId) =>
  operar('readonly', (t) => t.index('localId').getAll(localId)).then((l) => (l || []).sort((a, b) => b.ts - a.ts));

export async function guardarFotoGente({ localId, autor, dataUrl }) {
  const foto = { id: `${localId}-${Date.now()}`, localId, autor, dataUrl, ts: Date.now() };
  await operar('readwrite', (t) => t.put(foto));
  avisar();
  return foto;
}

export async function borrarFotoGente(id) {
  await operar('readwrite', (t) => t.delete(id));
  avisar();
}

export async function borrarTodasLasFotos() {
  try { await operar('readwrite', (t) => t.clear()); } catch { /* sin IndexedDB */ }
  avisar();
}

// Fotos de un local, siempre al día.
export function useFotosGente(localId) {
  const [fotos, setFotos] = useState([]);
  useEffect(() => {
    let vivo = true;
    const cargar = () => leerFotos(localId).then((f) => vivo && setFotos(f)).catch(() => vivo && setFotos([]));
    cargar();
    oyentes.add(cargar);
    return () => { vivo = false; oyentes.delete(cargar); };
  }, [localId]);
  return fotos;
}

// Reduce la foto de la cámara a JPEG ligero.
export function reducirFoto(archivo) {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('No se pudo leer la foto')); };
    img.src = url;
  });
}

export function haceCuanto(ts) {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

export const EN_DIRECTO_MIN = 60;

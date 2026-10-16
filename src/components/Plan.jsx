import { useEffect, useRef, useState } from 'react';
import { useApp } from '../ctx.js';
import { LOCALES, POR_ID, urlComoLlegar, euros } from '../data.js';
import { guardarPlan, votar, cerrarPlan, borrarPlan } from '../store.js';
import { Icono, NivelBadge, Punto } from './ui.jsx';

const AMIGOS = ['Lucía', 'Marcos', 'Anna (Erasmus)', 'Paco', 'Irene'];

// --- Enlace compartible: los datos del plan van dentro del propio enlace ---
const aBase64 = (obj) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export function leerPlanDeEnlace(param) {
  try {
    const b = atob(param.replace(/-/g, '+').replace(/_/g, '/'));
    const { id, t, h, l, c } = JSON.parse(new TextDecoder().decode(Uint8Array.from(b, (ch) => ch.charCodeAt(0))));
    const locales = l.filter((x) => POR_ID[x]);
    return id && locales.length >= 2 ? { id, titulo: t, hora: h, locales, creador: c } : null;
  } catch {
    return null;
  }
}
const enlacePlan = (p) =>
  `${location.origin}${location.pathname}#/p/${aBase64({ id: p.id, t: p.titulo, h: p.hora, l: p.locales, c: p.creador })}`;

function ganador(plan, estados) {
  const cuenta = Object.fromEntries(plan.locales.map((id) => [id, 0]));
  Object.values(plan.votos).forEach((id) => { if (id in cuenta) cuenta[id]++; });
  const orden = [...plan.locales].sort((a, b) => cuenta[b] - cuenta[a] || estados[b].nivel - estados[a].nivel);
  return { id: orden[0], cuenta };
}

export default function Plan({ planId }) {
  const { s } = useApp();
  const plan = planId && s.planes[planId];
  if (plan) return <DetallePlan plan={plan} />;
  return <ListaPlanes />;
}

function ListaPlanes() {
  const { s } = useApp();
  const [creando, setCreando] = useState(false);
  const planes = Object.values(s.planes).sort((a, b) => (b.creado || 0) - (a.creado || 0));
  if (creando) return <CrearPlan cancelar={() => setCreando(false)} />;
  return (
    <div className="pagina">
      <h1>Plan de grupo</h1>
      <p className="sub">Propón 2 o 3 sitios, mándalo al grupo de WhatsApp y que voten. Se acabó el «me da igual».</p>
      <button className="btn btn-primario btn-grande" onClick={() => setCreando(true)}><Icono n="mas" /> Crear plan</button>
      {planes.length > 0 && <h3 className="mt">Tus planes</h3>}
      <div className="lista">
        {planes.map((p) => (
          <a key={p.id} className="fila" href={`#/plan/${p.id}`}>
            <span className="fila-txt">
              <strong>{p.titulo}</strong>
              <small>{p.hora} · {p.locales.map((id) => POR_ID[id]?.nombre).join(' / ')}</small>
            </span>
            <span className="fila-dcha">{p.cerrado ? '✅ Decidido' : `${Object.keys(p.votos).length} votos`}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function CrearPlan({ cancelar }) {
  const { s, estados, now } = useApp();
  const [titulo, setTitulo] = useState('Plan de esta noche');
  const [hora, setHora] = useState('00:30');
  const [sel, setSel] = useState([]);
  const [busca, setBusca] = useState('');

  const opciones = LOCALES.filter((l) => l.nombre.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => (estados[a.id].cerrado - estados[b.id].cerrado) || estados[b.id].nivel - estados[a.id].nivel);

  function crear() {
    const id = Math.random().toString(36).slice(2, 8);
    guardarPlan({ id, titulo: titulo.trim() || 'Plan de esta noche', hora, locales: sel, creador: s.usuario.nombre, creado: now.getTime(), votos: {} });
    location.hash = `#/plan/${id}`;
  }

  return (
    <div className="pagina">
      <button className="link" onClick={cancelar}>← Volver</button>
      <h1>Nuevo plan</h1>
      <label className="campo">Nombre del plan<input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={40} /></label>
      <label className="campo">¿A qué hora quedamos?<input type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></label>
      <h3>Elige 2 o 3 sitios <span className="sub">({sel.length}/3)</span></h3>
      <input className="buscador" placeholder="Buscar local…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div className="lista lista-sel">
        {opciones.map((l) => {
          const on = sel.includes(l.id);
          return (
            <button key={l.id} className={`fila ${on ? 'fila-on' : ''}`} disabled={!on && sel.length >= 3}
              onClick={() => setSel(on ? sel.filter((x) => x !== l.id) : [...sel, l.id])}>
              <Punto nivel={estados[l.id].nivel} size={14} />
              <span className="fila-txt"><strong>{l.nombre}</strong><small>{l.tipo} · {l.zona}</small></span>
              <span className="check-caja">{on && <Icono n="check" size={16} />}</span>
            </button>
          );
        })}
      </div>
      <div className="pie-fijo">
        <button className="btn btn-primario btn-grande" disabled={sel.length < 2} onClick={crear}>
          {sel.length < 2 ? 'Elige al menos 2 sitios' : 'Crear plan y votar'}
        </button>
      </div>
    </div>
  );
}

function DetallePlan({ plan }) {
  const { s, estados, abrirLocal } = useApp();
  const yo = s.usuario.nombre;
  const [simulando, setSimulando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const { id: idGanador, cuenta } = ganador(plan, estados);
  const total = Object.keys(plan.votos).length;
  const enlace = enlacePlan(plan);
  const textoWA = `🌙 ${plan.titulo} — quedamos a las ${plan.hora}.\n¿Dónde vamos? Vota aquí en TONITE:\n${enlace}`;

  function simularAmigos() {
    setSimulando(true);
    const pendientes = AMIGOS.filter((a) => !plan.votos[a]);
    pendientes.forEach((amigo, i) => {
      timers.current.push(setTimeout(() => {
        // Los amigos tienden a votar el sitio con más ambiente.
        const pesos = plan.locales.map((id) => 1 + estados[id].nivel ** 2);
        let r = Math.random() * pesos.reduce((a, b) => a + b, 0);
        const elegido = plan.locales.find((_, k) => (r -= pesos[k]) < 0) ?? plan.locales[0];
        votar(plan.id, amigo, elegido);
        if (i === pendientes.length - 1) setSimulando(false);
      }, 600 * (i + 1)));
    });
    if (!pendientes.length) setSimulando(false);
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(enlace); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sin permiso */ }
  }

  if (plan.cerrado) {
    const l = POR_ID[idGanador];
    const textoFinal = `✅ ¡Decidido! Esta noche vamos a ${l.nombre} a las ${plan.hora}. 📍 ${urlComoLlegar(l)}`;
    return (
      <div className="pagina">
        <a className="link" href="#/plan">← Mis planes</a>
        <div className="ganador">
          <div className="ganador-emoji">🏆</div>
          <p className="sub">{plan.titulo} · {plan.hora}</p>
          <h1>{l.nombre}</h1>
          <p>{cuenta[idGanador]} de {total} votos</p>
          <NivelBadge estado={estados[l.id]} grande />
        </div>
        <div className="pila">
          <a className="btn btn-primario btn-grande" href={urlComoLlegar(l)} target="_blank" rel="noreferrer"><Icono n="ruta" /> Cómo llegar</a>
          <a className="btn btn-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(textoFinal)}`} target="_blank" rel="noreferrer">Avisar al grupo por WhatsApp</a>
          <button className="btn btn-secundario" onClick={() => abrirLocal(l.id)}>Ver ficha del local</button>
          <button className="link peligro" onClick={() => { borrarPlan(plan.id); location.hash = '#/plan'; }}>Borrar plan</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina">
      <a className="link" href="#/plan">← Mis planes</a>
      <h1>{plan.titulo}</h1>
      <p className="sub">Quedamos a las <strong>{plan.hora}</strong> · propuesto por {plan.creador === yo ? 'ti' : plan.creador}</p>

      <div className="opciones">
        {plan.locales.map((id) => {
          const l = POR_ID[id];
          const mio = plan.votos[yo] === id;
          const pct = total ? Math.round((cuenta[id] / total) * 100) : 0;
          return (
            <div key={id} className={`opcion ${mio ? 'opcion-mia' : ''}`}>
              <button className="opcion-info" onClick={() => abrirLocal(id)}>
                <strong>{l.nombre}</strong>
                <small>{l.musica.join(' · ')} · copa {euros(l.copa)}</small>
                <NivelBadge estado={estados[id]} />
              </button>
              <div className="barra"><i style={{ width: `${pct}%` }} /></div>
              <div className="opcion-pie">
                <span>{cuenta[id]} {cuenta[id] === 1 ? 'voto' : 'votos'}</span>
                <button className={`btn btn-pequeno ${mio ? 'btn-primario' : 'btn-secundario'}`} onClick={() => votar(plan.id, yo, id)}>
                  {mio ? '✓ Tu voto' : 'Votar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {total > 0 && (
        <p className="votantes">Han votado: {Object.keys(plan.votos).map((n) => (n === yo ? 'tú' : n)).join(', ')}</p>
      )}

      <div className="pila">
        <a className="btn btn-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(textoWA)}`} target="_blank" rel="noreferrer">
          <Icono n="compartir" size={20} /> Compartir por WhatsApp
        </a>
        <button className="btn btn-secundario" onClick={copiar}>{copiado ? '¡Enlace copiado!' : 'Copiar enlace'}</button>
        {s.demo.activo && (
          <button className="btn btn-demo" onClick={simularAmigos} disabled={simulando}>
            {simulando ? 'Llegando votos…' : '🎬 Simular votos de amigos'}
          </button>
        )}
        <button className="btn btn-primario btn-grande" disabled={total === 0} onClick={() => cerrarPlan(plan.id)}>
          Cerrar votación y ver ganador
        </button>
      </div>
    </div>
  );
}

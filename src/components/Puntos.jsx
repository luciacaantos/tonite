import { useState } from 'react';
import { useApp } from '../ctx.js';
import { RECOMPENSAS, NIVELES_USUARIO, CATEGORIAS, POR_ID } from '../data.js';
import { puntosSaldo, puntosGanados, nivelDe, puedeCanjear, PUNTOS_CHECKIN, PUNTOS_SITIO_NUEVO } from '../store.js';
import { Chip } from './ui.jsx';
import Canje from './Canje.jsx';

export function NivelChip({ nivel }) {
  return <span className={`nivel-chip nv${nivel.nivel}`}>Nivel {nivel.nivel} · {nivel.nombre}</span>;
}

// Tarjeta de saldo + nivel + progreso al siguiente nivel.
export function TarjetaPuntos() {
  const { s } = useApp();
  const saldo = puntosSaldo(s);
  const ganados = puntosGanados(s);
  const { actual, siguiente } = nivelDe(s);
  const pct = siguiente ? ((ganados - actual.desde) / (siguiente.desde - actual.desde)) * 100 : 100;
  return (
    <div className="puntos-card">
      <div className="puntos-fila">
        <div>
          <span className="sub">Tus puntos</span>
          <div className="puntos-num">{saldo}</div>
        </div>
        <NivelChip nivel={actual} />
      </div>
      <div className="barra"><i style={{ width: `${Math.min(100, pct)}%` }} /></div>
      <p className="sub">
        {siguiente
          ? <>Te faltan <strong>{siguiente.desde - ganados}</strong> puntos para <strong>Nivel {siguiente.nivel} · {siguiente.nombre}</strong></>
          : '¡Has llegado al nivel máximo!'}
      </p>
      <p className="mini sub">Llevas {ganados} puntos ganados en total. Gastarlos no te baja de nivel.</p>
    </div>
  );
}

export default function Puntos() {
  const { s } = useApp();
  const [cat, setCat] = useState(null);
  const [usando, setUsando] = useState(null);
  const { actual } = nivelDe(s);
  const saldo = puntosSaldo(s);
  const lista = RECOMPENSAS.filter((r) => !cat || r.categoria === cat);

  return (
    <div className="pagina">
      <h1>Puntos</h1>
      <TarjetaPuntos />

      <div className="como-ganar">
        <strong>¿Cómo consigo puntos?</strong>
        <span>📍 Check-in en un local: <b>+{PUNTOS_CHECKIN}</b></span>
        <span>⭐ Si es un sitio nuevo para ti: <b>+{PUNTOS_SITIO_NUEVO}</b> extra</span>
      </div>

      <h3 className="mt">Canjea tus puntos</h3>
      <div className="chips scroll-x">
        <Chip activo={!cat} onClick={() => setCat(null)}>Todo</Chip>
        {Object.entries(CATEGORIAS).map(([k, c]) => (
          <Chip key={k} activo={cat === k} onClick={() => setCat(cat === k ? null : k)}>{c.emoji} {c.nombre}</Chip>
        ))}
      </div>
      <div className="recompensas">
        {lista.map((r) => {
          const motivo = puedeCanjear(s, r);
          const local = r.localId ? POR_ID[r.localId] : null;
          return (
            <div key={r.id} className={`recompensa ${motivo ? 'recompensa-off' : ''}`}>
              <span className="recompensa-emoji">{(CATEGORIAS[r.categoria] || CATEGORIAS.copa).emoji}</span>
              <strong>{r.titulo}</strong>
              <small>{local ? local.nombre : 'Cualquier local adherido'}</small>
              <span className="recompensa-pts">{r.puntos} pts</span>
              {motivo === 'nivel' ? (
                <span className="recompensa-lock">🔒 Desde nivel {r.nivelMinimo}</span>
              ) : motivo === 'puntos' ? (
                <span className="recompensa-lock">Te faltan {r.puntos - saldo}</span>
              ) : (
                <button className="btn btn-primario btn-pequeno" onClick={() => setUsando(r)}>Canjear</button>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="mt">Niveles</h3>
      <div className="niveles-lista">
        {NIVELES_USUARIO.map((n) => (
          <div key={n.nivel} className={`nivel-fila ${n.nivel === actual.nivel ? 'nivel-actual' : ''} ${n.nivel > actual.nivel ? 'nivel-futuro' : ''}`}>
            <NivelChip nivel={n} />
            <span className="nivel-desde">{n.desde} pts</span>
            <small>{n.ventaja}</small>
          </div>
        ))}
      </div>

      {usando && <Canje tipo="recompensa" item={usando} cerrar={() => setUsando(null)} />}
    </div>
  );
}

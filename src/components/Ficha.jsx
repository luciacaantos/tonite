import { useState } from 'react';
import { useApp } from '../ctx.js';
import { LOCALES, POR_ID, FIESTAS, distancia, formatoDistancia, euros, urlComoLlegar } from '../data.js';
import { diaDeNoche, DIAS_LARGO } from '../clock.js';
import { textoHace, VIGENCIA_MIN } from '../afluencia.js';
import { minutosParaNuevoCheckin } from '../store.js';
import { Sheet, NivelBadge, Icono, Punto } from './ui.jsx';
import CheckIn from './CheckIn.jsx';

// Plan B: de los 6 locales abiertos más cercanos, los 3 con más ambiente.
export function planB(local, estados) {
  return LOCALES.filter((l) => l.id !== local.id && !estados[l.id].cerrado && estados[l.id].nivel > 0)
    .map((l) => ({ l, d: distancia(local, l) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 6)
    .sort((a, b) => estados[b.l.id].nivel - estados[a.l.id].nivel || a.d - b.d)
    .slice(0, 3);
}

export default function Ficha({ id, cerrar }) {
  const { estados, now, abrirLocal, s } = useApp();
  const [checkin, setCheckin] = useState(false);
  const l = POR_ID[id];
  if (!l) return null;
  const e = estados[id];
  const dia = diaDeNoche(now);
  const promos = l.promos.filter((p) => p.dias.includes(dia));
  const fiestas = FIESTAS.filter((f) => f.localId === id && f.dia === dia);
  const espera = minutosParaNuevoCheckin(s, id);
  const alternativas = planB(l, estados);

  return (
    <Sheet cerrar={cerrar} alto className="ficha">
      <div className="ficha-cab">
        <div>
          <h2>{l.nombre}</h2>
          <p className="sub">{l.tipo} · {l.zona}</p>
        </div>
        <button className="btn-icono" onClick={cerrar} aria-label="Cerrar"><Icono n="cerrar" /></button>
      </div>

      <div className={`afluencia-caja n${e.nivel}`}>
        <NivelBadge estado={e} grande />
        <p className="sub">
          {e.cerrado
            ? `Horario: ${l.horario.abre} – ${l.horario.cierra}`
            : e.checkins
              ? `${e.checkins} check-ins en los últimos ${VIGENCIA_MIN} min · último ${textoHace(e.haceMin)}`
              : 'Nadie ha hecho check-in todavía. ¡Sé el primero!'}
        </p>
        {e.reales > 0 && <p className="tu-checkin"><Icono n="check" size={14} /> Tu check-in está contando</p>}
      </div>

      <div className="acciones">
        <button className="btn btn-primario" onClick={() => setCheckin(true)} disabled={espera > 0 || e.cerrado}>
          <Icono n="pin" size={20} />
          {e.cerrado ? 'Cerrado' : espera > 0 ? `Vuelve en ${espera} min` : 'Estoy aquí'}
        </button>
        <a className="btn btn-secundario" href={urlComoLlegar(l)} target="_blank" rel="noreferrer">
          <Icono n="ruta" size={20} /> Cómo llegar
        </a>
      </div>

      {(fiestas.length > 0 || promos.length > 0) && (
        <section className="bloque">
          <h3>Esta noche</h3>
          {fiestas.map((f) => (
            <div key={f.id} className="promo fiesta"><strong>🎉 {f.nombre}</strong> · {f.hora}<br /><span>{f.descripcion}</span></div>
          ))}
          {promos.map((p, i) => <div key={i} className="promo">🔥 {p.texto}</div>)}
        </section>
      )}

      <section className="bloque">
        <h3><Icono n="musica" size={16} /> Música</h3>
        <div className="chips">{l.musica.map((m) => <span key={m} className="tag">{m}</span>)}</div>
        <h3>Ambiente</h3>
        <div className="chips">{l.ambiente.map((a) => <span key={a} className="tag tag-alt">{a}</span>)}</div>
      </section>

      <section className="bloque precios">
        <div><span>Entrada</span><strong>{l.entrada ? euros(l.entrada.precio) : 'Gratis'}</strong>{l.entrada && <small>{l.entrada.texto}</small>}</div>
        <div><span>Copa</span><strong>{euros(l.copa)}</strong></div>
        <div><span>Chupito</span><strong>{euros(l.chupito)}</strong></div>
      </section>
      <p className="nota-precios">Precios orientativos.</p>

      <section className="bloque datos">
        <p><Icono n="reloj" size={16} /> {l.horario.abre} – {l.horario.cierra} · {l.horario.dias.map((d) => DIAS_LARGO[d].slice(0, 3)).join(', ')}</p>
        <p><Icono n="pin" size={16} /> {l.sinDireccion ? `${l.direccion || l.zona} (dirección por confirmar)` : l.direccion}</p>
      </section>

      {alternativas.length > 0 && (
        <section className="bloque">
          <h3>Plan B cerca</h3>
          <p className="sub">Si está lleno o no te convence, aquí al lado hay ambiente:</p>
          <div className="lista">
            {alternativas.map(({ l: a, d }) => (
              <button key={a.id} className="fila" onClick={() => abrirLocal(a.id)}>
                <Punto nivel={estados[a.id].nivel} size={14} />
                <span className="fila-txt"><strong>{a.nombre}</strong><small>{a.musica.slice(0, 2).join(' · ')}</small></span>
                <span className="fila-dcha">{formatoDistancia(d)}<small>a pie {Math.max(1, Math.round(d / 80))} min</small></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {checkin && <CheckIn local={l} cerrar={() => setCheckin(false)} />}
    </Sheet>
  );
}

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../ctx.js';
import { POR_ID, CATEGORIAS, HORAS_ENTRE_CANJES } from '../data.js';
import { canjearOferta, canjearRecompensa } from '../store.js';
import { hhmm } from '../clock.js';

// Código corto para que el camarero lo vea (no es seguridad real: es un prototipo).
const codigo = (id, ts) => {
  let h = 0;
  for (const c of `${id}-${Math.floor(ts / 60000)}`) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return h.toString(36).toUpperCase().slice(-4).padStart(4, 'X');
};

// Pantalla para enseñar en la barra. El camarero pulsa «¡Canjeada!».
// tipo: 'oferta' | 'recompensa'
export default function Canje({ tipo, item, cerrar }) {
  const { s } = useApp();
  const [reloj, setReloj] = useState(new Date());
  const [hecho, setHecho] = useState(null);
  useEffect(() => {
    const t = setInterval(() => setReloj(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const local = item.localId ? POR_ID[item.localId] : null;
  const cat = CATEGORIAS[item.categoria] || CATEGORIAS.copa;

  function canjeada() {
    const ok = tipo === 'oferta' ? canjearOferta(item) : canjearRecompensa(item);
    if (ok) setHecho(new Date());
  }

  return createPortal(
    <div className={`canje ${hecho ? 'canje-ok' : ''}`} role="dialog">
      {!hecho ? (
        <>
          <p className="canje-aviso">Enseña esta pantalla en la barra</p>
          <div className="ticket">
            <span className="ticket-emoji">{cat.emoji}</span>
            <span className="ticket-tipo">{tipo === 'oferta' ? 'Oferta TONITE' : `Recompensa · ${item.puntos} puntos`}</span>
            <h1>{item.titulo}</h1>
            {item.antes && <p className="ticket-antes">Antes {item.antes}</p>}
            <p className="ticket-local">{local ? local.nombre : 'En cualquier local adherido'}</p>
            {item.condiciones && <p className="ticket-cond">{item.condiciones}</p>}
            <div className="ticket-pie">
              <div><small>Cliente</small><strong>{s.usuario.nombre}</strong></div>
              <div><small>Código</small><strong>{codigo(item.id, reloj.getTime())}</strong></div>
              <div><small>Hora</small><strong className="ticket-reloj">{reloj.toLocaleTimeString('es-ES')}</strong></div>
            </div>
            <div className="ticket-brillo" aria-hidden="true" />
          </div>
          <p className="canje-camarero">👇 Camarero/a: pulsa al servir</p>
          <button className="btn btn-canjear" onClick={canjeada}>¡Canjeada!</button>
          <button className="link canje-cerrar" onClick={cerrar}>Cancelar</button>
        </>
      ) : (
        <div className="canje-final">
          <div className="canje-check">✓</div>
          <h1>¡Canjeada!</h1>
          <p className="canje-titulo">{item.titulo}</p>
          <p className="sub">{local ? local.nombre : 'Local adherido'} · {hhmm(hecho)}</p>
          {tipo === 'oferta' ? (
            <p className="canje-info">Podrás volver a usar esta oferta a las <strong>{hhmm(new Date(hecho.getTime() + HORAS_ENTRE_CANJES * 3600000))}</strong>.</p>
          ) : (
            <p className="canje-info">Se han descontado <strong>{item.puntos} puntos</strong>. ¡Disfrútalo!</p>
          )}
          <button className="btn btn-primario btn-grande" onClick={cerrar}>Hecho</button>
        </div>
      )}
    </div>,
    document.body,
  );
}

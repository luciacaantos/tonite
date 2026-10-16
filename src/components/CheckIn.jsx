import { useState } from 'react';
import { NIVELES, VIGENCIA_MIN } from '../afluencia.js';
import { hacerCheckin, nivelDe, getEstado, PUNTOS_FOTO } from '../store.js';
import { Sheet, Chip } from './ui.jsx';
import Presencia from './Presencia.jsx';

const AMBIENTES_RAPIDOS = ['buen rollo', 'buena música', 'para bailar', 'tranqui', 'mucho Erasmus', 'cola en la puerta'];

export default function CheckIn({ local, cerrar, subirFoto }) {
  const [paso, setPaso] = useState('inicio'); // inicio | form | hecho
  const [ambiente, setAmbiente] = useState([]);
  const [simulado, setSimulado] = useState(false);
  const [puntos, setPuntos] = useState(0);
  const [subida, setSubida] = useState(null);

  function presente(sim) { setSimulado(sim); setPaso('form'); }

  function enviar(nivel) {
    const antes = nivelDe(getEstado()).actual;
    const p = hacerCheckin({ local, nivel, ambiente, simulado });
    const despues = nivelDe(getEstado()).actual;
    setPuntos(p ?? 0);
    if (despues.nivel > antes.nivel) setSubida(despues);
    setPaso('hecho');
  }

  return (
    <Sheet cerrar={cerrar} className="checkin">
      {paso === 'inicio' && <Presencia local={local} titulo={`Check-in en ${local.nombre}`} alConfirmar={presente} />}
      {paso === 'form' && (
        <>
          <h2>¿Cómo está {local.nombre}?</h2>
          {simulado && <p className="aviso-demo">Modo demo: ubicación simulada</p>}
          <h4>Ambiente (opcional)</h4>
          <div className="chips">
            {AMBIENTES_RAPIDOS.map((a) => (
              <Chip key={a} activo={ambiente.includes(a)} onClick={() => setAmbiente(ambiente.includes(a) ? ambiente.filter((x) => x !== a) : [...ambiente, a])}>{a}</Chip>
            ))}
          </div>
          <h4>¿Cuánta gente hay?</h4>
          <div className="niveles">
            {NIVELES.slice(1).map((n) => (
              <button key={n.id} className="nivel-btn" style={{ '--c': n.color }} onClick={() => enviar(n.id)}>
                <span className="nivel-barras">{[1, 2, 3, 4].map((i) => <i key={i} className={i <= n.id ? 'on' : ''} />)}</span>
                {n.nombre}
              </button>
            ))}
          </div>
        </>
      )}
      {paso === 'hecho' && (
        <div className="hecho">
          <div className="hecho-puntos">+{puntos}<small>puntos</small></div>
          <h2>¡Gracias por el check-in!</h2>
          <p className="sub">Tu aviso ayuda a los demás a decidir. Cuenta para la afluencia durante {VIGENCIA_MIN} minutos.</p>
          {puntos > 10 && <p className="tu-checkin">⭐ Bonus por descubrir un sitio nuevo</p>}
          {subida && (
            <div className="subida-nivel">🏆 ¡Subes a <strong>Nivel {subida.nivel} · {subida.nombre}</strong>!<br /><small>{subida.ventaja}</small></div>
          )}
          {subirFoto && (
            <button className="btn btn-secundario" onClick={subirFoto}>📷 Sube una foto de cómo está (+{PUNTOS_FOTO})</button>
          )}
          <button className="btn btn-primario" onClick={cerrar}>Genial</button>
        </div>
      )}
    </Sheet>
  );
}

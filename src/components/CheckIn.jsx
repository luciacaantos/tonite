import { useState } from 'react';
import { useApp } from '../ctx.js';
import { distancia, formatoDistancia } from '../data.js';
import { NIVELES, VIGENCIA_MIN } from '../afluencia.js';
import { hacerCheckin, nivelDe, getEstado } from '../store.js';
import { Sheet, Chip, Icono } from './ui.jsx';

const RADIO_M = 50;
const AMBIENTES_RAPIDOS = ['buen rollo', 'buena música', 'para bailar', 'tranqui', 'mucho Erasmus', 'cola en la puerta'];

export default function CheckIn({ local, cerrar }) {
  const { s } = useApp();
  const [paso, setPaso] = useState('inicio'); // inicio | buscando | lejos | error | form | hecho
  const [info, setInfo] = useState('');
  const [ambiente, setAmbiente] = useState([]);
  const [simulado, setSimulado] = useState(false);
  const [puntos, setPuntos] = useState(0);
  const [subida, setSubida] = useState(null);

  // La ubicación se pide SOLO aquí, una vez, al pulsar el botón. No se guarda.
  function comprobarUbicacion() {
    if (!navigator.geolocation) { setPaso('error'); setInfo('Tu navegador no permite usar la ubicación.'); return; }
    setPaso('buscando');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = distancia({ lat: pos.coords.latitude, lon: pos.coords.longitude }, local);
        if (d <= RADIO_M) setPaso('form');
        else { setPaso('lejos'); setInfo(`Estás a ${formatoDistancia(d)} de ${local.nombre}. Tienes que estar a menos de ${RADIO_M} m.`); }
      },
      (err) => {
        setPaso('error');
        setInfo(err.code === 1 ? 'No has dado permiso para usar la ubicación. Puedes activarlo en los ajustes del navegador.' : 'No hemos podido obtener tu ubicación. Inténtalo de nuevo.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  function simular() { setSimulado(true); setPaso('form'); }

  function enviar(nivel) {
    const antes = nivelDe(getEstado()).actual;
    const p = hacerCheckin({ local, nivel, ambiente, simulado });
    const despues = nivelDe(getEstado()).actual;
    setPuntos(p ?? 0);
    if (despues.nivel > antes.nivel) setSubida(despues);
    setPaso('hecho');
  }

  const botonSimular = s.demo.activo && (
    <button className="btn btn-demo" onClick={simular}>🎬 Simular que estoy aquí</button>
  );

  return (
    <Sheet cerrar={cerrar} className="checkin">
      {paso === 'inicio' && (
        <>
          <h2>Check-in en {local.nombre}</h2>
          <p className="sub">Comprobamos que estás a menos de {RADIO_M} m. Solo usamos tu ubicación en este momento, no te seguimos.</p>
          <div className="pila">
            <button className="btn btn-primario" onClick={comprobarUbicacion}><Icono n="pin" size={20} /> Comprobar mi ubicación</button>
            {botonSimular}
          </div>
        </>
      )}
      {paso === 'buscando' && <div className="cargando"><span className="spinner" /> Buscando tu ubicación…</div>}
      {(paso === 'lejos' || paso === 'error') && (
        <>
          <h2>{paso === 'lejos' ? 'Estás un poco lejos' : 'Ups'}</h2>
          <p className="sub">{info}</p>
          <div className="pila">
            <button className="btn btn-secundario" onClick={comprobarUbicacion}>Reintentar</button>
            {botonSimular}
          </div>
        </>
      )}
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
          <button className="btn btn-primario" onClick={cerrar}>Genial</button>
        </div>
      )}
    </Sheet>
  );
}

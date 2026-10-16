import { useState } from 'react';
import { useApp } from '../ctx.js';
import { FIESTAS, POR_ID } from '../data.js';
import { diaDeNoche, DIAS_LARGO } from '../clock.js';
import { Chip, NivelBadge } from './ui.jsx';

const ordenHora = (h) => { const [a, b] = h.split(':').map(Number); return (a < 12 ? a + 24 : a) * 60 + b; };
const COLOR_TIPO = { universitaria: '#7A5CFF', Erasmus: '#22D3EE', 'temática': '#FF2E9A', discoteca: '#FF9F1C' };

export default function Agenda() {
  const { now, estados, abrirLocal } = useApp();
  const [elegido, setElegido] = useState(0);
  const [tipo, setTipo] = useState(null);

  const noches = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(now.getTime() - 7 * 3600000 + i * 86400000);
    const dia = diaDeNoche(new Date(fecha.getTime() + 7 * 3600000));
    const etiqueta = i === 0 ? 'Esta noche' : i === 1 ? 'Mañana' : `${DIAS_LARGO[dia].slice(0, 3)} ${fecha.getDate()}`;
    return { i, dia, etiqueta, fecha };
  });
  const lista = (elegido === 'todas' ? noches : [noches[elegido]])
    .map((n) => ({ ...n, fiestas: FIESTAS.filter((f) => f.adherido && f.dia === n.dia && (!tipo || f.tipo === tipo)).sort((a, b) => ordenHora(a.hora) - ordenHora(b.hora)) }))
    .filter((n) => n.fiestas.length || elegido !== 'todas');

  return (
    <div className="pagina">
      <h1>Agenda de fiestas</h1>
      <p className="sub">Eventos de los locales adheridos a TONITE en los próximos 7 días.</p>
      <div className="chips scroll-x">
        {noches.map((n) => <Chip key={n.i} activo={elegido === n.i} onClick={() => setElegido(n.i)}>{n.etiqueta}</Chip>)}
        <Chip activo={elegido === 'todas'} onClick={() => setElegido('todas')}>Toda la semana</Chip>
      </div>
      <div className="chips scroll-x">
        {Object.keys(COLOR_TIPO).map((t) => (
          <Chip key={t} activo={tipo === t} color={COLOR_TIPO[t]} onClick={() => setTipo(tipo === t ? null : t)}>{t}</Chip>
        ))}
      </div>

      {lista.map((n) => (
        <section key={n.i} className="agenda-dia">
          <h3>{n.i === 0 ? 'Esta noche' : n.i === 1 ? `Mañana, ${DIAS_LARGO[n.dia]}` : `${DIAS_LARGO[n.dia][0].toUpperCase()}${DIAS_LARGO[n.dia].slice(1)} ${n.fecha.getDate()}`}</h3>
          {n.fiestas.length === 0 && <p className="sub vacio">No hay fiestas especiales esta noche. ¡Mira el mapa para ver qué está animado!</p>}
          {n.fiestas.map((f) => {
            const l = POR_ID[f.localId];
            return (
              <button key={f.id} className="evento" onClick={() => abrirLocal(f.localId)} style={{ '--c': COLOR_TIPO[f.tipo] || '#FF2E9A' }}>
                <div className="evento-hora">{f.hora}</div>
                <div className="evento-txt">
                  <span className="evento-tipo">{f.tipo}</span>
                  <strong>{f.nombre}</strong>
                  <span className="sub">{l.nombre} · {l.zona}</span>
                  <span className="evento-desc">{f.descripcion}</span>
                  {n.i === 0 && <NivelBadge estado={estados[f.localId]} />}
                </div>
              </button>
            );
          })}
        </section>
      ))}
      {elegido === 'todas' && lista.length === 0 && <p className="sub vacio">No hay fiestas de este tipo esta semana.</p>}
    </div>
  );
}

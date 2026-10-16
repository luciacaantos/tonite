import { useState } from 'react';
import { useApp } from '../ctx.js';
import { POR_ID } from '../data.js';
import { puntosTotales, setDemo, cerrarSesion, borrarTodo } from '../store.js';
import { Chip, Sheet } from './ui.jsx';
import { TextoPrivacidad } from './Login.jsx';

const META = 100;
const HORAS_DEMO = [
  { t: '22:00', off: -180 }, { t: '23:00', off: -120 }, { t: '00:00', off: -60 },
  { t: '01:00', off: 0 }, { t: '02:00', off: 60 }, { t: '03:00', off: 120 },
];

export default function Perfil() {
  const { s } = useApp();
  const [verPrivacidad, setVerPrivacidad] = useState(false);
  const puntos = puntosTotales(s);
  const sitios = new Set(s.checkins.map((c) => c.localId)).size;
  const nivelUsuario = puntos >= 200 ? 'Reina/Rey de la noche' : puntos >= 100 ? 'Explorador/a' : puntos >= 25 ? 'Noctámbulo/a' : 'Recién llegado/a';

  return (
    <div className="pagina">
      <div className="perfil-cab">
        <div className="avatar">{s.usuario.nombre.slice(0, 1).toUpperCase()}</div>
        <div>
          <h1>{s.usuario.nombre}</h1>
          <p className="sub">{nivelUsuario}</p>
        </div>
      </div>

      <div className="puntos-card">
        <span className="sub">Tus puntos</span>
        <div className="puntos-num">{puntos}</div>
        <div className="barra"><i style={{ width: `${Math.min(100, ((puntos % META) / META) * 100)}%` }} /></div>
        <p className="sub">{META - (puntos % META)} puntos para tu próxima recompensa</p>
        <p className="canje">🍹 Pronto podrás canjearlos por chupitos y copas en locales adheridos.</p>
      </div>

      <div className="stats">
        <div><strong>{s.checkins.length}</strong><span>check-ins</span></div>
        <div><strong>{sitios}</strong><span>sitios distintos</span></div>
        <div><strong>{Object.keys(s.planes).length}</strong><span>planes</span></div>
      </div>

      <p className="sub">Cada check-in te da 10 puntos, y si es un sitio nuevo para ti, 15 más.</p>

      {s.movimientos.length > 0 && (
        <section className="bloque">
          <h3>Historial</h3>
          <div className="lista">
            {s.movimientos.slice(0, 8).map((m, i) => (
              <div key={i} className="fila fila-plana">
                <span className="fila-txt"><strong>{m.motivo}</strong><small>{new Date(m.ts).toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</small></span>
                <span className="fila-dcha puntos-mas">+{m.puntos}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bloque demo-panel">
        <div className="fila-plana espacio">
          <div>
            <h3>🎬 Modo demo</h3>
            <p className="sub">Fija la hora en la noche del jueves y permite simular el check-in y los votos.</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={s.demo.activo} onChange={(e) => setDemo({ activo: e.target.checked })} />
            <span />
          </label>
        </div>
        {s.demo.activo && (
          <>
            <h4>Hora simulada (jueves noche)</h4>
            <div className="chips">
              {HORAS_DEMO.map((h) => (
                <Chip key={h.t} activo={(s.demo.horaOffsetMin || 0) === h.off} onClick={() => setDemo({ horaOffsetMin: h.off })}>{h.t}</Chip>
              ))}
            </div>
          </>
        )}
      </section>

      {s.checkins.length > 0 && (
        <p className="sub mini">Último check-in: {POR_ID[s.checkins[s.checkins.length - 1].localId]?.nombre}</p>
      )}

      <div className="pila">
        <button className="btn btn-secundario" onClick={() => setVerPrivacidad(true)}>Privacidad y ubicación</button>
        <button className="btn btn-secundario" onClick={cerrarSesion}>Cerrar sesión</button>
        <button className="link peligro" onClick={() => confirm('¿Borrar tu cuenta y todos los datos de este móvil?') && borrarTodo()}>Borrar mis datos de este móvil</button>
      </div>
      <p className="lema">Menos dudas, más planes y la noche que tú eliges.</p>

      {verPrivacidad && (
        <Sheet cerrar={() => setVerPrivacidad(false)} alto><TextoPrivacidad /></Sheet>
      )}
    </div>
  );
}

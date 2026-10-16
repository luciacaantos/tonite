import { useState } from 'react';
import { useApp } from '../ctx.js';
import { setDemo, cerrarSesion, borrarTodo, sumarPuntosDemo, nivelDe } from '../store.js';
import { Chip, Sheet } from './ui.jsx';
import { TextoPrivacidad } from './Login.jsx';
import { TarjetaPuntos, NivelChip } from './Puntos.jsx';

const HORAS_DEMO = [
  { t: '22:00', off: -180 }, { t: '23:00', off: -120 }, { t: '00:00', off: -60 },
  { t: '01:00', off: 0 }, { t: '02:00', off: 60 }, { t: '03:00', off: 120 },
];

export default function Perfil() {
  const { s, ir } = useApp();
  const [verPrivacidad, setVerPrivacidad] = useState(false);
  const sitios = new Set(s.checkins.map((c) => c.localId)).size;
  const { actual } = nivelDe(s);

  return (
    <div className="pagina">
      <div className="perfil-cab">
        <div className="avatar">{s.usuario.nombre.slice(0, 1).toUpperCase()}</div>
        <div>
          <h1>{s.usuario.nombre}</h1>
          <NivelChip nivel={actual} />
        </div>
      </div>

      <TarjetaPuntos />
      <button className="btn btn-secundario btn-grande mt-s" onClick={() => ir('puntos')}>Canjear mis puntos</button>

      <div className="stats">
        <div><strong>{s.checkins.length}</strong><span>check-ins</span></div>
        <div><strong>{sitios}</strong><span>sitios distintos</span></div>
        <div><strong>{s.canjes.length}</strong><span>canjes</span></div>
      </div>

      {s.movimientos.length > 0 && (
        <section className="bloque">
          <h3>Historial de puntos</h3>
          <div className="lista">
            {s.movimientos.slice(0, 10).map((m, i) => (
              <div key={i} className="fila fila-plana">
                <span className="fila-txt"><strong>{m.motivo}</strong><small>{new Date(m.ts).toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</small></span>
                <span className={`fila-dcha ${m.puntos > 0 ? 'puntos-mas' : 'puntos-menos'}`}>{m.puntos > 0 ? '+' : ''}{m.puntos}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bloque demo-panel">
        <div className="fila-plana espacio">
          <div>
            <h3>🎬 Modo demo</h3>
            <p className="sub">Fija la hora en la noche del jueves y permite simular el check-in.</p>
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
            <h4>Puntos para enseñar canjes y niveles</h4>
            <div className="chips">
              <Chip onClick={() => sumarPuntosDemo(100)}>+100 puntos</Chip>
              <Chip onClick={() => sumarPuntosDemo(500)}>+500 puntos</Chip>
            </div>
          </>
        )}
      </section>

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

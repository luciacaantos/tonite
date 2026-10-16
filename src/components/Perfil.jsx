import { useState } from 'react';
import { useApp } from '../ctx.js';
import { setDemo, cerrarSesion, borrarTodo, sumarPuntosDemo, nivelDe, actualizarUsuario } from '../store.js';
import { PREGUNTAS } from '../gustos.js';
import { Chip, Sheet } from './ui.jsx';
import { TextoPrivacidad } from './Login.jsx';
import { NivelChip } from './Puntos.jsx';
import Cuestionario from './Cuestionario.jsx';

const HORAS_DEMO = [
  { t: '22:00', off: -180 }, { t: '23:00', off: -120 }, { t: '00:00', off: -60 },
  { t: '01:00', off: 0 }, { t: '02:00', off: 60 }, { t: '03:00', off: 120 },
];
const TITULO_CORTO = { gente: 'Gente', musica: 'Música', plan: 'Plan', publico: 'Público', estilo: 'Estilo', bebida: 'Bebida', presupuesto: 'Presupuesto' };

function DatosPersonales({ usuario }) {
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState({ nombre: usuario.nombre, email: usuario.email });
  const [error, setError] = useState('');
  function guardar(e) {
    e.preventDefault();
    if (!f.nombre.trim()) return setError('El nombre no puede estar vacío.');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('Ese email no parece válido.');
    actualizarUsuario(f);
    setEditando(false);
    setError('');
  }
  return (
    <section className="bloque tarjeta">
      <div className="tarjeta-cab">
        <h3>Datos personales</h3>
        {!editando && <button className="link" onClick={() => setEditando(true)}>Editar</button>}
      </div>
      {editando ? (
        <form onSubmit={guardar}>
          <label className="campo">Nombre<input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
          <label className="campo">Email<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          {error && <p className="error">{error}</p>}
          <div className="acciones">
            <button type="button" className="btn btn-secundario" onClick={() => { setEditando(false); setF({ nombre: usuario.nombre, email: usuario.email }); }}>Cancelar</button>
            <button type="submit" className="btn btn-primario">Guardar</button>
          </div>
        </form>
      ) : (
        <dl className="datos-lista">
          <dt>Nombre</dt><dd>{usuario.nombre}</dd>
          <dt>Email</dt><dd>{usuario.email}</dd>
          <dt>En TONITE desde</dt><dd>{new Date(usuario.desde || Date.now()).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
        </dl>
      )}
    </section>
  );
}

function MisGustos({ gustos, editar }) {
  const respuestas = PREGUNTAS.map((p) => {
    const v = gustos?.[p.clave];
    const elegidas = p.opciones.filter((o) => (Array.isArray(v) ? v.includes(o.v) : v === o.v));
    return { p, elegidas };
  }).filter((r) => r.elegidas.length);

  return (
    <section className="bloque tarjeta">
      <div className="tarjeta-cab">
        <h3>Mis gustos</h3>
        {respuestas.length > 0 && <button className="link" onClick={editar}>Editar</button>}
      </div>
      {respuestas.length ? (
        <div className="gustos-lista">
          {respuestas.map(({ p, elegidas }) => (
            <div key={p.clave}>
              <small>{TITULO_CORTO[p.clave]}</small>
              <span>{elegidas.map((o) => `${o.emoji} ${o.texto}`).join(' · ')}</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="sub">Cuéntanos qué te gusta y te diremos qué sitios encajan contigo («% para ti»).</p>
          <button className="btn btn-primario btn-grande mt-s" onClick={editar}>Hacer el cuestionario (30 s)</button>
        </>
      )}
    </section>
  );
}

export default function Perfil() {
  const { s } = useApp();
  const [verPrivacidad, setVerPrivacidad] = useState(false);
  const [editandoGustos, setEditandoGustos] = useState(false);
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

      <DatosPersonales key={s.usuario.email + s.usuario.nombre} usuario={s.usuario} />
      <MisGustos gustos={s.gustos} editar={() => setEditandoGustos(true)} />

      <section className="bloque tarjeta">
        <h3>Privacidad</h3>
        <p className="sub">Tu ubicación solo se usa al hacer check-in. Tus datos se guardan en este móvil.</p>
        <button className="btn btn-secundario btn-grande mt-s" onClick={() => setVerPrivacidad(true)}>Privacidad y ubicación</button>
      </section>

      <section className="bloque demo-panel">
        <div className="fila-plana espacio">
          <div>
            <h3>🎬 Modo demo</h3>
            <p className="sub">Para la presentación: fija la hora en la noche del jueves y permite simular el check-in.</p>
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
        <button className="btn btn-secundario btn-grande" onClick={cerrarSesion}>Cerrar sesión</button>
        <button className="link peligro" onClick={() => confirm('¿Borrar tu cuenta y todos los datos de este móvil?') && borrarTodo()}>Borrar mi cuenta y mis datos</button>
      </div>
      <p className="lema">Menos dudas, más planes y la noche que tú eliges.</p>

      {verPrivacidad && <Sheet cerrar={() => setVerPrivacidad(false)} alto><TextoPrivacidad /></Sheet>}
      {editandoGustos && <Cuestionario nombre={s.usuario.nombre} inicial={s.gustos} cerrar={() => setEditandoGustos(false)} />}
    </div>
  );
}

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PREGUNTAS } from '../gustos.js';
import { guardarGustos, saltarCuestionario } from '../store.js';
import { Logo } from './ui.jsx';

// Cuestionario opcional de gustos (al crear la cuenta o desde Perfil).
export default function Cuestionario({ nombre, inicial, cerrar }) {
  const editando = !!cerrar;
  const [paso, setPaso] = useState(editando ? 0 : -1); // -1 = bienvenida
  const [g, setG] = useState(inicial || {});
  const p = PREGUNTAS[paso];
  const avanzando = useRef(false);

  function terminar(final) {
    guardarGustos(final);
    cerrar?.();
  }
  function saltar() {
    if (editando) cerrar();
    else if (Object.keys(g).length) guardarGustos(g); // guarda lo contestado hasta ahora
    else saltarCuestionario();
  }
  function siguiente(nuevo = g) {
    if (paso < PREGUNTAS.length - 1) setPaso(paso + 1);
    else terminar(nuevo);
  }
  function elegir(v) {
    if (p.multi) {
      const lista = g[p.clave] || [];
      setG({ ...g, [p.clave]: lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v] });
    } else {
      const nuevo = { ...g, [p.clave]: v };
      setG(nuevo);
      if (avanzando.current) return;
      avanzando.current = true;
      setTimeout(() => { avanzando.current = false; siguiente(nuevo); }, 180); // una sola opción: avanza solo
    }
  }

  return createPortal(
    <div className="cuestionario" role="dialog">
      {paso === -1 ? (
        <div className="cuest-intro">
          <Logo grande />
          <h1>¡Hola, {nombre}!</h1>
          <p>¿Te hacemos <strong>7 preguntas rápidas</strong> sobre tus gustos? Así TONITE te dirá qué sitios encajan contigo y por qué.</p>
          <p className="sub">Menos de 30 segundos. Puedes cambiarlas cuando quieras en tu perfil.</p>
          <div className="pila">
            <button className="btn btn-primario btn-grande" onClick={() => setPaso(0)}>Vamos</button>
            <button className="btn btn-secundario" onClick={saltar}>Ahora no</button>
          </div>
        </div>
      ) : (
        <>
          <div className="cuest-cab">
            <button className="link" onClick={() => (paso === 0 ? saltar() : setPaso(paso - 1))}>{paso === 0 ? (editando ? 'Cancelar' : 'Saltar') : '← Atrás'}</button>
            <span className="sub">{paso + 1} de {PREGUNTAS.length}</span>
            {editando ? <span /> : <button className="link" onClick={saltar}>Saltar todo</button>}
          </div>
          <div className="barra"><i style={{ width: `${((paso + 1) / PREGUNTAS.length) * 100}%` }} /></div>
          <h1 className="cuest-titulo">{p.titulo}</h1>
          {p.multi && <p className="sub">Puedes marcar varias.</p>}
          <div className={`cuest-opciones ${p.opciones.length > 4 ? 'dos-col' : ''}`}>
            {p.opciones.map((o) => {
              const on = p.multi ? (g[p.clave] || []).includes(o.v) : g[p.clave] === o.v;
              return (
                <button key={o.v} className={`cuest-op ${on ? 'on' : ''}`} onClick={() => elegir(o.v)}>
                  <span className="cuest-emoji">{o.emoji}</span>
                  <span>{o.texto}</span>
                </button>
              );
            })}
          </div>
          {p.multi && (
            <div className="cuest-pie">
              <button className="btn btn-primario btn-grande" onClick={() => siguiente()}>
                {(g[p.clave] || []).length ? (paso === PREGUNTAS.length - 1 ? 'Terminar' : 'Siguiente') : 'Me da igual, siguiente'}
              </button>
            </div>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}

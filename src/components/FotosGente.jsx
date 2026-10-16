import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../ctx.js';
import { hhmm } from '../clock.js';
import { minutosParaNuevaFoto, checkinReciente, registrarFoto, nivelDe, getEstado, PUNTOS_FOTO } from '../store.js';
import { useFotosGente, guardarFotoGente, borrarFotoGente, reducirFoto, haceCuanto, EN_DIRECTO_MIN } from '../fotosGente.js';
import { Sheet, Icono } from './ui.jsx';
import Presencia from './Presencia.jsx';

const enDirecto = (ts) => Date.now() - ts < EN_DIRECTO_MIN * 60000;

// Subir una foto de cómo está el local ahora mismo (hay que estar allí).
export function SubirFoto({ local, cerrar, yaVerificado }) {
  const { s } = useApp();
  const [paso, setPaso] = useState(yaVerificado || checkinReciente(s, local.id) ? 'camara' : 'verificar');
  const [foto, setFoto] = useState(null);
  const [error, setError] = useState('');
  const [puntos, setPuntos] = useState(0);
  const [subida, setSubida] = useState(null);
  const input = useRef(null);

  async function elegida(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setError('');
    try {
      setFoto(await reducirFoto(archivo));
      setPaso('revisar');
    } catch {
      setError('No hemos podido leer la foto. Prueba otra vez.');
    }
  }

  async function publicar() {
    setPaso('subiendo');
    try {
      await guardarFotoGente({ localId: local.id, autor: s.usuario.nombre, dataUrl: foto });
      const antes = nivelDe(getEstado()).actual;
      setPuntos(registrarFoto(local));
      const despues = nivelDe(getEstado()).actual;
      if (despues.nivel > antes.nivel) setSubida(despues);
      setPaso('hecho');
    } catch {
      setError('No se ha podido guardar la foto (¿memoria del móvil llena?).');
      setPaso('revisar');
    }
  }

  return (
    <Sheet cerrar={cerrar} className="subir-foto">
      {paso === 'verificar' && <Presencia local={local} titulo={`Foto de ${local.nombre}`} alConfirmar={() => setPaso('camara')} />}
      {paso === 'camara' && (
        <>
          <h2>¿Cómo está {local.nombre} ahora?</h2>
          <p className="sub">Haz una foto del ambiente para que los demás lo vean. Ganas <strong>{PUNTOS_FOTO} puntos</strong>.</p>
          <p className="aviso-fotos">No subas fotos en las que se reconozca a gente sin su permiso.</p>
          {error && <p className="error">{error}</p>}
          <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={elegida} />
          <div className="pila">
            <button className="btn btn-primario btn-grande" onClick={() => input.current.click()}>📷 Abrir la cámara</button>
          </div>
        </>
      )}
      {(paso === 'revisar' || paso === 'subiendo') && (
        <>
          <h2>¿La publicamos?</h2>
          <img className="foto-previa" src={foto} alt="Tu foto" />
          {error && <p className="error">{error}</p>}
          <div className="acciones">
            <button className="btn btn-secundario" disabled={paso === 'subiendo'} onClick={() => input.current.click()}>Repetir</button>
            <button className="btn btn-primario" disabled={paso === 'subiendo'} onClick={publicar}>Publicar (+{PUNTOS_FOTO})</button>
          </div>
          <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={elegida} />
        </>
      )}
      {paso === 'hecho' && (
        <div className="hecho">
          <div className="hecho-puntos">+{puntos}<small>puntos</small></div>
          <h2>¡Foto publicada!</h2>
          <p className="sub">Ya está en la galería de {local.nombre}, con la hora a la que la has subido.</p>
          {subida && (
            <div className="subida-nivel">🏆 ¡Subes a <strong>Nivel {subida.nivel} · {subida.nombre}</strong>!<br /><small>{subida.ventaja}</small></div>
          )}
          <button className="btn btn-primario" onClick={cerrar}>Genial</button>
        </div>
      )}
    </Sheet>
  );
}

// Galería de fotos de la gente en la ficha del local.
export default function GaleriaGente({ local, cerrado, abrirSubida }) {
  const { s } = useApp();
  const fotos = useFotosGente(local.id);
  const [vista, setVista] = useState(null);
  const espera = minutosParaNuevaFoto(s, local.id);

  return (
    <section className="bloque galeria-gente">
      <div className="tarjeta-cab">
        <h3>Fotos de la gente {fotos.length > 0 && <span className="sub">({fotos.length})</span>}</h3>
      </div>
      {fotos.length > 0 ? (
        <div className="galeria-fila">
          {fotos.map((f) => (
            <button key={f.id} className="galeria-mini" onClick={() => setVista(f)}>
              <img src={f.dataUrl} alt={`Foto de ${f.autor}`} loading="lazy" />
              {enDirecto(f.ts) && <span className="en-directo">EN DIRECTO</span>}
              <span className="galeria-hora">{haceCuanto(f.ts)}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="sub">Todavía no hay fotos de hoy. ¡Sé el primero en enseñar cómo está!</p>
      )}
      <button className="btn btn-secundario btn-grande mt-s" disabled={cerrado || espera > 0} onClick={abrirSubida}>
        {cerrado ? 'Cerrado ahora' : espera > 0 ? `Podrás subir otra en ${espera} min` : `📷 Subir foto de ahora (+${PUNTOS_FOTO})`}
      </button>

      {vista && createPortal(
        <div className="visor" role="dialog" onClick={() => setVista(null)}>
          <div className="visor-cab" onClick={(e) => e.stopPropagation()}>
            <div>
              <strong>{local.nombre}</strong>
              <small>{vista.autor} · {haceCuanto(vista.ts)} ({hhmm(new Date(vista.ts))})</small>
            </div>
            <button className="btn-icono" onClick={() => setVista(null)} aria-label="Cerrar"><Icono n="cerrar" /></button>
          </div>
          <img src={vista.dataUrl} alt={`Foto de ${vista.autor}`} onClick={(e) => e.stopPropagation()} />
          {vista.autor === s.usuario.nombre && (
            <button className="link peligro visor-borrar" onClick={(e) => { e.stopPropagation(); borrarFotoGente(vista.id); setVista(null); }}>
              Borrar mi foto
            </button>
          )}
        </div>,
        document.body,
      )}
    </section>
  );
}

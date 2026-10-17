import { useState } from 'react';
import { useApp } from '../ctx.js';
import { LOCALES, POR_ID, FIESTAS, OFERTAS, ESTILOS, distancia, formatoDistancia, euros, urlComoLlegar } from '../data.js';
import { afinidad, encajeAhora, TEXTO_GENTE, TEXTO_GENTE_PREFIERE } from '../gustos.js';
import { diaDeNoche, DIAS_LARGO } from '../clock.js';
import { textoHace, VIGENCIA_MIN, NIVELES } from '../afluencia.js';
import { minutosParaNuevoCheckin } from '../store.js';
import { Sheet, NivelBadge, Icono, Punto, Estrella } from './ui.jsx';
import CheckIn from './CheckIn.jsx';
import GaleriaGente, { SubirFoto } from './FotosGente.jsx';
import Canje from './Canje.jsx';
import { TarjetaOferta } from './Ofertas.jsx';

// Plan B: de los 6 locales abiertos más cercanos, los 3 con más ambiente.
export function planB(local, estados) {
  return LOCALES.filter((l) => l.id !== local.id && !estados[l.id].cerrado && estados[l.id].nivel > 0)
    .map((l) => ({ l, d: distancia(local, l) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 6)
    .sort((a, b) => estados[b.l.id].nivel - estados[a.l.id].nivel || a.d - b.d)
    .slice(0, 3);
}

const VOLUMEN = { 'se puede hablar': '🗣️ Se puede hablar', alto: '🔊 Alta', 'muy alto': '🔊🔊 Muy alta' };
const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const ICONO_ESTILO = { casual: '👟', arreglado: '✨', pijo: '💎' };

export function Precio({ n }) {
  return <span className="precio-eur">{[1, 2, 3].map((i) => <b key={i} className={i <= n ? 'on' : ''}>€</b>)}</span>;
}

const EMOJI_TIPO = (tipo) => (tipo.includes('discoteca') ? '🪩' : tipo.includes('chupito') ? '🥃' : tipo === 'bar' ? '🍻' : '🍸');

// Fotos del local (se pasan con el dedo). Si no tiene, una portada de diseño.
function Portada({ local }) {
  const [actual, setActual] = useState(0);
  if (!local.fotos.length) {
    return (
      <div className="portada portada-vacia">
        <Estrella className="portada-estrella" color="var(--acento)" />
        <span className="portada-emoji">{EMOJI_TIPO(local.tipo)}</span>
        <span className="portada-zona">{local.zona}</span>
      </div>
    );
  }
  return (
    <div className="portada">
      <div className="portada-fila" onScroll={(e) => setActual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {local.fotos.map((url, i) => (
          // Las fotos verticales se ven enteras sobre un fondo desenfocado de la misma foto.
          <div key={url} className="portada-foto" style={{ '--img': `url("${url}")` }}>
            <img
              src={url}
              alt={`${local.nombre} (${i + 1})`}
              loading={i ? 'lazy' : 'eager'}
              onLoad={(e) => e.currentTarget.naturalHeight > e.currentTarget.naturalWidth * 0.8 && e.currentTarget.parentElement.classList.add('vertical')}
            />
          </div>
        ))}
      </div>
      {local.fotos.length > 1 && (
        <div className="portada-puntos">{local.fotos.map((u, i) => <i key={u} className={i === actual ? 'on' : ''} />)}</div>
      )}
    </div>
  );
}

function TarjetaParaTi({ local, estado, gustos }) {
  const a = afinidad(local, gustos);
  if (!a) return null;
  const ahora = encajeAhora(estado, gustos);
  return (
    <div className="para-ti">
      <div className="para-ti-cab">
        <span className="para-ti-pct" style={{ '--p': a.pct }}>{a.pct}%</span>
        <div>
          <strong>{a.pct >= 75 ? 'Encaja mucho contigo' : a.pct >= 50 ? 'Encaja bastante contigo' : 'No es muy tu estilo'}</strong>
          {ahora === 1 && <small>Ahora está {TEXTO_GENTE[gustos.gente]}, como te gusta</small>}
          {ahora === 0 && <small>Ahora: {NIVELES[estado.nivel].nombre.toLowerCase()}. A ti te gustan {TEXTO_GENTE_PREFIERE[gustos.gente]}.</small>}
        </div>
      </div>
      {a.razones.length > 0 && <div className="chips">{a.razones.slice(0, 4).map((r) => <span key={r} className="tag tag-ok">{r}</span>)}</div>}
    </div>
  );
}

export default function Ficha({ id, cerrar }) {
  const { estados, now, abrirLocal, s } = useApp();
  const [checkin, setCheckin] = useState(false);
  const [usando, setUsando] = useState(null);
  const [subiendo, setSubiendo] = useState(null); // { yaVerificado }
  const l = POR_ID[id];
  if (!l) return null;
  const e = estados[id];
  const dia = diaDeNoche(now);
  // Ofertas y fiestas solo de locales adheridos (pagan la mensualidad).
  const ofertas = OFERTAS.filter((o) => o.localId === id);
  const fiestas = FIESTAS.filter((f) => f.adherido && f.localId === id && f.dia === dia);
  const espera = minutosParaNuevoCheckin(s, id);
  const alternativas = planB(l, estados);

  return (
    <Sheet cerrar={cerrar} alto className="ficha">
      <Portada key={l.id} local={l} />
      <div className="ficha-cab">
        <div>
          <h2>{l.nombre}</h2>
          <p className="sub">{mayus(l.tipo)} · {l.zona} · <Precio n={l.precio} /> · {ICONO_ESTILO[l.estilo]} {mayus(l.estilo)}</p>
          {l.adherido && <span className="adherido"><i className="rombo-oro" /> Local adherido · ofertas TONITE</span>}
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

      <TarjetaParaTi local={l} estado={e} gustos={s.gustos} />

      <div className="acciones">
        <button className="btn btn-primario" onClick={() => setCheckin(true)} disabled={espera > 0 || e.cerrado}>
          <Icono n="pin" size={20} />
          {e.cerrado ? 'Cerrado' : espera > 0 ? `Vuelve en ${espera} min` : 'Estoy aquí'}
        </button>
        <a className="btn btn-secundario" href={urlComoLlegar(l)} target="_blank" rel="noreferrer">
          <Icono n="ruta" size={20} /> Cómo llegar
        </a>
      </div>

      <GaleriaGente local={l} cerrado={e.cerrado} abrirSubida={() => setSubiendo({ yaVerificado: false })} />

      {fiestas.length > 0 && (
        <section className="bloque">
          <h3>Esta noche</h3>
          {fiestas.map((f) => (
            <div key={f.id} className="promo fiesta"><strong>🎉 {f.nombre}</strong> · {f.hora}<br /><span>{f.descripcion}</span></div>
          ))}
        </section>
      )}

      {ofertas.length > 0 && (
        <section className="bloque">
          <h3>Ofertas</h3>
          <div className="lista-ofertas">
            {ofertas.map((o) => <TarjetaOferta key={o.id} oferta={o} conLocal={false} usar={setUsando} />)}
          </div>
        </section>
      )}

      <section className="bloque ambiente">
        <h3>Ambiente</h3>
        <div className="estilo-escala" aria-label={`Estilo: ${l.estilo}`}>
          {ESTILOS.map((x) => <span key={x} className={x === l.estilo ? 'on' : ''}>{ICONO_ESTILO[x]} {x}</span>)}
        </div>
        <dl className="ambiente-datos">
          <div><dt>Precio</dt><dd><Precio n={l.precio} /></dd></div>
          {l.edad && <div><dt>Edad media</dt><dd>{l.edad.replace('-', '–')} años</dd></div>}
          {l.volumen && <div><dt>Volumen</dt><dd>{VOLUMEN[l.volumen] || l.volumen}</dd></div>}
        </dl>
        {l.publico.length > 0 && (<><h4>Público</h4><div className="chips">{l.publico.map((x) => <span key={x} className="tag tag-alt">{x}</span>)}</div></>)}
        {l.plan.length > 0 && (<><h4>Ideal para</h4><div className="chips">{l.plan.map((x) => <span key={x} className="tag tag-alt">{x}</span>)}</div></>)}
        <h4><Icono n="musica" size={14} /> Música</h4>
        <div className="chips">{l.musica.map((m) => <span key={m} className="tag">{m}</span>)}</div>
        <h4>Cómo es</h4>
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

      {checkin && (
        <CheckIn local={l} cerrar={() => setCheckin(false)} subirFoto={() => { setCheckin(false); setSubiendo({ yaVerificado: true }); }} />
      )}
      {subiendo && <SubirFoto local={l} yaVerificado={subiendo.yaVerificado} cerrar={() => setSubiendo(null)} />}
      {usando && <Canje tipo="oferta" item={usando} cerrar={() => setUsando(null)} />}
    </Sheet>
  );
}

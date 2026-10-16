import { useState } from 'react';
import { useApp } from '../ctx.js';
import { OFERTAS, POR_ID, CATEGORIAS, HORAS_ENTRE_CANJES } from '../data.js';
import { diaDeNoche, DIAS_LARGO } from '../clock.js';
import { minutosParaOferta } from '../store.js';
import { Chip, NivelBadge } from './ui.jsx';
import Canje from './Canje.jsx';

const diasCortos = (dias) => dias.map((d) => DIAS_LARGO[d].slice(0, 3)).join(', ');

export function estadoOferta(s, oferta, dia) {
  if (!oferta.dias.includes(dia)) return { disponible: false, texto: `Solo ${diasCortos(oferta.dias)}` };
  const min = minutosParaOferta(s, oferta.id);
  if (min > 0) return { disponible: false, texto: `Canjeada · vuelve en ${min} min`, usada: true };
  return { disponible: true };
}

// Tarjeta de oferta (se usa en la pestaña Ofertas y en la ficha del local).
export function TarjetaOferta({ oferta, conLocal = true, usar }) {
  const { s, now, estados, abrirLocal } = useApp();
  const e = estadoOferta(s, oferta, diaDeNoche(now));
  const local = POR_ID[oferta.localId];
  const cat = CATEGORIAS[oferta.categoria] || CATEGORIAS.copa;
  return (
    <div className={`oferta ${e.disponible ? '' : 'oferta-off'}`}>
      <div className="oferta-emoji">{cat.emoji}</div>
      <div className="oferta-txt">
        {conLocal && (
          <button className="oferta-local" onClick={() => abrirLocal(local.id)}>
            {local.nombre} <NivelBadge estado={estados[local.id]} />
          </button>
        )}
        <strong>{oferta.titulo}</strong>
        {(oferta.antes || oferta.condiciones) && (
          <small>{oferta.antes && <s>{oferta.antes}</s>} {oferta.condiciones}</small>
        )}
        {e.disponible ? (
          <button className="btn btn-primario btn-pequeno" onClick={() => usar(oferta)}>Usar oferta</button>
        ) : (
          <span className={`oferta-estado ${e.usada ? 'usada' : ''}`}>{e.texto}</span>
        )}
      </div>
    </div>
  );
}

export default function Ofertas() {
  const { s, now } = useApp();
  const [cat, setCat] = useState(null);
  const [usando, setUsando] = useState(null);
  const dia = diaDeNoche(now);

  const lista = OFERTAS.filter((o) => !cat || o.categoria === cat)
    .map((o) => ({ o, e: estadoOferta(s, o, dia) }))
    // Primero las disponibles; dentro, las de la bebida que prefiere (cuestionario).
    .sort((a, b) => b.e.disponible - a.e.disponible ||
      (b.o.categoria === s.gustos?.bebida) - (a.o.categoria === s.gustos?.bebida));

  return (
    <div className="pagina">
      <h1>Ofertas</h1>
      <p className="sub">De los locales adheridos a TONITE. Pulsa «Usar oferta» y enséñala en la barra. Cada oferta se puede usar una vez cada {HORAS_ENTRE_CANJES === 1 ? 'hora' : `${HORAS_ENTRE_CANJES} horas`}.</p>
      <div className="chips scroll-x">
        <Chip activo={!cat} onClick={() => setCat(null)}>Todas</Chip>
        {Object.entries(CATEGORIAS).map(([k, c]) => (
          <Chip key={k} activo={cat === k} onClick={() => setCat(cat === k ? null : k)}>{c.emoji} {c.nombre}</Chip>
        ))}
      </div>
      <div className="lista-ofertas">
        {lista.map(({ o }) => <TarjetaOferta key={o.id} oferta={o} usar={setUsando} />)}
        {lista.length === 0 && <p className="sub vacio">No hay ofertas de este tipo.</p>}
      </div>
      {usando && <Canje tipo="oferta" item={usando} cerrar={() => setUsando(null)} />}
    </div>
  );
}

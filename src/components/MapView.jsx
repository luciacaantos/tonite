import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, AttributionControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../ctx.js';
import { LOCALES } from '../data.js';
import { NIVELES } from '../afluencia.js';
import { Chip, Icono, Leyenda, NivelBadge } from './ui.jsx';
import Filtros, { FILTROS_VACIOS, aplicarFiltros, contarFiltros } from './Filtros.jsx';
import { afinidad, puntuacionParaTi } from '../gustos.js';
import { Precio } from './Ficha.jsx';

const LIMITES = L.latLngBounds(LOCALES.map((l) => [l.lat, l.lon]));
// Margen para que los marcadores no queden debajo de los filtros ni del carrusel.
const MARGEN = { paddingTopLeft: [24, 70], paddingBottomRight: [24, 250] };
const iconoCache = {};
function icono(nivel, elegido, adherido) {
  const k = `${nivel}-${elegido}-${adherido}`;
  return (iconoCache[k] ??= L.divIcon({
    className: '',
    // Estrella de ocho puntas del color de la afluencia; rombo dorado = local adherido con ofertas.
    html: `<div class="pin n${nivel} ${elegido ? 'pin-elegido' : ''}" style="--c:${NIVELES[nivel].color}"><svg viewBox="0 0 24 24"><g fill="${NIVELES[nivel].color}"><rect x="5" y="5" width="14" height="14"/><rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)"/></g></svg>${adherido ? '<b class="pin-oferta"></b>' : ''}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  }));
}

function Encuadre() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => { map.invalidateSize(); map.fitBounds(LIMITES, MARGEN); }, 50);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// Fondos de calles (sin clave de API). Si uno no carga (red bloqueada, servidor caído...), se prueba el siguiente.
// OpenStreetMap se pasa a modo oscuro con un filtro CSS (.tiles-oscuras).
const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const FONDOS = [
  { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: OSM, className: 'tiles-oscuras' },
  { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', attribution: `${OSM} &copy; Esri`, maxNativeZoom: 16 },
];

function CapaCalles({ onSinMapa }) {
  const [i, setI] = useState(0);
  const cargadas = useRef(0);
  const errores = useRef(0);

  useEffect(() => {
    cargadas.current = 0;
    errores.current = 0;
    // Si en 6 s no ha llegado ninguna imagen, pasamos al siguiente fondo.
    const t = setTimeout(() => { if (!cargadas.current) siguiente(); }, 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  function siguiente() {
    if (i < FONDOS.length - 1) setI(i + 1);
    else onSinMapa(true);
  }

  const f = FONDOS[i];
  return (
    <TileLayer
      key={i}
      url={f.url}
      attribution={f.attribution}
      className={f.className}
      maxZoom={19}
      maxNativeZoom={f.maxNativeZoom ?? 19}
      eventHandlers={{
        tileload: () => { cargadas.current++; onSinMapa(false); },
        tileerror: () => { if (++errores.current >= 4 && !cargadas.current) siguiente(); },
      }}
    />
  );
}

let filtrosGuardados = FILTROS_VACIOS;
let modoGuardado = null;

export default function MapView({ seleccionado }) {
  const { estados, abrirLocal, now, s } = useApp();
  const conGustos = !!s.gustos && Object.keys(s.gustos).length > 0;
  const [modo, setModoState] = useState(modoGuardado || (conGustos ? 'parati' : 'animado'));
  const setModo = (m) => { modoGuardado = m; setModoState(m); };
  const modoReal = conGustos ? modo : 'animado';
  const [filtros, setFiltrosState] = useState(filtrosGuardados);
  const [verFiltros, setVerFiltros] = useState(false);
  const [sinMapa, setSinMapa] = useState(false);
  const setFiltros = (f) => { filtrosGuardados = f; setFiltrosState(f); };

  const visibles = aplicarFiltros(LOCALES, filtros, estados, now);
  const abiertos = visibles.filter((l) => !estados[l.id].cerrado);
  const top = (modoReal === 'parati'
    ? abiertos.sort((a, b) => puntuacionParaTi(b, estados[b.id], s.gustos) - puntuacionParaTi(a, estados[a.id], s.gustos))
    : abiertos.sort((a, b) => estados[b.id].nivel - estados[a.id].nivel || estados[b.id].checkins - estados[a.id].checkins)
  ).slice(0, 8);
  const n = contarFiltros(filtros);

  return (
    <div className="mapa-wrap">
      <MapContainer bounds={LIMITES} boundsOptions={MARGEN} zoomControl={false} className="mapa" attributionControl={false}>
        <AttributionControl position="topright" prefix={false} />
        <Encuadre />
        <CapaCalles onSinMapa={setSinMapa} />
        {visibles.map((l) => (
          <Marker
            key={l.id}
            position={[l.lat, l.lon]}
            icon={icono(estados[l.id].nivel, seleccionado === l.id, l.adherido)}
            eventHandlers={{ click: () => abrirLocal(l.id) }}
            zIndexOffset={estados[l.id].nivel * 100}
            title={l.nombre}
          />
        ))}
      </MapContainer>

      {sinMapa && (
        <div className="aviso-mapa">No se pueden cargar las calles del mapa. Revisa la conexión a internet (o prueba otra wifi / datos móviles).</div>
      )}

      <div className="mapa-filtros">
        <Chip activo={n > 0} onClick={() => setVerFiltros(true)}>
          <Icono n="filtro" size={16} /> Filtros{n ? ` · ${n}` : ''}
        </Chip>
        <Chip activo={filtros.abierto} onClick={() => setFiltros({ ...filtros, abierto: !filtros.abierto })}>Abierto ahora</Chip>
        <Chip activo={filtros.ofertas} onClick={() => setFiltros({ ...filtros, ofertas: !filtros.ofertas })}><i className="rombo-oro" /> Con ofertas</Chip>
        {['Pedro Antonio', 'Ganivet', 'Elvira'].map((z) => (
          <Chip key={z} activo={filtros.zonas.includes(z)}
            onClick={() => setFiltros({ ...filtros, zonas: filtros.zonas.includes(z) ? filtros.zonas.filter((x) => x !== z) : [...filtros.zonas, z] })}>
            {z}
          </Chip>
        ))}
      </div>

      <div className="mapa-abajo">
        <div className="mapa-info">
          <Leyenda />
          <span className="contador">{visibles.length} locales</span>
        </div>
        {top.length > 0 ? (
          <div className="carrusel">
            <div className="carrusel-titulo">
              {conGustos ? (
                <>
                  <button className={modoReal === 'parati' ? 'on' : ''} onClick={() => setModo('parati')}>💘 Para ti ahora</button>
                  <button className={modoReal === 'animado' ? 'on' : ''} onClick={() => setModo('animado')}><Icono n="fuego" size={15} /> Lo más animado</button>
                </>
              ) : (
                <span className="on"><Icono n="fuego" size={15} /> Lo más animado ahora</span>
              )}
            </div>
            <div className="carrusel-fila">
              {top.map((l) => {
                const a = afinidad(l, s.gustos);
                return (
                  <button key={l.id} className="mini-card" onClick={() => abrirLocal(l.id)}>
                    <strong>{l.nombre}</strong>
                    <span className="mini-sub">{l.tipo} · <Precio n={l.precio} /> · {l.estilo}</span>
                    <span className="mini-pie">
                      <NivelBadge estado={estados[l.id]} />
                      {a && <span className="mini-pct">{a.pct}%</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="carrusel vacio">Nada abierto con estos filtros. Prueba a quitar alguno.</div>
        )}
      </div>

      {verFiltros && <Filtros filtros={filtros} setFiltros={setFiltros} cerrar={() => setVerFiltros(false)} total={visibles.length} />}
    </div>
  );
}

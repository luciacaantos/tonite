import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, AttributionControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../ctx.js';
import { LOCALES } from '../data.js';
import { NIVELES } from '../afluencia.js';
import { Chip, Icono, Leyenda, NivelBadge } from './ui.jsx';
import Filtros, { FILTROS_VACIOS, aplicarFiltros, contarFiltros } from './Filtros.jsx';

const LIMITES = L.latLngBounds(LOCALES.map((l) => [l.lat, l.lon]));
// Margen para que los marcadores no queden debajo de los filtros ni del carrusel.
const MARGEN = { paddingTopLeft: [24, 70], paddingBottomRight: [24, 250] };
const iconoCache = {};
function icono(nivel, elegido) {
  const k = `${nivel}-${elegido}`;
  return (iconoCache[k] ??= L.divIcon({
    className: '',
    html: `<div class="pin n${nivel} ${elegido ? 'pin-elegido' : ''}" style="--c:${NIVELES[nivel].color}"><i></i></div>`,
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

let filtrosGuardados = FILTROS_VACIOS;

export default function MapView({ seleccionado }) {
  const { estados, abrirLocal, now } = useApp();
  const [filtros, setFiltrosState] = useState(filtrosGuardados);
  const [verFiltros, setVerFiltros] = useState(false);
  const setFiltros = (f) => { filtrosGuardados = f; setFiltrosState(f); };

  const visibles = aplicarFiltros(LOCALES, filtros, estados, now);
  const top = [...visibles]
    .filter((l) => !estados[l.id].cerrado)
    .sort((a, b) => estados[b.id].nivel - estados[a.id].nivel || estados[b.id].checkins - estados[a.id].checkins)
    .slice(0, 8);
  const n = contarFiltros(filtros);

  return (
    <div className="mapa-wrap">
      <MapContainer bounds={LIMITES} boundsOptions={MARGEN} zoomControl={false} className="mapa" attributionControl={false}>
        <AttributionControl position="topright" prefix={false} />
        <Encuadre />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO'
          maxZoom={19}
        />
        {visibles.map((l) => (
          <Marker
            key={l.id}
            position={[l.lat, l.lon]}
            icon={icono(estados[l.id].nivel, seleccionado === l.id)}
            eventHandlers={{ click: () => abrirLocal(l.id) }}
            zIndexOffset={estados[l.id].nivel * 100}
            title={l.nombre}
          />
        ))}
      </MapContainer>

      <div className="mapa-filtros">
        <Chip activo={n > 0} onClick={() => setVerFiltros(true)}>
          <Icono n="filtro" size={16} /> Filtros{n ? ` · ${n}` : ''}
        </Chip>
        <Chip activo={filtros.abierto} onClick={() => setFiltros({ ...filtros, abierto: !filtros.abierto })}>Abierto ahora</Chip>
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
            <div className="carrusel-titulo"><Icono n="fuego" size={16} /> Lo más animado ahora</div>
            <div className="carrusel-fila">
              {top.map((l) => (
                <button key={l.id} className="mini-card" onClick={() => abrirLocal(l.id)}>
                  <strong>{l.nombre}</strong>
                  <span className="mini-sub">{l.tipo} · {l.zona}</span>
                  <NivelBadge estado={estados[l.id]} />
                </button>
              ))}
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

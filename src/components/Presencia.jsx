import { useState } from 'react';
import { useApp } from '../ctx.js';
import { distancia, formatoDistancia } from '../data.js';
import { Icono } from './ui.jsx';

export const RADIO_M = 50;

// Comprueba que la persona está a menos de RADIO_M del local (check-in y fotos).
// La ubicación se pide SOLO aquí, una vez, al pulsar el botón. No se guarda.
export default function Presencia({ local, titulo, alConfirmar }) {
  const { s } = useApp();
  const [paso, setPaso] = useState('inicio'); // inicio | buscando | lejos | error
  const [info, setInfo] = useState('');

  function comprobar() {
    if (!navigator.geolocation) { setPaso('error'); setInfo('Tu navegador no permite usar la ubicación.'); return; }
    setPaso('buscando');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = distancia({ lat: pos.coords.latitude, lon: pos.coords.longitude }, local);
        if (d <= RADIO_M) alConfirmar(false);
        else { setPaso('lejos'); setInfo(`Estás a ${formatoDistancia(d)} de ${local.nombre}. Tienes que estar a menos de ${RADIO_M} m.`); }
      },
      (err) => {
        setPaso('error');
        setInfo(err.code === 1 ? 'No has dado permiso para usar la ubicación. Puedes activarlo en los ajustes del navegador.' : 'No hemos podido obtener tu ubicación. Inténtalo de nuevo.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  const botonSimular = s.demo.activo && (
    <button className="btn btn-demo" onClick={() => alConfirmar(true)}>🎬 Simular que estoy aquí</button>
  );

  if (paso === 'buscando') return <div className="cargando"><span className="spinner" /> Buscando tu ubicación…</div>;
  if (paso === 'lejos' || paso === 'error') {
    return (
      <>
        <h2>{paso === 'lejos' ? 'Estás un poco lejos' : 'Ups'}</h2>
        <p className="sub">{info}</p>
        <div className="pila">
          <button className="btn btn-secundario" onClick={comprobar}>Reintentar</button>
          {botonSimular}
        </div>
      </>
    );
  }
  return (
    <>
      <h2>{titulo}</h2>
      <p className="sub">Comprobamos que estás a menos de {RADIO_M} m. Solo usamos tu ubicación en este momento, no te seguimos.</p>
      <div className="pila">
        <button className="btn btn-primario" onClick={comprobar}><Icono n="pin" size={20} /> Comprobar mi ubicación</button>
        {botonSimular}
      </div>
    </>
  );
}

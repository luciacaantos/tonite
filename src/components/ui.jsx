import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NIVELES } from '../afluencia.js';

// Estrella de ocho puntas (la del alicatado nazarí): el símbolo de TONITE.
export function Estrella({ color = 'var(--acento)', size, className = '', style }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} style={style} aria-hidden="true">
      <g fill={color}>
        <rect x="5" y="5" width="14" height="14" />
        <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
      </g>
    </svg>
  );
}

export function Logo({ grande }) {
  return (
    <span className={`logo ${grande ? 'logo-grande' : ''}`} aria-label="tonite">
      <span className="logo-texto">ton<span className="logo-i">ı<Estrella className="logo-estrella" /></span>te</span>
      {grande && <span className="logo-lema">Granada de noche</span>}
    </span>
  );
}

// Hoja que sube desde abajo (fichas, filtros, check-in...).
export function Sheet({ cerrar, children, alto, className = '' }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [cerrar]);
  return createPortal(
    <div className="sheet-fondo" onClick={cerrar}>
      <div className={`sheet ${alto ? 'sheet-alto' : ''} ${className}`} onClick={(e) => e.stopPropagation()} role="dialog">
        <button className="sheet-asa" onClick={cerrar} aria-label="Cerrar" />
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Punto({ nivel, size = 12 }) {
  return <Estrella className={`punto n${nivel}`} color={NIVELES[nivel].color} size={size + 3} />;
}

export function NivelBadge({ estado, grande }) {
  if (estado.cerrado) return <span className="badge badge-cerrado">Cerrado ahora</span>;
  const n = NIVELES[estado.nivel];
  return (
    <span className={`badge ${grande ? 'badge-grande' : ''}`} style={{ '--c': n.color }}>
      <Punto nivel={estado.nivel} size={grande ? 14 : 10} /> {n.nombre}
    </span>
  );
}

export function Chip({ activo, onClick, children, color }) {
  return (
    <button type="button" className={`chip ${activo ? 'chip-on' : ''}`} onClick={onClick} style={color ? { '--c': color } : undefined}>
      {children}
    </button>
  );
}

export function Leyenda() {
  return (
    <div className="leyenda">
      {[1, 2, 3, 4, 0].map((n) => (
        <span key={n}><Punto nivel={n} size={9} />{NIVELES[n].corto}</span>
      ))}
    </div>
  );
}

const iconos = {
  mapa: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
  agenda: 'M4 7h16M4 7v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7M4 7V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v1M8 3v4m8-4v4M8 12h3m-3 4h6',
  ofertas: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8ZM7 7h.01',
  puntos: 'M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7L12 2Z',
  perfil: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  ruta: 'M3 11l18-8-8 18-2-8-8-2Z',
  check: 'M20 6 9 17l-5-5',
  filtro: 'M3 5h18M6 12h12M10 19h4',
  compartir: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13',
  cerrar: 'M18 6 6 18M6 6l12 12',
  mas: 'M12 5v14M5 12h14',
  reloj: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  musica: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  copa: 'M8 22h8M12 15v7M5 3h14l-1 6a6 6 0 0 1-12 0L5 3Z',
  fuego: 'M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-4-9 0 4-4 6-4 12 0 5 3 8 7 8Z',
};

export function Icono({ n, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={iconos[n]} />
    </svg>
  );
}

export function Toast({ texto }) {
  return texto ? <div className="toast">{texto}</div> : null;
}

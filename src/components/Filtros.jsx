import { ZONAS, TIPOS, MUSICAS, AMBIENTES } from '../data.js';
import { NIVELES } from '../afluencia.js';
import { Chip, Sheet } from './ui.jsx';

export const FILTROS_VACIOS = { zonas: [], tipos: [], musica: [], ambiente: [], niveles: [], abierto: false };

export const contarFiltros = (f) =>
  f.zonas.length + f.tipos.length + f.musica.length + f.ambiente.length + f.niveles.length + (f.abierto ? 1 : 0);

export function aplicarFiltros(locales, f, estados) {
  return locales.filter((l) => {
    const e = estados[l.id];
    if (f.zonas.length && !f.zonas.includes(l.zona)) return false;
    if (f.tipos.length && !f.tipos.includes(l.tipo)) return false;
    if (f.musica.length && !l.musica.some((m) => f.musica.includes(m))) return false;
    if (f.ambiente.length && !l.ambiente.some((a) => f.ambiente.includes(a))) return false;
    if (f.niveles.length && (e.cerrado || !f.niveles.includes(e.nivel))) return false;
    if (f.abierto && e.cerrado) return false;
    return true;
  });
}

const alternar = (lista, v) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

export default function Filtros({ filtros, setFiltros, cerrar, total }) {
  const grupo = (titulo, clave, opciones, color) => (
    <section className="filtro-grupo">
      <h4>{titulo}</h4>
      <div className="chips">
        {opciones.map((o) => {
          const v = typeof o === 'object' ? o.id : o;
          return (
            <Chip key={v} activo={filtros[clave].includes(v)} color={color?.(o)}
              onClick={() => setFiltros({ ...filtros, [clave]: alternar(filtros[clave], v) })}>
              {typeof o === 'object' ? o.nombre : o}
            </Chip>
          );
        })}
      </div>
    </section>
  );

  return (
    <Sheet cerrar={cerrar} alto>
      <div className="sheet-cab">
        <h2>Filtros</h2>
        <button className="link" onClick={() => setFiltros(FILTROS_VACIOS)}>Borrar todo</button>
      </div>
      <section className="filtro-grupo">
        <Chip activo={filtros.abierto} onClick={() => setFiltros({ ...filtros, abierto: !filtros.abierto })}>Abierto ahora</Chip>
      </section>
      {grupo('Afluencia', 'niveles', NIVELES.slice(1), (o) => o.color)}
      {grupo('Zona', 'zonas', ZONAS)}
      {grupo('Tipo de local', 'tipos', TIPOS)}
      {grupo('Música', 'musica', MUSICAS)}
      {grupo('Ambiente', 'ambiente', AMBIENTES)}
      <div className="sheet-pie">
        <button className="btn btn-primario" onClick={cerrar}>Ver {total} locales</button>
      </div>
    </Sheet>
  );
}

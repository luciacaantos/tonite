const TABS = [
  { id: 'mapa', nombre: 'Mapa' },
  { id: 'ofertas', nombre: 'Ofertas' },
  { id: 'puntos', nombre: 'Puntos' },
  { id: 'agenda', nombre: 'Agenda' },
  { id: 'perfil', nombre: 'Perfil' },
];

export default function BottomNav({ actual, ir }) {
  return (
    <nav className="bottomnav">
      {TABS.map((t) => (
        <button key={t.id} className={actual === t.id ? 'on' : ''} onClick={() => ir(t.id)}>
          <i className="rombo" aria-hidden="true" />
          <span>{t.nombre}</span>
        </button>
      ))}
    </nav>
  );
}

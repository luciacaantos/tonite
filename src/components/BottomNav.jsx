import { Icono } from './ui.jsx';

const TABS = [
  { id: 'mapa', nombre: 'Mapa' },
  { id: 'agenda', nombre: 'Agenda' },
  { id: 'plan', nombre: 'Plan' },
  { id: 'perfil', nombre: 'Perfil' },
];

export default function BottomNav({ actual, ir }) {
  return (
    <nav className="bottomnav">
      {TABS.map((t) => (
        <button key={t.id} className={actual === t.id ? 'on' : ''} onClick={() => ir(t.id)}>
          <Icono n={t.id} />
          <span>{t.nombre}</span>
        </button>
      ))}
    </nav>
  );
}

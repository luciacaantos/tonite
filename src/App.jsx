import { useEffect, useMemo, useState } from 'react';
import { Ctx } from './ctx.js';
import { useStore, sesionAbierta } from './store.js';
import { ahora, hhmm, diaDeNoche, DIAS_LARGO } from './clock.js';
import { afluencia } from './afluencia.js';
import { LOCALES } from './data.js';
import Login from './components/Login.jsx';
import MapView from './components/MapView.jsx';
import Ficha from './components/Ficha.jsx';
import Agenda from './components/Agenda.jsx';
import Ofertas from './components/Ofertas.jsx';
import Puntos from './components/Puntos.jsx';
import Perfil from './components/Perfil.jsx';
import BottomNav from './components/BottomNav.jsx';
import { Logo } from './components/ui.jsx';
import Cuestionario from './components/Cuestionario.jsx';

function leerRuta() {
  const h = location.hash.replace(/^#\/?/, '');
  const [tab, ...resto] = h.split('/');
  return { tab: ['mapa', 'ofertas', 'puntos', 'agenda', 'perfil'].includes(tab) ? tab : 'mapa', param: resto.join('/') };
}

export default function App() {
  const s = useStore();
  const [, setTick] = useState(0);
  const [ruta, setRuta] = useState(leerRuta);
  const [localAbierto, setLocalAbierto] = useState(null);

  // Refresca la hora cada 20 s.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 20000);
    const onHash = () => setRuta(leerRuta());
    window.addEventListener('hashchange', onHash);
    return () => { clearInterval(t); window.removeEventListener('hashchange', onHash); };
  }, []);

  const logueado = sesionAbierta(s);

  const now = ahora(s.demo);
  const estados = useMemo(
    () => Object.fromEntries(LOCALES.map((l) => [l.id, afluencia(l, now, s.checkins)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.floor(now.getTime() / 60000), s.checkins],
  );

  if (!logueado) return <Login />;
  if (!s.cuestionarioVisto) return <Cuestionario nombre={s.usuario.nombre} />;

  const ir = (tab) => { setLocalAbierto(null); location.hash = `#/${tab}`; };
  const ctx = { s, now, estados, abrirLocal: setLocalAbierto, ir };

  return (
    <Ctx.Provider value={ctx}>
      <div className="app">
        <header className="topbar">
          <Logo />
          {s.demo.activo && (
            <button className="pill-demo" onClick={() => ir('perfil')} title="Modo demo activo">
              <span className="dot-live" /> DEMO · {DIAS_LARGO[diaDeNoche(now)]} {hhmm(now)}
            </button>
          )}
        </header>
        <main className={`contenido tab-${ruta.tab}`}>
          {ruta.tab === 'mapa' && <MapView seleccionado={localAbierto} />}
          {ruta.tab === 'agenda' && <Agenda />}
          {ruta.tab === 'ofertas' && <Ofertas />}
          {ruta.tab === 'puntos' && <Puntos />}
          {ruta.tab === 'perfil' && <Perfil />}
        </main>
        <BottomNav actual={ruta.tab} ir={ir} />
        {localAbierto && <Ficha id={localAbierto} cerrar={() => setLocalAbierto(null)} />}
      </div>
    </Ctx.Provider>
  );
}

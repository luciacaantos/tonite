import { useState } from 'react';
import { useStore, registrar, entrar, abrirSesionTrasRegistro } from '../store.js';
import { Logo, Sheet } from './ui.jsx';

export function TextoPrivacidad() {
  return (
    <div className="texto-legal">
      <h2>Privacidad y ubicación</h2>
      <p><strong>Prototipo de demostración.</strong> En esta versión tu cuenta, tus check-ins y tus puntos se guardan solo en este móvil. No se envían a ningún servidor.</p>
      <h3>Ubicación</h3>
      <p>TONITE solo te pide la ubicación cuando pulsas «Estoy aquí» para hacer check-in, y la usa una única vez para comprobar que estás a menos de 50 m del local. No te seguimos ni guardamos tu posición.</p>
      <h3>Check-ins</h3>
      <p>Tu check-in (local, nivel de gente y ambiente) cuenta para la afluencia durante 25 minutos y después caduca. La afluencia sale solo de los check-ins de usuarios; los locales nunca la declaran.</p>
      <h3>Mayores de 18</h3>
      <p>TONITE es para mayores de 18 años. Bebe con moderación.</p>
    </div>
  );
}

export default function Login() {
  const s = useStore();
  const hayCuenta = !!s.usuario;
  const [modo, setModo] = useState(hayCuenta ? 'entrar' : 'registro');
  const [f, setF] = useState({ nombre: '', email: hayCuenta ? s.usuario.email : '', password: '', mayor: false, privacidad: false, ubicacion: false });
  const [error, setError] = useState('');
  const [verPrivacidad, setVerPrivacidad] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (modo === 'registro') {
      if (!f.nombre.trim()) return setError('Dinos cómo te llamas.');
      if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('Ese email no parece válido.');
      if (f.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
      if (!f.mayor) return setError('Tienes que ser mayor de 18 años.');
      if (!f.privacidad || !f.ubicacion) return setError('Tienes que aceptar la política de privacidad y el uso de la ubicación.');
      await registrar(f);
      abrirSesionTrasRegistro();
    } else {
      const err = await entrar(f);
      if (err) setError(err);
    }
  }

  return (
    <div className="login">
      <div className="login-cab">
        <Logo grande />
        <p className="lema">Menos dudas, más planes y la noche que tú eliges.</p>
      </div>
      <div className="tabs">
        <button className={modo === 'registro' ? 'on' : ''} onClick={() => setModo('registro')}>Crear cuenta</button>
        <button className={modo === 'entrar' ? 'on' : ''} onClick={() => setModo('entrar')}>Entrar</button>
      </div>
      <form onSubmit={enviar} className="form">
        {modo === 'registro' && (
          <label className="campo">Nombre<input value={f.nombre} onChange={set('nombre')} autoComplete="given-name" placeholder="Carla" /></label>
        )}
        <label className="campo">Email<input type="email" value={f.email} onChange={set('email')} autoComplete="email" placeholder="carla@correo.ugr.es" /></label>
        <label className="campo">Contraseña<input type="password" value={f.password} onChange={set('password')} autoComplete={modo === 'registro' ? 'new-password' : 'current-password'} placeholder="Mínimo 6 caracteres" /></label>
        {modo === 'registro' && (
          <div className="checks">
            <label className="check"><input type="checkbox" checked={f.mayor} onChange={set('mayor')} /><span><strong>Soy mayor de 18 años</strong></span></label>
            <label className="check"><input type="checkbox" checked={f.privacidad} onChange={set('privacidad')} /><span>Acepto la <button type="button" className="link" onClick={() => setVerPrivacidad(true)}>política de privacidad</button></span></label>
            <label className="check"><input type="checkbox" checked={f.ubicacion} onChange={set('ubicacion')} /><span>Acepto que se use mi ubicación <strong>solo al hacer check-in</strong></span></label>
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primario btn-grande" type="submit">{modo === 'registro' ? 'Empezar' : 'Entrar'}</button>
      </form>
      <p className="sub mini centrado">+18 · Prototipo de demostración · tus datos se quedan en este móvil</p>
      {verPrivacidad && <Sheet cerrar={() => setVerPrivacidad(false)} alto><TextoPrivacidad /></Sheet>}
    </div>
  );
}

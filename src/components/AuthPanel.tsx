import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

export function AuthPanel() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'user' | 'expert'>('user');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName, last_name: lastName, human_role: role } },
        });
        if (error) throw error;
        if (!data.session) setMessage('Compte créé. Vérifiez votre e-mail puis connectez-vous.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur d’authentification');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-shell panel">
      <div className="panel-heading">
        <div><p className="eyebrow">Compte HUMAN</p><h2>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h2></div>
        <button className="text-button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} type="button">
          {mode === 'login' ? 'Créer un compte' : 'J’ai déjà un compte'}
        </button>
      </div>
      <form className="request-form" onSubmit={submit}>
        {mode === 'signup' && <>
          <div className="form-grid">
            <label>Prénom<input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></label>
            <label>Nom<input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></label>
          </div>
          <label>Type de compte
            <select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'expert')}>
              <option value="user">Utilisateur / agent</option>
              <option value="expert">Expert humain</option>
            </select>
          </label>
        </>}
        <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Mot de passe<input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {message && <div className="notice">{message}</div>}
        <button className="primary-button full" disabled={busy}>{busy ? 'En cours…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}</button>
      </form>
    </section>
  );
}

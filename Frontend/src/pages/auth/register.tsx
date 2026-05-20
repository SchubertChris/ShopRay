import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth, register } from '@features/auth';
import { SeoMeta, IconGoogle } from '@components/ui';
import { ROUTES } from '@config/routes';
import { supabase } from '@/lib/supabase';
import { APP_NAME } from '@config/app';

export default function RegisterPage() {
  const { setAuth }                    = useAuth();
  const navigate                       = useNavigate();
  const [firstName, setFirstName]      = useState('');
  const [lastName,  setLastName]       = useState('');
  const [email,     setEmail]          = useState('');
  const [password,  setPassword]       = useState('');
  const [showPw,    setShowPw]         = useState(false);
  const [loading,   setLoading]        = useState(false);
  const [error,     setError]          = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await register({ firstName, lastName, email, password });
      setAuth(response.user, response.token);
      navigate(ROUTES.ACCOUNT.DASHBOARD);
    } catch {
      setError('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoMeta title="Konto erstellen" noIndex />
    <div className="auth-card">
      <div className="auth-card__logo">{APP_NAME}<span>.</span></div>
      <h1 className="auth-card__title">Konto erstellen</h1>
      <p className="auth-card__subtitle">Kostenlos registrieren und loslegen.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <button
          type="button"
          className="social-btn"
          onClick={() => supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}${ROUTES.AUTH.CALLBACK}` },
          })}
        >
          <IconGoogle size={20} /> Mit Google registrieren
        </button>
        <div className="auth-form__divider"><span>oder per E-Mail</span></div>

        {error && <p className="auth-form__error">{error}</p>}

        <div className="grid grid--2">
          <div className="form-group">
            <label className="form-label">Vorname</label>
            <input
              className="form-input"
              type="text"
              placeholder="Max"
              autoComplete="given-name"
              required
              maxLength={100}
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nachname</label>
            <input
              className="form-input"
              type="text"
              placeholder="Mustermann"
              autoComplete="family-name"
              required
              maxLength={100}
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">E-Mail-Adresse</label>
          <input
            className="form-input"
            type="email"
            placeholder="max@example.com"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Passwort</label>
          <div className="input-password">
            <input
              className="form-input"
              type={showPw ? 'text' : 'password'}
              placeholder="Mindestens 8 Zeichen"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="input-password__toggle" type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}>
              {showPw ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
          {loading ? 'Konto wird erstellt…' : 'Konto erstellen'}
        </button>

        <p className="auth-form__disclaimer">
          Mit der Registrierung stimmst du unseren{' '}
          <Link to={ROUTES.INFO.TERMS}>AGB</Link> und der{' '}
          <Link to={ROUTES.INFO.PRIVACY}>Datenschutzerklärung</Link> zu.
        </p>

        <p className="auth-form__footer">
          Bereits registriert? <Link to={ROUTES.AUTH.LOGIN}>Jetzt anmelden</Link>
        </p>
      </form>
    </div>
    </>
  );
}

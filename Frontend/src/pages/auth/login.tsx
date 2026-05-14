import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth, login } from '@features/auth';
import { SeoMeta, IconGoogle } from '@components/ui';
import { ROUTES } from '@config/routes';
import { APP_NAME } from '@config/app';

export default function LoginPage() {
  const { setAuth }              = useAuth();
  const navigate                 = useNavigate();
  const location                 = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    ?? ROUTES.ACCOUNT.DASHBOARD;
  const [email,    setEmail]     = useState('');
  const [password, setPassword]  = useState('');
  const [showPw,   setShowPw]    = useState(false);
  const [loading,  setLoading]   = useState(false);
  const [error,    setError]     = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await login({ email, password });
      setAuth(response.user, response.token);
      navigate(from, { replace: true });
    } catch {
      setError('E-Mail oder Passwort falsch. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await login({ email: 'chris@concepts.de', password: 'start12345' });
      setAuth(response.user, response.token);
      navigate(from, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoMeta title="Anmelden" noIndex />
    <div className="auth-card">
      <div className="auth-card__logo">{APP_NAME}<span>.</span></div>
      <h1 className="auth-card__title">Willkommen zurück</h1>
      <p className="auth-card__subtitle">Melde dich an, um fortzufahren.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <button type="button" className="social-btn">
          <IconGoogle size={20} /> Mit Google anmelden
        </button>

        <div className="auth-form__divider"><span>oder per E-Mail</span></div>

        {error && <p className="auth-form__error">{error}</p>}

        <div className="form-group">
          <label className="form-label">E-Mail-Adresse</label>
          <input
            className="form-input"
            type="email"
            placeholder="max@example.com"
            autoComplete="email"
            required
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
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="input-password__toggle" type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}>
              {showPw ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        <div className="auth-form__forgot-row">
          <Link to={ROUTES.AUTH.FORGOT_PASSWORD} className="auth-form__forgot-link">Passwort vergessen?</Link>
        </div>

        <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
          {loading ? 'Anmelden…' : 'Anmelden'}
        </button>

        <button type="button" className="btn btn--secondary btn--full" onClick={handleDemoLogin} disabled={loading}>
          Demo-Zugang — direkt einloggen
        </button>

        <p className="auth-form__footer">
          Noch kein Konto?{' '}
          <Link to={ROUTES.AUTH.REGISTER}>Jetzt registrieren</Link>
        </p>
      </form>
    </div>
    </>
  );
}

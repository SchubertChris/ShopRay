import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, Zap } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { ROUTES } from '@config/routes';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const { login } = useAuthStore();
  const navigate  = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* ── Brand Panel ──────────────────────────────────────────────────── */}
      <div className="login-brand">
        <div className="login-brand__logo">
          <div className="login-brand__mark">S</div>
          <span className="login-brand__name">ShopRay Admin</span>
        </div>

        <div className="login-brand__body">
          <h1 className="login-brand__headline">
            Dein Shop.<br />Deine Kontrolle.
          </h1>
          <p className="login-brand__sub">
            Produkte anlegen, Bestellungen verwalten, Kunden betreuen —
            alles an einem Ort.
          </p>
        </div>

        <div className="login-brand__features">
          <div className="login-brand__feature">
            <Shield size={15} strokeWidth={2} />
            DSGVO-konformes Datenmanagement
          </div>
          <div className="login-brand__feature">
            <Zap size={15} strokeWidth={2} />
            Echtzeitdaten aus Supabase
          </div>
          <div className="login-brand__feature">
            <CheckCircle size={15} strokeWidth={2} />
            Stripe-Zahlungen im Überblick
          </div>
        </div>
      </div>

      {/* ── Form Panel ───────────────────────────────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-form-wrap">
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <p className="login-form__eyebrow">Admin-Bereich</p>
            <h2 className="login-form__title">Anmelden</h2>
            <p className="login-form__sub">Nur autorisierte Nutzer haben Zugriff.</p>

            <div className="login-form__group">
              <label htmlFor="email">E-Mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@shop.de"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-form__group">
              <label htmlFor="password">Passwort</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="login-form__error">{error}</p>}

            <button className="login-form__submit" type="submit" disabled={loading}>
              {loading ? 'Wird angemeldet…' : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

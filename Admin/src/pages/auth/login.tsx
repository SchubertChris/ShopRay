import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, CheckCircle, Eye, EyeOff, Lock, Smartphone } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { ROUTES } from '@config/routes';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // TOTP-Schritt
  const [totpCode,    setTotpCode]    = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError,   setTotpError]   = useState('');
  const totpInputRef = useRef<HTMLInputElement>(null);

  const { login, verifyTotp, requireTotp } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) { setError('Bitte Passwort eingeben.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(password);
      // Wenn requireTotp jetzt true ist, bleibt die Seite — zeigt TOTP-Form
      // Wenn false → navigate passiert durch checkAuth im App-Wrapper oder hier direkt:
      if (!useAuthStore.getState().requireTotp) {
        navigate(ROUTES.DASHBOARD);
      } else {
        setTimeout(() => totpInputRef.current?.focus(), 50);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  const handleTotpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) { setTotpError('Bitte 6-stelligen Code eingeben.'); return; }
    setTotpError('');
    setTotpLoading(true);
    try {
      await verifyTotp(totpCode);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setTotpError(err instanceof Error ? err.message : 'Ungültiger Code.');
      setTotpCode('');
      totpInputRef.current?.focus();
    } finally {
      setTotpLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* ── Brand Panel ──────────────────────────────────────────────────── */}
      <div className="login-brand">
        <div className="login-brand__grid-bg" aria-hidden="true" />

        <div className="login-brand__logo">
          <div className="login-brand__mark">
            <span>S</span>
          </div>
          <span className="login-brand__name">ShopRay Admin</span>
        </div>

        <div className="login-brand__body">
          <p className="login-brand__kicker">Kontrollzentrum</p>
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
            <div className="login-brand__feature-icon">
              <Shield size={13} strokeWidth={2} />
            </div>
            DSGVO-konformes Datenmanagement
          </div>
          <div className="login-brand__feature">
            <div className="login-brand__feature-icon">
              <Zap size={13} strokeWidth={2} />
            </div>
            Echtzeitdaten aus Supabase
          </div>
          <div className="login-brand__feature">
            <div className="login-brand__feature-icon">
              <CheckCircle size={13} strokeWidth={2} />
            </div>
            Stripe-Zahlungen im Überblick
          </div>
        </div>
      </div>

      {/* ── Form Panel ───────────────────────────────────────────────────── */}
      <div className="login-form-panel">
        <div className="login-form-wrap">

          <div className="login-form__lock-icon" aria-hidden="true">
            {requireTotp
              ? <Smartphone size={22} strokeWidth={1.75} />
              : <Lock       size={22} strokeWidth={1.75} />
            }
          </div>

          {/* ── Passwort-Form ── */}
          {!requireTotp && (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <p className="login-form__eyebrow">Admin-Bereich</p>
              <h2 className="login-form__title">Anmelden</h2>
              <p className="login-form__sub">Nur autorisierte Nutzer haben Zugriff.</p>

              <div className="login-form__group">
                <label htmlFor="password">Admin-Passwort</label>
                <div className="login-form__input-wrap">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="login-form__pw-toggle"
                    onClick={() => setShowPw(v => !v)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  >
                    {showPw
                      ? <EyeOff size={15} strokeWidth={2} />
                      : <Eye    size={15} strokeWidth={2} />
                    }
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-form__error">
                  <Shield size={13} strokeWidth={2} />
                  {error}
                </div>
              )}

              <button className="login-form__submit" type="submit" disabled={loading}>
                {loading
                  ? <><span className="login-form__spinner" />Wird angemeldet…</>
                  : 'Anmelden'
                }
              </button>
            </form>
          )}

          {/* ── TOTP-Form ── */}
          {requireTotp && (
            <form className="login-form" onSubmit={handleTotpSubmit} noValidate>
              <p className="login-form__eyebrow">2-Faktor-Authentifizierung</p>
              <h2 className="login-form__title">Code eingeben</h2>
              <p className="login-form__sub">
                Öffne deine Authenticator-App und gib den 6-stelligen Code ein.
              </p>

              <div className="login-form__group">
                <label htmlFor="totp">Authenticator-Code</label>
                <input
                  id="totp"
                  ref={totpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  value={totpCode}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTotpCode(val);
                    if (totpError) setTotpError('');
                  }}
                  required
                  className="login-form__totp-input"
                />
              </div>

              {totpError && (
                <div className="login-form__error">
                  <Shield size={13} strokeWidth={2} />
                  {totpError}
                </div>
              )}

              <button className="login-form__submit" type="submit" disabled={totpLoading || totpCode.length !== 6}>
                {totpLoading
                  ? <><span className="login-form__spinner" />Wird geprüft…</>
                  : 'Bestätigen'
                }
              </button>

              <button
                type="button"
                className="login-form__back-link"
                onClick={() => useAuthStore.setState({ requireTotp: false })}
              >
                ← Zurück zur Passwort-Eingabe
              </button>
            </form>
          )}

          <p className="login-form__security-note">
            <Shield size={12} strokeWidth={2} />
            Verbindung verschlüsselt · Alle Zugriffe werden protokolliert
          </p>
        </div>
      </div>
    </div>
  );
}

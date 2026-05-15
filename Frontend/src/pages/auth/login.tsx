import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth, login, completeMfaLogin, MfaRequiredError } from '@features/auth';
import { SeoMeta, IconGoogle } from '@components/ui';
import { ROUTES } from '@config/routes';
import { APP_NAME } from '@config/app';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorMessage';

type LoginStep = 'credentials' | 'totp';

interface MfaPending {
  factorId:    string;
  challengeId: string;
}

export default function LoginPage() {
  const { setAuth }  = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const from         = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    ?? ROUTES.ACCOUNT.DASHBOARD;

  // Credentials
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);

  // TOTP
  const [step,       setStep]       = useState<LoginStep>('credentials');
  const [mfaPending, setMfaPending] = useState<MfaPending | null>(null);
  const [totpCode,   setTotpCode]   = useState('');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Schritt 1: E-Mail + Passwort ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await login({ email, password });
      setAuth(response.user, response.token);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof MfaRequiredError) {
        setMfaPending({ factorId: err.factorId, challengeId: err.challengeId });
        setStep('totp');
        return;
      }
      setError('E-Mail oder Passwort falsch. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }

  // ── Schritt 2: TOTP-Code ──
  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaPending) return;
    setLoading(true);
    setError(null);
    try {
      const response = await completeMfaLogin(mfaPending.factorId, mfaPending.challengeId, totpCode);
      setAuth(response.user, response.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err) || 'Ungültiger Code. Bitte erneut versuchen.');
      setTotpCode('');
    } finally {
      setLoading(false);
    }
  }

  // Auto-submit wenn 6 Ziffern eingegeben
  function handleTotpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setTotpCode(val);
    if (val.length === 6 && mfaPending) {
      setLoading(true);
      setError(null);
      completeMfaLogin(mfaPending.factorId, mfaPending.challengeId, val)
        .then(response => {
          setAuth(response.user, response.token);
          navigate(from, { replace: true });
        })
        .catch(err => {
          setError(getErrorMessage(err) || 'Ungültiger Code. Bitte erneut versuchen.');
          setTotpCode('');
        })
        .finally(() => setLoading(false));
    }
  }

  async function handleBackToCredentials() {
    await supabase.auth.signOut();
    setStep('credentials');
    setMfaPending(null);
    setTotpCode('');
    setError(null);
  }

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await login({ email: 'anna.mueller@shopray-test.de', password: 'Test1234!' });
      setAuth(response.user, response.token);
      navigate(from, { replace: true });
    } catch {
      setError('Demo-Login nicht verfügbar. Bitte melde dich mit deinen Zugangsdaten an.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoMeta title="Anmelden" noIndex />
      <div className="auth-card">
        <div className="auth-card__logo">{APP_NAME}<span>.</span></div>

        {/* ── Schritt 1: Credentials ── */}
        {step === 'credentials' && (
          <>
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
                  <button
                    className="input-password__toggle"
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  >
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
          </>
        )}

        {/* ── Schritt 2: TOTP ── */}
        {step === 'totp' && (
          <div className="totp-step">
            <div className="totp-step__icon" aria-hidden="true">🔐</div>
            <h2 className="totp-step__title">Zwei-Faktor-Authentifizierung</h2>
            <p className="totp-step__text">
              Öffne deine Authenticator-App und gib den 6-stelligen Code ein.
              Der Code wechselt alle 30 Sekunden.
            </p>

            {error && <p className="auth-form__error">{error}</p>}

            <form className="totp-form" onSubmit={handleTotpSubmit}>
              <input
                className="totp-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
                value={totpCode}
                onChange={handleTotpChange}
                disabled={loading}
              />
              <button
                className="btn btn--primary btn--full"
                type="submit"
                disabled={loading || totpCode.length < 6}
              >
                {loading ? 'Wird geprüft…' : 'Code bestätigen'}
              </button>
            </form>

            <button className="totp-back-link" type="button" onClick={handleBackToCredentials}>
              Zurück zum Login
            </button>
          </div>
        )}
      </div>
    </>
  );
}

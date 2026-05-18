import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, CheckCircle, Eye, EyeOff, Lock, Smartphone, Users, KeyRound } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { ROUTES } from '@config/routes';

function pwCheck(pw: string) {
  return {
    len:     pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    digit:   /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw),
  };
}
function pwValid(pw: string) { return Object.values(pwCheck(pw)).every(Boolean); }

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

  // Tab-Modus
  const [loginMode, setLoginMode] = useState<'owner' | 'mod'>('owner');
  const [modEmail,    setModEmail]    = useState('');
  const [modPassword, setModPassword] = useState('');
  const [modShowPw,   setModShowPw]   = useState(false);
  const [modError,    setModError]    = useState('');
  const [modLoading,  setModLoading]  = useState(false);

  const { login, verifyTotp, loginMod, submitNewModPassword, requireTotp, mustChangePassword } = useAuthStore();
  const navigate = useNavigate();

  // Force-Change-Password State (nach Mod-Login mit Startpasswort)
  const [newPw,       setNewPw]       = useState('');
  const [newPwShow,   setNewPwShow]   = useState(false);
  const [changingPw,  setChangingPw]  = useState(false);
  const [changeError, setChangeError] = useState('');

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

  const handleModSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!modEmail || !modPassword) { setModError('Bitte E-Mail und Passwort eingeben.'); return; }
    setModError('');
    setModLoading(true);
    try {
      await loginMod(modEmail, modPassword);
      // Wenn mustChangePassword → bleibt auf Login-Seite, zeigt Force-Change-Screen
      if (!useAuthStore.getState().mustChangePassword) {
        navigate(ROUTES.DASHBOARD);
      }
    } catch (err) {
      setModError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setModLoading(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!pwValid(newPw)) { setChangeError('Passwort erfüllt nicht alle Anforderungen.'); return; }
    setChangeError('');
    setChangingPw(true);
    try {
      await submitNewModPassword(newPw);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setChangeError(err instanceof Error ? err.message : 'Passwort konnte nicht gesetzt werden.');
    } finally {
      setChangingPw(false);
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

          {/* ── Force-Change-Password (Mitarbeiter, erster Login) ── */}
          {mustChangePassword && (
            <form className="login-form" onSubmit={handlePasswordChange} noValidate>
              <div className="login-form__lock-icon" aria-hidden="true">
                <KeyRound size={22} strokeWidth={1.75} />
              </div>
              <p className="login-form__eyebrow">Sicherheitshinweis</p>
              <h2 className="login-form__title">Passwort festlegen</h2>
              <p className="login-form__sub">
                Das Startpasswort muss beim ersten Login geändert werden.
                Wähle ein sicheres, persönliches Passwort.
              </p>

              <div className="login-form__group">
                <label htmlFor="new-pw">Neues Passwort</label>
                <div className="login-form__input-wrap">
                  <input
                    id="new-pw"
                    type={newPwShow ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    value={newPw}
                    onChange={e => { setNewPw(e.target.value); if (changeError) setChangeError(''); }}
                    required
                    autoFocus
                  />
                  <button type="button" className="login-form__pw-toggle" onClick={() => setNewPwShow(v => !v)} tabIndex={-1}>
                    {newPwShow ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                  </button>
                </div>
              </div>

              <ul className="pw-criteria">
                {([
                  ['len',     'Mindestens 8 Zeichen'],
                  ['upper',   'Großbuchstabe (A–Z)'],
                  ['lower',   'Kleinbuchstabe (a–z)'],
                  ['digit',   'Zahl (0–9)'],
                  ['special', 'Sonderzeichen (!@#…)'],
                ] as const).map(([key, label]) => {
                  const ok = newPw.length > 0 && pwCheck(newPw)[key];
                  return (
                    <li key={key} className={`pw-criteria__item${ok ? ' pw-criteria__item--ok' : ''}`}>
                      <span className="pw-criteria__dot" />
                      {label}
                    </li>
                  );
                })}
              </ul>

              {changeError && (
                <div className="login-form__error">
                  <Shield size={13} strokeWidth={2} />
                  {changeError}
                </div>
              )}

              <button
                className="login-form__submit"
                type="submit"
                disabled={changingPw || !pwValid(newPw)}
              >
                {changingPw
                  ? <><span className="login-form__spinner" />Wird gespeichert…</>
                  : 'Passwort festlegen & weiter'
                }
              </button>
            </form>
          )}

          {/* ── Tab-Switcher ── */}
          {!requireTotp && !mustChangePassword && (
            <div className="login-tabs">
              <button
                type="button"
                className={`login-tab${loginMode === 'owner' ? ' login-tab--active' : ''}`}
                onClick={() => { setLoginMode('owner'); setError(''); setModError(''); }}
              >
                <Lock size={13} strokeWidth={2} />
                Inhaber
              </button>
              <button
                type="button"
                className={`login-tab${loginMode === 'mod' ? ' login-tab--active' : ''}`}
                onClick={() => { setLoginMode('mod'); setError(''); setModError(''); }}
              >
                <Users size={13} strokeWidth={2} />
                Mitarbeiter
              </button>
            </div>
          )}

          {!mustChangePassword && (
          <div className="login-form__lock-icon" aria-hidden="true">
            {requireTotp
              ? <Smartphone size={22} strokeWidth={1.75} />
              : <Lock       size={22} strokeWidth={1.75} />
            }
          </div>
          )}

          {/* ── Passwort-Form ── */}
          {!requireTotp && !mustChangePassword && loginMode === 'owner' && (
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
          {requireTotp && !mustChangePassword && (
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

          {/* ── Mitarbeiter-Form ── */}
          {!requireTotp && !mustChangePassword && loginMode === 'mod' && (
            <form className="login-form" onSubmit={handleModSubmit} noValidate>
              <p className="login-form__eyebrow">Mitarbeiter-Zugang</p>
              <h2 className="login-form__title">Anmelden</h2>
              <p className="login-form__sub">Eingeschränkter Zugriff für Teammitglieder.</p>
              <div className="login-form__group">
                <label htmlFor="mod-email">E-Mail-Adresse</label>
                <input
                  id="mod-email"
                  type="email"
                  autoComplete="email"
                  placeholder="mitarbeiter@beispiel.de"
                  value={modEmail}
                  onChange={e => { setModEmail(e.target.value); if (modError) setModError(''); }}
                  required
                  autoFocus
                />
              </div>
              <div className="login-form__group">
                <label htmlFor="mod-password">Passwort</label>
                <div className="login-form__input-wrap">
                  <input
                    id="mod-password"
                    type={modShowPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={modPassword}
                    onChange={e => { setModPassword(e.target.value); if (modError) setModError(''); }}
                    required
                  />
                  <button type="button" className="login-form__pw-toggle" onClick={() => setModShowPw(v => !v)} tabIndex={-1}>
                    {modShowPw ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                  </button>
                </div>
              </div>
              {modError && <div className="login-form__error"><Shield size={13} strokeWidth={2} />{modError}</div>}
              <button className="login-form__submit" type="submit" disabled={modLoading}>
                {modLoading ? <><span className="login-form__spinner" />Wird angemeldet…</> : 'Als Mitarbeiter anmelden'}
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { SeoMeta } from '@components/ui';
import { APP_NAME } from '@config/app';
import { ROUTES } from '@config/routes';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/utils/errorMessage';

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [ready,    setReady]    = useState(false);   // PASSWORD_RECOVERY Event empfangen
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Supabase setzt die Session sobald der Reset-Link gültig ist
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;
      await supabase.auth.signOut();
      setDone(true);
      setTimeout(() => navigate(ROUTES.AUTH.LOGIN), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SeoMeta title="Neues Passwort" noIndex />
      <div className="auth-card">
        <div className="auth-card__logo">{APP_NAME}<span>.</span></div>

        {/* Link noch nicht validiert */}
        {!ready && !done && (
          <div className="auth-sent">
            <div className="auth-sent__icon" aria-hidden="true" />
            <h2 className="auth-sent__title">Link wird geprüft…</h2>
            <p className="auth-sent__text">
              Bitte warte einen Moment, während wir deinen Reset-Link validieren.
            </p>
          </div>
        )}

        {/* Passwort-Formular */}
        {ready && !done && (
          <>
            <h1 className="auth-card__title">Neues Passwort</h1>
            <p className="auth-card__subtitle">Wähle ein sicheres Passwort mit mindestens 8 Zeichen.</p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {error && <p className="auth-form__error">{error}</p>}

              <div className="form-group">
                <label className="form-label" htmlFor="rp-pw">Neues Passwort</label>
                <div className="input-password">
                  <input
                    id="rp-pw"
                    className="form-input"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
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

              <div className="form-group">
                <label className="form-label" htmlFor="rp-confirm">Passwort bestätigen</label>
                <input
                  id="rp-confirm"
                  className="form-input"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
              </div>

              <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
                {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
              </button>
            </form>
          </>
        )}

        {/* Erfolgreich */}
        {done && (
          <div className="auth-sent">
            <div className="auth-sent__icon" aria-hidden="true" />
            <h2 className="auth-sent__title">Passwort gesetzt</h2>
            <p className="auth-sent__text">
              Dein Passwort wurde erfolgreich geändert.
              Du wirst in Kürze zum Login weitergeleitet.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

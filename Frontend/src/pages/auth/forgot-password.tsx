import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';
import { APP_NAME } from '@config/app';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Aus Sicherheitsgründen immer Erfolg zeigen (verhindert E-Mail-Enumeration)
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
    } finally {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <>
      <SeoMeta title="Passwort vergessen" noIndex />
    <div className="auth-card">
      <div className="auth-card__logo">{APP_NAME}<span>.</span></div>
      <h1 className="auth-card__title">Passwort vergessen?</h1>
      <p className="auth-card__subtitle">
        Kein Problem — wir schicken dir einen Reset-Link.
      </p>

      {sent ? (
        <div className="auth-sent">
          <div className="auth-sent__icon" aria-hidden="true" />
          <h2 className="auth-sent__title">E-Mail gesendet</h2>
          <p className="auth-sent__text">
            Falls ein Konto mit <strong>{email}</strong> existiert, erhältst du
            in Kürze eine E-Mail mit einem Reset-Link. Prüfe auch deinen Spam-Ordner.
          </p>
          <Link to={ROUTES.AUTH.LOGIN} className="btn btn--primary btn--full">
            Zurück zum Login
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="fp-email">E-Mail-Adresse</label>
            <input
              id="fp-email"
              className="form-input"
              type="email"
              placeholder="max@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
            {loading ? 'Wird gesendet …' : 'Reset-Link senden'}
          </button>

          <p className="auth-form__footer">
            Passwort wieder eingefallen?{' '}
            <Link to={ROUTES.AUTH.LOGIN}>Zurück zum Login</Link>
          </p>
        </form>
      )}
    </div>
    </>
  );
}

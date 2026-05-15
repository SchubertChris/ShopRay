import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { useAuth } from '@features/auth';
import { updateUser } from '@features/users';
import {
  getMfaStatus,
  enrollTotp,
  confirmEnrollTotp,
  disableTotp,
} from '@features/auth';
import { getErrorMessage } from '@/utils/errorMessage';
import { ROUTES } from '@config/routes';
import { supabase } from '@/lib/supabase';

interface ProfileForm {
  firstName: string;
  lastName:  string;
}

interface PwForm {
  currentPassword: string;
  newPassword:     string;
  confirmPassword: string;
}

type MfaStep = 'idle' | 'enrolling-qr' | 'enrolling-verify' | 'disabling';

export default function SettingsPage() {
  const { user, token, setAuth, clearAuth } = useAuth();
  const navigate = useNavigate();

  // ── Profil ──────────────────────────────────────────────────────────────
  const [profile,        setProfile]       = useState<ProfileForm>({ firstName: '', lastName: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError,   setProfileError]   = useState<string | null>(null);

  // ── Passwort ────────────────────────────────────────────────────────────
  const [pw,        setPw]       = useState<PwForm>({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError,   setPwError]   = useState<string | null>(null);

  // ── 2FA ─────────────────────────────────────────────────────────────────
  const [mfaEnabled,   setMfaEnabled]   = useState(false);
  const [mfaLoading,   setMfaLoading]   = useState(true);
  const [mfaStep,      setMfaStep]      = useState<MfaStep>('idle');
  const [mfaError,     setMfaError]     = useState<string | null>(null);
  const [mfaSuccess,   setMfaSuccess]   = useState<string | null>(null);
  const [enrollData,   setEnrollData]   = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [mfaCode,      setMfaCode]      = useState('');
  const [mfaSubmitting, setMfaSubmitting] = useState(false);

  // ── Konto löschen ────────────────────────────────────────────────────────
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteInput,   setDeleteInput]   = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  useEffect(() => {
    if (user) setProfile({ firstName: user.firstName, lastName: user.lastName });
  }, [user]);

  useEffect(() => {
    getMfaStatus()
      .then(setMfaEnabled)
      .finally(() => setMfaLoading(false));
  }, []);

  // ── Profil speichern ────────────────────────────────────────────────────
  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const updated = await updateUser(profile);
      const { data: { session } } = await supabase.auth.getSession();
      setAuth(updated, session?.access_token ?? token ?? '');
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Passwort ändern ─────────────────────────────────────────────────────
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) {
      setPwError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    if (pw.newPassword.length < 8) {
      setPwError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    setPwLoading(true);
    setPwError(null);
    setPwSuccess(false);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    user?.email ?? '',
        password: pw.currentPassword,
      });
      if (signInErr) throw new Error('Aktuelles Passwort ist falsch.');

      const { error: updateErr } = await supabase.auth.updateUser({ password: pw.newPassword });
      if (updateErr) throw updateErr;

      setPwSuccess(true);
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  }

  // ── 2FA aktivieren ──────────────────────────────────────────────────────
  async function handleStartEnroll() {
    setMfaError(null);
    setMfaSuccess(null);
    setMfaSubmitting(true);
    try {
      const data = await enrollTotp();
      setEnrollData(data);
      setMfaStep('enrolling-qr');
    } catch (err) {
      setMfaError(getErrorMessage(err));
    } finally {
      setMfaSubmitting(false);
    }
  }

  async function handleConfirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollData) return;
    setMfaSubmitting(true);
    setMfaError(null);
    try {
      await confirmEnrollTotp(enrollData.factorId, mfaCode);
      setMfaEnabled(true);
      setMfaStep('idle');
      setEnrollData(null);
      setMfaCode('');
      setMfaSuccess('2FA wurde erfolgreich aktiviert.');
      setTimeout(() => setMfaSuccess(null), 5000);
    } catch {
      setMfaError('Ungültiger Code. Bitte erneut versuchen.');
      setMfaCode('');
    } finally {
      setMfaSubmitting(false);
    }
  }

  // ── 2FA deaktivieren ────────────────────────────────────────────────────
  async function handleDisableMfa(e: React.FormEvent) {
    e.preventDefault();
    setMfaSubmitting(true);
    setMfaError(null);
    try {
      await disableTotp(mfaCode);
      setMfaEnabled(false);
      setMfaStep('idle');
      setMfaCode('');
      setMfaSuccess('2FA wurde deaktiviert.');
      setTimeout(() => setMfaSuccess(null), 5000);
    } catch {
      setMfaError('Ungültiger Code. Bitte erneut versuchen.');
      setMfaCode('');
    } finally {
      setMfaSubmitting(false);
    }
  }

  function handleCancelMfa() {
    setMfaStep('idle');
    setEnrollData(null);
    setMfaCode('');
    setMfaError(null);
  }

  // ── Konto löschen ───────────────────────────────────────────────────────
  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (deleteInput !== user?.email) {
      setDeleteError('Die eingegebene E-Mail-Adresse stimmt nicht überein.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'}/customers/me`,
        {
          method:  'DELETE',
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
        },
      );
      if (!res.ok) throw new Error('Konto konnte nicht gelöscht werden.');
      await supabase.auth.signOut();
      clearAuth();
      navigate(ROUTES.HOME);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  }

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '?';

  return (
    <>
      <SeoMeta title="Einstellungen" noIndex />
      <div className="settings-page">

        {/* ── Profil-Sektion ── */}
        <section className="settings-section">
          <div className="settings-avatar">
            <div className="settings-avatar__img">{initials}</div>
            <div className="settings-avatar__info">
              <div className="settings-avatar__name">{user?.firstName} {user?.lastName}</div>
              <div className="settings-avatar__email">{user?.email}</div>
            </div>
          </div>

          <div className="settings-section__header">
            <div className="settings-section__title">Persönliche Daten</div>
            <div className="settings-section__subtitle">Name und Kontaktdaten anpassen</div>
          </div>

          <form className="settings-form" onSubmit={handleProfileSave}>
            {profileError && <p className="settings-form__error">{profileError}</p>}

            <div className="settings-form__row">
              <div className="form-group">
                <label className="form-label" htmlFor="s-firstname">Vorname</label>
                <input
                  id="s-firstname"
                  className="form-input"
                  type="text"
                  required
                  value={profile.firstName}
                  onChange={e => setProfile(f => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-lastname">Nachname</label>
                <input
                  id="s-lastname"
                  className="form-input"
                  type="text"
                  required
                  value={profile.lastName}
                  onChange={e => setProfile(f => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">E-Mail-Adresse</label>
              <input
                className="form-input"
                type="email"
                value={user?.email ?? ''}
                disabled
                aria-describedby="email-note"
              />
              <span id="email-note" className="form-hint">
                E-Mail-Adresse kann nicht geändert werden.
              </span>
            </div>

            <div className="settings-form__actions">
              <button className="btn btn--primary btn--sm" type="submit" disabled={profileLoading}>
                {profileLoading ? 'Speichert…' : 'Speichern'}
              </button>
              {profileSuccess && <span className="settings-form__success">✓ Gespeichert</span>}
            </div>
          </form>
        </section>

        {/* ── Passwort-Sektion ── */}
        <section className="settings-section">
          <div className="settings-section__header">
            <div className="settings-section__title">Passwort ändern</div>
            <div className="settings-section__subtitle">Mindestens 8 Zeichen</div>
          </div>

          <form className="settings-form" onSubmit={handlePasswordChange}>
            {pwError && <p className="settings-form__error">{pwError}</p>}

            <div className="form-group">
              <label className="form-label" htmlFor="s-curpw">Aktuelles Passwort</label>
              <input
                id="s-curpw"
                className="form-input"
                type="password"
                autoComplete="current-password"
                required
                value={pw.currentPassword}
                onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))}
              />
            </div>

            <div className="settings-form__row">
              <div className="form-group">
                <label className="form-label" htmlFor="s-newpw">Neues Passwort</label>
                <input
                  id="s-newpw"
                  className="form-input"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={pw.newPassword}
                  onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-confirmpw">Passwort bestätigen</label>
                <input
                  id="s-confirmpw"
                  className="form-input"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={pw.confirmPassword}
                  onChange={e => setPw(p => ({ ...p, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            <div className="settings-form__actions">
              <button className="btn btn--primary btn--sm" type="submit" disabled={pwLoading}>
                {pwLoading ? 'Wird geändert…' : 'Passwort ändern'}
              </button>
              {pwSuccess && <span className="settings-form__success">✓ Passwort geändert</span>}
            </div>
          </form>
        </section>

        {/* ── 2FA-Sektion ── */}
        <section className="settings-section">
          <div className="twofa-header">
            <div>
              <div className="settings-section__title">Zwei-Faktor-Authentifizierung</div>
              <div className="settings-section__subtitle">
                Extra Sicherheitsschicht per Authenticator-App (Google Authenticator, Authy)
              </div>
            </div>
            {!mfaLoading && (
              <span className={`twofa-badge twofa-badge--${mfaEnabled ? 'on' : 'off'}`}>
                {mfaEnabled ? 'Aktiv' : 'Inaktiv'}
              </span>
            )}
          </div>

          {mfaError   && <p className="settings-form__error">{mfaError}</p>}
          {mfaSuccess && <p className="twofa-success">{mfaSuccess}</p>}

          {/* Idle: Aktiv oder Inaktiv */}
          {mfaStep === 'idle' && !mfaLoading && (
            mfaEnabled ? (
              <div className="twofa-idle">
                <p className="twofa-idle__text">
                  Dein Konto ist mit einer Authenticator-App gesichert.
                  Bei jedem Login wird ein 6-stelliger Code abgefragt.
                </p>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => { setMfaStep('disabling'); setMfaCode(''); setMfaError(null); }}
                >
                  2FA deaktivieren
                </button>
              </div>
            ) : (
              <div className="twofa-idle">
                <p className="twofa-idle__text">
                  Aktiviere 2FA, um dein Konto mit einem zeitbasierten Einmal-Code
                  zusätzlich abzusichern. Kostenlos, kein SMS erforderlich.
                </p>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={handleStartEnroll}
                  disabled={mfaSubmitting}
                >
                  {mfaSubmitting ? 'Wird vorbereitet…' : '2FA aktivieren'}
                </button>
              </div>
            )
          )}

          {/* QR-Code anzeigen */}
          {mfaStep === 'enrolling-qr' && enrollData && (
            <div className="twofa-enroll">
              <p className="twofa-enroll__instruction">
                <strong>Schritt 1:</strong> Scanne diesen QR-Code mit deiner Authenticator-App.
              </p>
              <img
                className="twofa-qr"
                src={enrollData.qrCode}
                alt="2FA QR-Code — mit Authenticator-App scannen"
              />
              <div className="twofa-manual">
                <div className="twofa-manual__label">Kein Scan möglich? Code manuell eingeben:</div>
                <code className="twofa-manual__code">{enrollData.secret}</code>
              </div>
              <div className="twofa-enroll__actions">
                <button className="btn btn--primary btn--sm" onClick={() => setMfaStep('enrolling-verify')}>
                  Weiter — Code eingeben →
                </button>
                <button className="btn btn--ghost btn--sm" onClick={handleCancelMfa}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Code zur Bestätigung eingeben */}
          {mfaStep === 'enrolling-verify' && (
            <form className="twofa-verify" onSubmit={handleConfirmEnroll}>
              <p className="twofa-verify__instruction">
                <strong>Schritt 2:</strong> Gib den 6-stelligen Code aus deiner Authenticator-App ein.
              </p>
              <input
                className="twofa-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={mfaSubmitting}
              />
              <div className="twofa-verify__actions">
                <button
                  className="btn btn--primary btn--sm"
                  type="submit"
                  disabled={mfaSubmitting || mfaCode.length < 6}
                >
                  {mfaSubmitting ? 'Wird geprüft…' : '2FA bestätigen'}
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  type="button"
                  onClick={() => setMfaStep('enrolling-qr')}
                >
                  Zurück
                </button>
              </div>
            </form>
          )}

          {/* 2FA deaktivieren */}
          {mfaStep === 'disabling' && (
            <form className="twofa-verify" onSubmit={handleDisableMfa}>
              <p className="twofa-verify__instruction">
                Gib deinen aktuellen Authenticator-Code ein, um 2FA zu deaktivieren.
              </p>
              <input
                className="twofa-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={mfaSubmitting}
              />
              <div className="twofa-verify__actions">
                <button
                  className="btn btn--danger btn--sm"
                  type="submit"
                  disabled={mfaSubmitting || mfaCode.length < 6}
                >
                  {mfaSubmitting ? 'Wird deaktiviert…' : '2FA deaktivieren'}
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  type="button"
                  onClick={handleCancelMfa}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ── Danger Zone ── */}
        <section className="danger-zone">
          <div className="danger-zone__header">
            <div className="danger-zone__title">Konto löschen</div>
            <div className="danger-zone__subtitle">
              Unwiderruflich — alle persönlichen Daten, Bestellhistorie und Einstellungen werden dauerhaft gelöscht.
              Gesetzliche Aufbewahrungspflichten (§ 257 HGB, § 147 AO) bleiben hiervon unberührt.
            </div>
          </div>

          {!deleteOpen ? (
            <button className="btn btn--danger btn--sm" onClick={() => setDeleteOpen(true)}>
              Konto löschen
            </button>
          ) : (
            <form className="delete-confirm" onSubmit={handleDeleteAccount}>
              <p className="delete-confirm__text">
                Bestätige die Löschung, indem du deine E-Mail-Adresse eingibst:
                <strong className="delete-confirm__email"> {user?.email}</strong>
              </p>
              {deleteError && <p className="settings-form__error">{deleteError}</p>}
              <input
                className="form-input"
                type="email"
                placeholder="Deine E-Mail-Adresse zur Bestätigung"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                required
                autoComplete="off"
              />
              <div className="delete-confirm__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => { setDeleteOpen(false); setDeleteInput(''); setDeleteError(null); }}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn btn--danger btn--sm" disabled={deleteLoading}>
                  {deleteLoading ? 'Wird gelöscht…' : 'Unwiderruflich löschen'}
                </button>
              </div>
            </form>
          )}
        </section>

      </div>
    </>
  );
}

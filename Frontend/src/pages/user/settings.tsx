import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { useAuth } from '@features/auth';
import { updateUser } from '@features/users';
import { getErrorMessage } from '@/utils/errorMessage';
import { ROUTES } from '@config/routes';
import api from '@/api/axiosinstance';

interface ProfileForm {
  firstName: string;
  lastName:  string;
}

interface PwForm {
  currentPassword: string;
  newPassword:     string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { user, token, setAuth, clearAuth } = useAuth();
  const navigate = useNavigate();

  const [profile,        setProfile]       = useState<ProfileForm>({ firstName: '', lastName: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError,   setProfileError]   = useState<string | null>(null);

  const [pw,        setPw]       = useState<PwForm>({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError,   setPwError]   = useState<string | null>(null);

  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteInput,   setDeleteInput]   = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfile({ firstName: user.firstName, lastName: user.lastName });
    }
  }, [user]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const updated = await updateUser(profile);
      if (token) setAuth(updated, token);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setProfileLoading(false);
    }
  }

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
      await api.post('/auth/change-password', {
        currentPassword: pw.currentPassword,
        newPassword:     pw.newPassword,
      });
      setPwSuccess(true);
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (deleteInput !== user?.email) {
      setDeleteError('Die eingegebene E-Mail-Adresse stimmt nicht überein.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.delete('/users/me');
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
              <div className="settings-avatar__name">
                {user?.firstName} {user?.lastName}
              </div>
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

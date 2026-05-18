import { useState, useEffect, useCallback } from 'react';
import { Users, Trash2, Plus, Loader2, AlertCircle, UserCheck, Clock, Copy, Check, KeyRound, Mail } from 'lucide-react';
import {
  getMods, addMod, removeMod, cancelInvite,
  type ModUser, type PendingInvite,
} from '../../../api/adminApi';

export default function TeamTab() {
  const [active,     setActive]     = useState<ModUser[]>([]);
  const [pending,    setPending]    = useState<PendingInvite[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [email,      setEmail]      = useState('');
  const [adding,     setAdding]     = useState(false);
  const [addError,   setAddError]   = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [removingId,     setRemovingId]     = useState<string | null>(null);
  const [tempPw,         setTempPw]         = useState<{ email: string; pw: string } | null>(null);
  const [copied,         setCopied]         = useState(false);
  const [removeConfirm,  setRemoveConfirm]  = useState<ModUser | null>(null);
  const [cancelConfirm,  setCancelConfirm]  = useState<PendingInvite | null>(null);
  const [removeError,    setRemoveError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMods();
      setActive(data.active);
      setPending(data.pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setAdding(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      const result = await addMod(trimmed);
      setEmail('');
      if (result.invited && result.tempPassword) {
        // Neuer User → mit Startpasswort angelegt
        setPending(prev => [...prev, { id: crypto.randomUUID(), email: trimmed, invited_at: new Date().toISOString() }]);
        setTempPw({ email: trimmed, pw: result.tempPassword });
      } else {
        // Existierender User → direkt als Mod hinzugefügt
        setActive(prev => [...prev, { id: result.id!, email: trimmed, created_at: new Date().toISOString() }]);
        setAddSuccess(`${trimmed} wurde als Mitarbeiter hinzugefügt.`);
        setTimeout(() => setAddSuccess(null), 5000);
      }
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Hinzufügen fehlgeschlagen.');
    } finally {
      setAdding(false);
    }
  }

  function handleRemove(mod: ModUser) {
    setRemoveError(null);
    setRemoveConfirm(mod);
  }

  async function confirmRemove() {
    if (!removeConfirm) return;
    const mod = removeConfirm;
    setRemoveConfirm(null);
    setRemovingId(mod.id);
    setRemoveError(null);
    try {
      await removeMod(mod.id);
      setActive(prev => prev.filter(m => m.id !== mod.id));
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Entfernen fehlgeschlagen.');
    } finally {
      setRemovingId(null);
    }
  }

  function handleCancelInvite(invite: PendingInvite) {
    setRemoveError(null);
    setCancelConfirm(invite);
  }

  async function confirmCancelInvite() {
    if (!cancelConfirm) return;
    const invite = cancelConfirm;
    setCancelConfirm(null);
    setRemovingId(invite.id);
    setRemoveError(null);
    try {
      await cancelInvite(invite.id);
      setPending(prev => prev.filter(i => i.id !== invite.id));
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Zurückziehen fehlgeschlagen.');
    } finally {
      setRemovingId(null);
    }
  }

  const hasAny = active.length > 0 || pending.length > 0;

  function handleCopyPw() {
    if (!tempPw) return;
    void navigator.clipboard.writeText(tempPw.pw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="settings-section">

      {/* ── Mitarbeiter entfernen ── */}
      {removeConfirm && (
        <div className="modal-overlay" onClick={() => setRemoveConfirm(null)}>
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Mitarbeiter-Rechte entziehen</h3>
            </div>
            <div className="modal__body">
              <p>Soll <strong>{removeConfirm.email}</strong> der Zugriff auf das Admin-Panel wirklich entzogen werden?</p>
            </div>
            <div className="modal__footer">
              <button className="btn-secondary" onClick={() => setRemoveConfirm(null)}>Abbrechen</button>
              <button className="btn-danger" onClick={confirmRemove}>Entziehen</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Einladung zurückziehen ── */}
      {cancelConfirm && (
        <div className="modal-overlay" onClick={() => setCancelConfirm(null)}>
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Einladung zurückziehen</h3>
            </div>
            <div className="modal__body">
              <p>Die Einladung an <strong>{cancelConfirm.email}</strong> wirklich zurückziehen?</p>
            </div>
            <div className="modal__footer">
              <button className="btn-secondary" onClick={() => setCancelConfirm(null)}>Abbrechen</button>
              <button className="btn-danger" onClick={confirmCancelInvite}>Zurückziehen</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Startpasswort-Modal ── */}
      {tempPw && (
        <div className="temp-pw-overlay" onClick={() => setTempPw(null)}>
          <div className="temp-pw-modal" onClick={e => e.stopPropagation()}>
            <div className="temp-pw-modal__icon">
              <KeyRound size={20} strokeWidth={1.75} />
            </div>
            <h3 className="temp-pw-modal__title">Konto erstellt</h3>
            <p className="temp-pw-modal__desc">
              Teile das Startpasswort sicher mit <strong>{tempPw.email}</strong>.
              Der Mitarbeiter muss es beim ersten Login ändern.
            </p>
            <div className="temp-pw-modal__pw-row">
              <code className="temp-pw-modal__pw">{tempPw.pw}</code>
              <button className="btn-icon" onClick={handleCopyPw} title="Kopieren">
                {copied ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} strokeWidth={2} />}
              </button>
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setTempPw(null)}>
              Verstanden
            </button>
          </div>
        </div>
      )}

      <div className="form-section__head">
        <h2 className="form-section__title">Mitarbeiter</h2>
        <p className="form-section__desc">
          Mitarbeiter haben Zugriff auf Bestellungen, Tickets und Kunden —
          aber nicht auf Produkte, Kategorien oder Einstellungen.
          Noch kein Account? Eine Einladungs-Mail wird automatisch verschickt.
        </p>
      </div>

      {/* Invite-Form */}
      <form className="team-add-form" onSubmit={handleAdd}>
        <div className="form-field team-add-form__input">
          <label className="form-label" htmlFor="mod-email-input">E-Mail des Mitarbeiters</label>
          <input
            id="mod-email-input"
            className="form-input"
            type="email"
            placeholder="mitarbeiter@beispiel.de"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <button className="btn-primary team-add-form__btn" type="submit" disabled={adding || !email.trim()}>
          {adding
            ? <><Loader2 size={14} strokeWidth={2} className="spin" />Wird gesendet…</>
            : <><Plus size={14} strokeWidth={2.5} />Hinzufügen / Einladen</>
          }
        </button>
      </form>

      {addError    && <p className="form-error-inline"   style={{ marginTop: '0.5rem' }}>{addError}</p>}
      {addSuccess  && <p className="form-success-inline" style={{ marginTop: '0.5rem' }}>{addSuccess}</p>}
      {removeError && <p className="form-error-inline"   style={{ marginTop: '0.5rem' }}>{removeError}</p>}

      {/* Loading */}
      {loading && (
        <div className="page-loading" style={{ marginTop: '1.5rem' }}>
          <Loader2 size={28} strokeWidth={1.5} className="spin" />
          <span>Wird geladen…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="page-loading" style={{ marginTop: '1.5rem' }}>
          <AlertCircle size={28} strokeWidth={1.5} />
          <p>{error}</p>
          <button className="btn-secondary" onClick={load}>Erneut versuchen</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !hasAny && (
        <div className="page-loading" style={{ marginTop: '1.5rem' }}>
          <UserCheck size={28} strokeWidth={1.5} />
          <p>Noch keine Mitarbeiter. Füge die erste Person oben hinzu.</p>
        </div>
      )}

      {/* Listen */}
      {!loading && !error && hasAny && (
        <div className="team-list">

          {/* Aktive Mods */}
          {active.length > 0 && (
            <>
              {pending.length > 0 && (
                <p className="team-list__section-label">
                  <Users size={12} strokeWidth={2} />
                  Aktiv
                </p>
              )}
              {active.map(mod => (
                <div key={mod.id} className="team-item">
                  <div className="team-item__info">
                    <Users size={15} strokeWidth={1.75} />
                    <span className="team-item__email">{mod.email}</span>
                    <span className="team-item__since">
                      seit {new Date(mod.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  <button
                    className="btn-icon btn-icon--danger"
                    onClick={() => handleRemove(mod)}
                    disabled={removingId === mod.id}
                    title="Mitarbeiter-Rechte entziehen"
                  >
                    {removingId === mod.id
                      ? <Loader2 size={14} strokeWidth={2} className="spin" />
                      : <Trash2  size={14} strokeWidth={2} />
                    }
                  </button>
                </div>
              ))}
            </>
          )}

          {/* Ausstehende Einladungen */}
          {pending.length > 0 && (
            <>
              <p className="team-list__section-label">
                <Clock size={12} strokeWidth={2} />
                Startpasswort noch nicht geändert
              </p>
              {pending.map(invite => (
                <div key={invite.id} className="team-item team-item--pending">
                  <div className="team-item__info">
                    <Mail size={15} strokeWidth={1.75} />
                    <span className="team-item__email">{invite.email}</span>
                    <span className="team-item__since team-item__since--pending">
                      eingeladen {new Date(invite.invited_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  <button
                    className="btn-icon btn-icon--danger"
                    onClick={() => handleCancelInvite(invite)}
                    disabled={removingId === invite.id}
                    title="Einladung zurückziehen"
                  >
                    {removingId === invite.id
                      ? <Loader2 size={14} strokeWidth={2} className="spin" />
                      : <Trash2  size={14} strokeWidth={2} />
                    }
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

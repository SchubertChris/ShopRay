import { useState, useEffect, useCallback } from 'react';
import { Users, Trash2, Plus, Loader2, AlertCircle, UserCheck, Mail, Clock } from 'lucide-react';
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
  const [removingId, setRemovingId] = useState<string | null>(null);

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
      if (result.invited) {
        // Neuer User → Einladungsmail verschickt
        setPending(prev => [...prev, { id: crypto.randomUUID(), email: trimmed, invited_at: new Date().toISOString() }]);
        setAddSuccess(`Einladung an ${trimmed} wurde gesendet.`);
      } else {
        // Existierender User → direkt als Mod hinzugefügt
        setActive(prev => [...prev, { id: result.id!, email: trimmed, created_at: new Date().toISOString() }]);
        setAddSuccess(`${trimmed} wurde als Mitarbeiter hinzugefügt.`);
      }
      setTimeout(() => setAddSuccess(null), 5000);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Hinzufügen fehlgeschlagen.');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(mod: ModUser) {
    if (!confirm(`Mitarbeiter-Rechte von „${mod.email}" wirklich entziehen?`)) return;
    setRemovingId(mod.id);
    try {
      await removeMod(mod.id);
      setActive(prev => prev.filter(m => m.id !== mod.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Entfernen fehlgeschlagen.');
    } finally {
      setRemovingId(null);
    }
  }

  async function handleCancelInvite(invite: PendingInvite) {
    if (!confirm(`Einladung an „${invite.email}" wirklich zurückziehen?`)) return;
    setRemovingId(invite.id);
    try {
      await cancelInvite(invite.id);
      setPending(prev => prev.filter(i => i.id !== invite.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Zurückziehen fehlgeschlagen.');
    } finally {
      setRemovingId(null);
    }
  }

  const hasAny = active.length > 0 || pending.length > 0;

  return (
    <div className="settings-section">
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

      {addError   && <p className="form-error-inline" style={{ marginTop: '0.5rem' }}>{addError}</p>}
      {addSuccess && <p className="form-success-inline" style={{ marginTop: '0.5rem' }}>{addSuccess}</p>}

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
                Eingeladen — wartet auf Kontoaktivierung
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

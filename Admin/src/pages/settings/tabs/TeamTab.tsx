import { useState, useEffect, useCallback } from 'react';
import { Users, Trash2, Plus, Loader2, AlertCircle, UserCheck } from 'lucide-react';
import { getMods, addMod, removeMod, type ModUser } from '../../../api/adminApi';

export default function TeamTab() {
  const [mods,       setMods]       = useState<ModUser[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [email,      setEmail]      = useState('');
  const [adding,     setAdding]     = useState(false);
  const [addError,   setAddError]   = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMods(await getMods());
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
    try {
      const created = await addMod(trimmed);
      setMods(prev => [...prev, { id: created.id, email: created.email, created_at: new Date().toISOString() }]);
      setEmail('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Hinzufügen fehlgeschlagen.');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(mod: ModUser) {
    if (!confirm(`Mitarbeiter-Rechte von "${mod.email}" wirklich entziehen?`)) return;
    setRemovingId(mod.id);
    try {
      await removeMod(mod.id);
      setMods(prev => prev.filter(m => m.id !== mod.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Entfernen fehlgeschlagen.');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="settings-section">
      <div className="form-section__head">
        <h2 className="form-section__title">Mitarbeiter</h2>
        <p className="form-section__desc">
          Mitarbeiter haben Zugriff auf Bestellungen, Tickets und Kunden — aber nicht auf Produkte, Kategorien oder Einstellungen.
          Der Nutzer muss bereits einen Account im Shop haben.
        </p>
      </div>

      <form className="team-add-form" onSubmit={handleAdd}>
        <div className="form-field team-add-form__input">
          <label className="form-label" htmlFor="mod-email-input">E-Mail des Nutzers</label>
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
          <Plus size={14} strokeWidth={2.5} />
          {adding ? 'Wird hinzugefügt…' : 'Hinzufügen'}
        </button>
      </form>
      {addError && <p className="form-error-inline" style={{ marginTop: '0.5rem' }}>{addError}</p>}

      {loading && (
        <div className="page-loading" style={{ marginTop: '1.5rem' }}>
          <Loader2 size={28} strokeWidth={1.5} className="spin" />
          <span>Wird geladen…</span>
        </div>
      )}

      {!loading && error && (
        <div className="page-loading" style={{ marginTop: '1.5rem' }}>
          <AlertCircle size={28} strokeWidth={1.5} />
          <p>{error}</p>
          <button className="btn-secondary" onClick={load}>Erneut versuchen</button>
        </div>
      )}

      {!loading && !error && mods.length === 0 && (
        <div className="page-loading" style={{ marginTop: '1.5rem' }}>
          <UserCheck size={28} strokeWidth={1.5} />
          <p>Noch keine Mitarbeiter. Füge die erste Person oben hinzu.</p>
        </div>
      )}

      {!loading && !error && mods.length > 0 && (
        <div className="team-list">
          {mods.map(mod => (
            <div key={mod.id} className="team-item">
              <div className="team-item__info">
                <Users size={15} strokeWidth={1.75} />
                <span className="team-item__email">{mod.email}</span>
                <span className="team-item__since">seit {new Date(mod.created_at).toLocaleDateString('de-DE')}</span>
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
        </div>
      )}
    </div>
  );
}

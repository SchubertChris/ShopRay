import { useState, useEffect, useCallback } from 'react';
import {
  TicketPercent, Plus, Pencil, Trash2, RefreshCw,
  Loader2, AlertCircle, CheckCircle, XCircle, X,
} from 'lucide-react';
import {
  getDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode,
  type DiscountCode, type DiscountCodeInput,
} from '../../api/adminApi';
import { useAuthStore } from '@stores/authStore';

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  } catch { return iso; }
}

function formatDateInput(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

const EMPTY_FORM: DiscountCodeInput = {
  code:       '',
  type:       'percent',
  value:      10,
  min_order:  0,
  max_uses:   null,
  active:     true,
  expires_at: null,
};

interface FormState extends Omit<DiscountCodeInput, 'max_uses' | 'value' | 'min_order'> {
  value:        string;
  min_order:    string;
  max_uses:     string;
  expires_at:   string;
}

function toFormState(d: DiscountCodeInput): FormState {
  return {
    ...d,
    value:      String(d.value),
    min_order:  String(d.min_order),
    max_uses:   d.max_uses != null ? String(d.max_uses) : '',
    expires_at: formatDateInput(d.expires_at ?? null),
  };
}

function fromFormState(f: FormState): DiscountCodeInput {
  return {
    code:       f.code.toUpperCase().trim(),
    type:       f.type,
    value:      parseFloat(f.value) || 0,
    min_order:  parseFloat(f.min_order) || 0,
    max_uses:   f.max_uses ? parseInt(f.max_uses) : null,
    active:     f.active,
    expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
  };
}

export default function DiscountsPage() {
  const role    = useAuthStore(s => s.role);
  const isOwner = role === 'owner';

  const [codes,         setCodes]         = useState<DiscountCode[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [busy,          setBusy]          = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; code: string } | null>(null);
  const [modal,         setModal]         = useState<'create' | 'edit' | null>(null);
  const [editTarget,    setEditTarget]    = useState<string | null>(null);
  const [form,          setForm]          = useState<FormState>(toFormState(EMPTY_FORM));
  const [formError,     setFormError]     = useState<string | null>(null);
  const [saving,        setSaving]        = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCodes(await getDiscountCodes());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm(toFormState(EMPTY_FORM));
    setFormError(null);
    setEditTarget(null);
    setModal('create');
  }

  function openEdit(code: DiscountCode) {
    setForm(toFormState({
      code:       code.code,
      type:       code.type,
      value:      code.value,
      min_order:  code.min_order,
      max_uses:   code.max_uses,
      active:     code.active,
      expires_at: code.expires_at,
    }));
    setFormError(null);
    setEditTarget(code.id);
    setModal('edit');
  }

  async function handleSave() {
    setFormError(null);
    const payload = fromFormState(form);

    if (!payload.code) { setFormError('Code darf nicht leer sein.'); return; }
    if (isNaN(payload.value) || payload.value <= 0) { setFormError('Wert muss größer als 0 sein.'); return; }
    if (payload.type === 'percent' && payload.value > 100) { setFormError('Prozentwert kann nicht über 100 liegen.'); return; }

    setSaving(true);
    try {
      if (modal === 'create') {
        const created = await createDiscountCode(payload);
        setCodes(prev => [created, ...prev]);
      } else if (editTarget) {
        const updated = await updateDiscountCode(editTarget, payload);
        setCodes(prev => prev.map(c => c.id === editTarget ? updated : c));
      }
      setModal(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(code: DiscountCode) {
    setBusy(code.id);
    try {
      const updated = await updateDiscountCode(code.id, { active: !code.active });
      setCodes(prev => prev.map(c => c.id === code.id ? updated : c));
    } finally { setBusy(null); }
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    setDeleteConfirm(null);
    setBusy(id);
    try {
      await deleteDiscountCode(id);
      setCodes(prev => prev.filter(c => c.id !== id));
    } finally { setBusy(null); }
  }

  function isExpired(code: DiscountCode) {
    return code.expires_at != null && new Date(code.expires_at) < new Date();
  }

  function isExhausted(code: DiscountCode) {
    return code.max_uses != null && code.uses >= code.max_uses;
  }

  const active   = codes.filter(c => c.active && !isExpired(c) && !isExhausted(c)).length;
  const inactive = codes.length - active;

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Shop</span>
          <h1 className="page-header__title">Gutscheincodes</h1>
          <p className="page-header__sub">
            {active} aktiv · {inactive} inaktiv / abgelaufen
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn-secondary" onClick={load} disabled={loading} title="Aktualisieren">
            <RefreshCw size={15} strokeWidth={2} />
            Aktualisieren
          </button>
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={15} strokeWidth={2} />
            Neuer Code
          </button>
        </div>
      </div>

      {loading && (
        <div className="inq-state">
          <div className="inq-state__icon"><Loader2 size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">Lade Gutscheincodes…</p>
        </div>
      )}

      {!loading && error && (
        <div className="inq-state">
          <div className="inq-state__icon"><AlertCircle size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">{error}</p>
          <button className="inq-state__retry" onClick={load}>Erneut versuchen</button>
        </div>
      )}

      {!loading && !error && codes.length === 0 && (
        <div className="inq-state">
          <div className="inq-state__icon"><TicketPercent size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">Noch keine Gutscheincodes angelegt.</p>
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={14} /> Ersten Code anlegen
          </button>
        </div>
      )}

      {!loading && !error && codes.length > 0 && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Typ</th>
                <th>Wert</th>
                <th>Mindestbestellwert</th>
                <th>Nutzungen</th>
                <th>Gültig bis</th>
                <th>Status</th>
                <th className="admin-table__actions-col">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(code => {
                const expired   = isExpired(code);
                const exhausted = isExhausted(code);
                const effective = code.active && !expired && !exhausted;

                return (
                  <tr key={code.id} className={effective ? '' : 'admin-table__row--muted'}>
                    <td>
                      <span className="disc-code">{code.code}</span>
                    </td>
                    <td>
                      <span className={`disc-type disc-type--${code.type}`}>
                        {code.type === 'percent' ? 'Prozent' : 'Festbetrag'}
                      </span>
                    </td>
                    <td className="admin-table__num">
                      {code.type === 'percent'
                        ? `${code.value} %`
                        : `€ ${Number(code.value).toFixed(2)}`}
                    </td>
                    <td className="admin-table__muted">
                      {Number(code.min_order) > 0 ? `€ ${Number(code.min_order).toFixed(2)}` : '—'}
                    </td>
                    <td className="admin-table__muted">
                      {code.uses}
                      {code.max_uses != null ? ` / ${code.max_uses}` : ''}
                    </td>
                    <td className="admin-table__muted">
                      {code.expires_at ? (
                        <span className={expired ? 'disc-expired' : ''}>
                          {formatDate(code.expires_at)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {effective
                        ? <span className="status-badge status-badge--paid">Aktiv</span>
                        : expired
                        ? <span className="status-badge status-badge--cancelled">Abgelaufen</span>
                        : exhausted
                        ? <span className="status-badge status-badge--payment_failed">Erschöpft</span>
                        : <span className="status-badge status-badge--pending">Inaktiv</span>
                      }
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          className={`table-action${effective ? ' table-action--warning' : ''}`}
                          title={code.active ? 'Deaktivieren' : 'Aktivieren'}
                          onClick={() => handleToggleActive(code)}
                          disabled={busy === code.id}
                        >
                          {code.active ? <XCircle size={13} strokeWidth={2} /> : <CheckCircle size={13} strokeWidth={2} />}
                        </button>
                        <button
                          className="table-action"
                          title="Bearbeiten"
                          onClick={() => openEdit(code)}
                          disabled={busy === code.id}
                        >
                          <Pencil size={13} strokeWidth={2} />
                        </button>
                        {isOwner && (
                          <button
                            className="table-action table-action--danger"
                            title="Löschen"
                            onClick={() => setDeleteConfirm({ id: code.id, code: code.code })}
                            disabled={busy === code.id}
                          >
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal--md" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                {modal === 'create' ? 'Neuen Gutscheincode anlegen' : 'Gutscheincode bearbeiten'}
              </h3>
              <button className="modal__close" onClick={() => setModal(null)}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="modal__body disc-form">
              {formError && (
                <div className="disc-form__error">
                  <AlertCircle size={14} strokeWidth={2} />
                  {formError}
                </div>
              )}

              <div className="disc-form__row">
                <label className="disc-form__label">Code *</label>
                <input
                  className="disc-form__input disc-form__input--mono"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="z. B. SOMMER25"
                  maxLength={50}
                  autoFocus
                />
              </div>

              <div className="disc-form__row disc-form__row--cols">
                <div>
                  <label className="disc-form__label">Typ *</label>
                  <select
                    className="disc-form__select"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}
                  >
                    <option value="percent">Prozent (%)</option>
                    <option value="fixed">Festbetrag (€)</option>
                  </select>
                </div>
                <div>
                  <label className="disc-form__label">
                    Wert * {form.type === 'percent' ? '(%)' : '(€)'}
                  </label>
                  <input
                    className="disc-form__input"
                    type="number"
                    min="0.01"
                    max={form.type === 'percent' ? 100 : 999999}
                    step="0.01"
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  />
                </div>
              </div>

              <div className="disc-form__row disc-form__row--cols">
                <div>
                  <label className="disc-form__label">Mindestbestellwert (€)</label>
                  <input
                    className="disc-form__input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_order}
                    onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="disc-form__label">Maximale Nutzungen</label>
                  <input
                    className="disc-form__input"
                    type="number"
                    min="1"
                    step="1"
                    value={form.max_uses}
                    onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                    placeholder="Unbegrenzt"
                  />
                </div>
              </div>

              <div className="disc-form__row">
                <label className="disc-form__label">Gültig bis</label>
                <input
                  className="disc-form__input"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                />
              </div>

              <div className="disc-form__row disc-form__row--toggle">
                <label className="disc-form__label">Aktiv</label>
                <button
                  className={`disc-toggle${form.active ? ' disc-toggle--on' : ''}`}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  aria-pressed={form.active}
                >
                  <span className="disc-toggle__thumb" />
                </button>
              </div>
            </div>

            <div className="modal__footer">
              <button className="btn-secondary" onClick={() => setModal(null)}>Abbrechen</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 size={14} className="spin" /> Speichern…</> : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Gutscheincode löschen</h3>
            </div>
            <div className="modal__body">
              <p>„<strong>{deleteConfirm.code}</strong>" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            </div>
            <div className="modal__footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Abbrechen</button>
              <button className="btn-danger" onClick={confirmDelete}>Löschen</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

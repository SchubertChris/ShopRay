import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ExternalLink, CheckCircle2, XCircle, Truck, Package2 } from 'lucide-react';
import { ROUTES } from '@config/routes';
import {
  getReturnRequests,
  updateReturnRequest,
  type AdminReturnRequest,
  type ReturnStatus,
  type ReturnItemData,
} from '../../api/adminApi';

const STATUS_LABELS: Record<ReturnStatus, string> = {
  requested:  'Beantragt',
  approved:   'Genehmigt',
  rejected:   'Abgelehnt',
  label_sent: 'Etikett gesendet',
  received:   'Paket eingegangen',
  refunded:   'Erstattet',
};

const STATUS_TABS: Array<{ key: ReturnStatus | 'all'; label: string }> = [
  { key: 'all',        label: 'Alle'              },
  { key: 'requested',  label: 'Beantragt'         },
  { key: 'approved',   label: 'Genehmigt'         },
  { key: 'label_sent', label: 'Etikett gesendet'  },
  { key: 'received',   label: 'Eingegangen'       },
  { key: 'refunded',   label: 'Erstattet'         },
  { key: 'rejected',   label: 'Abgelehnt'         },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ReturnsPage() {
  const [returns, setReturns]   = useState<AdminReturnRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState<string | null>(null);
  const [tab,     setTab]       = useState<ReturnStatus | 'all'>('all');
  const [editing, setEditing]   = useState<AdminReturnRequest | null>(null);
  const [labelUrl,  setLabelUrl]  = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState<ReturnStatus>('approved');
  const [saving,  setSaving]    = useState(false);
  const [saveErr, setSaveErr]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReturnRequests();
      setReturns(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = tab === 'all' ? returns : returns.filter(r => r.status === tab);

  function openEdit(r: AdminReturnRequest) {
    setEditing(r);
    setNewStatus(r.status);
    setLabelUrl(r.label_url ?? '');
    setAdminNote(r.admin_note ?? '');
    setSaveErr(null);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setSaveErr(null);
    try {
      const updated = await updateReturnRequest(editing.id, {
        status:     newStatus,
        label_url:  labelUrl.trim() || null,
        admin_note: adminNote.trim() || null,
      });
      setReturns(prev => prev.map(r => r.id === updated.id ? updated : r));
      setEditing(null);
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Bestellungen</span>
          <h1 className="page-header__title">Rücksendungen</h1>
          <p className="page-header__sub">
            {loading ? 'Lädt…' : `${returns.length} Anfrage${returns.length !== 1 ? 'n' : ''} insgesamt`}
          </p>
        </div>
      </div>

      {/* Status-Tabs */}
      <div className="filter-bar">
        <div className="filter-bar__tabs">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              className={`filter-bar__tab${tab === t.key ? ' is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key !== 'all' && (
                <span className="filter-bar__tab-count">
                  {returns.filter(r => r.status === t.key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="data-card data-card--error">
          <div className="data-card__body">
            <div className="admin-table__empty">
              <AlertCircle size={18} strokeWidth={1.5} />
              {error}
              <button className="btn-secondary btn-secondary--ml" onClick={load}>Erneut laden</button>
            </div>
          </div>
        </div>
      )}

      {!error && (
        <div className="data-card">
          <div className="data-card__body">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Bestellung</th>
                  <th>Grund</th>
                  <th>Status</th>
                  <th>Datum</th>
                  <th className="admin-table__th--action">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="admin-table__skeleton-row">
                      <td><span className="skeleton skeleton--md" /></td>
                      <td><span className="skeleton skeleton--lg" /></td>
                      <td><span className="skeleton skeleton--sm" /></td>
                      <td><span className="skeleton skeleton--sm" /></td>
                      <td><span className="skeleton skeleton--xs" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table__empty">
                      <Package2 size={18} strokeWidth={1.5} />
                      Keine Rücksendeanträge
                    </td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="admin-table__row--clickable" onDoubleClick={() => openEdit(r)}>
                    <td>
                      <Link
                        to={ROUTES.ORDERS.detail(r.order_id)}
                        className="admin-table__link"
                        onClick={e => e.stopPropagation()}
                      >
                        #{r.orders?.order_number ?? r.order_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td>
                      <span className="admin-table__muted" title={r.reason}>
                        {r.reason.length > 45 ? r.reason.slice(0, 45) + '…' : r.reason}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${r.status}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="admin-table__muted">{fmtDate(r.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-action"
                          title="Bearbeiten"
                          onClick={() => openEdit(r)}
                        >
                          <CheckCircle2 size={14} strokeWidth={2} />
                        </button>
                        {r.label_url && (
                          <a
                            className="table-action"
                            href={r.label_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Etikett öffnen"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink size={13} strokeWidth={2} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bearbeitungs-Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => !saving && setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">
                Rücksendung — #{editing.orders?.order_number ?? editing.order_id.slice(0, 8)}
              </h2>
              <button className="modal__close" onClick={() => setEditing(null)}>✕</button>
            </div>

            <div className="modal__body">
              <div className="form-group">
                <label className="form-label">Grund des Kunden</label>
                <p className="form-static-text">{editing.reason}</p>
              </div>

              {editing.return_items && editing.return_items.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Zurückzusendende Artikel</label>
                  <div className="return-items-list">
                    {(editing.return_items as ReturnItemData[]).map((item, i) => (
                      <div key={i} className="return-items-list__row">
                        <span className="return-items-list__name">{item.productName}</span>
                        <span className="return-items-list__qty">× {item.quantity}</span>
                        <span className="return-items-list__price">{(parseFloat(item.price) * item.quantity).toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as ReturnStatus)}
                  disabled={saving}
                >
                  {(Object.keys(STATUS_LABELS) as ReturnStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
                {newStatus === 'refunded' && (
                  <p className="form-hint form-hint--warning">
                    ⚡ Stripe-Erstattung wird automatisch ausgelöst. Betrag: {
                      editing.return_items && editing.return_items.length > 0
                        ? `${editing.return_items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0).toFixed(2)} €`
                        : `${editing.orders?.total?.toFixed(2) ?? '?'} €`
                    } — E-Mail an Kunden wird gesendet.
                  </p>
                )}
                {newStatus === 'rejected' && (
                  <p className="form-hint form-hint--warning">
                    Ablehnungsgrund in der internen Notiz ergänzen — wird an Kunden gesendet.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Rücksendeetikett-URL</label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://… (z.B. DHL Etikett Link)"
                  value={labelUrl}
                  onChange={e => setLabelUrl(e.target.value)}
                  disabled={saving}
                />
                <p className="form-hint">Wird dem Kunden per E-Mail gesendet wenn Status auf „Etikett gesendet" gesetzt wird.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Interne Notiz</label>
                <textarea
                  className="form-input form-input--textarea"
                  rows={3}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  disabled={saving}
                  placeholder="Nur intern sichtbar…"
                />
              </div>

              {saveErr && <p className="form-error">{saveErr}</p>}
            </div>

            <div className="modal__footer">
              <button className="btn-secondary" onClick={() => setEditing(null)} disabled={saving}>
                Abbrechen
              </button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

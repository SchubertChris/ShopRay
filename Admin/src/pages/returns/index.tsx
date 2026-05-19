import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ExternalLink, CheckCircle2, Package2, Archive, CreditCard } from 'lucide-react';
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

const ACTIVE_STATUSES:  ReturnStatus[] = ['requested', 'approved', 'label_sent', 'received'];
const ARCHIVE_STATUSES: ReturnStatus[] = ['refunded', 'rejected'];

const ACTIVE_TABS: Array<{ key: ReturnStatus | 'all'; label: string }> = [
  { key: 'all',        label: 'Alle'             },
  { key: 'requested',  label: 'Beantragt'        },
  { key: 'approved',   label: 'Genehmigt'        },
  { key: 'label_sent', label: 'Etikett gesendet' },
  { key: 'received',   label: 'Eingegangen'      },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const PAYMENT_LABELS: Record<string, string> = {
  card:        'Kreditkarte',
  paypal:      'PayPal',
  klarna:      'Klarna',
  sofort:      'Sofort',
  apple_pay:   'Apple Pay',
  google_pay:  'Google Pay',
  sepa_debit:  'SEPA-Lastschrift',
};
function fmtPayment(m: string | null | undefined) {
  if (!m) return '—';
  return PAYMENT_LABELS[m] ?? m;
}

type ViewMode = 'active' | 'archive';

export default function ReturnsPage() {
  const [returns,  setReturns]  = useState<AdminReturnRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [tab,      setTab]      = useState<ReturnStatus | 'all'>('all');
  const [editing,  setEditing]  = useState<AdminReturnRequest | null>(null);
  const [labelUrl,  setLabelUrl]  = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState<ReturnStatus>('approved');
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState<string | null>(null);

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

  // Nach View-Mode filtern
  const byMode = viewMode === 'active'
    ? returns.filter(r => ACTIVE_STATUSES.includes(r.status))
    : returns.filter(r => ARCHIVE_STATUSES.includes(r.status));

  // Innerhalb des Modes nochmal nach Tab filtern
  const filtered = tab === 'all' ? byMode : byMode.filter(r => r.status === tab);

  const activeCount  = returns.filter(r => ACTIVE_STATUSES.includes(r.status)).length;
  const archiveCount = returns.filter(r => ARCHIVE_STATUSES.includes(r.status)).length;

  function switchView(mode: ViewMode) {
    setViewMode(mode);
    setTab('all');
  }

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
        <div className="page-header__actions">
          <button
            className={`filter-bar__tab${viewMode === 'active' ? ' is-active' : ''}`}
            onClick={() => switchView('active')}
          >
            Aktiv
            {activeCount > 0 && <span className="tab-nav__count">{activeCount}</span>}
          </button>
          <button
            className={`filter-bar__tab${viewMode === 'archive' ? ' is-active' : ''}`}
            onClick={() => switchView('archive')}
          >
            <Archive size={13} strokeWidth={2} />
            Archiv
            {archiveCount > 0 && <span className="tab-nav__count">{archiveCount}</span>}
          </button>
        </div>
      </div>

      {/* Status-Tabs (nur im Aktiv-Modus) */}
      {viewMode === 'active' && (
        <div className="filter-bar">
          <div className="filter-bar__tabs">
            {ACTIVE_TABS.map(t => (
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
      )}

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
                      {viewMode === 'active' ? 'Keine aktiven Rücksendeanträge' : 'Keine archivierten Einträge'}
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
                        {viewMode === 'active' && (
                          <button
                            className="table-action"
                            title="Bearbeiten"
                            onClick={() => openEdit(r)}
                          >
                            <CheckCircle2 size={14} strokeWidth={2} />
                          </button>
                        )}
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

              <div className="form-group">
                <label className="form-label">
                  <CreditCard size={13} strokeWidth={2} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
                  Zahlungsart
                </label>
                <p className="form-static-text">{fmtPayment(editing.orders?.payment_method)}</p>
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
                    ⚡ Stripe-Erstattung wird automatisch ausgelöst. Betrag:{' '}
                    {editing.return_items && editing.return_items.length > 0
                      ? `${editing.return_items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0).toFixed(2)} €`
                      : `${editing.orders?.total?.toFixed(2) ?? '?'} €`
                    } — Ticket + E-Mail an Kunden.
                  </p>
                )}
                {newStatus === 'approved' && editing.status !== 'approved' && (
                  <p className="form-hint form-hint--warning">
                    Kunde erhält automatisch ein Ticket + E-Mail mit der Genehmigung.
                  </p>
                )}
                {newStatus === 'rejected' && (
                  <p className="form-hint form-hint--warning">
                    Ablehnungsgrund in der internen Notiz ergänzen — wird an Kunden gesendet (Ticket + E-Mail).
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
                <p className="form-hint">Wird dem Kunden per E-Mail + Ticket gesendet wenn Status auf „Etikett gesendet" gesetzt wird.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Interne Notiz</label>
                <textarea
                  className="form-input form-input--textarea"
                  rows={3}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  disabled={saving}
                  placeholder="Nur intern sichtbar… (bei Ablehnung: Begründung für Kunden)"
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

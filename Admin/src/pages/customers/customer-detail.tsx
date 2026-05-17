import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, ShoppingBag, Mail, Calendar, ShieldCheck, ShieldOff, Loader2, AlertTriangle } from 'lucide-react';
import { ROUTES } from '@config/routes';
import {
  getAdminCustomer, updateCustomerRole, deleteAdminCustomer, unbanCustomer,
  type AdminCustomerDetail, type UserRole,
} from '../../api/adminApi';
import type { OrderStatus } from '../../types/index';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import BanModal from '../../components/ui/BanModal';

const ROLE_LABELS: Record<UserRole, string> = {
  owner:    'Inhaber',
  admin:    'Admin',
  mod:      'Moderator',
  customer: 'Kunde',
};

const ROLE_OPTIONS: UserRole[] = ['customer', 'mod', 'admin', 'owner'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:        'Ausstehend',
  paid:           'Bezahlt',
  shipped:        'Versendet',
  delivered:      'Zugestellt',
  cancelled:      'Storniert',
  payment_failed: 'Zahlung fehlgeschlagen',
  refunded:       'Erstattet',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatPrice(n: string | number): string {
  const val = typeof n === 'string' ? parseFloat(n) : n;
  return isNaN(val) ? String(n) : val.toLocaleString('de-DE', { minimumFractionDigits: 2 });
}

export default function CustomerDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer,  setCustomer]  = useState<AdminCustomerDetail | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting,          setDeleting]          = useState(false);

  const [showBanModal,  setShowBanModal]  = useState(false);
  const [unbanning,     setUnbanning]     = useState(false);
  const [unbanError,    setUnbanError]    = useState<string | null>(null);

  const [role,            setRole]            = useState<UserRole>('customer');
  const [roleSaving,      setRoleSaving]      = useState(false);
  const [roleError,       setRoleError]       = useState<string | null>(null);
  const [roleSaved,       setRoleSaved]       = useState(false);
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAdminCustomer(id)
      .then(data => {
        setCustomer(data);
        setRole(data.role);
      })
      .catch(() => setError('Kunde konnte nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUnban = async () => {
    if (!id) return;
    setUnbanning(true);
    setUnbanError(null);
    try {
      await unbanCustomer(id);
      const updated = await getAdminCustomer(id);
      setCustomer(updated);
    } catch (err) {
      setUnbanError(err instanceof Error ? err.message : 'Sperre konnte nicht aufgehoben werden.');
    } finally {
      setUnbanning(false);
    }
  };

  const handleRoleSave = async () => {
    if (!id) return;
    setRoleSaving(true);
    setRoleError(null);
    setRoleSaved(false);
    try {
      await updateCustomerRole(id, role);
      setRoleSaved(true);
      setTimeout(() => setRoleSaved(false), 3000);
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setRoleSaving(false);
    }
  };

  const handleExport = () => {
    if (!customer) return;
    const data = JSON.stringify(customer, null, 2);
    const blob  = new Blob([data], { type: 'application/json' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `dsgvo-export-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteAdminCustomer(id);
      navigate(ROUTES.CUSTOMERS.LIST);
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Loader2 size={20} strokeWidth={1.5} className="spin" />
        <span>Lade Kundenprofil…</span>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="page-error">
        <AlertTriangle size={20} strokeWidth={1.5} />
        <span>{error ?? 'Kunde nicht gefunden.'}</span>
        <button className="btn-secondary" onClick={() => navigate(ROUTES.CUSTOMERS.LIST)}>
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  const initials   = (customer.name ?? 'KK').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const sinceDate  = formatDate(customer.created_at);
  const totalSpent = customer.orders.reduce((sum, o) => sum + parseFloat(String(o.total)), 0);
  const lastOrder  = customer.orders[0]?.created_at;

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <button className="back-btn" onClick={() => navigate(ROUTES.CUSTOMERS.LIST)}>
            <ArrowLeft size={15} strokeWidth={2} />
            Alle Kunden
          </button>
          <span className="page-header__eyebrow">Kunden</span>
          <h1 className="page-header__title">{customer.name ?? '—'}</h1>
          <p className="page-header__sub">Kunde seit {sinceDate}</p>
        </div>
        <div className="page-header__actions">
          <button className="btn-secondary" onClick={handleExport} title="DSGVO-Datenexport">
            <Download size={14} strokeWidth={2} />
            Daten exportieren
          </button>
          <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)} title="Konto löschen (DSGVO Art. 17)">
            <Trash2 size={14} strokeWidth={2} />
            Konto löschen
          </button>
        </div>
      </div>

      <div className="customer-detail-grid">
        {/* ── Linke Spalte ── */}
        <div>
          {/* Profil-Karte */}
          <div className="detail-card detail-card--profile">
            <div className="detail-card__body">
              <div className="customer-profile">
                <div className="customer-profile__avatar">{initials}</div>
                <div className="customer-profile__info">
                  <h2 className="customer-profile__name">{customer.name ?? '—'}</h2>
                  <div className="customer-profile__meta">
                    {customer.email && <span><Mail size={13} strokeWidth={2} />{customer.email}</span>}
                    <span><Calendar size={13} strokeWidth={2} />Seit {sinceDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="customer-stats">
            <div className="customer-stat">
              <ShoppingBag size={18} strokeWidth={1.5} />
              <p className="customer-stat__value">{customer.orders.length}</p>
              <p className="customer-stat__label">Bestellungen</p>
            </div>
            <div className="customer-stat">
              <p className="customer-stat__value">€ {formatPrice(totalSpent)}</p>
              <p className="customer-stat__label">Gesamtumsatz</p>
            </div>
            <div className="customer-stat">
              <p className="customer-stat__value">
                {customer.orders.length > 0
                  ? `€ ${formatPrice(totalSpent / customer.orders.length)}`
                  : '—'
                }
              </p>
              <p className="customer-stat__label">Ø Bestellwert</p>
            </div>
            <div className="customer-stat">
              <p className="customer-stat__value">{lastOrder ? formatDate(lastOrder) : '—'}</p>
              <p className="customer-stat__label">Letzte Bestellung</p>
            </div>
          </div>

          {/* Bestellhistorie */}
          <div className="detail-card">
            <div className="detail-card__header">
              <ShoppingBag size={15} strokeWidth={1.75} />
              Bestellhistorie
            </div>
            {customer.orders.length === 0 ? (
              <div className="detail-card__body">
                <p className="admin-table__muted">Noch keine Bestellungen.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bestellung</th>
                    <th>Datum</th>
                    <th>Betrag</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map(o => (
                    <tr key={o.id}>
                      <td><strong>{o.order_number}</strong></td>
                      <td className="admin-table__muted">{formatDate(o.created_at)}</td>
                      <td><strong>€ {formatPrice(o.total)}</strong></td>
                      <td>
                        <span className={`status-badge status-badge--${o.status}`}>
                          {STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Rechte Spalte ── */}
        <div>
          {/* Rollen-Verwaltung */}
          <div className="detail-card">
            <div className="detail-card__header">
              <ShieldCheck size={15} strokeWidth={1.75} />
              Rolle
            </div>
            <div className="detail-card__body">
              <p className="detail-info-item__label detail-role__label">
                Benutzerrolle festlegen
              </p>
              <select
                className="form-select"
                value={role}
                onChange={e => { setRole(e.target.value as UserRole); setRoleSaved(false); }}
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              {roleError && <p className="form-error-inline detail-role__error">{roleError}</p>}
              <button
                className="btn-primary detail-role__btn"
                onClick={() => setShowRoleConfirm(true)}
                disabled={roleSaving || role === customer.role}
              >
                {roleSaving ? 'Speichert…' : roleSaved ? 'Gespeichert ✓' : 'Rolle speichern'}
              </button>
            </div>
          </div>

          {/* DSGVO-Bereich */}
          <div className="detail-card dsgvo-card">
            <div className="detail-card__header dsgvo-card__header">
              DSGVO — Betroffenenrechte
            </div>
            <div className="detail-card__body">
              <div className="dsgvo-action">
                <div className="dsgvo-action__info">
                  <p className="dsgvo-action__title">Datenauskunft (Art. 15)</p>
                  <p className="dsgvo-action__desc">
                    Exportiert alle gespeicherten Daten dieses Kunden als JSON-Datei.
                    Muss auf Anfrage innerhalb von 30 Tagen bereitgestellt werden.
                  </p>
                </div>
                <button className="btn-secondary" onClick={handleExport}>
                  <Download size={13} strokeWidth={2} />
                  Exportieren
                </button>
              </div>
              <div className="dsgvo-divider" />
              <div className="dsgvo-action">
                <div className="dsgvo-action__info">
                  <p className="dsgvo-action__title">Recht auf Löschung (Art. 17)</p>
                  <p className="dsgvo-action__desc">
                    Löscht das Kundenkonto und alle personenbezogenen Daten unwiderruflich.
                    Bestelldaten werden anonymisiert (Pflicht für Buchführung).
                  </p>
                </div>
                <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={13} strokeWidth={2} />
                  Löschen
                </button>
              </div>
            </div>
          </div>

          {/* Konto-Status / Ban */}
          <div className="detail-card">
            <div className="detail-card__header">
              {customer.banned_at
                ? <><ShieldOff size={15} strokeWidth={1.75} /> Konto-Status</>
                : <><ShieldCheck size={15} strokeWidth={1.75} /> Konto-Status</>
              }
            </div>
            <div className="detail-card__body">
              {customer.banned_at ? (
                <>
                  <div className="ban-info">
                    <p className="ban-info__item">
                      <span className="ban-info__label">Gesperrt seit</span>
                      <span className="ban-info__value">
                        {new Date(customer.banned_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </p>
                    <p className="ban-info__item">
                      <span className="ban-info__label">Gesperrt bis</span>
                      <span className="ban-info__value">
                        {customer.banned_until
                          ? new Date(customer.banned_until).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : 'Dauerhaft'
                        }
                      </span>
                    </p>
                    {customer.ban_reason && (
                      <p className="ban-info__item">
                        <span className="ban-info__label">Grund</span>
                        <span className="ban-info__value">{customer.ban_reason}</span>
                      </p>
                    )}
                  </div>
                  {unbanError && <p className="form-error-inline">{unbanError}</p>}
                  <button
                    className="btn-primary detail-role__btn"
                    onClick={handleUnban}
                    disabled={unbanning}
                  >
                    {unbanning
                      ? <><Loader2 size={13} className="spin" /> Wird entsperrt…</>
                      : <><ShieldCheck size={13} /> Sperre aufheben</>
                    }
                  </button>
                </>
              ) : (
                <>
                  <p className="detail-info-item__label detail-role__label">
                    Konto ist aktiv. Sperre verhindert den Login und alle Aktivitäten dieses Kontos.
                  </p>
                  <button
                    className="btn-danger detail-role__btn"
                    onClick={() => setShowBanModal(true)}
                  >
                    <ShieldOff size={13} strokeWidth={2} />
                    Konto sperren
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showRoleConfirm}
        title="Rolle wirklich ändern?"
        description={`${customer.name ?? 'Dieser Kunde'} bekommt die Rolle „${ROLE_LABELS[role]}".${role === 'admin' || role === 'owner' ? ' ⚠️ Admins und Inhaber haben vollen Backend-Zugriff.' : ''}`}
        confirmLabel="Rolle ändern"
        variant={role === 'admin' || role === 'owner' ? 'warning' : 'info'}
        loading={roleSaving}
        onConfirm={async () => { await handleRoleSave(); setShowRoleConfirm(false); }}
        onCancel={() => { setShowRoleConfirm(false); }}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Kundenkonto löschen?"
        description={`Das Konto von ${customer.name ?? 'diesem Kunden'} wird unwiderruflich gelöscht. Alle personenbezogenen Daten werden gemäß DSGVO Art. 17 entfernt. Bestelldaten werden anonymisiert.`}
        confirmLabel="Konto löschen"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {showBanModal && (
        <BanModal
          customer={{ id: customer.id, name: customer.name, email: customer.email }}
          onClose={() => setShowBanModal(false)}
          onBanned={() => {
            setShowBanModal(false);
            if (id) {
              getAdminCustomer(id).then(setCustomer).catch(() => null);
            }
          }}
        />
      )}
    </>
  );
}

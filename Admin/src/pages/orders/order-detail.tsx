import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Package, User, MapPin, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { ROUTES } from '@config/routes';
import { getAdminOrder, updateOrderStatus, type AdminOrder } from '../../api/adminApi';
import type { OrderStatus } from '../../types/index';

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending',        label: 'Ausstehend'             },
  { value: 'paid',           label: 'Bezahlt'                },
  { value: 'shipped',        label: 'Versendet'              },
  { value: 'delivered',      label: 'Zugestellt'             },
  { value: 'cancelled',      label: 'Storniert'              },
  { value: 'payment_failed', label: 'Zahlung fehlgeschlagen' },
  { value: 'refunded',       label: 'Erstattet'              },
];

const STATUS_TIMELINE: Record<OrderStatus, string> = {
  pending:        'Bestellung eingegangen',
  paid:           'Zahlung bestätigt',
  shipped:        'Paket versendet',
  delivered:      'Zugestellt',
  cancelled:      'Storniert',
  payment_failed: 'Zahlung fehlgeschlagen',
  refunded:       'Erstattet',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatPrice(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OrderDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order,   setOrder]   = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [status,  setStatus]  = useState<OrderStatus>('pending');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAdminOrder(id)
      .then(data => {
        setOrder(data);
        setStatus(data.status as OrderStatus);
      })
      .catch(() => setError('Bestellung konnte nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id || !order) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateOrderStatus(id, status);
      setOrder(prev => prev ? { ...prev, status: updated.status } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Status zurücksetzen bei Fehler
      setStatus(order.status as OrderStatus);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Loader2 size={20} strokeWidth={1.5} className="spin" />
        <span>Lade Bestellung…</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-error">
        <AlertTriangle size={20} strokeWidth={1.5} />
        <span>{error ?? 'Bestellung nicht gefunden.'}</span>
        <button className="btn-secondary" onClick={() => navigate(ROUTES.ORDERS.LIST)}>
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  // Subtotal aus Items berechnen
  const subtotal = order.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = Math.max(0, order.total - subtotal);

  const addr = order.shipping_address;
  const customerName = [addr?.firstName, addr?.lastName].filter(Boolean).join(' ')
    || order.profile?.name
    || '—';

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <button className="back-btn" onClick={() => navigate(ROUTES.ORDERS.LIST)}>
            <ArrowLeft size={15} strokeWidth={2} />
            Alle Bestellungen
          </button>
          <span className="page-header__eyebrow">Bestellungen</span>
          <h1 className="page-header__title">{order.order_number}</h1>
          <p className="page-header__sub">{formatDate(order.created_at)}</p>
        </div>
        <div className="page-header__actions">
          <select
            value={status}
            onChange={e => { setStatus(e.target.value as OrderStatus); setSaved(false); }}
            className="form-select form-select--auto"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <Loader2 size={14} strokeWidth={2} className="spin" />
              : <Save    size={14} strokeWidth={2} />
            }
            {saving ? 'Speichert…' : saved ? 'Gespeichert ✓' : 'Speichern'}
          </button>
        </div>
      </div>

      <div className="order-detail-grid">
        {/* ── Linke Spalte ── */}
        <div className="order-detail-col">

          {/* Artikel */}
          <div className="detail-card">
            <div className="detail-card__header">
              <Package size={15} strokeWidth={1.75} />
              Artikel
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Menge</th>
                  <th>Einzelpreis</th>
                  <th className="admin-table__cell--right">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="order-item-row">
                        <div className="order-item-row__thumb" />
                        <span className="admin-table__primary">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="admin-table__muted">× {item.quantity}</td>
                    <td className="admin-table__muted">€ {formatPrice(item.price)}</td>
                    <td className="admin-table__cell--right">
                      <strong>€ {formatPrice(item.price * item.quantity)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="order-summary">
              <div className="order-summary__row">
                <span>Zwischensumme</span>
                <span>€ {formatPrice(subtotal)}</span>
              </div>
              {shipping > 0 && (
                <div className="order-summary__row">
                  <span>Versand</span>
                  <span>€ {formatPrice(shipping)}</span>
                </div>
              )}
              <div className="order-summary__row order-summary__row--total">
                <span>Gesamt</span>
                <span>€ {formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Kundennotiz */}
          {order.customer_note && (
            <div className="detail-card">
              <div className="detail-card__header">
                <Clock size={15} strokeWidth={1.75} />
                Kundennotiz
              </div>
              <div className="detail-card__body">
                <p className="detail-note">{order.customer_note}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Rechte Spalte ── */}
        <div className="order-detail-col order-detail-col--side">

          {/* Kunde */}
          <div className="detail-card">
            <div className="detail-card__header">
              <User size={15} strokeWidth={1.75} />
              Kunde
            </div>
            <div className="detail-card__body">
              <div className="detail-info-list">
                <div className="detail-info-item">
                  <span className="detail-info-item__label">Name</span>
                  <span className="detail-info-item__value">{customerName}</span>
                </div>
                {order.profile?.email && (
                  <div className="detail-info-item">
                    <span className="detail-info-item__label">E-Mail</span>
                    <a href={`mailto:${order.profile.email}`} className="detail-info-item__link">
                      {order.profile.email}
                    </a>
                  </div>
                )}
                {order.profile?.phone && (
                  <div className="detail-info-item">
                    <span className="detail-info-item__label">Telefon</span>
                    <span className="detail-info-item__value">{order.profile.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lieferadresse */}
          {addr && (
            <div className="detail-card">
              <div className="detail-card__header">
                <MapPin size={15} strokeWidth={1.75} />
                Lieferadresse
              </div>
              <div className="detail-card__body">
                <address className="detail-address">
                  {[addr.firstName, addr.lastName].filter(Boolean).join(' ')}<br />
                  {addr.street}<br />
                  {addr.zip} {addr.city}<br />
                  {addr.country}
                </address>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="detail-card">
            <div className="detail-card__header">
              <Clock size={15} strokeWidth={1.75} />
              Verlauf
            </div>
            <div className="detail-card__body">
              <div className="order-timeline">
                {STATUS_OPTIONS.map((opt, i) => {
                  const statusIndex = STATUS_OPTIONS.findIndex(s => s.value === status);
                  const isDone      = i <= statusIndex;

                  // Bekannte Zeitstempel zuordnen
                  let date: string | undefined;
                  if (opt.value === 'pending')  date = formatDate(order.created_at);
                  if (opt.value === 'paid'    && order.paid_at)    date = formatDate(order.paid_at);
                  if (opt.value === 'shipped' && order.shipped_at) date = formatDate(order.shipped_at);

                  return (
                    <div key={opt.value} className={`timeline-step${isDone ? ' is-done' : ''}`}>
                      <div className="timeline-step__dot" />
                      <div className="timeline-step__content">
                        <p className="timeline-step__label">{STATUS_TIMELINE[opt.value]}</p>
                        {date && <p className="timeline-step__date">{date}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, X, Package, User, Mail, CreditCard } from 'lucide-react';
import { ROUTES } from '@config/routes';
import type { OrderStatus } from '../../types/index';
import { getAdminOrders, getAdminOrder, updateOrderStatus, type AdminOrder } from '../../api/adminApi';

const STATUS_TABS: Array<{ key: OrderStatus | 'all'; label: string }> = [
  { key: 'all',            label: 'Alle'             },
  { key: 'pending',        label: 'Ausstehend'       },
  { key: 'paid',           label: 'Bezahlt'          },
  { key: 'shipped',        label: 'Versendet'        },
  { key: 'delivered',      label: 'Zugestellt'       },
  { key: 'cancelled',      label: 'Storniert'        },
  { key: 'payment_failed', label: 'Zahlung fehlg.'  },
];

const STATUS_LABELS: Record<string, string> = {
  pending:        'Ausstehend',
  paid:           'Bezahlt',
  shipped:        'Versendet',
  delivered:      'Zugestellt',
  cancelled:      'Storniert',
  payment_failed: 'Zahlung fehlgeschlagen',
  refunded:       'Erstattet',
};

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE');
}

export default function OrdersPage() {
  const [orders, setOrders]       = useState<Awaited<ReturnType<typeof getAdminOrders>>['data']>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [activeId, setActiveId]   = useState<string | null>(null);
  const [detail, setDetail]       = useState<AdminOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const panelRef    = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(-1);

  useEffect(() => {
    setLoading(true);
    getAdminOrders(1, 200)
      .then(res => { setOrders(res.data); setTotal(res.total); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) { setDetail(null); return; }
    setDetailLoading(true);
    getAdminOrder(activeId)
      .then(setDetail)
      .catch(() => null)
      .finally(() => setDetailLoading(false));
  }, [activeId]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (panelRef.current && panelRef.current.scrollTop === 0)
      touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current < 0 || !panelRef.current) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) { panelRef.current.style.transition = 'none'; panelRef.current.style.transform = `translateY(${dy}px)`; }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current < 0 || !panelRef.current) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = -1;
    if (dy > 100) {
      panelRef.current.style.transition = 'transform 0.22s ease';
      panelRef.current.style.transform  = 'translateY(100%)';
      setTimeout(() => setActiveId(null), 220);
    } else {
      panelRef.current.style.transition = 'transform 0.25s cubic-bezier(0.32,0.72,0,1)';
      panelRef.current.style.transform  = '';
    }
  };

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length;
    return acc;
  }, {});

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateOrderStatus(id, newStatus);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (detail?.id === id) setDetail(prev => prev ? { ...prev, status: newStatus } : prev);
    } catch { /* ignore */ }
  };

  const profile = detail?.profile;
  const addr    = detail?.shipping_address;

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Shop</span>
          <h1 className="page-header__title">Bestellungen</h1>
          <p className="page-header__sub">{total} Bestellungen insgesamt</p>
        </div>
      </div>

      <div className="tab-nav">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-nav__item${activeTab === tab.key ? ' is-active' : ''}`}
            onClick={() => { setActiveTab(tab.key as OrderStatus | 'all'); setActiveId(null); }}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`tab-nav__count${activeTab === tab.key ? ' is-active' : ''}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {detail && <div className="panel-backdrop" onClick={() => setActiveId(null)} />}
      <div className={`order-split${detail ? ' has-detail' : ''}`}>
        <div className="data-card">
          <div className="data-card__body">
            {loading ? (
              <p className="data-card__empty">Lade Bestellungen…</p>
            ) : filtered.length === 0 ? (
              <p className="data-card__empty">Keine Bestellungen in dieser Kategorie.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bestellung</th>
                    <th>Kunde</th>
                    <th>Betrag</th>
                    <th>Status</th>
                    <th>Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr
                      key={o.id}
                      className={`admin-table__row--clickable${activeId === o.id ? ' is-selected' : ''}`}
                      onClick={() => setActiveId(prev => prev === o.id ? null : o.id)}
                    >
                      <td><strong>{o.order_number}</strong></td>
                      <td><p className="admin-table__primary">{o.user_id ?? '—'}</p></td>
                      <td><strong>{fmt(o.total)}</strong></td>
                      <td>
                        <span className={`status-badge status-badge--${o.status}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="admin-table__muted">{fmtDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {(detail || detailLoading) && (
          <div
            className="order-detail"
            ref={panelRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {detailLoading ? (
              <p className="data-card__empty">Lade Details…</p>
            ) : detail && (
              <>
                <div className="order-detail__header">
                  <div className="order-detail__header-top">
                    <p className="order-detail__number">{detail.order_number}</p>
                    <button className="order-detail__close" onClick={() => setActiveId(null)} title="Schließen">
                      <X size={15} strokeWidth={2} />
                    </button>
                  </div>
                  <span className={`status-badge status-badge--${detail.status}`}>
                    {STATUS_LABELS[detail.status] ?? detail.status}
                  </span>
                  <p className="order-detail__date">{fmtDate(detail.created_at)}</p>
                </div>

                {profile && (
                  <div className="order-detail__section">
                    <p className="order-detail__label">Kunde</p>
                    {profile.name && (
                      <div className="order-detail__row">
                        <User size={13} strokeWidth={2} className="order-detail__icon" />
                        <span>{profile.name}</span>
                      </div>
                    )}
                    {profile.email && (
                      <div className="order-detail__row">
                        <Mail size={13} strokeWidth={2} className="order-detail__icon" />
                        <a className="order-detail__link" href={`mailto:${profile.email}`}>{profile.email}</a>
                      </div>
                    )}
                  </div>
                )}

                <div className="order-detail__section">
                  <p className="order-detail__label">Bestellung</p>
                  <div className="order-detail__row">
                    <Package size={13} strokeWidth={2} className="order-detail__icon" />
                    <span>{detail.order_items.length} Artikel</span>
                  </div>
                  <div className="order-detail__total">
                    <span className="order-detail__total-label">Gesamtbetrag</span>
                    <span className="order-detail__total-value">{fmt(detail.total)}</span>
                  </div>
                  {addr && (
                    <div className="order-detail__row">
                      <CreditCard size={13} strokeWidth={2} className="order-detail__icon" />
                      <span className="admin-table__muted">
                        {[addr.firstName, addr.lastName].filter(Boolean).join(' ')}{addr.street ? `, ${addr.street}` : ''}{addr.zip ? `, ${addr.zip}` : ''}{addr.city ? ` ${addr.city}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="order-detail__section">
                  <p className="order-detail__label">Status ändern</p>
                  <select
                    className="form-select"
                    value={detail.status}
                    onChange={e => handleStatusChange(detail.id, e.target.value)}
                  >
                    <option value="pending">Ausstehend</option>
                    <option value="paid">Bezahlt</option>
                    <option value="shipped">Versendet</option>
                    <option value="delivered">Zugestellt</option>
                    <option value="cancelled">Storniert</option>
                    <option value="refunded">Erstattet</option>
                  </select>
                </div>

                <div className="order-detail__footer">
                  <Link to={ROUTES.ORDERS.detail(detail.id)} className="btn-secondary">
                    <Eye size={13} strokeWidth={2} />
                    Vollansicht
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {filtered.length > 0 && !detail && (
        <p className="table-hint">Klick auf eine Zeile für Details und Statusänderung</p>
      )}
    </>
  );
}

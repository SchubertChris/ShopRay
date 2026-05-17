import { useEffect, useState } from 'react';
import { ShoppingCart, Users, Package, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@config/routes';
import { getAdminStats, type AdminStats } from '../../api/adminApi';

const STATUS_LABELS: Record<string, string> = {
  pending:        'Ausstehend',
  paid:           'Bezahlt',
  shipped:        'Versendet',
  delivered:      'Zugestellt',
  cancelled:      'Storniert',
  payment_failed: 'Zahlung fehlg.',
  refunded:       'Erstattet',
};

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Umsatz (30 Tage)',  value: fmt(stats.revenue30d),      trend: 'up'   as const, icon: TrendingUp   },
    { label: 'Bestellungen',      value: String(stats.orders),        trend: 'up'   as const, icon: ShoppingCart },
    { label: 'Kunden gesamt',     value: String(stats.customers),     trend: 'up'   as const, icon: Users        },
    { label: 'Produkte aktiv',    value: String(stats.activeProducts), trend: 'flat' as const, icon: Package      },
  ] : [];

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Übersicht</span>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__sub">Willkommen zurück — hier ist der aktuelle Stand.</p>
        </div>
      </div>

      <div className="stat-grid">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="stat-card stat-card--loading" />)
        ) : (
          statCards.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__icon"><s.icon size={18} strokeWidth={1.75} /></div>
              <p className="stat-card__label">{s.label}</p>
              <p className="stat-card__value">{s.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="dashboard-grid">
        <div className="data-card">
          <div className="data-card__header">
            <h2 className="data-card__title">Letzte Bestellungen</h2>
            <Link to={ROUTES.ORDERS.LIST} className="data-card__action">Alle ansehen →</Link>
          </div>
          <div className="data-card__body">
            {loading ? (
              <p className="data-card__empty">Lade…</p>
            ) : !stats?.recentOrders.length ? (
              <p className="data-card__empty">Noch keine Bestellungen.</p>
            ) : (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Nr.</th>
                    <th>Kunde</th>
                    <th>Betrag</th>
                    <th>Status</th>
                    <th>Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(o => (
                    <tr
                      key={o.id}
                      className="admin-table__row--clickable"
                      onClick={() => navigate(ROUTES.ORDERS.detail(o.id))}
                      title="Bestellung öffnen"
                    >
                      <td><strong>{o.order_number}</strong></td>
                      <td>{o.profiles?.name ?? o.profiles?.email ?? '—'}</td>
                      <td>{fmt(o.total)}</td>
                      <td>
                        <span className={`status-badge status-badge--${o.status}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="admin-table__muted">
                        {new Date(o.created_at).toLocaleDateString('de-DE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="data-card">
          <div className="data-card__header">
            <h2 className="data-card__title">Schnellübersicht</h2>
          </div>
          <div className="data-card__body">
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-stat__label">Offene Bestellungen</span>
                <span className="quick-stat__value">{loading ? '…' : stats?.pendingOrders ?? 0}</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat__label">Offene Tickets</span>
                <span className="quick-stat__value">{loading ? '…' : stats?.openTickets ?? 0}</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat__label">Aktive Produkte</span>
                <span className="quick-stat__value">{loading ? '…' : stats?.activeProducts ?? 0}</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat__label">Kunden gesamt</span>
                <span className="quick-stat__value">{loading ? '…' : stats?.customers ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

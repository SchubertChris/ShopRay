import { ShoppingCart, Users, Package, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@config/routes';
import type { StatCard } from '../../types/index';

const STATS: (StatCard & { icon: React.ComponentType<{ size?: number; strokeWidth?: number }> })[] = [
  { label: 'Umsatz (30 Tage)', value: '€ 4.280',  delta: '+12,4 %', trend: 'up',   icon: TrendingUp  },
  { label: 'Bestellungen',     value: '138',       delta: '+8 %',    trend: 'up',   icon: ShoppingCart },
  { label: 'Kunden gesamt',    value: '642',       delta: '+5,1 %',  trend: 'up',   icon: Users       },
  { label: 'Produkte aktiv',   value: '48',        delta: '0',       trend: 'flat', icon: Package     },
];

const RECENT_ORDERS = [
  { id: '#1042', customer: 'Laura Meier',    total: '€ 89,00',  status: 'paid',      date: '14.05.2026' },
  { id: '#1041', customer: 'Jonas Braun',    total: '€ 124,50', status: 'shipped',   date: '13.05.2026' },
  { id: '#1040', customer: 'Sara König',     total: '€ 56,00',  status: 'delivered', date: '13.05.2026' },
  { id: '#1039', customer: 'Max Müller',     total: '€ 210,00', status: 'new',       date: '12.05.2026' },
  { id: '#1038', customer: 'Anna Schmidt',   total: '€ 38,00',  status: 'cancelled', date: '11.05.2026' },
];

const STATUS_LABELS: Record<string, string> = {
  new:       'Neu',
  paid:      'Bezahlt',
  shipped:   'Versendet',
  delivered: 'Zugestellt',
  cancelled: 'Storniert',
};

export default function DashboardPage() {
  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Übersicht</span>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__sub">Willkommen zurück — hier ist der aktuelle Stand.</p>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="stat-grid">
        {STATS.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card__icon">
              <s.icon size={18} strokeWidth={1.75} />
            </div>
            <p className="stat-card__label">{s.label}</p>
            <p className="stat-card__value">{s.value}</p>
            {s.delta && (
              <p className={`stat-card__delta stat-card__delta--${s.trend}`}>
                {s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : '—'} {s.delta}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Dashboard Grid ─────────────────────────────────────────────────── */}
      <div className="dashboard-grid">
        {/* Letzte Bestellungen */}
        <div className="data-card">
          <div className="data-card__header">
            <h2 className="data-card__title">Letzte Bestellungen</h2>
            <Link to={ROUTES.ORDERS.LIST} className="data-card__action">Alle ansehen →</Link>
          </div>
          <div className="data-card__body">
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
                {RECENT_ORDERS.map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.id}</strong></td>
                    <td>{o.customer}</td>
                    <td>{o.total}</td>
                    <td>
                      <span className={`status-badge status-badge--${o.status}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="admin-table__muted">
                      {o.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="data-card">
          <div className="data-card__header">
            <h2 className="data-card__title">Schnellübersicht</h2>
          </div>
          <div className="data-card__body">
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-stat__label">Offene Bestellungen</span>
                <span className="quick-stat__value">3</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat__label">Offene Tickets</span>
                <span className="quick-stat__value">5</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat__label">Produkte ohne Bild</span>
                <span className="quick-stat__value">7</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat__label">Ø Bestellwert</span>
                <span className="quick-stat__value">€ 68,40</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat__label">Conversion Rate</span>
                <span className="quick-stat__value">3,2 %</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

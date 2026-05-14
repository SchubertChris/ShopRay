import { Link } from 'react-router-dom';
import { useAuth } from '@features/auth';
import { useWishlist } from '@features/wishlist';
import { useOrders, orderStatusLabel } from '@features/orders';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';

export default function DashboardPage() {
  const { user }                   = useAuth();
  const { ids }                    = useWishlist();
  const { data, loading }          = useOrders();
  const orders                     = data?.data ?? [];
  const recentOrders               = orders.slice(0, 3);
  const firstName                  = user?.firstName ?? 'zurück';
  const initial                    = user?.firstName?.[0]?.toUpperCase() ?? '?';

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: 'Bestellungen',  value: String(orders.length),         change: `${orders.length} gesamt`,        up: orders.length > 0 },
    { label: 'Ausgaben',      value: `€ ${totalSpent.toFixed(0)}`,  change: 'Gesamtausgaben',                 up: totalSpent > 0    },
    { label: 'Retourenquote', value: '0 %',                         change: 'Keine Retouren',                 up: false             },
    { label: 'Wunschliste',   value: String(ids.length),            change: `${ids.length} gespeichert`,      up: ids.length > 0    },
  ];

  return (
    <>
      <SeoMeta title="Mein Konto" noIndex />
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__greeting">Guten Tag, {firstName} 👋</h1>
        <p className="dashboard__sub">Hier ist deine Übersicht.</p>
      </div>

      {/* Profil-Karte */}
      <div className="profile-card">
        <div className="profile-card__avatar">{initial}</div>
        <div className="profile-card__info">
          <p className="profile-card__name">{user ? `${user.firstName} ${user.lastName}` : '—'}</p>
          <p className="profile-card__email">{user?.email ?? '—'}</p>
        </div>
        <Link to={ROUTES.ACCOUNT.SETTINGS} className="profile-card__edit">Bearbeiten</Link>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card__label">{s.label}</div>
            <div className="stat-card__value">{loading ? '…' : s.value}</div>
            <div className={`stat-card__change stat-card__change--${s.up ? 'up' : 'down'}`}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Letzte Bestellungen */}
      <div className="dashboard-section">
        <div className="dashboard-section__header">
          <span className="dashboard-section__title">Letzte Bestellungen</span>
          <Link to={ROUTES.ACCOUNT.ORDERS} className="dashboard-section__link">Alle anzeigen →</Link>
        </div>
        <div className="list-feed">
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="order-card">
              <div className="order-card__thumb order-card__thumb--placeholder skeleton" />
              <div className="order-card__info">
                <div className="skeleton-text skeleton-text--60" />
                <div className="skeleton-text skeleton-text--40" />
              </div>
            </div>
          ))}
          {!loading && recentOrders.length === 0 && (
            <p className="dashboard__empty">Noch keine Bestellungen. <Link to={ROUTES.HOME}>Jetzt shoppen →</Link></p>
          )}
          {!loading && recentOrders.map(o => (
            <Link key={o.id} to={ROUTES.ACCOUNT.orderDetail(o.id)} className="order-card order-card--clickable">
              <div className="order-card__thumb order-card__thumb--placeholder" />
              <div className="order-card__info">
                <div className="order-card__name">Bestellung #{o.id}</div>
                <div className="order-card__meta">{new Date(o.createdAt).toLocaleDateString('de-DE')}</div>
              </div>
              <span className={`order-status order-status--${o.status}`}>{orderStatusLabel(o.status)}</span>
              <div className="order-card__price">{o.total.toFixed(2)} €</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

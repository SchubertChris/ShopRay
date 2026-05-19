import { useState } from 'react';
import { useOrders, orderStatusLabel } from '@features/orders';
import { ROUTES } from '@config/routes';
import { Link } from 'react-router-dom';
import { SeoMeta, Pagination } from '@components/ui';

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const { data, loading, error } = useOrders();
  const [page, setPage]          = useState(1);
  const orders                   = data ?? [];
  const totalPages               = Math.ceil(orders.length / PAGE_SIZE);
  const visibleOrders            = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const seoMeta = <SeoMeta title="Meine Bestellungen" noIndex />;

  if (loading) {
    return (
      <div>
        {seoMeta}
        <h1 className="orders-history__title">Bestellungen</h1>
        <div className="list-feed">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="order-card">
              <div className="order-card__thumb order-card__thumb--placeholder skeleton" />
              <div className="order-card__info">
                <div className="skeleton-text" />
                <div className="skeleton-text" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {seoMeta}
        <h1 className="orders-history__title">Bestellungen</h1>
        <p className="orders-history__error">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        {seoMeta}
        <h1 className="orders-history__title">Bestellungen</h1>
        <div className="orders-history__empty">
          <p className="orders-history__empty-text">Du hast noch keine Bestellungen aufgegeben.</p>
          <Link to={ROUTES.SHOP.CATEGORIES} className="btn btn--primary btn--sm">Kollektion entdecken</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {seoMeta}
      <h2 className="orders-history__title">
        Bestellungen <span className="orders-history__count">({orders.length})</span>
      </h2>
      <div className="list-feed">
        {visibleOrders.map(o => {
          const thumb = o.items[0]?.imageUrl ?? null;
          return (
          <Link key={o.id} to={ROUTES.ACCOUNT.orderDetail(o.id)} className="order-card order-card--clickable">
            <div className="order-card__thumb">
              {thumb
                ? <img src={thumb} alt={o.items[0]?.productName} onContextMenu={e => e.preventDefault()} />
                : <span className="order-card__thumb-letter">{o.orderNumber?.[0] ?? '#'}</span>
              }
            </div>
            <div className="order-card__info">
              <div className="order-card__name">Bestellung #{o.orderNumber || o.id.slice(0, 8)}</div>
              <div className="order-card__meta">
                {new Date(o.createdAt).toLocaleDateString('de-DE')} · {o.items.length} {o.items.length === 1 ? 'Artikel' : 'Artikel'}
              </div>
            </div>
            <span className={`order-status order-status--${o.status}`}>
              {orderStatusLabel(o.status)}
            </span>
            <div className="order-card__price">{o.total.toFixed(2)} €</div>
          </Link>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}

import { useParams, Link } from 'react-router-dom';
import { useOrderById, orderStatusLabel } from '@features/orders';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';
import type { OrderStatus } from '@/types/order';

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending',   label: 'Bestellung eingegangen' },
  { status: 'paid',      label: 'Bezahlt' },
  { status: 'shipped',   label: 'Versandt' },
  { status: 'delivered', label: 'Geliefert' },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending:        0,
  paid:           1,
  shipped:        2,
  delivered:      3,
  cancelled:      -1,
  payment_failed: -1,
  refunded:       -1,
};

export default function OrderDetailPage() {
  const { id }                   = useParams<{ id: string }>();
  const { data: order, loading, error } = useOrderById(id ?? '');

  if (loading) {
    return (
      <>
        <SeoMeta title="Bestellung" noIndex />
        <div className="page-loader"><span className="spinner" /></div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <SeoMeta title="Bestellung" noIndex />
        <div className="order-detail">
          <Link to={ROUTES.ACCOUNT.ORDERS} className="order-detail__back">← Zurück zu Bestellungen</Link>
          <p className="orders-history__error">{error ?? 'Bestellung nicht gefunden.'}</p>
        </div>
      </>
    );
  }

  const subtotal     = order.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const shippingCost = Math.max(0, order.total - subtotal);
  const currentStep  = STATUS_ORDER[order.status] ?? -1;
  const isCancelled  = order.status === 'cancelled';
  const formattedDate = new Date(order.createdAt).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <>
      <SeoMeta title={`Bestellung #${order.orderNumber}`} noIndex />
      <div className="order-detail">

        <Link to={ROUTES.ACCOUNT.ORDERS} className="order-detail__back">
          ← Zurück zu Bestellungen
        </Link>

        <div className="order-detail__header">
          <h1 className="order-detail__title">
            Bestellung <span>#{order.orderNumber}</span>
          </h1>
          <span className={`order-status order-status--${order.status}`}>
            {orderStatusLabel(order.status)}
          </span>
        </div>

        <div className="order-detail__grid">

          {/* ── Linke Spalte ── */}
          <div className="order-detail__main">

            {/* Status-Timeline */}
            {!isCancelled && (
              <div className="detail-card">
                <div className="detail-card__title">Bestellstatus</div>
                <div className="order-timeline">
                  {TIMELINE_STEPS.map((step, i) => {
                    const done   = i <= currentStep;
                    const active = i === currentStep;
                    return (
                      <div
                        key={step.status}
                        className={`order-timeline__step${done ? ' order-timeline__step--done' : ''}${active ? ' order-timeline__step--active' : ''}`}
                      >
                        <div className={`order-timeline__dot${done ? ' order-timeline__dot--done' : active ? ' order-timeline__dot--active' : ''}`}>
                          {done && '✓'}
                        </div>
                        <div className="order-timeline__content">
                          <div className="order-timeline__label">{step.label}</div>
                          {active && (
                            <div className="order-timeline__date">{formattedDate}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="detail-card">
                <div className="detail-card__title">Status</div>
                <span className="order-status order-status--cancelled">Storniert</span>
              </div>
            )}

            {/* Artikel */}
            <div className="detail-card">
              <div className="detail-card__title">Artikel ({order.items.length})</div>
              <div className="order-items">
                {order.items.map((item, i) => (
                  <div key={i} className="order-item">
                    <div className="order-item__thumb" />
                    <div className="order-item__info">
                      <div className="order-item__name">{item.productName}</div>
                      <div className="order-item__qty">Menge: {item.quantity}</div>
                    </div>
                    <div className="order-item__price">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Rechte Spalte ── */}
          <div className="order-detail__side">

            {/* Bestelldaten */}
            <div className="detail-card">
              <div className="detail-card__title">Bestelldaten</div>
              <div className="order-summary">
                <div className="order-summary__row">
                  <span className="order-summary__label">Bestellnummer</span>
                  <span className="order-summary__value">#{order.orderNumber}</span>
                </div>
                <div className="order-summary__row">
                  <span className="order-summary__label">Datum</span>
                  <span className="order-summary__value">{formattedDate}</span>
                </div>
                <div className="order-summary__row">
                  <span className="order-summary__label">Zwischensumme</span>
                  <span className="order-summary__value">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="order-summary__row">
                  <span className="order-summary__label">Versand</span>
                  <span className="order-summary__value">
                    {shippingCost === 0 ? 'Kostenlos' : `${shippingCost.toFixed(2)} €`}
                  </span>
                </div>
                <div className="order-summary__row order-summary__row--total">
                  <span>Gesamt</span>
                  <span>{order.total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Lieferadresse */}
            <div className="detail-card">
              <div className="detail-card__title">Lieferadresse</div>
              <div className="shipping-address">
                <strong>{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</strong>
                {order.shippingAddress?.street}<br />
                {order.shippingAddress?.zip} {order.shippingAddress?.city}<br />
                {order.shippingAddress?.country}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

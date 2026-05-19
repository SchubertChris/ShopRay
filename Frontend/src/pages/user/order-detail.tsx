import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrderById, orderStatusLabel, cancelOrder, requestReturn } from '@features/orders';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';
import { getProductImage } from '@config/images';
import type { OrderStatus, ReturnRequest } from '@/types/order';

const PAYMENT_LABELS: Record<string, string> = {
  card:           'Kreditkarte',
  paypal:         'PayPal',
  klarna:         'Klarna',
  'bank-transfer': 'SEPA-Überweisung',
  sofort:         'Sofortüberweisung',
};

function paymentLabel(method: string | null | undefined): string {
  if (!method) return 'Kreditkarte';
  return PAYMENT_LABELS[method] ?? method;
}

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

const RETURN_REASONS = [
  'Artikel gefällt mir nicht',
  'Falsches Produkt erhalten',
  'Artikel beschädigt / defekt',
  'Artikel entspricht nicht der Beschreibung',
  'Zu spät geliefert',
  'Sonstiges',
];

const RETURN_STATUS_LABELS: Record<ReturnRequest['status'], string> = {
  requested:   'Beantragt — wir prüfen deinen Antrag',
  approved:    'Genehmigt — Etikett wird vorbereitet',
  rejected:    'Abgelehnt — bitte kontaktiere uns',
  label_sent:  'Rücksendeetikett wurde per E-Mail gesendet',
  received:    'Paket eingegangen — Rückerstattung folgt',
  refunded:    'Rückerstattung erfolgt',
};

export default function OrderDetailPage() {
  const { id }                   = useParams<{ id: string }>();
  const { data: order, loading, error, refetch } = useOrderById(id ?? '');

  const [cancelling,       setCancelling]       = useState(false);
  const [cancelError,      setCancelError]       = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [showReturnForm,   setShowReturnForm]   = useState(false);
  const [returnReason,     setReturnReason]     = useState(RETURN_REASONS[0]);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError,      setReturnError]      = useState<string | null>(null);

  async function handleCancel() {
    if (!id) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelOrder(id);
      setShowCancelDialog(false);
      void refetch();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Stornierung fehlgeschlagen.');
    } finally {
      setCancelling(false);
    }
  }

  async function handleReturnSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSubmittingReturn(true);
    setReturnError(null);
    try {
      await requestReturn(id, returnReason);
      setShowReturnForm(false);
      void refetch();
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : 'Rücksendung konnte nicht beantragt werden.');
    } finally {
      setSubmittingReturn(false);
    }
  }

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

  const subtotal      = order.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const shippingCost  = Math.max(0, order.total - subtotal);
  const currentStep   = STATUS_ORDER[order.status] ?? -1;
  const isCancelled   = order.status === 'cancelled';
  const formattedDate = new Date(order.createdAt).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const canCancel    = ['pending', 'paid'].includes(order.status);
  const daysSinceOrder = (Date.now() - new Date(order.createdAt).getTime()) / 86_400_000;
  const canReturn    = order.status === 'delivered' && daysSinceOrder <= 30 && !order.returnRequest;

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
                    <div className="order-item__thumb">
                      <img
                        src={item.imageUrl ?? getProductImage(item.productId)}
                        alt={item.productName}
                        loading="lazy"
                        onContextMenu={e => e.preventDefault()}
                      />
                    </div>
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
                  <span className="order-summary__label">Zahlung</span>
                  <span className="order-summary__value">{paymentLabel(order.paymentMethod)}</span>
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

            {/* Sendungsverfolgung */}
            {order.trackingNumber && (
              <div className="detail-card">
                <div className="detail-card__title">Sendungsverfolgung</div>
                <div className="order-tracking">
                  <p className="order-tracking__label">DHL Sendungsnummer</p>
                  <a
                    className="order-tracking__link"
                    href={`https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?idc=${order.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {order.trackingNumber} →
                  </a>
                </div>
              </div>
            )}

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

            {/* Rücksendungsantrag — Status anzeigen falls vorhanden */}
            {order.returnRequest && (
              <div className="detail-card detail-card--return">
                <div className="detail-card__title">Rücksendung</div>
                <p className="return-status">
                  <span className={`return-status__dot return-status__dot--${order.returnRequest.status}`} />
                  {RETURN_STATUS_LABELS[order.returnRequest.status]}
                </p>
                {order.returnRequest.label_url && (
                  <a
                    className="btn btn--secondary btn--sm"
                    href={order.returnRequest.label_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Rücksendeetikett herunterladen →
                  </a>
                )}
              </div>
            )}

            {/* Aktionen */}
            {(canCancel || canReturn) && (
              <div className="order-actions">
                {canCancel && (
                  <button
                    className="btn btn--outline-danger btn--sm"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Bestellung stornieren
                  </button>
                )}
                {canReturn && (
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => setShowReturnForm(true)}
                  >
                    Rücksendung beantragen
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Stornierung-Dialog ── */}
      {showCancelDialog && (
        <div className="modal-overlay" onClick={() => !cancelling && setShowCancelDialog(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-box__title">Bestellung stornieren?</h2>
            <p className="modal-box__text">
              Möchtest du Bestellung <strong>#{order.orderNumber}</strong> wirklich stornieren?
              {order.status === 'paid' && ' Der bezahlte Betrag wird automatisch erstattet.'}
            </p>
            {cancelError && <p className="modal-box__error">{cancelError}</p>}
            <div className="modal-box__actions">
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setShowCancelDialog(false)}
                disabled={cancelling}
              >
                Abbrechen
              </button>
              <button
                className="btn btn--danger btn--sm"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Wird storniert…' : 'Ja, stornieren'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rücksendungs-Dialog ── */}
      {showReturnForm && (
        <div className="modal-overlay" onClick={() => !submittingReturn && setShowReturnForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-box__title">Rücksendung beantragen</h2>
            <p className="modal-box__text">
              Wähle den Grund für deine Rücksendung. Wir senden dir anschließend ein kostenloses Rücksendeetikett per E-Mail.
            </p>
            <form onSubmit={handleReturnSubmit}>
              <div className="form-group">
                <label className="form-label">Rückgabegrund</label>
                <select
                  className="form-input"
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  disabled={submittingReturn}
                >
                  {RETURN_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {returnError && <p className="modal-box__error">{returnError}</p>}
              <div className="modal-box__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setShowReturnForm(false)}
                  disabled={submittingReturn}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={submittingReturn}
                >
                  {submittingReturn ? 'Wird beantragt…' : 'Rücksendung beantragen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@features/cart';
import { SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';

interface OrderSuccessState {
  orderNumber?: string;
  total?:       number;
}

export default function OrderSuccessPage() {
  const { clearCart } = useCart();
  const location      = useLocation();
  const state         = location.state as OrderSuccessState | null;

  const orderNumber = state?.orderNumber ?? '#SR-2026-XXXX';
  const total       = state?.total != null ? `${state.total.toFixed(2)} €` : null;

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <>
      <SeoMeta title="Bestellung erfolgreich" noIndex />
    <section className="section">
      <div className="container">
        <div className="order-success">
          <div className="order-success__icon" aria-hidden="true" />

          <h1 className="order-success__title">Bestellung erfolgreich!</h1>

          <p className="order-success__subtitle">
            Vielen Dank für deine Bestellung. Du erhältst in Kürze eine
            Bestätigungs-E-Mail mit Bestellnummer und Tracking-Link.
          </p>

          <div className="order-success__order-num">
            Bestellnummer: <span>{orderNumber}</span>
          </div>

          <div className="order-success__details">
            <div className="order-success__details-row">
              <span>Status</span>
              <span>Bestätigt</span>
            </div>
            {total && (
              <div className="order-success__details-row">
                <span>Gesamt</span>
                <span>{total}</span>
              </div>
            )}
            <div className="order-success__details-row">
              <span>Versand</span>
              <span>Standard (3–5 Werktage)</span>
            </div>
            <div className="order-success__details-row">
              <span>Zahlung</span>
              <span>Abgeschlossen</span>
            </div>
          </div>

          <div className="order-success__actions">
            <Link to={ROUTES.ACCOUNT.ORDERS} className="btn btn--secondary">
              Bestellung verfolgen
            </Link>
            <Link to={ROUTES.HOME} className="btn btn--primary">
              Weiter shoppen
            </Link>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}

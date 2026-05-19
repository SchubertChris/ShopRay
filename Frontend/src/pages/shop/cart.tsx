import { Link } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '@features/cart';
import { useNotifications } from '@features/notifications';
import { ProductImage, SeoMeta } from '@components/ui';
import { ROUTES } from '@config/routes';

export default function CartPage() {
  const items          = useCart(s => s.items);
  const updateQuantity = useCart(s => s.updateQuantity);
  const removeItem     = useCart(s => s.removeItem);
  const notify         = useNotifications(s => s.notify);

  const subtotal  = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const shipping  = subtotal >= 50 ? 0 : 4.99;
  const cartTotal = subtotal.toFixed(2);

  return (
    <>
      <SeoMeta title="Warenkorb" noIndex />
    <section className="section">
        <div className="cart-page">
          <h1 className="cart-page__title">Warenkorb {cartCount > 0 && `(${cartCount})`}</h1>

          {items.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon"><ShoppingCart size={40} strokeWidth={1.25} /></span>
              <span className="empty-state__title">Dein Warenkorb ist leer</span>
              <span className="empty-state__text">Entdecke unsere Kollektion und füge Produkte hinzu.</span>
              <Link className="btn btn--primary mt-3" to={ROUTES.HOME}>Kollektion entdecken</Link>
            </div>
          ) : (
            <div className="cart-page__layout">
              {/* Artikel-Liste */}
              <div className="cart-items">
                {items.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item__thumb">
                      <ProductImage product={item} />
                    </div>
                    <div className="cart-item__info">
                      <div className="cart-item__name">{item.name}</div>
                      <div className="cart-item__variant">{item.category}</div>
                      <div className="cart-item__actions">
                        <div className="cart-item__qty">
                          <button onClick={() => updateQuantity(item.id, -1)} aria-label="Weniger">−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => {
                            const result = updateQuantity(item.id, +1);
                            if (!result.ok) notify({ type: 'error', title: result.reason ?? 'Nicht verfügbar' });
                          }} aria-label="Mehr">+</button>
                        </div>
                      </div>
                    </div>
                    <div className="cart-item__price">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} €
                    </div>
                    <button
                      className="cart-item__remove"
                      onClick={() => removeItem(item.id)}
                      aria-label={`${item.name} entfernen`}
                    >
                      <X size={16} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bestellübersicht */}
              <div className="cart-summary">
                <h2 className="cart-summary__title">Bestellübersicht</h2>
                <div className="cart-summary__rows">
                  <div className="cart-summary__row">
                    <span>Zwischensumme</span>
                    <span>{cartTotal} €</span>
                  </div>
                  <div className="cart-summary__row">
                    <span>Versand</span>
                    <span className={shipping === 0 ? 'cart-summary__shipping--free' : ''}>
                      {shipping === 0 ? 'Kostenlos' : `${shipping.toFixed(2)} €`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <div className="cart-summary__row cart-summary__row--hint">
                      <span>
                        Noch {(50 - subtotal).toFixed(2)} € bis zum Gratisversand
                      </span>
                    </div>
                  )}
                </div>
                <div className="cart-summary__row cart-summary__row--total">
                  <span>Gesamt</span>
                  <span>{(subtotal + shipping).toFixed(2)} €</span>
                </div>
                <p className="cart-summary__tax-hint">
                  inkl. MwSt. · <Link to={ROUTES.INFO.SHIPPING} className="cart-summary__tax-link">zzgl. Versandkosten</Link>
                </p>
                <div className="cart-summary__cta">
                  <Link to={ROUTES.SHOP.CHECKOUT} className="btn btn--primary btn--full">
                    Zur Kasse
                  </Link>
                  <Link to={ROUTES.HOME} className="btn btn--text btn--full">
                    Weiter shoppen
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
    </section>
    </>
  );
}

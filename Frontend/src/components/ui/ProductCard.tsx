import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useCart } from '@features/cart';
import { useWishlist } from '@features/wishlist';
import { useNotifications } from '@features/notifications';
import { ROUTES } from '@config/routes';
import { FEATURES } from '@config/features';
import { Stars } from './Stars';
import { ProductImage } from './ProductImage';
import type { Product } from '@features/products';

interface ProductCardProps {
  product:      Product;
  skeleton?:    boolean;
  revealDelay?: number;
  onQuickView?: (p: Product) => void;
}

export function ProductCard({ product: p, skeleton, revealDelay, onQuickView }: ProductCardProps) {
  const { addItem } = useCart();
  const notify      = useNotifications(s => s.notify);

  // Reaktiver Selector: Component re-rendert nur wenn DIESER Artikel sich ändert
  const isInWishlist = useWishlist(state => state.ids.includes(p.id));
  const toggle       = useWishlist(state => state.toggle);

  const isOutOfStock = (p.stock ?? 1) === 0;

  if (skeleton) {
    return (
      <div className="product-card">
        <div className="skeleton skeleton-thumb" />
        <div className="product-card__body">
          <div className="skeleton skeleton-text skeleton-text--short" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text skeleton-text--xshort" />
          <div className="skeleton skeleton-btn" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`product-card${isOutOfStock ? ' product-card--sold-out' : ''}`}
      {...(revealDelay ? { 'data-reveal': '', 'data-delay': String(revealDelay) } : {})}
    >
      <div className="product-card__image-wrap">
        {isOutOfStock && (
          <div className="product-card__sold-out" aria-hidden="true">
            <span>Ausverkauft</span>
          </div>
        )}
        {p.discount && !isOutOfStock && <span className="product-card__discount">{p.discount}</span>}
        {FEATURES.wishlist && (
          <button
            className={`product-card__wish-btn${isInWishlist ? ' is-active' : ''}`}
            aria-label={isInWishlist ? 'Von Wunschliste entfernen' : 'Zur Wunschliste hinzufügen'}
            onClick={(e) => {
              e.preventDefault();
              toggle(p.id);
              notify({
                type:  'wishlist',
                title: isInWishlist ? 'Von Wunschliste entfernt' : 'Zur Wunschliste hinzugefügt',
              });
            }}
          >
            <Heart size={16} strokeWidth={2} fill={isInWishlist ? 'currentColor' : 'none'} />
          </button>
        )}
        <Link to={ROUTES.SHOP.product(p.slug)} aria-label={p.name}>
          <ProductImage product={p} />
        </Link>
      </div>

      <div className="product-card__body">
        {p.badge && <span className="product-card__badge">{p.badge}</span>}
        <h4 className="product-card__title">
          <Link to={ROUTES.SHOP.product(p.slug)}>{p.name}</Link>
        </h4>

        <div className="product-card__rating">
          <Stars rating={p.rating} />
          <span>({p.reviews})</span>
        </div>

        <div className="product-card__price-row">
          <span className="product-card__price">{p.price} €</span>
          {p.oldPrice && <span className="product-card__price-old">{p.oldPrice} €</span>}
        </div>
        <p className="product-card__tax-hint">
          inkl. {p.taxRate}% MwSt. ·{' '}
          <a href="/versand" className="product-card__tax-link">zzgl. Versandkosten</a>
        </p>

        <div className="product-card__actions">
          {isOutOfStock ? (
            <button className="btn btn--primary product-card__atc-btn" disabled aria-disabled="true">
              Nicht verfügbar
            </button>
          ) : (
            <button className="btn btn--primary product-card__atc-btn" onClick={() => { addItem(p); notify({ type: 'success', title: 'In den Warenkorb gelegt', message: p.name, action: { label: 'Zum Warenkorb', href: '/cart' } }); }}>
              In den Warenkorb
            </button>
          )}
          {onQuickView && (
            <button className="btn btn--secondary product-card__qv-btn" onClick={() => onQuickView(p)} aria-label="Schnellansicht">
              Ansehen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

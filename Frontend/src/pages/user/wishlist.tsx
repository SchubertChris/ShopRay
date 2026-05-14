import { Heart } from 'lucide-react';
import { useWishlist } from '@features/wishlist';
import { PRODUCTS } from '@features/products';
import { ProductCard, SeoMeta } from '@components/ui';

export default function WishlistPage() {
  const ids = useWishlist(s => s.ids);

  const wishlistProducts = PRODUCTS.filter(p => ids.includes(p.id));

  return (
    <>
      <SeoMeta title="Wunschliste" noIndex />
    <div className="wishlist-page">
      <div className="wishlist-page__header">
        <h2>Wunschliste</h2>
        <span className="wishlist-page__count">{wishlistProducts.length} Artikel</span>
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="wishlist-page__empty">
          <span className="wishlist-page__empty-icon"><Heart size={40} strokeWidth={1.25} /></span>
          <span className="wishlist-page__empty-title">Wunschliste ist leer</span>
          <span className="wishlist-page__empty-text">Speichere Produkte, die dir gefallen, um sie hier wiederzufinden.</span>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistProducts.map((p, idx) => (
            <ProductCard key={p.id} product={p} revealDelay={idx + 1} />
          ))}
        </div>
      )}
    </div>
    </>
  );
}

import { Link } from 'react-router-dom';
import { ProductCard } from '@components/ui';
import { ROUTES } from '@config/routes';
import type { Product } from '@features/products';

interface BestsellerSectionProps {
  products: Product[];
}

export function BestsellerSection({ products }: BestsellerSectionProps) {
  return (
    <section className="cs-products" id="produkte" aria-labelledby="bestseller-heading">
      <div className="cs-section-head" data-reveal>
        <div>
          <span className="cs-eyebrow">Beliebt diese Woche</span>
          <h2 id="bestseller-heading" className="cs-heading">Bestseller</h2>
        </div>
        <Link to={ROUTES.SHOP.SEARCH} className="btn btn--ghost btn--sm">
          Alle anzeigen →
        </Link>
      </div>

      {/* data-reveal-stagger: jede Produktkarte erscheint mit Versatz */}
      <div className="cs-products__grid" data-reveal-stagger>
        {products.slice(0, 4).map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="cs-products__cta" data-reveal>
          <Link to={ROUTES.SHOP.SEARCH} className="btn btn--ghost">Alle Produkte ansehen →</Link>
        </div>
      )}
    </section>
  );
}

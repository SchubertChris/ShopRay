import { Link } from 'react-router-dom';
import { ROUTES } from '@config/routes';
import type { Category } from '@features/categories';

interface CategoriesSectionProps {
  categories: Category[];
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  return (
    <section className="cs-cats" aria-labelledby="cats-heading">
      <div className="cs-section-head" data-reveal>
        <div>
          <span className="cs-eyebrow">Wähle deinen Bereich</span>
          <h2 id="cats-heading" className="cs-heading">Kollektionen</h2>
        </div>
      </div>

      {/* data-reveal-stagger: Kategoriekarten staffeln */}
      <div className="cs-cats__grid" data-reveal-stagger>
        {categories.map(cat => (
          <Link
            key={cat.id}
            to={`${ROUTES.SHOP.SEARCH}?category=${encodeURIComponent(cat.name)}`}
            className="cs-cat-card"
          >
            {cat.image_url && (
              <>
                <img src={cat.image_url} alt="" loading="lazy" className="cs-cat-card__img" />
                <div className="cs-cat-card__overlay" aria-hidden="true" />
              </>
            )}
            <div className="cs-cat-card__body">
              <h3 className="cs-cat-card__name">{cat.name}</h3>
              <span className="cs-cat-card__count">{cat.count} Produkte</span>
            </div>
            <span className="cs-cat-card__arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

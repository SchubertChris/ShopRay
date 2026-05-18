import { useNavigate } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { useCategories } from '@features/categories';
import { ROUTES } from '@config/routes';
import { getCategoryImage } from '@config/images';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { data: categories, loading } = useCategories();

  const go = (name: string) =>
    navigate(`${ROUTES.SHOP.SEARCH}?category=${encodeURIComponent(name)}`);

  return (
    <>
      <SeoMeta
        title="Kollektionen"
        description="Entdecke unsere Kollektionen — handverlesene Produkte für jeden Geschmack."
      />

      <div className="cat-page">
        <div className="container">

          <header className="cat-header">
            <span className="cat-header__eyebrow">Sommer 2026</span>
            <h1 className="cat-header__title">Kollektionen</h1>
            <p className="cat-header__sub">
              Handverlesene Produkte in {categories.length} Welten — such dir deine aus.
            </p>
          </header>

          <div className="cat-grid">
            {loading && (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="cat-card" style={{ '--i': i } as React.CSSProperties}>
                  <div className="skeleton skeleton--full" style={{ height: '100%', borderRadius: '12px' }} />
                </div>
              ))
            )}
            {!loading && categories.map((cat, i) => {
              const img = cat.image_url ?? getCategoryImage(i);
              const mod = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              return (
                <button
                  key={cat.id}
                  className={`cat-card cat-card--${mod}${img ? ' has-image' : ''}`}
                  style={{ '--i': i } as React.CSSProperties}
                  onClick={() => go(cat.name)}
                  aria-label={`${cat.name} entdecken — ${cat.count} Produkte`}
                >
                  {img && (
                    <img
                      className="cat-card__img"
                      src={img}
                      alt=""
                      loading="lazy"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  )}
                  {img && <div className="cat-card__overlay" />}
                  <span className="cat-card__count">{cat.count} Produkte</span>
                  <div className="cat-card__body">
                    <h2 className="cat-card__name">{cat.name}</h2>
                    <span className="cat-card__cta" aria-hidden="true">Entdecken →</span>
                  </div>
                </button>
              );
            })}
            {!loading && categories.length === 0 && (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', opacity: 0.5 }}>
                Keine Kategorien vorhanden.
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

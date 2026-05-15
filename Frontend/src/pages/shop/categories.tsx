import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { useProducts } from '@features/products';
import { ROUTES } from '@config/routes';
import { getCategoryImage } from '@config/images';

const TAGLINES: Record<string, string> = {
  'Wohnen':    'Räume zum Leben gestalten',
  'Küche':     'Kochen mit Stil & Anspruch',
  'Deko':      'Details, die den Raum machen',
  'Textilien': 'Wärme für jeden Raum',
  'Kunst':     'Ausdruck für deine Wände',
  'Sport':     'Ausrüstung für jede Aktivität',
  'Outdoor':   'Natur pur erleben',
  'Technik':   'Smarte Produkte für den Alltag',
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { data: products } = useProducts();

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (p.category) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

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
            {categories.map(([name, count], i) => {
              const img = getCategoryImage(i);
              const mod = slugify(name);
              return (
                <button
                  key={name}
                  className={`cat-card cat-card--${mod}${img ? ' has-image' : ''}`}
                  style={{ '--i': i } as React.CSSProperties}
                  onClick={() => go(name)}
                  aria-label={`${name} entdecken — ${count} Produkte`}
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
                  <span className="cat-card__count">{count} Produkte</span>
                  <div className="cat-card__body">
                    <h2 className="cat-card__name">{name}</h2>
                    <p className="cat-card__tagline">
                      {TAGLINES[name] ?? 'Jetzt entdecken'}
                    </p>
                    <span className="cat-card__cta" aria-hidden="true">Entdecken →</span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}

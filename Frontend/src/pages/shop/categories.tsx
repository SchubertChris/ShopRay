import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { PRODUCTS, CATEGORIES, type ProductCategory } from '@features/products';
import { ROUTES } from '@config/routes';
import { getCategoryImage } from '@config/images';

interface CategoryDef {
  name:    ProductCategory;
  tagline: string;
  mod:     string;
  count:   number;
}

const CATEGORY_META: Omit<CategoryDef, 'count'>[] = [
  { name: 'Wohnen',    tagline: 'Räume zum Leben gestalten',     mod: 'wohnen'    },
  { name: 'Küche',     tagline: 'Kochen mit Stil & Anspruch',    mod: 'kueche'    },
  { name: 'Deko',      tagline: 'Details, die den Raum machen',  mod: 'deko'      },
  { name: 'Textilien', tagline: 'Wärme für jeden Raum',          mod: 'textilien' },
  { name: 'Kunst',     tagline: 'Ausdruck für deine Wände',      mod: 'kunst'     },
];

export default function CategoriesPage() {
  const navigate = useNavigate();

  const categories = useMemo<CategoryDef[]>(() =>
    CATEGORY_META.map(c => ({
      ...c,
      count: PRODUCTS.filter(p => p.category === c.name).length,
    })),
    []
  );

  const go = (name: ProductCategory) =>
    navigate(`${ROUTES.SHOP.SEARCH}?category=${encodeURIComponent(name)}`);

  return (
    <>
      <SeoMeta
        title="Kollektionen"
        description="Entdecke unsere fünf Kollektionen — Wohnen, Küche, Deko, Textilien und Kunst. Handverlesene Produkte für jeden Geschmack."
      />

      <div className="cat-page">
        <div className="container">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <header className="cat-header">
            <span className="cat-header__eyebrow">Sommer 2026</span>
            <h1 className="cat-header__title">Kollektionen</h1>
            <p className="cat-header__sub">
              Handverlesene Produkte in {CATEGORIES.length} Welten — such dir deine aus.
            </p>
          </header>

          {/* ── Bento-Grid ───────────────────────────────────────────────── */}
          <div className="cat-grid">
            {categories.map((cat, i) => {
              const img = getCategoryImage(i);
              return (
                <button
                  key={cat.name}
                  className={`cat-card cat-card--${cat.mod}${img ? ' has-image' : ''}`}
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
                    <p className="cat-card__tagline">{cat.tagline}</p>
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

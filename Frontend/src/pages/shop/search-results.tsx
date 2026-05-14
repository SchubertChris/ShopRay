import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProductSearch, type Product, type SortBy } from '@features/products';
import { ProductCard, Stars, ProductImage, SeoMeta } from '@components/ui';
import { useCart } from '@features/cart';
import { useNotifications } from '@features/notifications';
import { useWishlist } from '@features/wishlist';
import { ROUTES } from '@config/routes';

const CATEGORY_FILTERS = ['Alle', 'Wohnen', 'Küche', 'Deko', 'Textilien', 'Kunst'] as const;

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'popularity',  label: 'Beliebtheit' },
  { value: 'price-asc',  label: 'Preis ↑' },
  { value: 'price-desc', label: 'Preis ↓' },
  { value: 'newest',     label: 'Neuheiten' },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const urlCategory    = searchParams.get('category') ?? '';
  const urlFilter      = searchParams.get('filter');
  const initialIdx     = CATEGORY_FILTERS.indexOf(urlCategory as typeof CATEGORY_FILTERS[number]);

  const urlSort    = searchParams.get('sort') as SortBy | null;
  const validSorts: SortBy[] = ['popularity', 'price-asc', 'price-desc', 'newest'];
  const initialSort = urlSort && validSorts.includes(urlSort) ? urlSort : 'popularity';

  const [query,     setQuery]     = useState('');
  const [activeIdx, setActiveIdx] = useState(Math.max(0, initialIdx));
  const [sortBy,    setSortBy]    = useState<SortBy>(initialSort);
  const [quickView, setQuickView] = useState<Product | null>(null);

  const { addItem } = useCart();
  const notify      = useNotifications(s => s.notify);
  const { toggle }  = useWishlist();
  const wishlistIds = useWishlist(state => state.ids);

  const isSale = urlFilter === 'sale';
  const isNew  = sortBy === 'newest';

  const category       = activeIdx === 0 ? null : CATEGORY_FILTERS[activeIdx] as string;
  const results        = useProductSearch(query, category, sortBy);
  const displayResults = isSale ? results.filter(p => p.discount !== null) : results;

  useEffect(() => {
    let obs: IntersectionObserver;
    const timer = setTimeout(() => {
      obs = new IntersectionObserver(
        entries => entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
        }),
        { threshold: 0.05 },
      );
      document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(el => obs.observe(el));
    }, 50);
    return () => { clearTimeout(timer); obs?.disconnect(); };
  }, [displayResults]);

  return (
    <>
      <SeoMeta
        title={isSale ? 'Sale' : isNew ? 'Neuheiten' : 'Kollektionen'}
        description={
          isSale
            ? 'Jetzt sparen — reduzierte Produkte im Sale.'
            : isNew
            ? 'Entdecke die neuesten Produkte in unserem Sortiment.'
            : 'Stöbere durch unsere gesamte Kollektion — Wohnen, Küche, Deko, Textilien und mehr.'
        }
      />

      {/* ── MODE-AWARE HERO ──────────────────────────────────────────────── */}
      <div className={`collection-hero${isSale ? ' collection-hero--sale' : isNew ? ' collection-hero--new' : ''}`}>
        <div className="collection-hero__inner">
          <div className="collection-hero__text">
            {isSale ? (
              <>
                <span className="collection-hero__eyebrow">Ausgewählte Artikel reduziert</span>
                <h1 className="collection-hero__title">SALE</h1>
                <p className="collection-hero__sub">Bis zu <strong>−40 %</strong> — solange der Vorrat reicht</p>
              </>
            ) : isNew ? (
              <>
                <span className="collection-hero__eyebrow">Frisch eingetroffen</span>
                <h1 className="collection-hero__title">Neuheiten</h1>
                <p className="collection-hero__sub">Die neuesten Zugänge in unserem Sortiment</p>
              </>
            ) : (
              <>
                <span className="collection-hero__eyebrow">Sommer 2026</span>
                <h1 className="collection-hero__title">Kollektionen</h1>
              </>
            )}
          </div>
          <div className="collection-hero__search-col">
            <div className="collection-search">
              <span className="collection-search__icon" aria-hidden="true">/ /</span>
              <input
                className="collection-search__input"
                type="search"
                placeholder="Produkte, Materialien, Kategorien…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="collection-search__clear"
                  onClick={() => setQuery('')}
                  aria-label="Suche zurücksetzen"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY FILTER BAR ────────────────────────────────────────────── */}
      <div className="collection-filter">
        <div className="collection-filter__inner">
          {CATEGORY_FILTERS.map((f, i) => (
            <button
              key={f}
              className={`collection-filter__chip${activeIdx === i ? ' is-active' : ''}`}
              onClick={() => setActiveIdx(i)}
            >
              {f}
            </button>
          ))}
          <div className="collection-filter__spacer" />
          <select
            className="collection-filter__sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── GRID CONTENT ─────────────────────────────────────────────────── */}
      <div className="collection-body">
        <div className="container">
          <p className="collection-body__count">
            <span>{displayResults.length}</span>
            {displayResults.length === 1 ? ' Produkt' : ' Produkte'}
            {isSale && <> im <em>Sale</em></>}
            {query && <> — <em>„{query}"</em></>}
            {category && !query && !isSale && <> in <em>{category}</em></>}
          </p>

          {displayResults.length === 0 ? (
            <div className="collection-empty">
              <span className="collection-empty__zero">0</span>
              <p className="collection-empty__title">Keine Treffer</p>
              <p className="collection-empty__text">
                {query
                  ? `Keine Produkte für „${query}" gefunden.`
                  : isSale
                  ? 'Keine reduzierten Produkte verfügbar.'
                  : 'Keine Produkte in dieser Kategorie.'}
              </p>
              <button
                className="btn btn--ghost"
                onClick={() => { setQuery(''); setActiveIdx(0); }}
              >
                Alle Kollektionen
              </button>
            </div>
          ) : (
            <div className="collection-grid">
              {displayResults.map((p, idx) => (
                <ProductCard key={p.id} product={p} revealDelay={idx + 1} onQuickView={setQuickView} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK VIEW ───────────────────────────────────────────────────── */}
      {quickView && (
        <div className="modal-overlay" onClick={() => setQuickView(null)}>
          <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{quickView.name}</h3>
              <button className="modal__close" onClick={() => setQuickView(null)}>×</button>
            </div>
            <div className="modal__body">
              <div className="modal-product">
                <div className="modal-product__thumb">
                  <ProductImage id={quickView.id} />
                </div>
                <div className="modal-product__body">
                  <span className="product-card__badge">{quickView.category}</span>
                  <div className="modal-product__rating">
                    <Stars rating={quickView.rating} />
                    <span className="text-muted">({quickView.reviews})</span>
                  </div>
                  <p className="modal-product__desc">{quickView.description}</p>
                  <div className="product-card__price-row">
                    <span className="product-card__price">{quickView.price} €</span>
                    {quickView.oldPrice && (
                      <span className="product-card__price-old">{quickView.oldPrice} €</span>
                    )}
                    {quickView.discount && (
                      <span className="badge badge--danger">{quickView.discount}</span>
                    )}
                  </div>
                  <div className="modal-product__actions">
                    <button
                      className="btn btn--primary btn--full"
                      onClick={() => { addItem(quickView); notify({ type: 'success', title: 'In den Warenkorb gelegt', message: quickView.name, action: { label: 'Zum Warenkorb', href: '/cart' } }); setQuickView(null); }}
                    >
                      In den Warenkorb
                    </button>
                    <button
                      className="btn btn--ghost btn--full"
                      onClick={() => { toggle(quickView.id); setQuickView(null); }}
                    >
                      {wishlistIds.includes(quickView.id) ? 'Von Wunschliste entfernen' : 'Zur Wunschliste'}
                    </button>
                    <Link
                      to={ROUTES.SHOP.product(quickView.slug)}
                      className="btn btn--secondary btn--full"
                      onClick={() => setQuickView(null)}
                    >
                      Alle Details ansehen →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

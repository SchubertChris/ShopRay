import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Search, ChevronLeft, Heart, CheckCircle2, Check, ExternalLink, FileText } from 'lucide-react';
import { useProductBySlug } from '@features/products';
import type { LmivInfo } from '@features/products';
import { ImageGallery } from '@features/products/components/ImageGallery';
import { useCart } from '@features/cart';
import { useNotifications } from '@features/notifications';
import { useWishlist } from '@features/wishlist';
import { useReviews, createReview } from '@features/reviews';
import { useAuth } from '@features/auth';
import { Stars, SeoMeta, JsonLd } from '@components/ui';
import { ROUTES } from '@config/routes';
import { FEATURES } from '@config/features';
import { getErrorMessage } from '@/utils/errorMessage';

const DEMO_LMIV: LmivInfo = {
  ingredients:  'Molkenprotein-Isolat (Milch), Kakaopulver (10 %), Emulgator Lecithin (Soja), natürliches Vanille-Aroma.',
  allergens:    ['Milch', 'Soja'],
  servingSize:  '30 g (1 Messlöffel)',
  netContent:   '500 g',
  nutrients: [
    { name: 'Energie',             per100g: '1 548 kJ / 370 kcal', perServing: '464 kJ / 111 kcal' },
    { name: 'Fett',                per100g: '4,2 g',               perServing: '1,3 g' },
    { name: 'davon gesättigte FS', per100g: '1,8 g',               perServing: '0,5 g' },
    { name: 'Kohlenhydrate',       per100g: '6,8 g',               perServing: '2,0 g' },
    { name: 'davon Zucker',        per100g: '4,5 g',               perServing: '1,4 g' },
    { name: 'Ballaststoffe',       per100g: '1,2 g',               perServing: '0,4 g' },
    { name: 'Eiweiß',              per100g: '78 g',                perServing: '23,4 g', nrv: '47 %' },
    { name: 'Salz',                per100g: '0,55 g',              perServing: '0,17 g' },
  ],
  usage:       '1 Messlöffel (30 g) in 250–300 ml Wasser oder Milch einrühren. Empfohlen nach dem Training.',
  storageHint: 'Kühl, trocken und lichtgeschützt lagern. Nach Öffnung innerhalb von 3 Monaten verbrauchen.',
  warnings: [
    'Nahrungsergänzungsmittel sind kein Ersatz für eine ausgewogene und abwechslungsreiche Ernährung.',
    'Nicht für Kinder, Schwangere und Stillende geeignet.',
    'Die empfohlene tägliche Verzehrmenge nicht überschreiten.',
  ],
  manufacturer: 'Muster GmbH, Musterstraße 1, 12345 Musterstadt · Importiert von: Muster Import GmbH',
};

type Tab = 'details' | 'lmiv' | 'reviews';

export default function ProductDetailPage() {
  const { slug = '' } = useParams();
  const { data: product, loading: productLoading } = useProductBySlug(slug);
  const { addItem }    = useCart();
  const notify         = useNotifications(s => s.notify);
  const isInWishlist   = useWishlist(state => state.ids.includes(product?.id ?? ''));
  const toggle         = useWishlist(state => state.toggle);
  const { isAuthenticated } = useAuth();
  const [qty,       setQty]       = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('details');

  const { data: reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(product?.id ?? '');

  const [reviewRating,  setReviewRating]  = useState(0);
  const [reviewTitle,   setReviewTitle]   = useState('');
  const [reviewBody,    setReviewBody]    = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError,   setReviewError]   = useState<string | null>(null);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reviewRating === 0) { setReviewError('Bitte wähle eine Bewertung (1–5 Sterne).'); return; }
    if (!product) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      await createReview(product.id, { rating: reviewRating, title: reviewTitle, body: reviewBody });
      setReviewSuccess(true);
      setReviewRating(0); setReviewTitle(''); setReviewBody('');
      refetchReviews();
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      setReviewError(getErrorMessage(err));
    } finally {
      setReviewLoading(false);
    }
  }

  if (productLoading) {
    return (
      <section className="section">
        <div className="container">
          <div className="page-loader page-loader--inline"><span className="spinner" /></div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <span className="empty-state__icon"><Search size={40} strokeWidth={1.25} /></span>
            <span className="empty-state__title">Produkt nicht gefunden</span>
            <span className="empty-state__text">Das gesuchte Produkt existiert nicht oder wurde entfernt.</span>
            <Link className="btn btn--primary mt-3" to={ROUTES.HOME}>Zur Startseite</Link>
          </div>
        </div>
      </section>
    );
  }

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) addItem(product!);
    notify({ type: 'success', title: 'In den Warenkorb gelegt', message: product!.name, action: { label: 'Zum Warenkorb', href: '/cart' } });
  }

  const avgRating  = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:        product.name,
    description: product.description,
    sku:         product.id,
    image:       product.images?.[0] ?? undefined,
    offers: {
      '@type':        'Offer',
      priceCurrency:  'EUR',
      price:           product.price,
      availability:   (product.stock ?? 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    ...(avgRating && {
      aggregateRating: {
        '@type':       'AggregateRating',
        ratingValue:    avgRating,
        reviewCount:    reviews.length,
        bestRating:    '5',
        worstRating:   '1',
      },
    }),
  };

  return (
    <>
      <SeoMeta
        title={product.name}
        description={product.description ?? `${product.name} kaufen — ${product.category}`}
        ogType="product"
      />
      <JsonLd data={productSchema} />

      <section className="section">
        <div className="container">
          <div className="product-detail">

            {/* ── Breadcrumb ──────────────────────────────────────────────── */}
            <div className="product-detail__breadcrumb">
              <Link to={ROUTES.SHOP.SEARCH} className="product-detail__back">
                <ChevronLeft size={16} strokeWidth={2} />Kollektionen
              </Link>
              <span className="product-detail__breadcrumb-sep">/</span>
              <span>{product.category}</span>
              <span className="product-detail__breadcrumb-sep">/</span>
              <span>{product.name}</span>
            </div>

            {/* ── Haupt-Layout: Galerie + Info ─────────────────────────── */}
            <div className="product-detail__layout">

              {/* Galerie */}
              <div className="product-detail__gallery-col">
                <ImageGallery productId={product.id} productName={product.name} images={product.images} />
              </div>

              {/* Info-Panel */}
              <div className="product-info">
                <p className="product-info__category">{product.category}</p>
                <h1 className="product-info__title">{product.name}</h1>

                <div className="product-info__rating">
                  <Stars rating={product.rating} size={16} />
                  <span className="product-info__rating-count">({product.reviews} Bewertungen)</span>
                </div>

                {/* Preis */}
                <div className="product-info__price-block">
                  <span className="product-info__price">{product.price} €</span>
                  {product.oldPrice && (
                    <span className="product-info__price-old">{product.oldPrice} €</span>
                  )}
                  {product.discount && (
                    <span className="badge badge--danger">{product.discount}</span>
                  )}
                </div>
                <p className="product-info__tax-hint">
                  inkl. {product.taxRate}% MwSt. ·{' '}
                  <Link to={ROUTES.INFO.SHIPPING} className="product-info__tax-link">zzgl. Versandkosten</Link>
                </p>

                <p className="product-info__description">{product.description}</p>

                {/* Highlights */}
                {product.highlights && product.highlights.length > 0 && (
                  <ul className="product-highlights">
                    {product.highlights.map(h => (
                      <li key={h} className="product-highlights__item">
                        <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Menge + In den Warenkorb */}
                <div className="product-info__add-row">
                  <div className="product-info__qty">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Weniger">−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty(q => q + 1)} aria-label="Mehr">+</button>
                  </div>
                  <button className="btn btn--primary btn--lg" onClick={handleAddToCart}>
                    In den Warenkorb
                  </button>
                  {FEATURES.wishlist && (
                    <button
                      className={`btn btn--secondary btn--lg${isInWishlist ? ' is-wishlist-active' : ''}`}
                      onClick={() => toggle(product.id)}
                      aria-label={isInWishlist ? 'Von Wunschliste entfernen' : 'Zur Wunschliste'}
                    >
                      <Heart size={18} strokeWidth={1.75} fill={isInWishlist ? 'currentColor' : 'none'} />
                    </button>
                  )}
                </div>

                {/* Zertifikate & Siegel */}
                {product.certifications && product.certifications.length > 0 && (
                  <div className="cert-badges">
                    {product.certifications.map(c => (
                      <span key={c} className="cert-badge">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────── */}
            <div className="product-tabs">
              <div className="product-tabs__nav">
                <button
                  className={`product-tabs__tab${activeTab === 'details' ? ' product-tabs__tab--active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Produktdetails
                </button>
                {FEATURES.lmiv && (
                  <button
                    className={`product-tabs__tab${activeTab === 'lmiv' ? ' product-tabs__tab--active' : ''}`}
                    onClick={() => setActiveTab('lmiv')}
                  >
                    Inhaltsstoffe & Nährwerte
                  </button>
                )}
                {FEATURES.reviews && (
                  <button
                    className={`product-tabs__tab${activeTab === 'reviews' ? ' product-tabs__tab--active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                  >
                    Bewertungen{reviews && reviews.length > 0 ? ` (${reviews.length})` : ''}
                  </button>
                )}
              </div>

              {/* Tab: Produktdetails */}
              {activeTab === 'details' && (
                <div className="product-tabs__panel" key="details">
                  {product.richDescription ? (
                    <div
                      className="product-rich-description"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.richDescription, {
                        ALLOWED_TAGS: ['p','h4','h5','ul','ol','li','strong','em','br','span','a'],
                        ALLOWED_ATTR: ['href','target','rel'],
                      }) }}
                    />
                  ) : (
                    <p className="product-tabs__description">{product.description}</p>
                  )}
                </div>
              )}

              {/* Tab: Inhaltsstoffe & Nährwerte */}
              {activeTab === 'lmiv' && (() => {
                const lmiv = product.lmiv ?? DEMO_LMIV;
                return (
                  <div className="product-tabs__panel" key="lmiv">
                    <div className="lmiv">
                      {lmiv.nutrients && lmiv.nutrients.length > 0 && (
                        <div className="lmiv-block">
                          <div className="lmiv-block__title">Nährwertangaben</div>
                          {lmiv.servingSize && (
                            <p className="lmiv-block__note">Portionsgröße: {lmiv.servingSize}</p>
                          )}
                          <table className="nutrient-table">
                            <thead>
                              <tr>
                                <th>Nährstoff</th>
                                <th>pro 100 g</th>
                                {lmiv.nutrients.some(n => n.perServing) && <th>pro Portion</th>}
                                {lmiv.nutrients.some(n => n.nrv)        && <th>NRV %</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {lmiv.nutrients.map(n => (
                                <tr key={n.name} className={n.name.startsWith('davon') ? 'nutrient-table__sub' : ''}>
                                  <td>{n.name}</td>
                                  <td>{n.per100g}</td>
                                  {lmiv.nutrients!.some(x => x.perServing) && <td>{n.perServing ?? '—'}</td>}
                                  {lmiv.nutrients!.some(x => x.nrv)        && (
                                    <td>{n.nrv ? <span className="nrv-badge">{n.nrv}</span> : '—'}</td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="lmiv-block__footnote">
                            NRV = Nährstoffbezugswert (Nutrient Reference Value) für Erwachsene
                          </p>
                        </div>
                      )}
                      {lmiv.ingredients && (
                        <div className="lmiv-block">
                          <div className="lmiv-block__title">Zutaten</div>
                          <p className="lmiv-block__text">{lmiv.ingredients}</p>
                        </div>
                      )}
                      {lmiv.allergens && lmiv.allergens.length > 0 && (
                        <div className="lmiv-block">
                          <div className="lmiv-block__title">Enthält Allergene</div>
                          <div className="allergen-list">
                            {lmiv.allergens.map(a => (
                              <span key={a} className="allergen-badge">{a}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="lmiv-meta">
                        {lmiv.usage && (
                          <div className="lmiv-meta__item">
                            <div className="lmiv-meta__label">Verzehrempfehlung</div>
                            <div className="lmiv-meta__value">{lmiv.usage}</div>
                          </div>
                        )}
                        {lmiv.storageHint && (
                          <div className="lmiv-meta__item">
                            <div className="lmiv-meta__label">Lagerhinweis</div>
                            <div className="lmiv-meta__value">{lmiv.storageHint}</div>
                          </div>
                        )}
                        {lmiv.netContent && (
                          <div className="lmiv-meta__item">
                            <div className="lmiv-meta__label">Nettofüllmenge</div>
                            <div className="lmiv-meta__value">{lmiv.netContent}</div>
                          </div>
                        )}
                      </div>
                      {lmiv.warnings && lmiv.warnings.length > 0 && (
                        <div className="lmiv-warnings">
                          {lmiv.warnings.map(w => (
                            <p key={w} className="lmiv-warnings__item">{w}</p>
                          ))}
                        </div>
                      )}
                      {lmiv.manufacturer && (
                        <p className="lmiv-manufacturer">{lmiv.manufacturer}</p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Tab: Bewertungen */}
              {activeTab === 'reviews' && (
                <div className="product-tabs__panel" key="reviews">
                  <div className="reviews">
                    <div className="reviews__header">
                      <div className="reviews__title">Kundenbewertungen</div>
                      {reviews && reviews.length > 0 && (
                        <div className="reviews__avg">
                          {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                          <span>/ 5</span>
                        </div>
                      )}
                    </div>
                    {reviewsLoading ? (
                      <div className="page-loader page-loader--inline"><span className="spinner" /></div>
                    ) : reviews && reviews.length > 0 ? (
                      <div className="reviews__list">
                        {reviews.map(r => (
                          <div key={r.id} className="review-card">
                            <div className="review-card__header">
                              <div>
                                <div className="review-card__author">{r.userName}</div>
                                <Stars rating={r.rating} size={13} />
                              </div>
                              <div className="review-card__date">
                                {new Date(r.createdAt).toLocaleDateString('de-DE')}
                              </div>
                            </div>
                            <div className="review-card__title">{r.title}</div>
                            <div className="review-card__body">{r.body}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="reviews__empty">Noch keine Bewertungen. Sei der Erste!</p>
                    )}
                    {isAuthenticated ? (
                      <form className="review-form" onSubmit={handleReviewSubmit}>
                        <div className="review-form__title">Bewertung schreiben</div>
                        {reviewError && <p className="review-form__error">{reviewError}</p>}
                        <div className="review-form__stars">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              type="button"
                              className={`review-form__star${n <= reviewRating ? ' review-form__star--active' : ''}`}
                              onClick={() => setReviewRating(n)}
                              aria-label={`${n} Stern${n > 1 ? 'e' : ''}`}
                            >★</button>
                          ))}
                        </div>
                        <div className="review-form__fields">
                          <div className="form-group">
                            <label className="form-label" htmlFor="rv-title">Titel</label>
                            <input id="rv-title" className="form-input" type="text" required placeholder="Kurze Zusammenfassung" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label" htmlFor="rv-body">Deine Bewertung</label>
                            <textarea id="rv-body" className="form-textarea" required placeholder="Was hat dir gefallen oder nicht gefallen?" value={reviewBody} onChange={e => setReviewBody(e.target.value)} />
                          </div>
                        </div>
                        <button className="btn btn--primary btn--sm" type="submit" disabled={reviewLoading}>
                          {reviewLoading ? 'Wird gesendet…' : 'Bewertung absenden'}
                        </button>
                        {reviewSuccess && (
                          <div className="review-form__success">
                            <CheckCircle2 size={16} strokeWidth={2} /> Danke für deine Bewertung!
                          </div>
                        )}
                      </form>
                    ) : (
                      <p className="reviews__login-hint">
                        <Link to={ROUTES.AUTH.LOGIN} className="reviews__login-link">Anmelden</Link>{' '}
                        um eine Bewertung zu schreiben.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Händler & Bezugsquellen ──────────────────────────────── */}
            {product.dealerLinks && product.dealerLinks.length > 0 && (
              <div className="pd-section" data-reveal>
                <h2 className="pd-section__title">Erhältlich bei</h2>
                <div className="dealer-links">
                  {product.dealerLinks.map(d => (
                    <a
                      key={d.label}
                      href={d.href}
                      className="dealer-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="dealer-link__label">{d.label}</span>
                      <ExternalLink size={14} strokeWidth={1.75} className="dealer-link__icon" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── Downloads & Zertifikate ──────────────────────────────── */}
            {product.documents && product.documents.length > 0 && (
              <div className="pd-section" data-reveal>
                <h2 className="pd-section__title">Downloads & Dokumente</h2>
                <div className="product-documents">
                  {product.documents.map(d => (
                    <a
                      key={d.label}
                      href={d.href}
                      className="product-document"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {d.type === 'pdf'
                        ? <FileText size={16} strokeWidth={1.75} aria-hidden="true" />
                        : <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
                      }
                      <span>{d.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  );
}

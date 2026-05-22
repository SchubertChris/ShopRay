import { useState, useEffect } from 'react';
import { HeroCanvas } from './HeroCanvas';
import { Link } from 'react-router-dom';
import { useCart } from '@features/cart';
import { useNotifications } from '@features/notifications';
import { useWishlist } from '@features/wishlist';
import { useProducts } from '@features/products';
import type { Product } from '@features/products';
import { useCategories } from '@features/categories';
import { ProductCard, Stars, ProductImage, SeoMeta, JsonLd } from '@components/ui';
import { ROUTES } from '@config/routes';
import { useTheme } from '@providers/ThemeProvider';
import { PALETTES } from '@config/theme';
import { IMAGES, getAvatarImage, getCategoryImage } from '@config/images';
import { APP_NAME, APP_URL, APP_SOCIALS, APP_CONTACT, APP_OG_IMAGE } from '@config/app';

// ── DATA ──────────────────────────────────────────────────────────────────────


const TRUST_ITEMS = [
  '100 % Bio', 'Plastikfrei', 'Express-Versand', 'SSL-Sicher',
  '30 Tage Rückgabe', '4.9 / 5 Sterne', 'Seit 2018', 'Kauf auf Rechnung',
];

const USPS = [
  { metric: '100 %', title: 'Bio-zertifiziert',  size: 'large', text: 'Alle Rohstoffe aus kontrolliert ökologischem Anbau mit EU-Zertifizierung.' },
  { metric: '0 g',   title: 'Plastik',            size: 'small', text: 'Vollständig kompostierbare Verpackung.' },
  { metric: '24 h',  title: 'Express-Lieferung',  size: 'small', text: 'Bestellung bis 14 Uhr — Lieferung morgen.' },
  { metric: '30',    title: 'Tage Rückgabe',       size: 'small', text: 'Kostenlos, ohne Fragen.' },
  { metric: 'SSL',   title: 'Verschlüsselt',       size: 'small', text: 'SSL + PCI-DSS zertifiziert.' },
  { metric: '< 2 h', title: 'Support-Antwort',     size: 'large', text: 'Echte Menschen, kein Bot. Antwort im Schnitt unter 2 Stunden.' },
];

const REVIEWS = [
  { name: 'Anna M.',   date: 'April 2026', product: 'Sage Candle Set',    rating: 5, text: 'Traumhafte Qualität, riecht wunderbar und sieht noch besser aus als auf den Fotos.' },
  { name: 'Lars K.',   date: 'März 2026',  product: 'Ceramic Vase No. 4', rating: 5, text: 'Schnelle Lieferung, perfekte plastikfreie Verpackung — übertrifft alle Erwartungen.' },
  { name: 'Sophie B.', date: 'März 2026',  product: 'Stone Bowl Set',     rating: 4, text: 'Sehr schöne Verarbeitung und tolles Design. Genau wie auf den Fotos.' },
];

const FAQ_ITEMS = [
  { q: 'Wie lange dauert die Lieferung?',   a: 'Standard 3–5 Werktage, Express 1–2 Werktage. Ab 50 € Bestellwert kostenfrei.' },
  { q: 'Wie funktioniert die Rückgabe?',    a: '30 Tage Rückgaberecht ohne Angabe von Gründen — kostenlos per Retourenlink.' },
  { q: 'Welche Zahlungsmethoden gibt es?',  a: 'Kreditkarte, PayPal, Klarna, Sofortüberweisung und Apple Pay.' },
  { q: 'Kann ich meine Bestellung ändern?', a: 'Innerhalb von 30 Minuten nach Bestellung kostenfrei anpassen oder stornieren.' },
];

interface ToastState { visible: boolean; message: string; type: 'success' | 'error' | 'warning'; }

// ── SEITE ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: products }    = useProducts();
  const { data: categories }  = useCategories();
  const { palette, mode, setPalette, toggleMode } = useTheme();
  const { addItem, items, total, removeItem, count } = useCart();
  const notify = useNotifications(s => s.notify);
  const { toggle } = useWishlist();
  const wishlistIds = useWishlist(state => state.ids);

  const [themeDockOpen, setThemeDockOpen] = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [slotIdx,       setSlotIdx]       = useState(2); // mittleres Item im 5er-Fenster
  const [quickView,     setQuickView]     = useState<Product | null>(null);
  const [toast,         setToast]         = useState<ToastState>({ visible: false, message: '', type: 'success' });
  const [skeletons,     setSkeletons]     = useState(true);
  const [openFaq,       setOpenFaq]       = useState<number | null>(null);
  const [email,         setEmail]         = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSkeletons(false), 1600);
    return () => clearTimeout(t);
  }, []);

  // Slot-Index in sync mit der CSS-Animation halten (3s pro Item)
  useEffect(() => {
    if (!categories.length) return;
    const id = setInterval(() => setSlotIdx(i => (i + 1) % categories.length), 3000);
    return () => clearInterval(id);
  }, [categories.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [skeletons]);

  function showToast(message: string, type: ToastState['type'] = 'success') {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3200);
  }

  function handleAddItem(p: Product) {
    addItem(p);
    notify({ type: 'success', title: 'In den Warenkorb gelegt', message: p.name, action: { label: 'Zum Warenkorb', href: '/cart' } });
  }

  function handleToggleWishlist(id: string) {
    const wasIn = wishlistIds.includes(id);
    toggle(id);
    showToast(wasIn ? 'Von der Wunschliste entfernt' : 'Zur Wunschliste hinzugefügt', wasIn ? 'warning' : 'success');
  }

  const cartTotal = total().toFixed(2);
  const cartCount = count();

  const origin = typeof window !== 'undefined' ? window.location.origin : APP_URL;

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    url: origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${origin}/suche?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: origin,
    logo: {
      '@type':  'ImageObject',
      url:       `${origin}${APP_OG_IMAGE}`,
      width:    '1200',
      height:   '630',
    },
    contactPoint: {
      '@type':           'ContactPoint',
      email:              APP_CONTACT.email,
      telephone:          APP_CONTACT.phone,
      contactType:       'customer service',
      availableLanguage: 'German',
      areaServed:        'DE',
    },
    sameAs: Object.values(APP_SOCIALS).filter(v => v !== '#' && v !== ''),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <>
      <SeoMeta
        title="Startseite"
        description="Entdecke unsere Kollektion — handverlesene Produkte für Wohnen, Küche, Deko und mehr. Kostenloser Versand ab 50 €."
      />
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />
      <JsonLd data={faqSchema} />
      {/* ── THEME DOCK (Demo-Only) ──────────────────────────────────────────── */}
      <div className={`theme-dock${themeDockOpen ? ' is-open' : ''}`}>
        <button
          className="theme-dock__trigger"
          onClick={() => setThemeDockOpen(v => !v)}
          aria-label="Theme wechseln"
        >
          <span className="theme-dock__dot" />
          <span className="theme-dock__label">Themes</span>
        </button>

        {themeDockOpen && (
          <div className="theme-panel">
            <p className="theme-panel__title">Farbpalette</p>
            <div className="theme-panel__palettes">
              {PALETTES.map(p => (
                <button
                  key={p.id}
                  className={`theme-panel__swatch${palette === p.id ? ' is-active' : ''}`}
                  onClick={() => setPalette(p.id)}
                >
                  <span className="theme-panel__swatch-dot" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
            <div className="theme-panel__divider" />
            <button className="theme-panel__mode-btn" onClick={toggleMode}>
              {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        )}
      </div>

      {/* ── EDITORIAL HERO ──────────────────────────────────────────────────── */}
      <section className="editorial-hero">
        <div className="editorial-hero__bg" aria-hidden="true" />
        <HeroCanvas themeKey={`${palette}-${mode}`} />

        <div className="editorial-hero__inner">
          <div className="editorial-hero__content">
          <div className="hero-glass">

            <span
              className="editorial-hero__pill hero-fade"
              style={{ '--fd': '0s' } as React.CSSProperties}
            >
              Sommer 2026 — Neue Kollektion
            </span>

            <h1 className="editorial-hero__title">
              <span className="hero-word">
                <span className="hero-word__inner" style={{ '--wd': '0.18s' } as React.CSSProperties}>
                  Designed
                </span>
              </span>
              <br />
              <em>
                <span className="hero-word">
                  <span className="hero-word__inner" style={{ '--wd': '0.36s' } as React.CSSProperties}>
                    to last.
                  </span>
                </span>
              </em>
            </h1>

            <p
              className="editorial-hero__sub hero-fade"
              style={{ '--fd': '0.55s' } as React.CSSProperties}
            >
              Nachhaltige Wohnprodukte für ein bewusstes Leben. Von der Materialwahl bis zur plastikfreien Verpackung — jedes Detail durchdacht.
            </p>

            <div
              className="editorial-hero__ctas hero-fade"
              style={{ '--fd': '0.72s' } as React.CSSProperties}
            >
              <button
                className="btn btn--primary btn--lg"
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Kollektion entdecken
              </button>
              <button className="btn btn--ghost btn--lg hero-cart-btn" onClick={() => setDrawerOpen(true)}>
                {cartCount > 0 ? `Warenkorb (${cartCount})` : 'Warenkorb'}
              </button>
            </div>

            <div
              className="hero-social hero-fade"
              style={{ '--fd': '0.9s' } as React.CSSProperties}
            >
              <div className="hero-avatars">
                {(['A', 'L', 'S', 'M'] as const).map((l, i) => {
                  const avatarUrl = getAvatarImage(i);
                  return (
                    <div key={l} className={`hero-avatar hero-avatar--${i + 1}`}>
                      {avatarUrl
                        ? <img src={avatarUrl} alt="" loading="lazy" />
                        : l}
                    </div>
                  );
                })}
              </div>
              <div className="hero-social-text">
                <Stars rating={4.9} size={13} />
                <span>4.9 · über 2.400 Kunden</span>
              </div>
            </div>

          </div>{/* hero-glass */}
          </div>

          <div className="hero-slot" aria-label="Produktkategorien">
            <div className="hero-slot__header">
              <span className="hero-slot__label">Kollektionen</span>
              <span className="hero-slot__label-count">{categories.length} Bereiche</span>
            </div>

            <div className="hero-slot__body">
              <div className="hero-slot__rail" aria-hidden="true">
                <div className="hero-slot__arrow" />
              </div>
              <div className="hero-slot__frame">
                <Link
                  to={`${ROUTES.SHOP.CATEGORIES}?id=${categories[slotIdx % Math.max(categories.length, 1)]?.id ?? ''}`}
                  className="hero-slot__active-glass"
                  aria-label={`${categories[slotIdx % Math.max(categories.length, 1)]?.name ?? 'Kategorie'} entdecken`}
                />
                <div className="hero-slot__window">
                  <div className="hero-slot__track" aria-hidden="true">
                    {[...categories, ...categories, ...categories].map((cat, i) => (
                      <div key={i} className="hero-slot__item">
                        <span className="hero-slot__num">{cat.num}</span>
                        <span className="hero-slot__name">{cat.name}</span>
                        <span className="hero-slot__count">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="editorial-hero__scroll" aria-hidden="true">
          <span className="editorial-hero__scroll-label">Scroll</span>
          <div className="editorial-hero__scroll-line" />
        </div>
      </section>

      {/* ── TRUST MARQUEE ───────────────────────────────────────────────────── */}
      <div className="trust-bar" aria-hidden="true">
        <div className="trust-bar__track">
          {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
            <span key={i} className="trust-bar__item">{item}</span>
          ))}
        </div>
      </div>

      {/* ── EDITORIAL INTRO ─────────────────────────────────────────────────── */}
      <section className="editorial-intro">
        <div className="container" data-reveal>
          <h2 className="editorial-intro__text">
            Nachhaltige Wohnprodukte.<br />
            <span className="editorial-intro__sub">Jedes Detail durchdacht — von der Materialwahl bis zur Verpackung.</span>
          </h2>
        </div>
      </section>

      {/* ── KATEGORIE BENTO ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="cat-bento" data-reveal>
            {categories.map((cat, idx) => {
              const catImg = cat.image_url ?? getCategoryImage(idx);
              return (
                <Link
                  key={cat.id}
                  to={`${ROUTES.SHOP.SEARCH}?category=${encodeURIComponent(cat.name)}`}
                  className="cat-bento__item"
                >
                  {catImg && (
                    <>
                      <img src={catImg} alt="" loading="lazy" className="cat-bento__img" />
                      <div className="cat-bento__img-overlay" aria-hidden="true" />
                    </>
                  )}
                  <span className="cat-bento__num">{cat.num}</span>
                  <div className="cat-bento__body">
                    <h3 className="cat-bento__name">{cat.name}</h3>
                    <span className="cat-bento__count">{cat.count} Produkte</span>
                  </div>
                  <span className="cat-bento__arrow" aria-hidden="true">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BESTSELLER ──────────────────────────────────────────────────────── */}
      <section className="dark-block" id="products">
        <div className="container">
          <div className="products-head" data-reveal>
            <div>
              <span className="products-head__eyebrow">Beliebt diese Woche</span>
              <h2 className="products-head__title">Bestseller</h2>
            </div>
            <Link className="products-head__link" to={ROUTES.SHOP.SEARCH}>Alle anzeigen →</Link>
          </div>
          <div className="products-grid">
            {products.slice(0, 4).map((p, idx) => (
              <ProductCard key={p.id} product={p} skeleton={skeletons} revealDelay={idx + 1} onQuickView={setQuickView} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND SPLIT ─────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="brand-split" data-reveal>
            <div className="brand-split__visual">
              {IMAGES.brand ? (
                <>
                  <img src={IMAGES.brand} alt="" loading="lazy" className="brand-split__img" />
                  <div className="brand-split__overlay" aria-hidden="true" />
                </>
              ) : (
                <div className="brand-split__orb" aria-hidden="true" />
              )}
              <div className="brand-chip">
                <span className="brand-chip__label">Materialien</span>
                <span className="brand-chip__value">100 % bio-zertifiziert</span>
              </div>
            </div>
            <div className="brand-split__content">
              <span className="label">Unsere Mission</span>
              <h2 className="brand-split__title">Schönheit die nicht auf Kosten der Erde kommt.</h2>
              <p className="brand-split__text">
                Jedes Produkt entsteht in kleinen Manufakturen mit fairem Lohn, kurzen Lieferketten und ohne Kompromisse bei Materialqualität.
              </p>
              <div className="brand-split__stats">
                {[['2018', 'Gegründet'], ['4.9', 'Bewertung'], ['0 %', 'Plastik']].map(([val, lbl]) => (
                  <div key={lbl} className="brand-stat">
                    <div className="brand-stat__val">{val}</div>
                    <div className="brand-stat__lbl">{lbl}</div>
                  </div>
                ))}
              </div>
              <Link className="btn btn--primary" to={ROUTES.INFO.ABOUT}>Mehr erfahren</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── USP GRID ────────────────────────────────────────────────────────── */}
      <section className="dark-block">
        <div className="container">
          <div className="usp-grid" data-reveal>
            {USPS.map((usp, i) => (
              <div key={i} className={`usp-card usp-card--${usp.size}`}>
                <span className="usp-card__metric">{usp.metric}</span>
                <h5 className="usp-card__title">{usp.title}</h5>
                <p className="usp-card__text">{usp.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEUE ARRIVALS ────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="products-head" data-reveal>
            <div>
              <span className="products-head__eyebrow">Gerade eingetroffen</span>
              <h2 className="products-head__title">Neue Arrivals</h2>
            </div>
            <Link className="products-head__link" to={ROUTES.SHOP.SEARCH}>Neuheiten →</Link>
          </div>
          <div className="products-grid">
            {products.slice(4, 8).map((p, idx) => (
              <ProductCard key={p.id} product={p} skeleton={skeletons} revealDelay={idx + 1} onQuickView={setQuickView} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="dark-block">
        <div className="container">
          <div className="testimonials-head" data-reveal>
            <div>
              <span className="products-head__eyebrow">Was Kunden sagen</span>
              <h2 className="products-head__title">Echte Bewertungen</h2>
            </div>
            <div className="review-score-inline">
              <span className="review-score-inline__num">4.9</span>
              <Stars rating={4.9} size={18} />
              <span className="review-score-inline__label">/ 5 · 2.400 Bewertungen</span>
            </div>
          </div>
          <div className="review-grid" data-reveal>
            {REVIEWS.map((r, i) => (
              <div key={i} className="review-card-v2">
                <Stars rating={r.rating} size={15} />
                <p className="review-card-v2__text">"{r.text}"</p>
                <div className="review-card-v2__footer">
                  <div className={`review-avatar-v2 review-avatar-v2--${i + 1}`}>{r.name.charAt(0)}</div>
                  <div>
                    <p className="review-card-v2__name">{r.name}</p>
                    <p className="review-card-v2__sub">{r.product} · {r.date}</p>
                  </div>
                  <span className="review-verified">Verifiziert</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SPLIT ───────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="faq-split">
            <div className="faq-split__head" data-reveal>
              <span className="label">Häufige Fragen</span>
              <h2 className="faq-split__title">Alles was du wissen musst.</h2>
              <p className="faq-split__sub">Noch Fragen? Schreib uns — wir antworten innerhalb von 2 Stunden.</p>
              <Link className="btn btn--ghost btn--sm" to={ROUTES.INFO.CONTACT}>Kontakt →</Link>
            </div>
            <div className="faq-split__items" data-reveal>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="faq-item-v2">
                  <button
                    className="faq-item-v2__question"
                    aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{item.q}</span>
                    <span className="faq-item-v2__chevron">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && <p className="faq-item-v2__answer">{item.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ──────────────────────────────────────────────────────── */}
      <section className="newsletter-dark">
        <div className="newsletter-dark__orb" aria-hidden="true" />
        <div className="container newsletter-dark__inner" data-reveal>
          <span className="newsletter-dark__eyebrow">Exklusiv für Mitglieder</span>
          <h2 className="newsletter-dark__title">Join the Club.</h2>
          <p className="newsletter-dark__text">
            10 % auf deine erste Bestellung — plus exklusive Drops und Early-Bird-Preise.
          </p>
          <div className="newsletter-dark__form">
            <input
              type="email"
              className="newsletter-dark__input"
              placeholder="deine@email.de"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button
              className="btn newsletter-dark__btn"
              onClick={() => {
                if (email) { showToast('Willkommen im Club!'); setEmail(''); }
                else showToast('Bitte gib deine E-Mail-Adresse ein.', 'warning');
              }}
            >
              Jetzt anmelden
            </button>
          </div>
          <p className="newsletter-dark__disclaimer">Kein Spam · Jederzeit abmeldbar · DSGVO-konform</p>
        </div>
      </section>

      {/* ── QUICK VIEW MODAL ────────────────────────────────────────────────── */}
      {quickView && (
        <div className="modal-overlay" onClick={() => setQuickView(null)}>
          <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{quickView.name}</h3>
              <button className="modal__close" onClick={() => setQuickView(null)}>×</button>
            </div>
            <div className="modal__body">
              <div className="modal-product">
                <div className="modal-product__thumb"><ProductImage product={quickView} /></div>
                <div className="modal-product__body">
                  <span className="product-card__badge">{quickView.category}</span>
                  <div className="modal-product__rating">
                    <Stars rating={quickView.rating} />
                    <span className="text-muted text-sm">({quickView.reviews})</span>
                  </div>
                  <p className="modal-product__desc">{quickView.description}</p>
                  <div className="modal-product__price-row product-card__price-row">
                    <span className="product-card__price">{quickView.price} €</span>
                    {quickView.oldPrice && <span className="product-card__price-old">{quickView.oldPrice} €</span>}
                    {quickView.discount && <span className="badge badge--danger">{quickView.discount}</span>}
                  </div>
                  <p className="product-card__tax-hint">
                    inkl. {quickView.taxRate}% MwSt. ·{' '}
                    <a href="/versand" className="product-card__tax-link">zzgl. Versandkosten</a>
                  </p>
                  <div className="modal-product__actions">
                    <button
                      className="btn btn--primary btn--full"
                      onClick={() => { handleAddItem(quickView); setQuickView(null); }}
                    >
                      In den Warenkorb
                    </button>
                    <button
                      className="btn btn--ghost btn--full"
                      onClick={() => { handleToggleWishlist(quickView.id); setQuickView(null); }}
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

      {/* ── WARENKORB DRAWER ────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer">
            <div className="drawer__header">
              <h3 className="drawer__title">Warenkorb ({cartCount})</h3>
              <button className="drawer__close" onClick={() => setDrawerOpen(false)}>×</button>
            </div>
            {items.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state__title">Dein Warenkorb ist leer</span>
                <span className="empty-state__text">Entdecke unsere Kollektion.</span>
                <button className="btn btn--primary btn--sm" onClick={() => setDrawerOpen(false)}>
                  Weiter shoppen
                </button>
              </div>
            ) : (
              <>
                <div className="list-feed drawer__items">
                  {items.map(item => (
                    <div key={item.id} className="order-card">
                      <div className="order-card__thumb"><ProductImage product={item} /></div>
                      <div className="order-card__info">
                        <div className="order-card__name">{item.name}</div>
                        <div className="order-card__meta">{item.category} · {item.quantity} Stück</div>
                      </div>
                      <div className="order-card__price">
                        {(parseFloat(item.price) * item.quantity).toFixed(2)} €
                      </div>
                      <button
                        className="drawer__remove-btn"
                        onClick={() => removeItem(item.cartKey)}
                        aria-label={`${item.name} entfernen`}
                      >×</button>
                    </div>
                  ))}
                </div>
                {parseFloat(cartTotal) < 50 && (
                  <div className="drawer__shipping-hint">
                    Noch <strong>{(50 - parseFloat(cartTotal)).toFixed(2)} €</strong> bis kostenlosen Versand.
                  </div>
                )}
                <p className="drawer__tax-hint">
                  inkl. MwSt. · <a href="/versand" className="drawer__tax-link">zzgl. Versandkosten</a>
                </p>
                <div className="drawer__subtotal">
                  <span>Zwischensumme</span>
                  <span className="drawer__subtotal-price">{cartTotal} €</span>
                </div>
                <Link
                  className="btn btn--primary btn--full"
                  to={ROUTES.SHOP.CART}
                  onClick={() => setDrawerOpen(false)}
                >
                  Zur Kasse — {cartTotal} €
                </Link>
                <button
                  className="btn btn--text btn--full drawer__continue"
                  onClick={() => setDrawerOpen(false)}
                >
                  Weiter shoppen
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ── TOAST ───────────────────────────────────────────────────────────── */}
      {toast.visible && (
        <div className="toast-wrap">
          <div className={`toast toast--${toast.type}`}>
            <span className="toast__bar" aria-hidden="true" />
            <span className="toast__msg">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}

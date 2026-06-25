import { useState } from 'react';
import { Link }     from 'react-router-dom';
import { useProducts }            from '@features/products';
import { useCategories }          from '@features/categories';
import { subscribeNewsletter }    from '@features/newsletter';
import { ProductCard, Stars, SeoMeta, JsonLd } from '@components/ui';
import { ROUTES }     from '@config/routes';
import { APP_NAME, APP_URL, APP_CONTACT, APP_SOCIALS, APP_OG_IMAGE } from '@config/app';
import { useTheme }   from '@providers/ThemeProvider';
import { PALETTES }   from '@config/theme';

// ── Static Data ────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  '1.000+ Kunden', '4.9 / 5 Sterne', '2–3 Tage Lieferung', 'SSL-verschlüsselt',
  'DSGVO-konform', '30 Tage Rückgabe', 'Kostenloser Support', 'Made in Germany',
];

const REVIEWS = [
  {
    name:    'Lena K.',
    date:    'Mai 2026',
    product: 'Premium Paket',
    rating:  5,
    text:    'Blitzschnelle Lieferung und perfekte Qualität. Ich bin total begeistert — genau das, was ich mir erhofft hatte. Klare Empfehlung!',
    featured: true,
  },
  {
    name:    'Marc T.',
    date:    'April 2026',
    product: 'Starter Set',
    rating:  5,
    text:    'Top Qualität, schöne Verpackung und sehr schnelle Lieferung. Bestelle definitiv wieder.',
    featured: false,
  },
  {
    name:    'Sarah M.',
    date:    'April 2026',
    product: 'Bestseller Bundle',
    rating:  5,
    text:    'Einfach bestellt, schnell angekommen, qualitativ hochwertig. Genau so soll Online-Shopping sein.',
    featured: false,
  },
] as const;

const STAT_BADGES = [
  { val: '1k+',   lbl: 'Kunden',     cls: 'cs-hero__chip--tl' },
  { val: '4.9 ★', lbl: 'Bewertung',  cls: 'cs-hero__chip--bl' },
  { val: '2–3d',  lbl: 'Lieferzeit', cls: 'cs-hero__chip--tr' },
  { val: '30T',   lbl: 'Rückgabe',   cls: 'cs-hero__chip--br' },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────

function HeadlineWords({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="hw" style={{ '--i': i } as React.CSSProperties}>
          <span className="hw__inner">{word}{i < words.length - 1 ? ' ' : ''}</span>
        </span>
      ))}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: products }   = useProducts();
  const { data: categories } = useCategories();
  const { palette, mode, setPalette, toggleMode } = useTheme();

  const [email,         setEmail]         = useState('');
  const [subState,      setSubState]      = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [themeDockOpen, setThemeDockOpen] = useState(false);

  // ── Hero Card Carousel ───────────────────────────────────────────────────
  const [activeIdx, setActiveIdx] = useState(0);
  const [pulsing,   setPulsing]   = useState(false);

  const n     = products.length;
  const slots = n > 0 ? [0, 1, 2].map(i => products[(activeIdx + i) % n]) : [];
  const bgUrl = slots[0]?.imageUrl ?? null;

  function cycleNext() {
    if (pulsing || n < 2) return;
    setPulsing(true);
    setTimeout(() => {
      setActiveIdx(i => (i + 1) % n);
      setPulsing(false);
    }, 320);
  }

  // ── Newsletter ───────────────────────────────────────────────────────────
  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSubState('loading');
    try {
      await subscribeNewsletter({ email: trimmed });
      setSubState('done');
      setEmail('');
    } catch {
      setSubState('error');
    }
  }

  // ── SEO ──────────────────────────────────────────────────────────────────
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
    logo: { '@type': 'ImageObject', url: `${origin}${APP_OG_IMAGE}`, width: '1200', height: '630' },
    contactPoint: {
      '@type': 'ContactPoint', email: APP_CONTACT.email, telephone: APP_CONTACT.phone,
      contactType: 'customer service', availableLanguage: 'German', areaServed: 'DE',
    },
    sameAs: Object.values(APP_SOCIALS).filter(v => v !== '#' && v !== ''),
  };

  const featuredReview = REVIEWS[0];
  const miniReviews    = REVIEWS.slice(1);

  return (
    <>
      <SeoMeta
        title="Startseite"
        description="Qualitätsprodukte, schneller Versand und echter Support. Entdecke unseren Shop — Online-Shopping so wie es sein sollte."
      />
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />

      {/* ── THEME DOCK ────────────────────────────────────────────────────── */}
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
              {mode === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
          </div>
        )}
      </div>

      {/* ── HERO — Split Screen Reveal ──────────────────────────────────── */}
      <section className="cs-hero">

        {/* Hero background: gradient renders immediately (no LCP impact); product image
            via CSS ::before — pseudo-elements are not counted as LCP candidates */}
        <div
          className="cs-hero__bg"
          style={bgUrl ? ({ '--cs-bg': `url(${bgUrl})` } as React.CSSProperties) : undefined}
          aria-hidden="true"
        />
        {/* Noise texture stays on top of bg */}
        <div className="cs-hero__noise" aria-hidden="true" />

        <div className="cs-hero__grid">

          {/* ── Left: Content ──────────────────────────────────────────── */}
          <div className="cs-hero__content">
            <span className="cs-hero__eyebrow">Einfach. Schön. Sicher.</span>

            <h1 className="cs-hero__title">
              <HeadlineWords text="Dein Produkt." />
              <br />
              <em><HeadlineWords text="Deine Marke." /></em>
            </h1>

            <p className="cs-hero__sub">
              Entdecke handverlesene Produkte, genieß schnellen Versand und verlass dich
              auf echten Support — Online-Shopping so wie es sein sollte.
            </p>

            <div className="cs-hero__ctas">
              <Link to={ROUTES.SHOP.SEARCH} className="btn btn--primary btn--lg">
                Produkte entdecken →
              </Link>
              <Link to={ROUTES.INFO.ABOUT} className="btn btn--ghost btn--lg">
                Über uns
              </Link>
            </div>

            <div className="cs-hero__social">
              <Stars rating={4.9} size={14} />
              <span>4.9 · über 1.000 Bewertungen</span>
            </div>
          </div>

          {/* ── Right: Clickable Card Stack ────────────────────────────── */}
          <div className="cs-hero__visual" aria-hidden="true">

            {/* Card deck */}
            <div
              className={`cs-hero__card-stack${pulsing ? ' is-pulsing' : ''}`}
              onClick={cycleNext}
              role={n > 1 ? 'button' : undefined}
              tabIndex={n > 1 ? 0 : undefined}
              onKeyDown={n > 1 ? e => (e.key === 'Enter' || e.key === ' ') && cycleNext() : undefined}
              aria-label={n > 1 ? 'Nächstes Produkt anzeigen' : undefined}
              title={n > 1 ? 'Klicken für nächstes Produkt' : undefined}
            >
              {/* Back card */}
              <div className="cs-hero__mock cs-hero__mock--back">
                <div className="cs-hero__mock-img cs-hero__mock-img--placeholder" />
              </div>

              {/* Mid card */}
              <div className="cs-hero__mock cs-hero__mock--mid">
                {slots[1]?.imageUrl && (
                  <div className="cs-hero__mock-img">
                    <img
                      src={slots[1].imageUrl}
                      alt=""
                      className="cs-hero__mock-photo"
                      loading="lazy"
                    />
                  </div>
                )}
                {!slots[1]?.imageUrl && <div className="cs-hero__mock-img cs-hero__mock-img--placeholder" />}
                <div className="cs-hero__mock-body">
                  <div className="cs-hero__mock-line cs-hero__mock-line--title" />
                  <div className="cs-hero__mock-footer">
                    <div className="cs-hero__mock-price" />
                    <div className="cs-hero__mock-btn" />
                  </div>
                </div>
              </div>

              {/* Front card — active product */}
              <div className="cs-hero__mock cs-hero__mock--front">
                <div className="cs-hero__mock-img">
                  {slots[0]?.imageUrl ? (
                    <img
                      key={slots[0].imageUrl}           // remount on change → fade animation
                      src={slots[0].imageUrl}
                      alt={slots[0].name}
                      className="cs-hero__mock-photo"
                      loading="eager"
                    />
                  ) : (
                    <div className="cs-hero__mock-img--placeholder" style={{ width: '100%', height: '100%' }} />
                  )}
                </div>
                <div className="cs-hero__mock-body">
                  <p
                    key={slots[0]?.id}                  // remount on change → fade animation
                    className="cs-hero__mock-product-name"
                  >
                    {slots[0]?.name ?? ''}
                  </p>
                  <div className="cs-hero__mock-footer">
                    <span className="cs-hero__mock-price-text">
                      {slots[0]?.price ? `€ ${slots[0].price}` : ''}
                    </span>
                    <div className="cs-hero__mock-btn-icon">→</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Click hint — only when products available */}
            {n > 1 && (
              <p className="cs-hero__click-hint">
                Klicken für nächstes Produkt
              </p>
            )}

            {/* Stat chips */}
            {STAT_BADGES.map((b, i) => (
              <div
                key={i}
                className={`cs-hero__chip ${b.cls}`}
                style={{ animationDelay: `${0.5 + i * 0.12}s` } as React.CSSProperties}
              >
                <span className="cs-hero__chip-val">{b.val}</span>
                <span className="cs-hero__chip-lbl">{b.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
      <div className="trust-bar" aria-hidden="true">
        <div className="trust-bar__track">
          {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
            <span key={i} className="trust-bar__item">{item}</span>
          ))}
        </div>
      </div>

      {/* ── BESTSELLER ────────────────────────────────────────────────────── */}
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

      {/* ── KATEGORIEN ───────────────────────────────────────────────────── */}
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

      {/* ── REVIEWS ──────────────────────────────────────────────────────── */}
      <section className="cs-reviews" aria-labelledby="reviews-heading">
        <div className="cs-section-head" data-reveal>
          <div>
            <span className="cs-eyebrow">Was Kunden sagen</span>
            <h2 id="reviews-heading" className="cs-heading">Echte Bewertungen</h2>
          </div>
          <div className="cs-reviews__rating-badge">
            <Stars rating={4.9} size={16} />
            <span>4.9 · 1.000+ Bewertungen</span>
          </div>
        </div>

        <div className="cs-reviews__grid">
          <div className="cs-review-featured" data-reveal data-reveal-dir="left">
            <Stars rating={featuredReview.rating} size={18} />
            <blockquote className="cs-review-featured__quote">
              &ldquo;{featuredReview.text}&rdquo;
            </blockquote>
            <div className="cs-review-featured__footer">
              <div className="cs-review-avatar cs-review-avatar--0">
                {featuredReview.name.charAt(0)}
              </div>
              <div>
                <p className="cs-review-featured__name">{featuredReview.name}</p>
                <p className="cs-review-featured__sub">{featuredReview.product} · {featuredReview.date}</p>
              </div>
            </div>
          </div>

          <div className="cs-reviews__minis" data-reveal-stagger>
            {miniReviews.map((r, i) => (
              <div key={i} className="cs-review-mini">
                <Stars rating={r.rating} size={14} />
                <p className="cs-review-mini__text">&ldquo;{r.text}&rdquo;</p>
                <div className="cs-review-mini__footer">
                  <div className={`cs-review-avatar cs-review-avatar--${i + 1}`}>
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="cs-review-mini__name">{r.name}</p>
                    <p className="cs-review-mini__sub">{r.product}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
      <section className="cs-newsletter" aria-labelledby="newsletter-heading">
        <div className="cs-newsletter__inner">
          <span className="cs-eyebrow" data-reveal>Exklusiv für Mitglieder</span>
          <h2 id="newsletter-heading" className="cs-newsletter__title" data-reveal>
            Immer als Erster.
          </h2>
          <p className="cs-newsletter__sub" data-reveal>
            Neue Produkte, exklusive Angebote und 10 % Rabatt auf deine erste Bestellung —
            direkt in deinen Posteingang.
          </p>

          <form className="cs-newsletter__form" onSubmit={handleSubscribe} data-reveal>
            <input
              type="email"
              className="cs-newsletter__input"
              placeholder="deine@email.de"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={subState === 'loading' || subState === 'done'}
              required
              aria-label="E-Mail-Adresse"
            />
            <button
              type="submit"
              className="btn btn--primary"
              disabled={subState === 'loading' || subState === 'done'}
            >
              {subState === 'loading' ? 'Wird eingetragen…'
               : subState === 'done'  ? '✓ Eingetragen!'
               : 'Anmelden'}
            </button>
          </form>

          {subState === 'error' && (
            <p className="cs-newsletter__error" role="alert">
              Ein Fehler ist aufgetreten — bitte erneut versuchen.
            </p>
          )}

          <p className="cs-newsletter__disclaimer">
            Kein Spam · Jederzeit abmeldbar · DSGVO-konform
          </p>
        </div>
      </section>
    </>
  );
}

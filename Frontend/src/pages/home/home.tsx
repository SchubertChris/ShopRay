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
  '700+ Schüler', '4.9 / 5 Sterne', 'Live-Trading-Sessions', 'Discord-Community',
  'Seit 2024', 'Lifetime-Zugang', 'Praxis-orientiert', 'SSL-Sicher',
];

const REVIEWS = [
  {
    name:    'Leon K.',
    date:    'April 2026',
    product: 'Trading Anfänger Kurs',
    rating:  5,
    text:    'Endlich versteht man, was hinter den Kerzen steckt. Dieser Kurs hat mein Bild von Trading komplett verändert — klarer Aufbau, keine unnötigen Theorien.',
    featured: true,
  },
  {
    name:    'Jana M.',
    date:    'März 2026',
    product: 'Prompt Starter Kit',
    rating:  5,
    text:    'In wenigen Tagen habe ich mehr gelernt als in Monaten davor. Sehr empfehlenswert.',
    featured: false,
  },
  {
    name:    'Tobias S.',
    date:    'März 2026',
    product: 'Windows + Claude Code Kurs',
    rating:  5,
    text:    'Perfekte Einführung — auch für absolute Einsteiger. Klare Sprache, sofort umsetzbar.',
    featured: false,
  },
] as const;

// Decorative candlestick data [x, wickTop, wickBot, bodyTop, bodyH, isBull]
const CANDLES: [number, number, number, number, number, boolean][] = [
  [20,  18, 138, 58,  52, true ],
  [58,  28, 118, 43,  45, false],
  [96,  12, 152, 38,  78, true ],
  [134, 24, 128, 48,  48, false],
  [172,  8, 148, 28,  76, true ],
  [210, 18, 122, 44,  44, false],
  [248,  6, 142, 20,  82, true ],
];

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
      '@type': 'ImageObject',
      url:      `${origin}${APP_OG_IMAGE}`,
      width:   '1200',
      height:  '630',
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

  const featuredReview = REVIEWS.find(r => r.featured)!;
  const miniReviews    = REVIEWS.filter(r => !r.featured);

  return (
    <>
      <SeoMeta
        title="Startseite"
        description="Lerne Trading von Grund auf — mit echten Strategien, Live-Sessions und einer Community, die dich pushed. Candlescope Kurse &amp; Merch."
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

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="cs-hero">
        <div className="cs-hero__grid">

          {/* Content */}
          <div className="cs-hero__content">
            <span className="cs-hero__eyebrow">Trading-Plattform &amp; Community</span>

            <h1 className="cs-hero__title">
              <HeadlineWords text="Dein Edge." />
              <br />
              <em><HeadlineWords text="Dein Chart." /></em>
            </h1>

            <p className="cs-hero__sub" data-reveal>
              Lerne Trading von Grund auf — mit echten Strategien, Live-Sessions und einer
              Community, die dich pushed.
            </p>

            <div className="cs-hero__ctas" data-reveal>
              <Link to={`${ROUTES.SHOP.SEARCH}?category=Kurse`} className="btn btn--primary btn--lg">
                Kurse entdecken →
              </Link>
              <Link to={`${ROUTES.SHOP.SEARCH}?category=Merch`} className="btn btn--ghost btn--lg">
                Merch shoppen
              </Link>
            </div>

            <div className="cs-hero__social" data-reveal>
              <Stars rating={4.9} size={14} />
              <span>4.9 · über 700 Schüler</span>
            </div>
          </div>

          {/* Decorative chart */}
          <div className="cs-hero__visual" aria-hidden="true">
            <div className="cs-hero__chart-area">
              <svg
                className="cs-hero__chart-svg"
                viewBox="0 0 280 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="presentation"
              >
                {[40, 80, 120, 160].map(y => (
                  <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="#C9A84C" strokeWidth="0.5" opacity="0.12" />
                ))}
                {CANDLES.map(([x, wt, wb, bt, bh, bull], i) => (
                  <g key={i}>
                    <line
                      x1={x} y1={wt} x2={x} y2={wb}
                      stroke={bull ? '#C9A84C' : '#888'}
                      strokeWidth="1.5"
                      opacity={bull ? '0.6' : '0.35'}
                    />
                    <rect
                      x={x - 9} y={bt} width={18} height={bh} rx="2"
                      fill={bull ? '#C9A84C' : 'none'}
                      stroke={bull ? 'none' : '#888'}
                      strokeWidth="1.5"
                      opacity={bull ? '0.85' : '0.45'}
                    />
                  </g>
                ))}
              </svg>
            </div>

            <div className="cs-hero__chip cs-hero__chip--1">
              <span className="cs-hero__chip-val">700+</span>
              <span className="cs-hero__chip-lbl">Schüler</span>
            </div>
            <div className="cs-hero__chip cs-hero__chip--2">
              <span className="cs-hero__chip-val">4.9 ★</span>
              <span className="cs-hero__chip-lbl">Bewertung</span>
            </div>
          </div>
        </div>

        <div className="cs-hero__scroll" aria-hidden="true">
          <div className="cs-hero__scroll-dot" />
          <div className="cs-hero__scroll-line" />
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

        <div className="cs-products__grid">
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

        <div className="cs-cats__grid">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`${ROUTES.SHOP.SEARCH}?category=${encodeURIComponent(cat.name)}`}
              className="cs-cat-card"
              data-reveal
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
            <span className="cs-eyebrow">Was Schüler sagen</span>
            <h2 id="reviews-heading" className="cs-heading">Echte Bewertungen</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stars rating={4.9} size={16} />
            <span style={{ fontSize: '0.875rem', color: 'var(--clr-text-muted)' }}>
              4.9 · 700+ Bewertungen
            </span>
          </div>
        </div>

        <div className="cs-reviews__grid">
          <div className="cs-review-featured" data-reveal>
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

          <div className="cs-reviews__minis">
            {miniReviews.map((r, i) => (
              <div key={i} className="cs-review-mini" data-reveal>
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
            Join the Club.
          </h2>
          <p className="cs-newsletter__sub" data-reveal>
            Updates zu neuen Kursen, Live-Session-Einladungen und 10 % Rabatt auf deine erste Bestellung.
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

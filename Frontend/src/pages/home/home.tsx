import { useState, useEffect } from 'react';
import { gsap }                from 'gsap';
import { ScrollTrigger }       from 'gsap/ScrollTrigger';
import { useGSAP }             from '@gsap/react';
import { HeroCanvas }          from './HeroCanvas';

gsap.registerPlugin(ScrollTrigger);
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

// ── Animation-Design-System ───────────────────────────────────────────────────
// Einheitliche Tokens für alle GSAP-Animationen — nie Magic Numbers streuen.
// Easing-Hierarchie: ENTER für große Entrances, SOFT für Text/Labels, SPRING für Karten.
const EASE_ENTER  = 'expo.out';      // Große Entrances: Headings, Hero, Bento
const EASE_SOFT   = 'power2.out';    // Sanfte Reveals: Fließtext, Eyebrows, Subs
const EASE_SPRING = 'back.out(1.1)'; // Karten mit minimalem Federgefühl
const DUR_FAST    = 0.65;            // Schnell: Labels, Eyebrows, Sub-Text
const DUR_BASE    = 0.9;             // Standard: Sektionen, Karten
const DUR_SLOW    = 1.25;            // Dramatisch: Bento, Intro-Heading, Brand
const STAGGER_SM  = 0.055;           // Dichter Stagger: FAQ (viele Items)
const STAGGER_MD  = 0.085;           // Standard-Stagger: Karten, USPs, Reviews
const Y_NEAR      = 22;              // Subtiler Y-Versatz: Text, Labels
const Y_MID       = 44;              // Standard Y-Versatz: Karten, Sektionen
const X_SIDE      = 60;              // Horizontaler Versatz: Brand Split, Arrivals

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
  { q: 'Wie lange dauert die Lieferung?',        a: 'Standard 3–5 Werktage, Express 1–2 Werktage. Ab 50 € Bestellwert ist der Versand kostenlos.' },
  { q: 'Wie funktioniert die Rückgabe?',         a: '30 Tage Rückgaberecht ohne Angabe von Gründen — kostenlos per Retourenlink direkt aus deinem Kundenkonto.' },
  { q: 'Welche Zahlungsmethoden gibt es?',       a: 'Kreditkarte, PayPal, Klarna (Ratenkauf & Rechnung), Sofortüberweisung und Apple Pay.' },
  { q: 'Kann ich meine Bestellung ändern?',      a: 'Innerhalb von 30 Minuten nach Bestellung kannst du Artikel, Menge und Adresse kostenfrei anpassen oder stornieren.' },
  { q: 'Sind alle Produkte wirklich bio?',        a: 'Ja — jedes Produkt trägt eine EU-Bio-Zertifizierung. Unsere Lieferketten werden jährlich durch unabhängige Prüfstellen kontrolliert.' },
  { q: 'Wie wird verpackt?',                     a: 'Vollständig plastikfrei: Kartons aus Recyclingpapier, Füllmaterial aus Maisstärke, Klebeband aus Papier. Alles kompostierbar.' },
  { q: 'Gibt es eine Mindestbestellmenge?',      a: 'Nein — du kannst auch einzelne Artikel bestellen. Kostenloser Versand gilt bereits ab 50 € Warenwert.' },
  { q: 'Wie erreiche ich den Kundensupport?',    a: 'Per Chat (Antwort < 2 h), E-Mail oder Telefon. Montag bis Freitag 9–18 Uhr, Samstag 10–14 Uhr.' },
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

  // ── Block 1: Statische Elemente — einmalig auf Mount ─────────────────────
  useGSAP(() => {
    // HERO ENTRANCE — immer (above-the-fold, kein ScrollTrigger nötig, kein Mobile-Skip)
    gsap.from('.editorial-hero__pill',  { y: Y_NEAR, opacity: 0, duration: DUR_FAST, delay: 0.20, ease: EASE_SOFT });
    gsap.from('.hero-word__inner',      { y: '110%', stagger: 0.1, duration: DUR_BASE, delay: 0.05, ease: EASE_ENTER });
    gsap.from('.editorial-hero__sub',   { y: Y_NEAR, opacity: 0, duration: DUR_FAST, delay: 0.45, ease: EASE_SOFT });
    gsap.from('.editorial-hero__ctas',  { y: Y_NEAR, opacity: 0, duration: DUR_FAST, delay: 0.62, ease: EASE_SOFT });
    gsap.from('.hero-social',           { y: 16,     opacity: 0, duration: DUR_FAST, delay: 0.78, ease: EASE_SOFT });
    gsap.from('.hero-slot',             { x: X_SIDE, opacity: 0, duration: DUR_SLOW, delay: 0.30, ease: EASE_ENTER });

    // ── Scroll-Animationen: nur Desktop (pointer: fine) ─────────────────────
    // Auf Touch-Geräten: ScrollTrigger-Transform-Animationen ruckeln + kein
    // Mehrwert (kein Hover, kein Parallax). Opacity-only über CSS [data-reveal].
    if (window.matchMedia('(pointer: coarse)').matches) return;

    // Parallax
    gsap.to('.editorial-hero__bg', {
      yPercent: 28, ease: 'none',
      scrollTrigger: { trigger: '.editorial-hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero-canvas', {
      yPercent: 14, ease: 'none',
      scrollTrigger: { trigger: '.editorial-hero', start: 'top top', end: 'bottom top', scrub: 1.8 },
    });

    // Trust Bar — simples Fade reicht, kein Transform nötig
    gsap.from('.trust-bar', {
      opacity: 0, duration: DUR_FAST,
      scrollTrigger: { trigger: '.trust-bar', start: 'top 95%' },
    });

    // Editorial Intro — großer Heading, dramatisches Entrance
    gsap.from('.editorial-intro__text', {
      y: Y_MID, opacity: 0, duration: DUR_SLOW, ease: EASE_ENTER,
      scrollTrigger: { trigger: '.editorial-intro', start: 'top 80%' },
    });

    // Sektions-Köpfe — subtil, immer im DOM unabhängig von Produktdaten
    gsap.utils.toArray<HTMLElement>('.products-head').forEach(el => {
      gsap.from(el, {
        y: Y_NEAR, opacity: 0, duration: DUR_FAST, ease: EASE_SOFT,
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    // Brand Split — visuell starker horizontaler Aufbau
    gsap.from('.brand-split__visual-wrap', {
      x: -X_SIDE, opacity: 0, duration: DUR_SLOW, ease: EASE_ENTER,
      scrollTrigger: { trigger: '.brand-split', start: 'top 78%' },
    });
    gsap.from('.brand-split__content > *', {
      x: X_SIDE * 0.65, opacity: 0, stagger: STAGGER_MD, duration: DUR_BASE, ease: EASE_ENTER,
      scrollTrigger: { trigger: '.brand-split', start: 'top 78%' },
    });

    // Partikel-Ringe — scrub, nur Desktop (Rotation auf Touch zu teuer)
    gsap.to('.particle-ring--outer', {
      rotation: 360, ease: 'none',
      scrollTrigger: { trigger: '.brand-split', start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
    gsap.to('.particle-ring--inner', {
      rotation: -360, ease: 'none',
      scrollTrigger: { trigger: '.brand-split', start: 'top bottom', end: 'bottom top', scrub: 1.6 },
    });

    // USP Grid — scale minimal (0.96 statt 0.93: weniger aggressiv)
    gsap.utils.toArray<HTMLElement>('.usp-card').forEach((card, i) => {
      gsap.from(card, {
        y: Y_MID, opacity: 0, scale: 0.96, duration: DUR_BASE, ease: EASE_SPRING,
        delay: i * STAGGER_MD,
        scrollTrigger: { trigger: '.usp-grid', start: 'top 82%', toggleActions: 'play none none none' },
      });
    });

    // Testimonials — Head + Cards getrennt triggern
    gsap.from('.testimonials-head', {
      y: Y_NEAR, opacity: 0, duration: DUR_FAST, ease: EASE_SOFT,
      scrollTrigger: { trigger: '.testimonials-head', start: 'top 88%' },
    });
    gsap.from('.review-card-v2', {
      y: Y_MID, opacity: 0, stagger: STAGGER_MD * 1.4, duration: DUR_BASE, ease: EASE_SOFT,
      scrollTrigger: { trigger: '.review-grid', start: 'top 82%' },
    });

    // FAQ — Head horizontal, Items fade up mit engem Stagger (8 Items: 8 × 55ms = 440ms)
    gsap.from('.faq-split__head', {
      x: -(X_SIDE * 0.75), opacity: 0, duration: DUR_BASE, ease: EASE_ENTER,
      scrollTrigger: { trigger: '.faq-split', start: 'top 82%' },
    });
    gsap.from('.faq-item-v2', {
      y: Y_NEAR, opacity: 0, stagger: STAGGER_SM, duration: DUR_FAST, ease: EASE_SOFT,
      scrollTrigger: { trigger: '.faq-split__items', start: 'top 88%' },
    });

    // Newsletter — zentriert einblenden, kein X-Versatz nötig
    gsap.from('.newsletter-dark__inner > *', {
      y: Y_MID, opacity: 0, stagger: STAGGER_MD, duration: DUR_BASE, ease: EASE_ENTER,
      scrollTrigger: { trigger: '.newsletter-dark', start: 'top 82%' },
    });
  }, []);

  // ── Block 2: Bento — läuft sobald categories geladen sind ─────────────────
  useGSAP(() => {
    if (!categories.length) return;

    const mobile = window.matchMedia('(pointer: coarse)').matches;

    if (mobile) {
      // Mobile: reines Fade, kein Transform (keine Rotation, kein X/Y-Versatz)
      gsap.from('.cat-bento__item', {
        opacity: 0, duration: 0.5, ease: EASE_SOFT,
        scrollTrigger: { trigger: '.cat-bento', start: 'top 90%' },
      });
      return;
    }

    // Desktop: koordinierte Richtungs-Animation pro Karte
    // Kleine Werte für sanften Einzug — kein überdrehtes Rotation-Overload
    const bentoFrom = [
      { x: -45, y:   0, rotation: -0.8 },
      { x:  30, y: -28, rotation:  0.6 },
      { x:   0, y:  38, rotation: -0.5 },
      { x:  45, y:   0, rotation:  0.8 },
      { x:   0, y:  32, rotation: -0.6 },
      { x: -30, y:  28, rotation:  0.5 },
    ];
    gsap.utils.toArray<HTMLElement>('.cat-bento__item').forEach((item, i) => {
      const dir = bentoFrom[i] ?? { x: 0, y: 32, rotation: 0 };
      gsap.from(item, {
        ...dir, opacity: 0, duration: DUR_SLOW, ease: EASE_SOFT,
        delay: i * STAGGER_SM,
        scrollTrigger: { trigger: '.cat-bento', start: 'top 82%', toggleActions: 'play none none none' },
      });
    });
  }, [categories.length]);

  // ── Block 3: Product Cards — nach Data-Load + Skeleton-Ende ───────────────
  // products kommen async; Skeletons laufen 1.6 s — erst danach sind echte
  // Cards im DOM und ScrollTrigger-Positionen korrekt berechenbar.
  useGSAP(() => {
    if (skeletons || !products.length) return;

    const mobile = window.matchMedia('(pointer: coarse)').matches;

    // BESTSELLER CARDS — fade up, staggered
    gsap.utils.toArray<HTMLElement>('.products-grid:not(.products-grid--wide) .product-card').forEach((card, i) => {
      gsap.from(card, {
        y:        mobile ? 0 : Y_MID,
        opacity:  0,
        duration: mobile ? 0.4 : DUR_BASE,
        ease:     EASE_SOFT,
        delay:    mobile ? 0 : (i % 4) * STAGGER_MD,
        scrollTrigger: { trigger: card, start: 'top 92%', toggleActions: 'play none none none' },
      });
    });

    // ARRIVALS CARDS — links/rechts alternierend (nur Desktop mit seitlichem Einzug)
    gsap.utils.toArray<HTMLElement>('.products-grid--wide .product-card').forEach((card, i) => {
      const fromLeft = i % 2 === 0;
      gsap.from(card, {
        x:        mobile ? 0 : (fromLeft ? -X_SIDE : X_SIDE),
        opacity:  0,
        duration: mobile ? 0.4 : DUR_SLOW * 0.88,
        ease:     EASE_ENTER,
        delay:    mobile ? 0 : Math.floor(i / 2) * (STAGGER_MD * 1.5),
        scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
      });
    });

    ScrollTrigger.refresh();
  }, [skeletons, products.length]);

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
            <span className="editorial-hero__pill">
              Sommer 2026 — Neue Kollektion
            </span>

            <h1 className="editorial-hero__title">
              <span className="hero-word">
                <span className="hero-word__inner">Designed</span>
              </span>
              <br />
              <em>
                <span className="hero-word">
                  <span className="hero-word__inner">to last.</span>
                </span>
              </em>
            </h1>

            <p className="editorial-hero__sub">
              Nachhaltige Wohnprodukte für ein bewusstes Leben. Von der Materialwahl bis zur plastikfreien Verpackung — jedes Detail durchdacht.
            </p>

            <div className="editorial-hero__ctas">
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

            <div className="hero-social">
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
        <div className="container">
          <h2 className="editorial-intro__text">
            Nachhaltige Wohnprodukte.<br />
            <span className="editorial-intro__sub">Jedes Detail durchdacht — von der Materialwahl bis zur Verpackung.</span>
          </h2>
        </div>
      </section>

      {/* ── KATEGORIE BENTO ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="cat-bento">
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
          <div className="products-head">
            <div>
              <span className="products-head__eyebrow">Beliebt diese Woche</span>
              <h2 className="products-head__title">Bestseller</h2>
            </div>
            <Link className="products-head__link" to={ROUTES.SHOP.SEARCH}>Alle anzeigen →</Link>
          </div>
          <div className="products-grid">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} skeleton={skeletons} onQuickView={setQuickView} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND SPLIT ─────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="brand-split">
            <div className="brand-split__visual-wrap">
              <div className="particle-ring particle-ring--outer" aria-hidden="true" />
              <div className="particle-ring particle-ring--inner" aria-hidden="true" />
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
          <div className="usp-grid">
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
          <div className="products-head">
            <div>
              <span className="products-head__eyebrow">Gerade eingetroffen</span>
              <h2 className="products-head__title">Neue Arrivals</h2>
            </div>
            <Link className="products-head__link" to={ROUTES.SHOP.SEARCH}>Neuheiten →</Link>
          </div>
          <div className="products-grid products-grid--wide">
            {products.slice(4, 8).map((p) => (
              <ProductCard key={p.id} product={p} skeleton={skeletons} onQuickView={setQuickView} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="dark-block">
        <div className="container">
          <div className="testimonials-head">
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
          <div className="review-grid">
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
            <div className="faq-split__head">
              <span className="label">Häufige Fragen</span>
              <h2 className="faq-split__title">Alles was du wissen musst.</h2>
              <p className="faq-split__sub">Noch Fragen? Schreib uns — wir antworten innerhalb von 2 Stunden.</p>
              <Link className="btn btn--ghost btn--sm" to={ROUTES.INFO.CONTACT}>Kontakt →</Link>
            </div>
            <div className="faq-split__items">
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
        <div className="container newsletter-dark__inner">
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

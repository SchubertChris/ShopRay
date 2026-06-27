import { useState } from 'react';
import { useProducts }            from '@features/products';
import { useCategories }          from '@features/categories';
import { SeoMeta, JsonLd } from '@components/ui';
import { APP_NAME, APP_URL, APP_CONTACT, APP_SOCIALS, APP_OG_IMAGE } from '@config/app';
import { useTheme }   from '@providers/ThemeProvider';
import { useHeroCarousel } from './hooks/useHeroCarousel';
import { ThemeDock } from './components/ThemeDock';
import { HeroSection } from './components/HeroSection';
import { TrustBar } from './components/TrustBar';
import { BestsellerSection } from './components/BestsellerSection';
import { CategoriesSection } from './components/CategoriesSection';
import { ReviewsSection } from './components/ReviewsSection';
import { NewsletterSection } from './components/NewsletterSection';

// ── Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: products }   = useProducts();
  const { data: categories } = useCategories();
  const { palette, mode, setPalette, toggleMode } = useTheme();

  const [themeDockOpen, setThemeDockOpen] = useState(false);

  // ── Hero Card Carousel ───────────────────────────────────────────────────
  const { slots, bgUrl, pulsing, n, cycleNext } = useHeroCarousel(products);

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

  return (
    <>
      <SeoMeta
        title="Startseite"
        description="Qualitätsprodukte, schneller Versand und echter Support. Entdecke unseren Shop — Online-Shopping so wie es sein sollte."
      />
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />

      {/* ── THEME DOCK ────────────────────────────────────────────────────── */}
      <ThemeDock
        open={themeDockOpen}
        onToggle={() => setThemeDockOpen(v => !v)}
        palette={palette}
        mode={mode}
        setPalette={setPalette}
        toggleMode={toggleMode}
      />

      {/* ── HERO — Split Screen Reveal ──────────────────────────────────── */}
      <HeroSection bgUrl={bgUrl} slots={slots} pulsing={pulsing} n={n} cycleNext={cycleNext} />

      {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
      <TrustBar />

      {/* ── BESTSELLER ────────────────────────────────────────────────────── */}
      <BestsellerSection products={products} />

      {/* ── KATEGORIEN ───────────────────────────────────────────────────── */}
      <CategoriesSection categories={categories} />

      {/* ── REVIEWS ──────────────────────────────────────────────────────── */}
      <ReviewsSection />

      {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
      <NewsletterSection />
    </>
  );
}

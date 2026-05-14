import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE, APP_URL } from '@config/app';

/** Setzt <title> + <meta> im <head> via React 19 native hoisting — kein react-helmet nötig */

interface SeoMetaProps {
  title:        string;
  description?: string;
  noIndex?:     boolean;
  ogImage?:     string;
  ogType?:      'website' | 'product' | 'article';
  canonical?:   string;
}

export function SeoMeta({
  title,
  description = APP_DESCRIPTION,
  noIndex     = false,
  ogImage     = APP_OG_IMAGE,
  ogType      = 'website',
  canonical,
}: SeoMetaProps) {
  const base        = typeof window !== 'undefined' ? window.location.origin : APP_URL;
  const fullTitle   = `${title} | ${APP_NAME}`;
  const canonicalUrl = canonical
    ? canonical.startsWith('http') ? canonical : `${base}${canonical}`
    : base + (typeof window !== 'undefined' ? window.location.pathname : '');
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${base}${ogImage}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type"        content={ogType} />
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:image"       content={ogImageUrl} />
      <meta property="og:site_name"   content={APP_NAME} />

      {/* Twitter / X Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={ogImageUrl} />

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
    </>
  );
}

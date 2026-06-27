// ── Static Data ────────────────────────────────────────────────────────────

export const TRUST_ITEMS = [
  '1.000+ Kunden', '4.9 / 5 Sterne', '2–3 Tage Lieferung', 'SSL-verschlüsselt',
  'DSGVO-konform', '30 Tage Rückgabe', 'Kostenloser Support', 'Made in Germany',
];

export const REVIEWS = [
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

export type Review = (typeof REVIEWS)[number];

export const STAT_BADGES = [
  { val: '1k+',   lbl: 'Kunden',     cls: 'cs-hero__chip--tl' },
  { val: '4.9 ★', lbl: 'Bewertung',  cls: 'cs-hero__chip--bl' },
  { val: '2–3d',  lbl: 'Lieferzeit', cls: 'cs-hero__chip--tr' },
  { val: '30T',   lbl: 'Rückgabe',   cls: 'cs-hero__chip--br' },
] as const;

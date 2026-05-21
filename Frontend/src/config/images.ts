/**
 * Zentrale Bild-Konfiguration — alle Bild-URLs an einem einzigen Ort.
 *
 * Leer lassen ("") = automatischer Farb-Gradient oder CSS-Grafik aus dem Theme.
 * Kostenlose Bild-Quellen: unsplash.com, pexels.com, pixabay.com
 *
 * Käufer: Einfach die URLs gegen eigene Fotos austauschen — fertig.
 * Das aktive Farbschema wird automatisch als Overlay drübergelegt.
 */

// ─── HERO-HINTERGRÜNDE ───────────────────────────────────────────────────────
export const IMAGES = {
  /** Seitenweite Hero-Hintergrundbilder. Leer ("") = CSS-Farbgradient */
  hero: {
    home:  'https://picsum.photos/seed/concepts-hero-home/1920/1080',
    about: 'https://picsum.photos/seed/concepts-hero-about/1920/1080',
    shop:  '',
  },

  /** Auth-Seiten (Login, Registrierung, Passwort vergessen) — linkes Bild-Panel */
  auth: 'https://picsum.photos/seed/concepts-auth/900/1300',

  /** Brand-Split auf der Startseite — Marken-Visual neben dem Text */
  brand: 'https://picsum.photos/seed/concepts-brand/800/900',

  /** Kontaktseite — Werbe-/Markenbild links neben dem Formular */
  contact: 'https://picsum.photos/seed/concepts-contact/800/1000',

  /** Über-uns-Seite */
  about: {
    /** Großes Bild im Hero (rechts neben der Überschrift) */
    feature: 'https://picsum.photos/seed/concepts-about-feat/600/720',
    /** Timeline-Kapitel-Bilder (4 Einträge) */
    chapters: [
      'https://picsum.photos/seed/concepts-ch1/500/560',
      'https://picsum.photos/seed/concepts-ch2/500/560',
      'https://picsum.photos/seed/concepts-ch3/500/560',
      'https://picsum.photos/seed/concepts-ch4/500/560',
    ],
    /** Werte-Karten-Bilder (3 Einträge) */
    values: [
      'https://picsum.photos/seed/concepts-val1/420/380',
      'https://picsum.photos/seed/concepts-val2/420/380',
      'https://picsum.photos/seed/concepts-val3/420/380',
    ],
    /** Prozess-Schritte "Wie ein Produkt entsteht" (4 Einträge) */
    process: [
      'https://picsum.photos/seed/concepts-proc1/400/400',
      'https://picsum.photos/seed/concepts-proc2/400/400',
      'https://picsum.photos/seed/concepts-proc3/400/400',
      'https://picsum.photos/seed/concepts-proc4/400/400',
    ],
  },

  /** Produkt-Hauptbilder — 8 Varianten, zyklisch nach Produkt-ID */
  products: [
    'https://picsum.photos/seed/concepts-p1/800/1000',
    'https://picsum.photos/seed/concepts-p2/800/1000',
    'https://picsum.photos/seed/concepts-p3/800/1000',
    'https://picsum.photos/seed/concepts-p4/800/1000',
    'https://picsum.photos/seed/concepts-p5/800/1000',
    'https://picsum.photos/seed/concepts-p6/800/1000',
    'https://picsum.photos/seed/concepts-p7/800/1000',
    'https://picsum.photos/seed/concepts-p8/800/1000',
  ] as readonly string[],

  /**
   * Produkt-Detailgalerien — Index = Produkt-ID minus 1.
   * Leer ([]) = Fallback auf Hauptbild aus `products`.
   * Käufer: Einfach die URLs durch eigene Produktfotos ersetzen.
   * Empfehlung: 3–5 Bilder pro Produkt (Freisteller, Detail, Lifestyle).
   */
  productGalleries: [
    // id 1 — Sage Candle Set
    [
      'https://picsum.photos/seed/concepts-p1/800/1000',
      'https://picsum.photos/seed/concepts-p1-g2/800/1000',
      'https://picsum.photos/seed/concepts-p1-g3/1000/800',
      'https://picsum.photos/seed/concepts-p1-g4/800/1000',
    ],
    // id 2 — Ceramic Vase No. 4
    [
      'https://picsum.photos/seed/concepts-p2/800/1000',
      'https://picsum.photos/seed/concepts-p2-g2/800/1000',
      'https://picsum.photos/seed/concepts-p2-g3/1000/800',
      'https://picsum.photos/seed/concepts-p2-g4/800/1000',
    ],
    // id 3 — Stone Bowl Set
    [
      'https://picsum.photos/seed/concepts-p3/800/1000',
      'https://picsum.photos/seed/concepts-p3-g2/800/1000',
      'https://picsum.photos/seed/concepts-p3-g3/1000/800',
      'https://picsum.photos/seed/concepts-p3-g4/800/1000',
    ],
    // id 4 — Studio Art Print
    [
      'https://picsum.photos/seed/concepts-p4/800/1000',
      'https://picsum.photos/seed/concepts-p4-g2/800/1000',
      'https://picsum.photos/seed/concepts-p4-g3/1000/800',
      'https://picsum.photos/seed/concepts-p4-g4/800/1000',
    ],
    // id 5 — Linen Throw
    [
      'https://picsum.photos/seed/concepts-p5/800/1000',
      'https://picsum.photos/seed/concepts-p5-g2/800/1000',
      'https://picsum.photos/seed/concepts-p5-g3/1000/800',
      'https://picsum.photos/seed/concepts-p5-g4/800/1000',
    ],
    // id 6 — Bamboo Tray
    [
      'https://picsum.photos/seed/concepts-p6/800/1000',
      'https://picsum.photos/seed/concepts-p6-g2/800/1000',
      'https://picsum.photos/seed/concepts-p6-g3/1000/800',
      'https://picsum.photos/seed/concepts-p6-g4/800/1000',
    ],
    // id 7 — Scented Diffuser
    [
      'https://picsum.photos/seed/concepts-p7/800/1000',
      'https://picsum.photos/seed/concepts-p7-g2/800/1000',
      'https://picsum.photos/seed/concepts-p7-g3/1000/800',
      'https://picsum.photos/seed/concepts-p7-g4/800/1000',
    ],
    // id 8 — Marble Coaster Set
    [
      'https://picsum.photos/seed/concepts-p8/800/1000',
      'https://picsum.photos/seed/concepts-p8-g2/800/1000',
      'https://picsum.photos/seed/concepts-p8-g3/1000/800',
      'https://picsum.photos/seed/concepts-p8-g4/800/1000',
    ],
  ] as readonly (readonly string[])[],

  /** Team-Fotos für die About-Seite — 4 Einträge (leer = Initialen-Avatar) */
  team: [
    'https://picsum.photos/seed/concepts-team1/400/400',
    'https://picsum.photos/seed/concepts-team2/400/400',
    'https://picsum.photos/seed/concepts-team3/400/400',
    'https://picsum.photos/seed/concepts-team4/400/400',
  ],

  /** Social-Proof-Avatare im Hero — 4 Stück (leer = Buchstaben-Avatar) */
  avatars: [
    'https://picsum.photos/seed/concepts-av1/80/80',
    'https://picsum.photos/seed/concepts-av2/80/80',
    'https://picsum.photos/seed/concepts-av3/80/80',
    'https://picsum.photos/seed/concepts-av4/80/80',
  ],

  /** Kategorie-Bento-Bilder — 6 Einträge (leer = Farbgradient) */
  categories: [
    'https://picsum.photos/seed/concepts-cat1/800/900',
    'https://picsum.photos/seed/concepts-cat2/600/600',
    'https://picsum.photos/seed/concepts-cat3/600/400',
    'https://picsum.photos/seed/concepts-cat4/600/400',
    'https://picsum.photos/seed/concepts-cat5/600/400',
    'https://picsum.photos/seed/concepts-cat6/600/400',
  ],
} as const;

/** Mappt eine UUID-String-ID oder numerische ID auf einen stabilen 1-basierten Index. */
export function toImageIndex(id: number | string): number {
  if (typeof id === 'number') return id;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % IMAGES.products.length) + 1;
}

/** Produkt-Hauptbild nach ID (leer = Gradient-Fallback) */
export function getProductImage(id: number | string): string {
  const n   = toImageIndex(id);
  const idx = (n - 1) % IMAGES.products.length;
  return IMAGES.products[idx] ?? '';
}

/**
 * Alle Galeriebilder eines Produkts nach ID.
 * Fallback: Array mit dem Hauptbild, damit immer mindestens ein Bild da ist.
 */
export function getProductGallery(id: number | string): string[] {
  const n       = toImageIndex(id);
  const gallery = IMAGES.productGalleries[n - 1];
  if (!gallery || gallery.length === 0) return [getProductImage(id)];
  return [...gallery];
}

/** Timeline-Kapitel-Bild nach Index (leer = CSS-Grafik) */
export function getChapterImage(index: number): string {
  return IMAGES.about.chapters[index % IMAGES.about.chapters.length] ?? '';
}

/** Werte-Karten-Bild nach Index (leer = CSS-Grafik) */
export function getValueImage(index: number): string {
  return IMAGES.about.values[index % IMAGES.about.values.length] ?? '';
}

/** Prozess-Schritt-Bild nach Index (leer = CSS-Grafik) */
export function getProcessImage(index: number): string {
  return (IMAGES.about.process as readonly string[])[index % IMAGES.about.process.length] ?? '';
}

/** Team-Foto nach Index (leer = Initialen-Avatar) */
export function getTeamImage(index: number): string {
  return (IMAGES.team as readonly string[])[index] ?? '';
}

/** Kategorie-Bild nach Index (leer = Farbgradient) */
export function getCategoryImage(index: number): string {
  return (IMAGES.categories as readonly string[])[index] ?? '';
}

/** Avatar-Foto nach Index (leer = Buchstaben-Avatar) */
export function getAvatarImage(index: number): string {
  return (IMAGES.avatars as readonly string[])[index] ?? '';
}

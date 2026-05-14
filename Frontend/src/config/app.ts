// ═══════════════════════════════════════════════════════════════════════════
// ZENTRALE SHOP-KONFIGURATION — als Template-Käufer hier anpassen
// Alle Werte werden automatisch in Header, Footer, SEO-Tags und Meta-Daten
// übernommen — nichts muss doppelt gepflegt werden.
// ═══════════════════════════════════════════════════════════════════════════

/** Shop-Name — erscheint in Titel, Nav-Logo, Footer, Browser-Tab und SEO */
export const APP_NAME = 'Concepts';

/** Aktuelle Version des Templates (nicht für den End-Kunden sichtbar) */
export const APP_VERSION = '1.0.0';

/** Standardsprache / Locale */
export const APP_LOCALE = 'de-DE';

/** Währungscode (ISO 4217) */
export const APP_CURRENCY = 'EUR';

/** Deine Shop-URL ohne trailing Slash — für SEO, OG und Canonical-Links */
export const APP_URL = 'https://deine-domain.de';

/** Standard-Beschreibung — erscheint in Google-Ergebnissen und Social-Previews */
export const APP_DESCRIPTION =
  'Entdecke unsere Kollektion — handverlesene Produkte für Wohnen, Küche, Deko und mehr.';

/** Kurzslogan — erscheint im Footer und auf der Über-uns-Seite */
export const APP_TAGLINE =
  'Kuratierte Lifestyle-Objekte — ausgewählt für Menschen mit Geschmack.';

/** Pfad zum OG-Bild (in /public ablegen) — wird auf Social Media angezeigt */
export const APP_OG_IMAGE = '/og-image.png';

// ── KONTAKT-DATEN ────────────────────────────────────────────────────────────
// Erscheinen in Footer, Impressum und Kontaktseite

export const APP_CONTACT = {
  email:   'hello@deine-domain.de',
  phone:   '+49 30 000 000 00',
  address: 'Musterstraße 1, 12345 Musterstadt',
} as const;

// ── SOCIAL-MEDIA-LINKS ───────────────────────────────────────────────────────
// '#' = Platzhalter. Echte URLs einsetzen oder Plattform auf '#' lassen
// um den Icon-Link im Footer auszublenden (Icon erscheint trotzdem — URL leer lassen).

export const APP_SOCIALS = {
  instagram: '#',
  x:         '#',
  facebook:  '#',
  youtube:   '#',
  tiktok:    '#',
} as const;

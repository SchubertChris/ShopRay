// ═══════════════════════════════════════════════════════════════════════════════
// SHOPRAY — FEATURE-KONFIGURATION
//
// Hier aktivierst oder deaktivierst du optionale Shop-Funktionen.
// Ändere einfach "true" auf "false" — UI, Navigation und Routen passen
// sich automatisch an. Kein weiterer Eingriff nötig.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  KERN-FUNKTIONEN — NICHT DEAKTIVIEREN                                  │
// │                                                                         │
// │  Diese Features bilden den Kaufprozess. Ohne sie läuft kein Shop.      │
// │  Sie haben absichtlich keinen Schalter hier.                            │
// │                                                                         │
// │  ● Produktanzeige  → src/features/products/                             │
// │  ● Warenkorb       → src/features/cart/                                 │
// │  ● Checkout        → src/features/checkout/                             │
// │  ● Anmeldung       → src/features/auth/                                 │
// │  ● Bestellungen    → src/features/orders/                               │
// └─────────────────────────────────────────────────────────────────────────┘
//
// ─── OPTIONALE FUNKTIONEN ────────────────────────────────────────────────────
//
//   true  → Funktion ist aktiv und für den Käufer sichtbar
//   false → Funktion ist versteckt (Code bleibt, wird nur nicht gerendert)
//
// Willst du ein Feature dauerhaft entfernen?
//   1. Schalte es hier auf false
//   2. Prüfe ob alles noch funktioniert
//   3. Lösche dann den Ordner unter src/features/<name>/
// ═══════════════════════════════════════════════════════════════════════════════

export const FEATURES = {

  // ── Wunschliste ─────────────────────────────────────────────────────────────
  // Kunden können Produkte für später speichern.
  // Deaktivieren: Herzchen-Button an Produktkarten verschwindet,
  // der "Wunschliste"-Eintrag fällt aus der Konto-Navigation raus.
  wishlist: true,

  // ── Produktbewertungen ───────────────────────────────────────────────────────
  // Sterne-Bewertungen und Kommentare auf der Produktseite.
  // Deaktivieren: Tab "Bewertungen" auf der Produktdetailseite verschwindet.
  reviews: true,

  // ── Support-Tickets ──────────────────────────────────────────────────────────
  // Kunden können Support-Anfragen direkt im Konto stellen.
  // Deaktivieren: "Meine Tickets" fällt aus der Konto-Navigation raus.
  tickets: true,

  // ── LMIV-Nährwertangaben ─────────────────────────────────────────────────────
  // EU-Pflichtangaben für Lebensmittel und Nahrungsergänzungsmittel.
  // Nur aktivieren wenn du Lebensmittel / Supplements verkaufst.
  // Deaktivieren: Tab "Inhaltsstoffe & Nährwerte" auf der Produktseite verschwindet.
  lmiv: true,

} as const;

// Typ-Export damit andere Dateien sauber darauf zugreifen können
export type FeatureKey = keyof typeof FEATURES;

/** Anzahl der Einträge pro Seite (Bestellungen, Tickets, Suche) */
export const PAGE_SIZE = 20;

/** Bestellwert ab dem Versand kostenlos ist (Euro) */
export const FREE_SHIPPING_THRESHOLD = 50;

/** Versandkosten, wenn Bestellwert unter dem Schwellenwert (Euro) */
export const SHIPPING_COST = 4.95;

/** Zustand localStorage-Keys */
export const STORAGE_KEYS = {
  AUTH:     'sr-auth',
  CART:     'sr-cart',
  WISHLIST: 'sr-wishlist',
  CONSENT:  'sr-consent',
} as const;

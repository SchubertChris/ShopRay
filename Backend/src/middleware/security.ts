import helmet      from 'helmet';
import rateLimit   from 'express-rate-limit';
import { Request } from 'express';

// ── Helmet — Security-Header ──────────────────────────────────────────────────
export const helmetMiddleware = helmet({
  contentSecurityPolicy:     false, // API — kein HTML-Output
  crossOriginEmbedderPolicy: false, // API — kein Document-Context
  hsts: {
    maxAge:            31536000, // 1 Jahr — HSTS Preload-Anforderung
    includeSubDomains: true,
    preload:           true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard:     { action: 'deny' },
  noSniff:        true,
  xssFilter:      true,
});

// ── Globales Rate-Limit — 100 Requests / 15 Min pro IP ───────────────────────
export const globalRateLimit = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              100,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Zu viele Anfragen. Bitte warte 15 Minuten.' },
});

// ── Auth Rate-Limit — 10 Versuche / 15 Min (Brute-Force-Schutz) ──────────────
export const authRateLimit = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    (req: Request) => req.ip ?? 'unknown',
  message:         { error: 'Zu viele Login-Versuche. Bitte warte 15 Minuten.' },
});

// ── Checkout Rate-Limit — 20 Checkouts / Stunde pro IP ───────────────────────
export const checkoutRateLimit = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Zu viele Checkout-Versuche. Bitte versuche es später.' },
});

// ── Kontaktformular Rate-Limit — 5 Anfragen / Stunde pro IP ──────────────────
export const contactRateLimit = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Zu viele Kontaktanfragen. Bitte versuche es in einer Stunde erneut.' },
});

// ── Ticket Rate-Limit — 5 Tickets / Stunde pro IP (Gast-Schutz) ──────────────
export const ticketRateLimit = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Zu viele Tickets. Bitte versuche es in einer Stunde erneut.' },
});

// ── Discount Rate-Limit — 30 Prüfungen / Stunde pro IP (Brute-Force-Schutz) ──
export const discountRateLimit = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Zu viele Gutschein-Anfragen. Bitte versuche es später erneut.' },
});

import helmet      from 'helmet';
import rateLimit   from 'express-rate-limit';
import { Request } from 'express';

// ── Helmet — Security-Header ──────────────────────────────────────────────────
export const helmetMiddleware = helmet({
  contentSecurityPolicy:    false, // API — kein HTML-Output
  crossOriginEmbedderPolicy: false,
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

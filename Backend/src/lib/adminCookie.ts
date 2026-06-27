import { Response } from 'express';

// 8 Stunden — identisch zur JWT-Laufzeit (expiresIn: '8h')
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;

// sameSite 'lax': Admin und Backend sind via vercel.json-Rewrite same-origin
// (Browser sieht /api/* auf der Admin-Domain) → 'lax' genügt und ist sicherer als 'none'.
// secure nur in Produktion (lokal über http → sonst würde der Browser das Cookie verwerfen).
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure:   isProd,
    sameSite: 'lax' as const,
    path:     '/',
  };
}

/**
 * Setzt das httpOnly-Session-Cookie. Das Bearer-Token bleibt ZUSÄTZLICH im
 * JSON-Body (Fallback für cross-domain/Mobile) — daher kein Lockout-Risiko.
 */
export function setAdminCookie(res: Response, token: string): void {
  res.cookie('adminSession', token, { ...cookieOptions(), maxAge: SESSION_MAX_AGE });
}

/** Löscht das Session-Cookie. Optionen MÜSSEN exakt zu setAdminCookie passen. */
export function clearAdminCookie(res: Response): void {
  res.clearCookie('adminSession', cookieOptions());
}

import { Request, Response, NextFunction } from 'express';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF-Schutz für Cookie-authentifizierte Mutationen.
 *
 * Greift NUR wenn ALLE zutreffen:
 *   - die Methode ist mutierend (POST/PUT/PATCH/DELETE) UND
 *   - KEIN Authorization-Header vorhanden ist (= keine Bearer-Auth) UND
 *   - das `adminSession`-Cookie reitet tatsächlich mit (= die zu schützende
 *     ambiente Credential ist vorhanden)
 * Dann wird der Custom-Header `X-Requested-With: XMLHttpRequest` verlangt.
 *
 * Warum das schützt: Ein Cross-Site-Angreifer kann via <form>/<img> zwar das
 * Cookie automatisch mitschicken, aber KEINEN Custom-Header setzen — jeder fetch
 * mit Custom-Header löst einen CORS-Preflight aus, den nur erlaubte Origins
 * passieren. Bearer-Requests sind ohnehin nicht CSRF-fähig → durchgelassen.
 *
 * Die Cookie-Bedingung macht den Guard global mountbar: Gast-/Kunden-Mutationen
 * (Checkout, Kontaktformular, Newsletter) haben KEIN adminSession-Cookie und
 * werden daher nie geblockt — nur Admin-Cookie-Sessions sind betroffen, dafür
 * aber lückenlos (auch Admin-Routen unter öffentlichen Prefixes wie
 * PATCH /api/contact/:id oder PUT /api/settings/*).
 */
export function csrfGuard(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING.has(req.method)) { next(); return; }

  const hasBearer = req.headers['authorization']?.startsWith('Bearer ');
  if (hasBearer) { next(); return; }

  const hasAdminCookie = Boolean((req.cookies as Record<string, string | undefined> | undefined)?.adminSession);
  if (!hasAdminCookie) { next(); return; }

  if (req.headers['x-requested-with'] === 'XMLHttpRequest') { next(); return; }

  res.status(403).json({ error: 'CSRF-Schutz: ungültige Anfrage.' });
}

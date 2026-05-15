import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Express-Middleware-Factory für Zod-Validation.
 * Gibt 400 zurück wenn das Schema nicht erfüllt ist.
 * Ersetzt req.body / req.query / req.params mit den validierten Daten.
 */
export function validate<T>(
  schema:  ZodSchema<T>,
  source:  'body' | 'query' | 'params' = 'body',
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const err   = result.error.errors[0];
      const field = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      res.status(400).json({ error: `${field}${err.message}` });
      return;
    }
    // Validierte (und ggf. transformierte) Daten zurückschreiben
    (req as Request & Record<string, unknown>)[source] = result.data;
    next();
  };
}

// ── Wiederverwendbare Basis-Schemas ──────────────────────────────────────────

export const UUIDParam = z.object({
  id: z.string().uuid('Ungültige ID'),
});

export const SlugParam = z.object({
  slug: z.string().min(1).max(200),
});

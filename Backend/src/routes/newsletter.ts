import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { contactRateLimit } from '../middleware/security';

const router = Router();

const SubscribeSchema = z.object({
  email: z.string().trim().email('Ungültige E-Mail-Adresse').max(254),
});

/**
 * POST /api/newsletter/subscribe
 *
 * Trägt eine E-Mail-Adresse in die Brevo-Kontaktliste ein.
 * Wenn BREVO_DOI_TEMPLATE_ID gesetzt ist, wird Double-Opt-In (§7 UWG) verwendet.
 * Ohne Template-ID wird der Kontakt direkt hinzugefügt.
 *
 * Erforderliche Env-Variablen:
 *   BREVO_API_KEY        — API-Schlüssel aus dem Brevo-Dashboard
 *   BREVO_LIST_ID        — ID der Kontaktliste (Zahl, z.B. "3")
 *
 * Optionale Env-Variablen für Double-Opt-In:
 *   BREVO_DOI_TEMPLATE_ID — ID des DOI-E-Mail-Templates in Brevo
 *   BREVO_REDIRECT_URL    — Bestätigungsseite nach DOI-Klick (z.B. "https://deine-domain.de/newsletter-bestaetigt")
 */
router.post('/subscribe', contactRateLimit, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = SubscribeSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0]?.message ?? 'Ungültige E-Mail-Adresse.' });
      return;
    }

    const { email } = result.data;
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      // Newsletter nicht konfiguriert — still success (Config-State nicht nach außen exposieren)
      res.status(200).json({ success: true });
      return;
    }

    const listId   = Number(process.env.BREVO_LIST_ID ?? 1);
    const templateId = process.env.BREVO_DOI_TEMPLATE_ID;
    const redirectionUrl = process.env.BREVO_REDIRECT_URL
      ?? process.env.FRONTEND_URL
      ?? 'https://deine-domain.de/newsletter-bestaetigt';

    const headers: Record<string, string> = {
      'accept':       'application/json',
      'api-key':      apiKey,
      'content-type': 'application/json',
    };

    if (templateId) {
      // Double-Opt-In — gesetzlich vorgeschrieben in Deutschland (§7 UWG)
      const doiRes = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
        method:  'POST',
        headers,
        body:    JSON.stringify({
          email,
          includeListIds:  [listId],
          templateId:      Number(templateId),
          redirectionUrl,
        }),
      });

      if (!doiRes.ok && doiRes.status !== 204) {
        const body = await doiRes.json().catch(() => ({})) as { code?: string };
        // "duplicate_parameter" = Kontakt existiert bereits → kein Fehler
        if (body.code !== 'duplicate_parameter') {
          throw new Error(`Brevo DOI-Fehler: HTTP ${doiRes.status}`);
        }
      }
    } else {
      // Direktes Hinzufügen (Einwilligung durch Formular-Checkbox gegeben)
      const addRes = await fetch('https://api.brevo.com/v3/contacts', {
        method:  'POST',
        headers,
        body:    JSON.stringify({
          email,
          listIds:       [listId],
          updateEnabled: false,
        }),
      });

      if (!addRes.ok) {
        const body = await addRes.json().catch(() => ({})) as { code?: string };
        if (body.code !== 'duplicate_parameter') {
          throw new Error(`Brevo-Fehler: HTTP ${addRes.status}`);
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;

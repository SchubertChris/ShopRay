import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { sendMail, contactNotificationHtml } from '../lib/mailer';
import { contactRateLimit } from '../middleware/security';
import { requireAdmin }     from '../middleware/adminAuth';
import { validate, UUIDParam } from '../lib/validate';

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────
const ContactSchema = z.object({
  name:    z.string().trim().min(1, 'Name ist erforderlich').max(100),
  email:   z.string().trim().email('Ungültige E-Mail-Adresse').max(254),
  subject: z.string().trim().max(200).optional().default('Allgemeine Anfrage'),
  message: z.string().trim().min(10, 'Nachricht muss mindestens 10 Zeichen enthalten').max(5000),
  consent: z.literal(true, { errorMap: () => ({ message: 'Datenschutz-Einwilligung ist erforderlich.' }) }),
});

const PatchStatusSchema = z.object({
  status: z.enum(['new', 'read', 'replied'], { errorMap: () => ({ message: 'Ungültiger Status.' }) }),
});

type ContactBody = z.infer<typeof ContactSchema>;

// POST /api/contact — Kontaktformular (kein Login nötig)
router.post('/', contactRateLimit, validate(ContactSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body as ContactBody;

    const { error: dbError } = await supabase
      .from('contact_inquiries')
      .insert({ name, email, subject, message, consent: true });

    if (dbError) throw dbError;

    const ownerEmail = process.env.SMTP_FROM_EMAIL;
    if (ownerEmail) {
      await sendMail({
        to:      ownerEmail,
        subject: `Neue Anfrage: ${subject} — von ${name}`,
        html:    contactNotificationHtml({
          name,
          email,
          subject: subject ?? 'Allgemeine Anfrage',
          message,
          date: new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }),
        }),
      });
    }

    res.status(201).json({ success: true, message: 'Anfrage gesendet.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/contact — Alle Anfragen (Admin-Session erforderlich)
router.get('/', requireAdmin, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('contact_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/contact/:id — Status ändern (Admin-Session erforderlich)
router.patch('/:id', requireAdmin, validate(UUIDParam, 'params'), validate(PatchStatusSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body as z.infer<typeof PatchStatusSchema>;

    const { error } = await supabase
      .from('contact_inquiries')
      .update({ status })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;

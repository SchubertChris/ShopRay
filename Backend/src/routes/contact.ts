import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { sendMail, contactNotificationHtml } from '../lib/mailer';
import { contactRateLimit } from '../middleware/security';
import { requireAdmin }     from '../middleware/adminAuth';

const router = Router();

interface ContactBody {
  name:    string;
  email:   string;
  subject: string;
  message: string;
  consent: boolean;
}

// POST /api/contact — Kontaktformular (kein Login nötig)
router.post('/', contactRateLimit, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, subject, message, consent } = req.body as Partial<ContactBody>;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      res.status(400).json({ error: 'Name, E-Mail und Nachricht sind Pflichtfelder.' });
      return;
    }

    if (!consent) {
      res.status(400).json({ error: 'Datenschutz-Einwilligung ist erforderlich.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Ungültige E-Mail-Adresse.' });
      return;
    }

    if (message.trim().length < 10) {
      res.status(400).json({ error: 'Nachricht muss mindestens 10 Zeichen enthalten.' });
      return;
    }

    const safeSubject = (subject?.trim() || 'Allgemeine Anfrage').slice(0, 200);
    const safeName    = name.trim().slice(0, 100);
    const safeMessage = message.trim().slice(0, 5000);
    const safeEmail   = email.trim().toLowerCase().slice(0, 254);

    // ── In Supabase speichern ─────────────────────────────────────────────────
    const { error: dbError } = await supabase
      .from('contact_inquiries')
      .insert({ name: safeName, email: safeEmail, subject: safeSubject, message: safeMessage, consent: true });

    if (dbError) throw dbError;

    // ── E-Mail-Benachrichtigung an Shop-Betreiber ─────────────────────────────
    const ownerEmail = process.env.SMTP_FROM_EMAIL;
    if (ownerEmail) {
      await sendMail({
        to:      ownerEmail,
        subject: `Neue Anfrage: ${safeSubject} — von ${safeName}`,
        html:    contactNotificationHtml({
          name:    safeName,
          email:   safeEmail,
          subject: safeSubject,
          message: safeMessage,
          date:    new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }),
        }),
      });
    }

    res.status(201).json({ success: true, message: 'Anfrage gesendet.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/contact — Alle Anfragen lesen (Admin-Session erforderlich)
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PATCH /api/contact/:id — Status ändern (Admin-Session erforderlich)
router.patch('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!UUID_REGEX.test(String(req.params.id))) {
      res.status(400).json({ error: 'Ungültige ID.' });
      return;
    }

    const { status } = req.body as { status?: string };
    if (!status || !['new', 'read', 'replied'].includes(status)) {
      res.status(400).json({ error: 'Ungültiger Status.' });
      return;
    }

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

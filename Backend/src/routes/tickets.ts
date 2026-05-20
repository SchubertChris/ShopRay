import { z }                              from 'zod';
import { Router, Response, NextFunction } from 'express';
import { optionalAuth, AuthRequest }      from '../middleware/auth';
import { ticketRateLimit }                from '../middleware/security';
import { supabase }                       from '../lib/supabase';
import { validate }                       from '../lib/validate';
import { createNotification }            from '../lib/notify';

const router = Router();

const CATEGORY_MAP: Record<string, string> = {
  'Bestellung & Lieferung':  'order',
  'Rückgabe & Reklamation': 'order',
  'Zahlung & Rechnung':      'payment',
  'Produkt & Qualität':      'product',
  'Konto & Datenschutz':     'other',
  'Sonstiges':               'other',
};

const TicketSchema = z.object({
  subject:     z.string().trim().min(3).max(200),
  category:    z.string().trim().min(1),
  description: z.string().trim().min(10).max(5000),
  priority:    z.enum(['normal', 'high', 'urgent']).default('normal'),
  guestEmail:  z.string().trim().email('Ungültige E-Mail').optional(),
});

type TicketBody = z.infer<typeof TicketSchema>;

// POST /api/tickets — Ticket erstellen (Auth optional — Gäste erlaubt)
router.post('/', optionalAuth, ticketRateLimit, validate(TicketSchema), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, category, description, priority, guestEmail } = req.body as TicketBody;

    // Gäste müssen eine E-Mail angeben
    if (!req.userId && !guestEmail) {
      res.status(400).json({ error: 'Für Gäste ist eine E-Mail-Adresse erforderlich.' });
      return;
    }

    const dbCategory = CATEGORY_MAP[category] ?? 'other';

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        user_id:     req.userId ?? null,
        guest_email: req.userId ? null : (guestEmail ?? null),
        subject,
        message:     description,
        category:    dbCategory,
        priority,
      })
      .select('id, subject, category, status, created_at')
      .single();

    if (error) throw error;

    // Erste Nachricht als Chat-Eintrag (service_role umgeht RLS)
    await supabase
      .from('ticket_messages')
      .insert({ ticket_id: ticket.id, sender: 'customer', text: description });

    void createNotification(
      'new_ticket',
      `Neues Ticket: ${subject}`,
      description.slice(0, 120),
      '/support',
    );

    res.status(201).json({ id: ticket.id, subject: ticket.subject, status: ticket.status });
  } catch (err) {
    next(err);
  }
});

export default router;

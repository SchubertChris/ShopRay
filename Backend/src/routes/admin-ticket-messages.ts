import { z }                              from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import webpush                            from 'web-push';
import { requireAdmin }                   from '../middleware/adminAuth';
import { supabase }                       from '../lib/supabase';
import { validate }                       from '../lib/validate';

const router = Router();

const MessageSchema = z.object({
  text: z.string().min(1).max(5000),
});

// GET /api/admin/tickets/:id/messages
router.get('/:id/messages', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/tickets/:id/messages — Admin antwortet
router.post('/:id/messages', requireAdmin, validate(MessageSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text }    = req.body as z.infer<typeof MessageSchema>;
    const ticketId    = req.params.id;

    // 1. Nachricht in ticket_messages anlegen
    const { data: msg, error: msgErr } = await supabase
      .from('ticket_messages')
      .insert({ ticket_id: ticketId, sender: 'admin', text })
      .select('*')
      .single();
    if (msgErr) throw msgErr;

    // 2. tickets.reply + replied_at + updated_at für E-Mail-Kompatibilität
    await supabase
      .from('tickets')
      .update({
        reply:      text,
        replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    // 3. Push-Notification an Kunden (nicht-blockierend)
    try {
      const { data: ticket } = await supabase
        .from('tickets')
        .select('user_id')
        .eq('id', ticketId)
        .single();

      if (ticket?.user_id) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', ticket.user_id);

        if (subs && subs.length > 0) {
          webpush.setVapidDetails(
            `mailto:${process.env.VAPID_EMAIL ?? 'admin@shopray.de'}`,
            process.env.VAPID_PUBLIC_KEY  ?? '',
            process.env.VAPID_PRIVATE_KEY ?? '',
          );
          const payload = JSON.stringify({
            title: 'Neue Antwort',
            body:  'Du hast eine Antwort auf dein Support-Ticket erhalten.',
          });
          await Promise.allSettled(
            subs.map(s => webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              payload
            ))
          );
        }
      }
    } catch { /* Push-Fehler nicht an Client weitergeben */ }

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
});

export default router;

import webpush from 'web-push';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase }     from '../lib/supabase';
import { requireAdmin } from '../middleware/adminAuth';
import { validate }     from '../lib/validate';

const router = Router();

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? 'admin@shopray.de'}`,
  process.env.VAPID_PUBLIC_KEY  ?? '',
  process.env.VAPID_PRIVATE_KEY ?? '',
);

const SubscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth:   z.string().min(1).max(200),
  }),
});

// GET /api/admin/push/vapid-public-key — öffentlicher VAPID-Key für den Browser
router.get('/vapid-public-key', requireAdmin, (_req: Request, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? '' });
});

// POST /api/admin/push/subscribe — Subscription speichern
router.post('/subscribe', requireAdmin, validate(SubscribeSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { endpoint, keys } = req.body as z.infer<typeof SubscribeSchema>;

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'endpoint' });

    if (error) throw error;
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/push/subscribe — Subscription entfernen
router.delete('/subscribe', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const endpoint = req.body?.endpoint as string | undefined;
    if (!endpoint) { res.status(400).json({ error: 'endpoint fehlt' }); return; }

    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;

// ── Hilfsfunktion für andere Routes ──────────────────────────────────────────
export async function sendPushToAll(payload: { title: string; body: string; url?: string }): Promise<void> {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');

  if (!subs?.length) return;

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message,
        );
      } catch (err: unknown) {
        // 410 Gone = Subscription abgelaufen → löschen
        if ((err as { statusCode?: number }).statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }),
  );
}

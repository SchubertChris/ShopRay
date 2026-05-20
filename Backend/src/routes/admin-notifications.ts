import { Router, Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { supabase }     from '../lib/supabase';

const router = Router();

function userKey(req: Request): string {
  return req.adminRole === 'owner' ? 'owner' : (req.adminUserId ?? 'owner');
}

// GET /api/admin/notifications
router.get('/', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = userKey(req);

    const { data: notifications, error } = await supabase
      .from('admin_notifications')
      .select('id, type, title, body, link, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    const { data: reads } = await supabase
      .from('admin_notification_reads')
      .select('notification_id')
      .eq('user_key', key);

    const readSet = new Set((reads ?? []).map((r: { notification_id: string }) => r.notification_id));

    const items = (notifications ?? []).map((n: {
      id: string; type: string; title: string;
      body: string | null; link: string | null; created_at: string;
    }) => ({
      ...n,
      read: readSet.has(n.id),
    }));

    const unread = items.filter(i => !i.read).length;
    res.json({ items, unread });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/notifications/:id/read
router.post('/:id/read', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = userKey(req);
    await supabase
      .from('admin_notification_reads')
      .upsert({ notification_id: req.params.id, user_key: key }, { onConflict: 'notification_id,user_key' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/notifications/read-all
router.post('/read-all', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = userKey(req);
    const { data: all } = await supabase
      .from('admin_notifications')
      .select('id');
    const rows = (all ?? []).map((n: { id: string }) => ({ notification_id: n.id, user_key: key }));
    if (rows.length > 0) {
      await supabase
        .from('admin_notification_reads')
        .upsert(rows, { onConflict: 'notification_id,user_key' });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;

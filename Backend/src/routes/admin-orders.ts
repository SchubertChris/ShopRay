import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase }     from '../lib/supabase';
import { requireAdmin } from '../middleware/adminAuth';
import { validate, UUIDParam } from '../lib/validate';

const router = Router();
router.use(requireAdmin);

const VALID_STATUSES = [
  'pending', 'paid', 'shipped', 'delivered', 'cancelled', 'payment_failed', 'refunded',
] as const;

const StatusSchema = z.object({
  status: z.enum(VALID_STATUSES, { errorMap: () => ({ message: 'Ungültiger Status.' }) }),
});

// GET /api/admin/orders — alle Bestellungen (paginated)
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10)));
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at, user_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    res.json({ data: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders/:id — einzelne Bestellung mit Items und Kundendaten
router.get('/:id', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .single();

    if (oErr || !order) {
      res.status(404).json({ error: 'Bestellung nicht gefunden.' });
      return;
    }

    // Kundendaten separat laden (Profile hat kein email-Feld → auth.admin)
    let profile: { name: string | null; phone: string | null; email: string | null } | null = null;
    if (order.user_id) {
      const [{ data: prof }, { data: authData }] = await Promise.all([
        supabase.from('profiles').select('name, phone').eq('id', order.user_id).single(),
        supabase.auth.admin.getUserById(String(order.user_id)),
      ]);
      profile = {
        name:  prof?.name  ?? null,
        phone: prof?.phone ?? null,
        email: authData?.user?.email ?? null,
      };
    }

    res.json({ ...order, profile });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/:id/status — Status aktualisieren
router.patch('/:id/status', validate(UUIDParam, 'params'), validate(StatusSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body as { status: typeof VALID_STATUSES[number] };

    // Status-spezifische Zeitstempel setzen
    const extra: Record<string, string> = {};
    if (status === 'paid'     && !req.body.paid_at)    extra.paid_at    = new Date().toISOString();
    if (status === 'shipped'  && !req.body.shipped_at) extra.shipped_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders')
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, order_number, status')
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Bestellung nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;

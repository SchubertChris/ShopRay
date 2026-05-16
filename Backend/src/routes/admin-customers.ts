import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase }     from '../lib/supabase';
import { requireAdmin } from '../middleware/adminAuth';
import { validate, UUIDParam } from '../lib/validate';

const router = Router();

router.use(requireAdmin);

const VALID_ROLES = ['owner', 'admin', 'mod', 'customer'] as const;
type UserRole = typeof VALID_ROLES[number];

const RoleSchema = z.object({
  role: z.enum(VALID_ROLES, { errorMap: () => ({ message: 'Ungültige Rolle.' }) }),
});

// GET /api/admin/customers — alle Profile (paginated)
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10)));
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    res.json({ data: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/customers/:id — einzelner Kunde mit Bestellungen
router.get('/:id', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (pErr || !profile) {
      res.status(404).json({ error: 'Kunde nicht gefunden.' });
      return;
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({ ...profile, orders: orders ?? [] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/customers/:id/role — Rolle ändern
router.patch('/:id/role', validate(UUIDParam, 'params'), validate(RoleSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body as { role: UserRole };

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, name, email, role')
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Kunde nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/customers/:id — Kunden löschen (DSGVO-konform)
router.delete('/:id', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await supabase.from('orders').update({ user_id: null }).eq('user_id', id);
    await supabase.from('tickets').delete().eq('user_id', id);
    await supabase.from('profiles').delete().eq('id', id);

    const { error: authErr } = await supabase.auth.admin.deleteUser(String(id));
    if (authErr) { res.status(500).json({ error: 'Auth-Nutzer konnte nicht gelöscht werden.' }); return; }

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;

import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase }                   from '../lib/supabase';
import { requireAdmin, requireOwner } from '../middleware/adminAuth';
import { validate, UUIDParam }        from '../lib/validate';

const router = Router();

router.use(requireAdmin);

const ReviewQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(50),
  verified: z.enum(['true', 'false']).optional(),
});

// GET /api/admin/reviews — alle Bewertungen (paginated, optional filter)
router.get('/', validate(ReviewQuerySchema, 'query'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, verified } = req.query as unknown as z.infer<typeof ReviewQuerySchema>;
    const from = (page - 1) * limit;

    let query = supabase
      .from('reviews')
      .select('id, product_id, user_id, rating, title, body, verified, created_at, products(name), profiles(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (verified === 'true')  query = query.eq('verified', true);
    if (verified === 'false') query = query.eq('verified', false);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/reviews/:id/verify — Bewertung freischalten
router.patch('/:id/verify', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({ verified: true })
      .eq('id', req.params.id)
      .select('id, verified')
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Bewertung nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/reviews/:id/reject — Bewertung ablehnen (verified=false)
router.patch('/:id/reject', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({ verified: false })
      .eq('id', req.params.id)
      .select('id, verified')
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Bewertung nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/reviews/:id — Bewertung löschen (nur Owner)
router.delete('/:id', requireOwner, validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;

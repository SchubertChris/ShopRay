import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { supabase }     from '../lib/supabase';
import { validate }     from '../lib/validate';

const router = Router();

const ReplySchema = z.object({
  reply:  z.string().min(1).max(5000),
  status: z.enum(['open', 'in_progress', 'closed']),
});

// GET /api/admin/tickets
router.get('/', requireAdmin, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error, count } = await supabase
      .from('tickets')
      .select('id, subject, category, status, message, reply, replied_at, created_at, updated_at, user_id, profiles(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ data: data ?? [], total: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/tickets/:id/reply
router.patch('/:id/reply', requireAdmin, validate(ReplySchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reply, status } = req.body as z.infer<typeof ReplySchema>;
    const { data, error } = await supabase
      .from('tickets')
      .update({ reply, status, replied_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, status, replied_at')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;

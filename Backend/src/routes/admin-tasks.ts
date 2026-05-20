import { z }                                        from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { requireAdmin, requireOwner }              from '../middleware/adminAuth';
import { supabase }                                from '../lib/supabase';
import { validate }                                from '../lib/validate';
import { createNotification }                      from '../lib/notify';

const router = Router();

const TaskSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  priority:    z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  due_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

const StatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'done']),
});

// GET /api/admin/tasks
router.get('/', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let query = supabase
      .from('admin_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (req.adminRole === 'mod' && req.adminUserId) {
      query = query.or(`assigned_to.eq.${req.adminUserId},assigned_to.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/tasks — nur Owner
router.post('/', requireOwner, validate(TaskSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as z.infer<typeof TaskSchema>;
    const { data, error } = await supabase
      .from('admin_tasks')
      .insert({
        title:       body.title,
        description: body.description ?? null,
        assigned_to: body.assigned_to ?? null,
        priority:    body.priority,
        due_date:    body.due_date ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    if (body.assigned_to) {
      await createNotification(
        'task_assigned',
        `Neue Aufgabe: ${body.title}`,
        body.description ?? undefined,
        '/tasks',
      );
    }

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/tasks/:id/status — Admin kann Status seiner Aufgaben ändern
router.patch('/:id/status', requireAdmin, validate(StatusSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body as z.infer<typeof StatusSchema>;
    let query = supabase.from('admin_tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', req.params.id);
    if (req.adminRole === 'mod' && req.adminUserId) {
      query = query.or(`assigned_to.eq.${req.adminUserId},assigned_to.is.null`);
    }
    const { data, error } = await query.select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/tasks/:id — Owner: volle Änderung
router.patch('/:id', requireOwner, validate(TaskSchema.partial()), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as Partial<z.infer<typeof TaskSchema>>;
    const { data, error } = await supabase
      .from('admin_tasks')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/tasks/:id — nur Owner
router.delete('/:id', requireOwner, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = await supabase.from('admin_tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;

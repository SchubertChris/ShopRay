import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase }     from '../lib/supabase';
import { requireAdmin } from '../middleware/adminAuth';
import { validate, UUIDParam } from '../lib/validate';

const router = Router();

router.use(requireAdmin);

const CategorySchema = z.object({
  name:      z.string().trim().min(1, 'Name ist erforderlich').max(100),
  order:     z.number().int().min(0).optional().default(0),
  image_url: z.string().url('Ungültige URL').optional().nullable(),
});

// GET /api/admin/categories — alle Kategorien
router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, "order", image_url, created_at')
      .order('"order"', { ascending: true })
      .order('name',    { ascending: true });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/categories — Kategorie anlegen
router.post('/', validate(CategorySchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, order, image_url } = req.body as z.infer<typeof CategorySchema>;

    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', name)
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: `Kategorie "${name}" existiert bereits.` });
      return;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, order, image_url: image_url ?? null })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/categories/:id — Kategorie löschen
router.delete('/:id', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;

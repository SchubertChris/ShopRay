import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase }    from '../lib/supabase';
import { requireAdmin, requireOwner } from '../middleware/adminAuth';
import { validate, UUIDParam } from '../lib/validate';

const router = Router();
router.use(requireAdmin);

const DiscountSchema = z.object({
  code:       z.string().trim().min(1).max(50).toUpperCase(),
  type:       z.enum(['percent', 'fixed']),
  value:      z.number().min(0.01).max(100_000),
  min_order:  z.number().min(0).optional().default(0),
  max_uses:   z.number().int().min(1).nullable().optional(),
  active:     z.boolean().optional().default(true),
  expires_at: z.string().datetime({ offset: true }).nullable().optional(),
});

const UpdateDiscountSchema = DiscountSchema.partial();

// GET /api/admin/discounts — alle Codes
router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/discounts/:id
router.get('/:id', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) { res.status(404).json({ error: 'Gutscheincode nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/discounts — neuen Code anlegen (Owner + Mod)
router.post('/', validate(DiscountSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as z.infer<typeof DiscountSchema>;

    // Duplikat-Check (case-insensitive via unique index)
    const { data: existing } = await supabase
      .from('discount_codes')
      .select('id')
      .filter('code', 'ilike', body.code)
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: `Code "${body.code}" ist bereits vergeben.` });
      return;
    }

    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        code:       body.code.toUpperCase(),
        type:       body.type,
        value:      body.value,
        min_order:  body.min_order ?? 0,
        max_uses:   body.max_uses ?? null,
        active:     body.active ?? true,
        expires_at: body.expires_at ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/discounts/:id — bearbeiten (Owner + Mod)
router.put('/:id', validate(UUIDParam, 'params'), validate(UpdateDiscountSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as z.infer<typeof UpdateDiscountSchema>;
    const { id } = req.params;

    if (body.code) {
      const { data: existing } = await supabase
        .from('discount_codes')
        .select('id')
        .filter('code', 'ilike', body.code)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        res.status(409).json({ error: `Code "${body.code}" ist bereits vergeben.` });
        return;
      }
      body.code = body.code.toUpperCase();
    }

    const { data, error } = await supabase
      .from('discount_codes')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Gutscheincode nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/discounts/:id — nur Owner
router.delete('/:id', requireOwner, validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = await supabase.from('discount_codes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;

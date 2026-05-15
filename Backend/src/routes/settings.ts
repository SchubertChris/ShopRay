import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase }     from '../lib/supabase';
import { requireAdmin } from '../middleware/adminAuth';
import { validate }     from '../lib/validate';

const router = Router();

const ShippingSchema = z.object({
  standard:   z.number().min(0).max(999),
  express:    z.number().min(0).max(999),
  free_above: z.number().min(0).max(99999),
  delivery:   z.string().trim().min(1).max(100),
});

export interface ShippingSettings {
  standard:   number;
  express:    number;
  free_above: number;
  delivery:   string;
  updated_at: string;
}

// GET /api/settings/shipping — öffentlich, kein Auth
router.get('/shipping', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('shipping_settings')
      .select('standard, express, free_above, delivery, updated_at')
      .eq('id', 1)
      .single();

    if (error || !data) throw error ?? new Error('Keine Versandeinstellungen gefunden');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/settings/shipping — nur Admin
router.put('/shipping', requireAdmin, validate(ShippingSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as z.infer<typeof ShippingSchema>;

    const { data, error } = await supabase
      .from('shipping_settings')
      .upsert({ id: 1, ...body, updated_at: new Date().toISOString() })
      .select('standard, express, free_above, delivery, updated_at')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;

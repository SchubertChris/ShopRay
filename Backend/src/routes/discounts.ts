import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { validate } from '../lib/validate';
import { discountRateLimit } from '../middleware/security';

const router = Router();

const ValidateSchema = z.object({
  code:       z.string().trim().min(1).max(50),
  orderTotal: z.number().min(0),
});

// POST /api/discounts/validate — Gutscheincode prüfen (öffentlich, für Checkout)
router.post('/validate', discountRateLimit, validate(ValidateSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, orderTotal } = req.body as z.infer<typeof ValidateSchema>;

    const { data, error } = await supabase
      .from('discount_codes')
      .select('id, code, type, value, min_order, max_uses, uses, active, expires_at')
      .eq('active', true)
      .filter('code', 'ilike', code)
      .single();

    // Einheitliche Fehlermeldung — verhindert Code-Enumeration per Bruteforce
    const INVALID_MSG = 'Gutscheincode ungültig oder abgelaufen.';

    if (error || !data) {
      res.status(400).json({ error: INVALID_MSG });
      return;
    }

    if (data.expires_at && new Date(data.expires_at as string) < new Date()) {
      res.status(400).json({ error: INVALID_MSG });
      return;
    }

    if (data.max_uses !== null && (data.uses as number) >= (data.max_uses as number)) {
      res.status(400).json({ error: INVALID_MSG });
      return;
    }

    if (orderTotal < (data.min_order as number)) {
      res.status(400).json({
        error: `Mindestbestellwert für diesen Code: € ${Number(data.min_order).toFixed(2).replace('.', ',')}`,
      });
      return;
    }

    let discountAmount: number;
    if (data.type === 'percent') {
      discountAmount = Math.round(orderTotal * (data.value as number) / 100 * 100) / 100;
    } else {
      discountAmount = Math.min(data.value as number, orderTotal);
    }

    res.json({
      valid:          true,
      code:           data.code,
      type:           data.type,
      value:          data.value,
      discountAmount: discountAmount,
      finalTotal:     Math.max(0, orderTotal - discountAmount),
    });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/categories — alle Kategorien aus der categories-Tabelle mit Produktanzahl
router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [catRes, prodRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, order, image_url')
        .order('order', { ascending: true }),
      supabase
        .from('products')
        .select('category')
        .eq('active', true)
        .not('category', 'is', null),
    ]);

    if (catRes.error) throw catRes.error;

    // Produktanzahl pro Kategoriename zählen
    const countMap = new Map<string, number>();
    for (const p of (prodRes.data ?? [])) {
      if (p.category) countMap.set(p.category, (countMap.get(p.category) ?? 0) + 1);
    }

    const result = (catRes.data ?? []).map((cat, idx) => ({
      id:        cat.id,
      name:      cat.name,
      order:     cat.order,
      image_url: cat.image_url ?? null,
      count:     countMap.get(cat.name) ?? 0,
      num:       String(idx + 1).padStart(2, '0'),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

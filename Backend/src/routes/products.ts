import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { validate, SlugParam } from '../lib/validate';

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────
const ProductQuerySchema = z.object({
  category: z.string().trim().max(100).optional(),
  sort:     z.enum(['price_asc', 'price_desc', 'newest', 'rating']).optional(),
  search:   z.string().trim().max(100).optional(),
  page:     z.coerce.number().int().min(1).optional(),
  limit:    z.coerce.number().int().min(1).max(100).optional(),
}).strip(); // Unbekannte Query-Params entfernen

// GET /api/products/categories — eindeutige Kategorien (public)
router.get('/categories', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('active', true)
      .not('category', 'is', null);

    if (error) throw error;
    const categories = [...new Set((data ?? []).map(r => r.category as string).filter(Boolean))].sort();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// GET /api/products — alle Produkte (public)
router.get('/', validate(ProductQuerySchema, 'query'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, sort, search } = req.query as z.infer<typeof ProductQuerySchema>;

    let query = supabase.from('products').select('*').eq('active', true);

    if (category) query = query.eq('category', category);
    if (search)   query = query.ilike('name', `%${search}%`);

    switch (sort) {
      case 'price_asc':  query = query.order('price',      { ascending: true  }); break;
      case 'price_desc': query = query.order('price',      { ascending: false }); break;
      case 'rating':     query = query.order('rating',     { ascending: false }); break;
      default:           query = query.order('created_at', { ascending: false }); break;
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug — einzelnes Produkt (public)
router.get('/:slug', validate(SlugParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, reviews(*)')
      .eq('slug', req.params.slug)
      .eq('active', true)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Produkt nicht gefunden' });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;

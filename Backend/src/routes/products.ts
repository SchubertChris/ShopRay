import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/products — alle Produkte (public)
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, sort, search } = req.query as Record<string, string>;

    let query = supabase.from('products').select('*').eq('active', true);

    if (category) query = query.eq('category', category);
    if (search)   query = query.ilike('name', `%${search}%`);

    if (sort === 'price_asc')  query = query.order('price', { ascending: true });
    if (sort === 'price_desc') query = query.order('price', { ascending: false });
    if (sort === 'newest')     query = query.order('created_at', { ascending: false });
    if (!sort)                 query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug — einzelnes Produkt (public)
router.get('/:slug', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase }     from '../lib/supabase';
import { requireAdmin } from '../middleware/adminAuth';
import { validate }     from '../lib/validate';

const router = Router();

// ── Shop-Einstellungen ────────────────────────────────────────────────────────

const ShopSchema = z.object({
  name:        z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().default(''),
  url:         z.string().trim().max(255).optional().default(''),
  email:       z.string().trim().max(255).optional().default(''),
  phone:       z.string().trim().max(50).optional().default(''),
  street:      z.string().trim().max(200).optional().default(''),
  zip:         z.string().trim().max(20).optional().default(''),
  city:        z.string().trim().max(100).optional().default(''),
  country:     z.string().trim().max(100).optional().default('Deutschland'),
  vat_id:      z.string().trim().max(50).optional().default(''),
  tax_number:  z.string().trim().max(50).optional().default(''),
});

export interface ShopSettings {
  name:        string;
  description: string;
  url:         string;
  email:       string;
  phone:       string;
  street:      string;
  zip:         string;
  city:        string;
  country:     string;
  vat_id:      string;
  tax_number:  string;
  updated_at:  string;
}

const SHOP_DEFAULTS: ShopSettings = {
  name:        process.env.SHOP_NAME        ?? 'Mein Shop',
  description: '',
  url:         process.env.CLIENT_URL       ?? '',
  email:       process.env.SHOP_EMAIL       ?? process.env.SMTP_FROM_EMAIL ?? '',
  phone:       process.env.SHOP_PHONE       ?? '',
  street:      process.env.SHOP_STREET      ?? '',
  zip:         process.env.SHOP_ZIP         ?? '',
  city:        process.env.SHOP_CITY        ?? '',
  country:     process.env.SHOP_COUNTRY     ?? 'Deutschland',
  vat_id:      process.env.SHOP_VAT_ID      ?? '',
  tax_number:  process.env.SHOP_TAX_NUMBER  ?? '',
  updated_at:  new Date().toISOString(),
};

// GET /api/settings/shop — öffentlich
router.get('/shop', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) { res.json(SHOP_DEFAULTS); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/settings/shop — nur Admin
router.put('/shop', requireAdmin, validate(ShopSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as z.infer<typeof ShopSchema>;
    const { data, error } = await supabase
      .from('shop_settings')
      .upsert({ id: 1, ...body, updated_at: new Date().toISOString() })
      .select('*')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

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

const SHIPPING_DEFAULTS: ShippingSettings = {
  standard:   4.90,
  express:    9.90,
  free_above: 50.00,
  delivery:   '2–4 Werktage',
  updated_at: new Date().toISOString(),
};

// GET /api/settings/shipping — öffentlich, kein Auth
router.get('/shipping', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('shipping_settings')
      .select('standard, express, free_above, delivery, updated_at')
      .eq('id', 1)
      .single();

    // Tabelle noch nicht migriert oder leer → Defaults zurückgeben statt 500
    if (error || !data) {
      res.json(SHIPPING_DEFAULTS);
      return;
    }
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

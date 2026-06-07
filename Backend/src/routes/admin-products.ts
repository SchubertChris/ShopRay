import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import multer  from 'multer';
import crypto  from 'crypto';
import { supabase }    from '../lib/supabase';
import { requireAdmin, requireOwner } from '../middleware/adminAuth';
import { validate, UUIDParam } from '../lib/validate';

const router = Router();

// ── Multer: Bild-Upload ───────────────────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif',
};

const upload = multer({
  storage:    multer.memoryStorage(),
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype as typeof ALLOWED_TYPES[number])) {
      cb(null, true);
    } else {
      cb(new Error('Ungültiger Dateityp. Erlaubt: JPEG, PNG, WebP, AVIF'));
    }
  },
});

// ── Schemas ───────────────────────────────────────────────────────────────────
const DealerLinkSchema = z.object({
  name: z.string().trim().max(100),
  url:  z.string().url('Ungültige URL in dealer_links').max(2000),
});

const DocumentSchema = z.object({
  name: z.string().trim().max(100),
  url:  z.string().url('Ungültige URL in documents').max(2000),
});

const ProductBodySchema = z.object({
  name:             z.string().trim().min(1, 'Name ist erforderlich').max(200),
  slug:             z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug: nur a–z, 0–9 und Bindestriche erlaubt'),
  description:      z.string().trim().min(1, 'Beschreibung ist erforderlich').max(2000),
  price:            z.number({ invalid_type_error: 'Preis muss eine Zahl sein' }).min(0).max(999_999),
  old_price:        z.number().min(0).max(999_999).nullable().optional(),
  badge:            z.string().trim().max(50).nullable().optional(),
  discount:         z.string().trim().max(20).nullable().optional(),
  category:         z.string().trim().min(1).max(100),
  stock:            z.number().int().min(0).max(999_999).optional().default(0),
  active:           z.boolean().optional().default(true),
  image_url:        z.string().url('Ungültige Bild-URL').max(2000).nullable().optional(),
  images:           z.array(z.string().url('Ungültige URL in images').max(2000)).max(20).optional().default([]),
  tax_rate:         z.number().min(0).max(100),
  rich_description: z.string().max(50_000).nullable().optional(),
  highlights:       z.array(z.string().trim().max(200)).max(20).optional().default([]),
  certifications:   z.array(z.string().trim().max(200)).max(20).optional().default([]),
  lmiv:             z.record(z.unknown()).nullable().optional(),
  dealer_links:     z.array(DealerLinkSchema).max(20).optional().default([]),
  documents:        z.array(DocumentSchema).max(20).optional().default([]),
  sections_config:  z.object({
    lmiv:    z.boolean().optional(),
    reviews: z.boolean().optional(),
  }).nullable().optional(),
});

// PUT erlaubt partielle Updates
const UpdateProductSchema = ProductBodySchema.partial();

type ProductBody  = z.infer<typeof ProductBodySchema>;
type UpdateBody   = z.infer<typeof UpdateProductSchema>;

// Schema für CSV-Import (vereinfacht — nur was im CSV sinnvoll ist)
const BulkRowSchema = z.object({
  name:             z.string().trim().min(1).max(200),
  slug:             z.string().trim().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description:      z.string().trim().min(1).max(2000),
  price:            z.coerce.number().min(0).max(999_999),
  category:         z.string().trim().min(1).max(100),
  stock:            z.coerce.number().int().min(0).max(999_999).optional().default(0),
  old_price:        z.coerce.number().min(0).max(999_999).nullable().optional(),
  badge:            z.string().trim().max(50).nullable().optional(),
  tax_rate:         z.coerce.number().min(0).max(100).optional().default(19),
  image_url:        z.string().url().max(2000).nullable().optional(),
  highlights:       z.string().trim().max(2000).optional(), // semicolon-separated
  certifications:   z.string().trim().max(2000).optional(), // semicolon-separated
  discount:         z.string().trim().max(20).nullable().optional(),
});

// Alle Routen erfordern Admin-Session
router.use(requireAdmin);

// POST /api/admin/products/bulk — Mehrere Produkte auf einmal anlegen
router.post('/bulk', requireOwner, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rows = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: 'Leeres oder ungültiges Array.' });
      return;
    }
    if (rows.length > 200) {
      res.status(400).json({ error: 'Maximal 200 Produkte pro Import.' });
      return;
    }

    const results: { row: number; status: 'ok' | 'error'; name?: string; error?: string }[] = [];
    const toInsert: object[] = [];

    for (let i = 0; i < rows.length; i++) {
      const parsed = BulkRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        results.push({ row: i + 1, status: 'error', name: rows[i]?.name, error: parsed.error.errors[0]?.message ?? 'Ungültige Daten' });
        continue;
      }
      const d = parsed.data;
      toInsert.push({
        name:             d.name,
        slug:             d.slug,
        description:      d.description,
        price:            d.price,
        category:         d.category,
        stock:            d.stock,
        old_price:        d.old_price ?? null,
        badge:            d.badge ?? null,
        tax_rate:         d.tax_rate,
        image_url:        d.image_url ?? null,
        highlights:       d.highlights       ? d.highlights.split(';').map(s => s.trim()).filter(Boolean)       : [],
        certifications:   d.certifications   ? d.certifications.split(';').map(s => s.trim()).filter(Boolean)   : [],
        discount:         d.discount ?? null,
        active:           true,
        images:           [],
        dealer_links:     [],
        documents:        [],
        _row:             i + 1,
        _name:            d.name,
      });
    }

    // Batch-Insert: alle validen Produkte in einem einzigen DB-Call statt N sequenzieller Requests
    if (toInsert.length > 0) {
      const rows = toInsert.map(p => {
        const { _row, _name, ...data } = p as Record<string, unknown>;
        return { _row, _name, data };
      });
      const { data: inserted, error: batchErr } = await supabase
        .from('products')
        .insert(rows.map(r => r.data))
        .select('id');

      if (batchErr) {
        // DB hat den gesamten Batch abgelehnt (z.B. unique constraint) — alle als Fehler markieren
        for (const r of rows) {
          results.push({ row: r._row as number, status: 'error', name: r._name as string, error: batchErr.message });
        }
      } else {
        for (let i = 0; i < rows.length; i++) {
          results.push({ row: rows[i]._row as number, status: 'ok', name: rows[i]._name as string });
        }
        void inserted; // suppress unused warning
      }
    }

    const ok     = results.filter(r => r.status === 'ok').length;
    const errors = results.filter(r => r.status === 'error').length;
    res.status(errors === results.length ? 400 : 207).json({ ok, errors, results });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products/upload — Bild hochladen
router.post('/upload', requireOwner, upload.single('image'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ error: 'Keine Datei empfangen.' }); return; }

    const ext      = EXT_MAP[file.mimetype] ?? 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('product-images').getPublicUrl(filename);
    res.status(201).json({ url: data.publicUrl });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/products/:id — Einzelprodukt
router.get('/:id', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('products').select('*').eq('id', req.params.id).single();

    if (error || !data) { res.status(404).json({ error: 'Produkt nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products — Produkt anlegen
router.post('/', requireOwner, validate(ProductBodySchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as ProductBody;

    const { data: existing } = await supabase
      .from('products').select('id').eq('slug', body.slug).maybeSingle();
    if (existing) {
      res.status(409).json({ error: `Slug "${body.slug}" ist bereits vergeben.` });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .insert({ ...body, rating: 0, reviews: 0 })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/products/:id — Produkt bearbeiten
router.put('/:id', requireOwner, validate(UUIDParam, 'params'), validate(UpdateProductSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as UpdateBody;
    const { id } = req.params;

    if (body.slug) {
      const { data: existing } = await supabase
        .from('products').select('id').eq('slug', body.slug).neq('id', id).maybeSingle();
      if (existing) {
        res.status(409).json({ error: `Slug "${body.slug}" ist bereits vergeben.` });
        return;
      }
    }

    const { data, error } = await supabase
      .from('products').update(body).eq('id', id).select().single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Produkt nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id — Produkt löschen
router.delete('/:id', requireOwner, validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: product } = await supabase
      .from('products').select('image_url, images').eq('id', id).single();

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    const allUrls = [
      product?.image_url,
      ...((product?.images as string[] | null) ?? []),
    ].filter(Boolean) as string[];
    const filenames = allUrls.map(u => u.split('/').pop()).filter(Boolean) as string[];
    if (filenames.length) {
      await supabase.storage.from('product-images').remove(filenames);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import multer  from 'multer';
import crypto  from 'crypto';
import { supabase }    from '../lib/supabase';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// ── Multer: Bild-Upload (in-memory, dann weiter zu Supabase Storage) ──────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const upload = multer({
  storage:    multer.memoryStorage(),
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype as typeof ALLOWED_TYPES[number])) {
      cb(null, true);
    } else {
      cb(new Error('Ungültiger Dateityp. Erlaubt: JPEG, PNG, WebP, AVIF'));
    }
  },
});

// Alle Routen erfordern Admin-Session
router.use(requireAdmin);

// ── POST /api/admin/upload — Bild hochladen ───────────────────────────────────
router.post('/upload', upload.single('image'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Keine Datei empfangen.' });
      return;
    }

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

// ── GET /api/admin/products/:id — Einzelprodukt für Edit-Modus ───────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Produkt nicht gefunden.' });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/admin/products — Produkt anlegen ────────────────────────────────
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown>;

    const { name, slug, description, price, category, tax_rate } = body;
    if (!name || !slug || !description || price === undefined || !category || tax_rate === undefined) {
      res.status(400).json({ error: 'Pflichtfelder fehlen: name, slug, description, price, category, tax_rate.' });
      return;
    }

    // Slug-Konflikt prüfen
    const { data: existing } = await supabase.from('products').select('id').eq('slug', slug).maybeSingle();
    if (existing) {
      res.status(409).json({ error: `Slug "${slug}" ist bereits vergeben.` });
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name:             String(name).slice(0, 200),
        slug:             String(slug).slice(0, 200),
        description:      String(description).slice(0, 2000),
        price:            Number(price),
        old_price:        body.old_price        != null ? Number(body.old_price)                          : null,
        badge:            body.badge            != null ? String(body.badge).slice(0, 50)                 : null,
        discount:         body.discount         != null ? String(body.discount).slice(0, 20)              : null,
        category:         String(category).slice(0, 100),
        stock:            Number(body.stock ?? 0),
        active:           body.active !== false,
        image_url:        body.image_url        != null ? String(body.image_url)                          : null,
        tax_rate:         Number(tax_rate),
        rich_description: body.rich_description != null ? String(body.rich_description).slice(0, 50000)  : null,
        highlights:       Array.isArray(body.highlights)     ? body.highlights     : [],
        certifications:   Array.isArray(body.certifications) ? body.certifications : [],
        lmiv:             body.lmiv             != null ? body.lmiv                                       : null,
        dealer_links:     Array.isArray(body.dealer_links)   ? body.dealer_links   : [],
        documents:        Array.isArray(body.documents)      ? body.documents      : [],
        rating:           0,
        reviews:          0,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/admin/products/:id — Produkt bearbeiten ─────────────────────────
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown>;
    const { id } = req.params;

    // Slug-Konflikt prüfen (falls slug geändert)
    if (body.slug) {
      const { data: existing } = await supabase
        .from('products').select('id').eq('slug', body.slug).neq('id', id).maybeSingle();
      if (existing) {
        res.status(409).json({ error: `Slug "${body.slug}" ist bereits vergeben.` });
        return;
      }
    }

    const update: Record<string, unknown> = {};
    if (body.name        !== undefined) update.name        = String(body.name).slice(0, 200);
    if (body.slug        !== undefined) update.slug        = String(body.slug).slice(0, 200);
    if (body.description !== undefined) update.description = String(body.description).slice(0, 2000);
    if (body.price       !== undefined) update.price       = Number(body.price);
    if (body.old_price   !== undefined) update.old_price   = body.old_price != null ? Number(body.old_price) : null;
    if (body.badge       !== undefined) update.badge       = body.badge     != null ? String(body.badge).slice(0, 50) : null;
    if (body.discount    !== undefined) update.discount    = body.discount  != null ? String(body.discount).slice(0, 20) : null;
    if (body.category    !== undefined) update.category    = String(body.category).slice(0, 100);
    if (body.stock       !== undefined) update.stock       = Number(body.stock);
    if (body.active      !== undefined) update.active      = Boolean(body.active);
    if (body.image_url        !== undefined) update.image_url        = body.image_url != null ? String(body.image_url) : null;
    if (body.tax_rate         !== undefined) update.tax_rate         = Number(body.tax_rate);
    if (body.rich_description !== undefined) update.rich_description = body.rich_description != null ? String(body.rich_description).slice(0, 50000) : null;
    if (body.highlights       !== undefined) update.highlights       = Array.isArray(body.highlights)     ? body.highlights     : [];
    if (body.certifications   !== undefined) update.certifications   = Array.isArray(body.certifications) ? body.certifications : [];
    if (body.lmiv             !== undefined) update.lmiv             = body.lmiv != null ? body.lmiv : null;
    if (body.dealer_links     !== undefined) update.dealer_links     = Array.isArray(body.dealer_links)   ? body.dealer_links   : [];
    if (body.documents        !== undefined) update.documents        = Array.isArray(body.documents)      ? body.documents      : [];

    const { data, error } = await supabase
      .from('products')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Produkt nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/admin/products/:id — Produkt löschen ─────────────────────────
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Bild-URL holen um ggf. Storage zu bereinigen
    const { data: product } = await supabase
      .from('products').select('image_url').eq('id', id).single();

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    // Supabase-Storage-Datei löschen wenn vorhanden
    if (product?.image_url) {
      const url      = product.image_url as string;
      const filename = url.split('/').pop();
      if (filename) {
        await supabase.storage.from('product-images').remove([filename]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;

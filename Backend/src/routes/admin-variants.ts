import { Router } from 'express';
import { z }      from 'zod';
import { supabase }     from '../lib/supabase';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// ── Schema ────────────────────────────────────────────────────────────────────

const VariantsPayloadSchema = z.object({
  options: z.array(z.object({
    name:   z.string().min(1).max(60),
    values: z.array(z.string().min(1).max(60)).min(1),
  })).max(3),
  skus: z.array(z.object({
    combination:  z.record(z.string()),
    stock:        z.number().int().min(0),
    price_offset: z.number().min(-9999).max(9999),
    sku_code:     z.string().max(100).optional().nullable(),
    active:       z.boolean().optional(),
  })),
});

// ── GET /api/admin/products/:id/variants ──────────────────────────────────────

router.get('/:id/variants', requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { data: options, error: optErr } = await supabase
    .from('variant_options')
    .select('id, name, position, variant_option_values(id, value, position)')
    .eq('product_id', id)
    .order('position', { ascending: true });

  const { data: skus, error: skuErr } = await supabase
    .from('product_skus')
    .select('id, combination, stock, price_offset, sku_code, active')
    .eq('product_id', id)
    .order('created_at', { ascending: true });

  if (optErr || skuErr) {
    res.status(500).json({ error: 'Varianten konnten nicht geladen werden.' });
    return;
  }

  res.json({ options: options ?? [], skus: skus ?? [] });
});

// ── PUT /api/admin/products/:id/variants ──────────────────────────────────────
// Ersetzt ALLE Optionsgruppen + SKUs des Produkts (replace-all Ansatz)

router.put('/:id/variants', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const parsed = VariantsPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Varianten-Daten.', details: parsed.error.flatten() });
    return;
  }

  const { options, skus } = parsed.data;

  // 1. Alte Optionen + SKUs löschen (CASCADE löscht variant_option_values mit)
  const { error: delOptErr } = await supabase
    .from('variant_options')
    .delete()
    .eq('product_id', id);

  const { error: delSkuErr } = await supabase
    .from('product_skus')
    .delete()
    .eq('product_id', id);

  if (delOptErr || delSkuErr) {
    res.status(500).json({ error: 'Alte Varianten konnten nicht gelöscht werden.' });
    return;
  }

  // 2. Neue Optionsgruppen einfügen
  if (options.length > 0) {
    const optRows = options.map((o, idx) => ({
      product_id: id,
      name:       o.name,
      position:   idx,
    }));

    const { data: insertedOpts, error: insOptErr } = await supabase
      .from('variant_options')
      .insert(optRows)
      .select('id, name, position');

    if (insOptErr || !insertedOpts) {
      res.status(500).json({ error: 'Optionsgruppen konnten nicht gespeichert werden.' });
      return;
    }

    // 3. Werte für jede Gruppe einfügen
    const valueRows: { option_id: string; value: string; position: number }[] = [];
    for (let i = 0; i < options.length; i++) {
      const opt = insertedOpts.find(o => o.name === options[i].name && o.position === i);
      if (!opt) continue;
      options[i].values.forEach((val, vi) => {
        valueRows.push({ option_id: opt.id, value: val, position: vi });
      });
    }

    if (valueRows.length > 0) {
      const { error: insValErr } = await supabase
        .from('variant_option_values')
        .insert(valueRows);
      if (insValErr) {
        res.status(500).json({ error: 'Varianten-Werte konnten nicht gespeichert werden.' });
        return;
      }
    }
  }

  // 4. SKUs einfügen
  if (skus.length > 0) {
    const skuRows = skus.map(s => ({
      product_id:   id,
      combination:  s.combination,
      stock:        s.stock,
      price_offset: s.price_offset,
      sku_code:     s.sku_code ?? null,
      active:       s.active ?? true,
    }));

    const { error: insSkuErr } = await supabase
      .from('product_skus')
      .insert(skuRows);

    if (insSkuErr) {
      res.status(500).json({ error: 'SKUs konnten nicht gespeichert werden.' });
      return;
    }
  }

  res.json({ success: true });
});

export default router;

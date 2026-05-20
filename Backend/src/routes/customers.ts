import { z } from 'zod';
import { Router, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../lib/validate';

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────
const PatchProfileSchema = z.object({
  name:            z.string().trim().min(1).max(100).optional(),
  phone:           z.string().trim().max(30).nullable().optional(),
  address_street:  z.string().trim().max(200).nullable().optional(),
  address_zip:     z.string().trim().max(10).nullable().optional(),
  address_city:    z.string().trim().max(100).nullable().optional(),
  address_country: z.string().trim().max(100).nullable().optional(),
}).strict(); // Keine unbekannten Felder

type PatchProfile = z.infer<typeof PatchProfileSchema>;

// GET /api/customers/me — eigenes Profil
router.get('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.userId!)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Profil nicht gefunden' });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/customers/me — Profil aktualisieren
router.patch('/me', requireAuth, validate(PatchProfileSchema), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = req.body as PatchProfile;

    // Leere Updates ablehnen
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'Keine Felder zum Aktualisieren übergeben.' });
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', req.userId!)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/me/export — DSGVO Art. 15: Datenauskunft
router.get('/me/export', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [profileRes, ordersRes, ticketsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', req.userId!).single(),
      supabase.from('orders').select('*, order_items(*)').eq('user_id', req.userId!),
      supabase.from('tickets').select('*').eq('user_id', req.userId!),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile:    profileRes.data,
      orders:     ordersRes.data  ?? [],
      tickets:    ticketsRes.data ?? [],
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="dsgvo-export-${req.userId}.json"`);
    res.json(exportData);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/customers/me — DSGVO Art. 17: Recht auf Löschung
router.delete('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Bestelldaten anonymisieren (§ 147 AO — Aufbewahrungspflicht)
    // shipping_address wird auf {"anonymized":true} reduziert — Name + Adresse entfernt
    const { data: userOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', req.userId!);

    if (userOrders && userOrders.length > 0) {
      for (const order of userOrders) {
        await supabase
          .from('orders')
          .update({
            user_id:          null,
            customer_note:    '[gelöscht]',
            shipping_address: { anonymized: true },
          })
          .eq('id', order.id);
      }
    }

    await supabase.from('tickets').delete().eq('user_id', req.userId!);
    // Reviews anonymisieren (DSGVO Art. 17 — Text ist personenbezogen)
    await supabase
      .from('reviews')
      .update({ user_id: null, body: '[gelöscht]', title: '[gelöscht]' })
      .eq('user_id', req.userId!);
    await supabase.from('profiles').delete().eq('id', req.userId!);
    await supabase.auth.admin.deleteUser(req.userId!);

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;

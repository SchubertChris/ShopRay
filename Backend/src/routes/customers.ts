import { Router, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

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
router.patch('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allowed = ['name', 'phone', 'address_street', 'address_zip', 'address_city', 'address_country'];
    const updates: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
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
    // Bestelldaten anonymisieren (Pflicht für Buchführung § 147 AO)
    await supabase
      .from('orders')
      .update({
        user_id:       null,
        customer_note: '[gelöscht]',
      })
      .eq('user_id', req.userId!);

    // Tickets löschen
    await supabase.from('tickets').delete().eq('user_id', req.userId!);

    // Profil löschen
    await supabase.from('profiles').delete().eq('id', req.userId!);

    // Supabase Auth-Account löschen
    await supabase.auth.admin.deleteUser(req.userId!);

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;

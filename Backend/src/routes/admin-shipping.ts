import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase }        from '../lib/supabase';
import { requireAdmin, requireOwner } from '../middleware/adminAuth';
import { validate, UUIDParam } from '../lib/validate';
import { createDhlShipment }   from '../lib/dhl-api';

const router = Router();
router.use(requireAdmin);

const LabelSchema = z.object({
  weight_g: z.number().int().min(1).max(31500, { message: 'Max. 31,5 kg (31500 g)' }),
});

// POST /api/admin/orders/:id/label — DHL-Label erstellen (nur Owner)
router.post('/:id/label', requireOwner, validate(UUIDParam, 'params'), validate(LabelSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('id, order_number, shipping_address, tracking_number')
      .eq('id', req.params.id)
      .single();

    if (oErr || !order) { res.status(404).json({ error: 'Bestellung nicht gefunden.' }); return; }

    const addr = order.shipping_address as {
      firstName?: string; lastName?: string;
      street?: string; zip?: string; city?: string; country?: string;
    } | null;

    if (!addr?.street || !addr?.zip || !addr?.city) {
      res.status(422).json({ error: 'Keine vollständige Lieferadresse vorhanden.' });
      return;
    }

    const recipientName = [addr.firstName, addr.lastName].filter(Boolean).join(' ') || 'Empfänger';

    const result = await createDhlShipment({
      recipientName,
      recipientStreet:  addr.street,
      recipientZip:     addr.zip,
      recipientCity:    addr.city,
      recipientCountry: addr.country ?? 'Deutschland',
      weightGrams:      (req.body as { weight_g: number }).weight_g,
      refNo:            String(order.order_number),
    });

    // Tracking-Nummer speichern
    await supabase
      .from('orders')
      .update({ tracking_number: result.trackingNumber, status: 'shipped', shipped_at: new Date().toISOString() })
      .eq('id', req.params.id);

    res.json({ tracking_number: result.trackingNumber, label_b64: result.labelB64 });
  } catch (err) {
    next(err);
  }
});

export default router;

import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase }           from '../lib/supabase';
import { stripe }             from '../lib/stripe';
import { requireAdmin }       from '../middleware/adminAuth';
import { validate, UUIDParam } from '../lib/validate';
import { createNotification } from '../lib/notify';

const router = Router();
router.use(requireAdmin);

// Betragsschwellen (identisch mit admin-orders.ts)
const TEAM_LEAD_LIMIT = 500;
const OWNER_THRESHOLD = 2000;

const RefundRequestQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(200).default(50),
});

const RejectBodySchema = z.object({
  reason: z.string().max(2000).optional(),
});

// ── GET / — alle Anträge ──────────────────────────────────────────────────────
router.get('/', validate(RefundRequestQuerySchema, 'query'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page, limit } = req.query as unknown as z.infer<typeof RefundRequestQuerySchema>;
    const from = (page - 1) * limit;

    let query = supabase
      .from('refund_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    next(err);
  }
});

// ── GET /:id — Einzelantrag ───────────────────────────────────────────────────
router.get('/:id', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) { res.status(404).json({ error: 'Erstattungsantrag nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── POST /:id/approve — Antrag genehmigen ─────────────────────────────────────
router.post('/:id/approve', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role        = req.adminRole!;
    const approverId  = req.adminUserId;

    // Antrag laden
    const { data: refundReq, error: rrErr } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (rrErr || !refundReq) { res.status(404).json({ error: 'Erstattungsantrag nicht gefunden.' }); return; }

    const rr = refundReq as Record<string, unknown>;

    if (rr.status !== 'pending') {
      res.status(409).json({ error: `Antrag hat bereits den Status "${rr.status as string}" und kann nicht genehmigt werden.` });
      return;
    }

    // Antragsteller darf nicht selbst genehmigen
    if (approverId && rr.requested_by === approverId) {
      res.status(403).json({ error: 'Du kannst deinen eigenen Erstattungsantrag nicht genehmigen.' });
      return;
    }

    const amount = parseFloat(String(rr.amount ?? '0'));

    // Berechtigungsprüfung nach Betrag
    if (amount >= OWNER_THRESHOLD && role !== 'owner') {
      res.status(403).json({ error: `Erstattungen ab € ${OWNER_THRESHOLD.toFixed(2)} dürfen nur vom Inhaber genehmigt werden.` });
      return;
    }
    if (role === 'mod') {
      res.status(403).json({ error: 'Mitarbeiter dürfen keine Erstattungsanträge genehmigen.' });
      return;
    }

    // Order laden für Stripe
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', rr.order_id as string)
      .single();

    if (oErr || !order) { res.status(404).json({ error: 'Zugehörige Bestellung nicht gefunden.' }); return; }

    const paymentIntentId = order.stripe_payment_intent_id as string | null;
    if (!paymentIntentId) {
      res.status(409).json({ error: 'Keine Stripe-Payment-Intent-ID — manuelle Erstattung erforderlich.' });
      return;
    }

    // Stripe-Erstattung ausführen
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount:         Math.round(amount * 100),
    });

    if (refund.status !== 'succeeded' && refund.status !== 'pending') {
      res.status(502).json({ error: `Stripe-Erstattung fehlgeschlagen: ${refund.status}` });
      return;
    }

    const now = new Date().toISOString();

    // Antrag als genehmigt markieren
    await supabase
      .from('refund_requests')
      .update({
        status:           'approved',
        approved_by:      approverId ?? null,
        approved_by_role: role,
        approved_at:      now,
        stripe_refund_id: refund.id,
        updated_at:       now,
      })
      .eq('id', req.params.id);

    // Order-Status auf refunded setzen
    await supabase
      .from('orders')
      .update({ status: 'refunded', updated_at: now })
      .eq('id', rr.order_id as string);

    // Lagerbestand zurückbuchen (non-blocking)
    const items = (order.order_items as Array<{ product_id: string; quantity: number }>) ?? [];
    void (async () => {
      for (const item of items) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
        if (prod) {
          await supabase.from('products')
            .update({ stock: (prod.stock as number) + item.quantity })
            .eq('id', item.product_id);
        }
      }
    })().catch(e => console.error('Stock-Rückbuchung (refund-request) fehlgeschlagen:', e));

    // Notification (non-blocking)
    void createNotification(
      'refund_approved',
      `Erstattungsantrag genehmigt: Bestellung ${rr.order_number as string}`,
      `Rückerstattung über € ${amount.toFixed(2)} wurde von ${role} genehmigt und ausgeführt.`,
    ).catch(e => console.error('Approve-Notification fehlgeschlagen:', e));

    res.json({ ok: true, refundId: refund.id, status: refund.status });
  } catch (err) {
    next(err);
  }
});

// ── POST /:id/reject — Antrag ablehnen ───────────────────────────────────────
router.post('/:id/reject', validate(UUIDParam, 'params'), validate(RejectBodySchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role       = req.adminRole!;
    const rejecterId = req.adminUserId;
    const { reason } = req.body as z.infer<typeof RejectBodySchema>;

    // Antrag laden
    const { data: refundReq, error: rrErr } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (rrErr || !refundReq) { res.status(404).json({ error: 'Erstattungsantrag nicht gefunden.' }); return; }

    const rr = refundReq as Record<string, unknown>;

    if (rr.status !== 'pending') {
      res.status(409).json({ error: `Antrag hat bereits den Status "${rr.status as string}" und kann nicht abgelehnt werden.` });
      return;
    }

    // Antragsteller darf eigenen Antrag nicht selbst ablehnen
    if (rejecterId && rr.requested_by === rejecterId) {
      res.status(403).json({ error: 'Du kannst deinen eigenen Erstattungsantrag nicht ablehnen.' });
      return;
    }

    const now = new Date().toISOString();

    const { data: updated, error: upErr } = await supabase
      .from('refund_requests')
      .update({
        status:          'rejected',
        rejected_reason: reason ?? null,
        approved_by:     rejecterId ?? null,
        approved_by_role: role,
        updated_at:      now,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (upErr) throw upErr;

    // Notification (non-blocking)
    void createNotification(
      'refund_rejected',
      `Erstattungsantrag abgelehnt: Bestellung ${rr.order_number as string}`,
      reason
        ? `Abgelehnt von ${role}. Begründung: ${reason}`
        : `Abgelehnt von ${role}.`,
    ).catch(e => console.error('Reject-Notification fehlgeschlagen:', e));

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;

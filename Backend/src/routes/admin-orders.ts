import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase }     from '../lib/supabase';
import { stripe }       from '../lib/stripe';
import { requireAdmin, requireOwner } from '../middleware/adminAuth';
import { validate, UUIDParam } from '../lib/validate';
import { generateInvoicePdf }  from '../lib/invoice-pdf';
import { sendMail }     from '../lib/mailer';

const router = Router();
router.use(requireAdmin);

const VALID_STATUSES = [
  'pending', 'paid', 'shipped', 'delivered', 'cancelled', 'payment_failed', 'refunded',
] as const;

const StatusSchema = z.object({
  status: z.enum(VALID_STATUSES, { errorMap: () => ({ message: 'Ungültiger Status.' }) }),
});

// GET /api/admin/orders — alle Bestellungen (paginated)
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10)));
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at, user_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    res.json({ data: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    next(err);
  }
});

// ── RETURN REQUESTS (müssen VOR /:id stehen, sonst matcht Express den Wildcard) ──

const ReturnStatusSchema = z.object({
  status:     z.enum(['requested','approved','rejected','label_sent','received','refunded']),
  label_url:  z.string().url().optional().nullable(),
  admin_note: z.string().max(2000).optional().nullable(),
});

// GET /api/admin/orders/return-requests — alle Rücksendeanträge
router.get('/return-requests', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('return_requests')
      .select('*, orders(order_number, total, user_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/return-requests/:id — Status + Label aktualisieren
router.patch('/return-requests/:id', validate(UUIDParam, 'params'), validate(ReturnStatusSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, label_url, admin_note } = req.body as z.infer<typeof ReturnStatusSchema>;

    const { data, error } = await supabase
      .from('return_requests')
      .update({ status, label_url: label_url ?? null, admin_note: admin_note ?? null, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Antrag nicht gefunden.' }); return; }

    // Kunden benachrichtigen wenn Label bereit
    if (status === 'label_sent' && label_url) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('user_id, order_number')
        .eq('id', (data as Record<string, unknown>).order_id as string)
        .single();
      if (orderData?.user_id) {
        const { data: authData } = await supabase.auth.admin.getUserById(String(orderData.user_id));
        const email = authData?.user?.email;
        if (email) {
          void sendMail({
            to:      email,
            subject: `Rücksendeetikett für Bestellung ${orderData.order_number as string}`,
            html:    `<p>Hallo,<br><br>dein Rücksendeetikett für Bestellung <strong>${orderData.order_number as string}</strong> ist fertig.<br><br><a href="${label_url}">Etikett herunterladen →</a><br><br>Klebe das Etikett auf das Paket und gib es in einer Postfiliale ab. Nach Eingang des Pakets bearbeiten wir deine Rückerstattung.</p>`,
          }).catch(e => console.error('Return-Label-Mail fehlgeschlagen:', e));
        }
      }
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders/:id — einzelne Bestellung mit Items und Kundendaten
router.get('/:id', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .single();

    if (oErr || !order) {
      res.status(404).json({ error: 'Bestellung nicht gefunden.' });
      return;
    }

    // Kundendaten separat laden (Profile hat kein email-Feld → auth.admin)
    let profile: { name: string | null; phone: string | null; email: string | null } | null = null;
    if (order.user_id) {
      const [{ data: prof }, { data: authData }] = await Promise.all([
        supabase.from('profiles').select('name, phone').eq('id', order.user_id).single(),
        supabase.auth.admin.getUserById(String(order.user_id)),
      ]);
      profile = {
        name:  prof?.name  ?? null,
        phone: prof?.phone ?? null,
        email: authData?.user?.email ?? null,
      };
    }

    res.json({ ...order, profile });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/:id/status — Status aktualisieren
router.patch('/:id/status', validate(UUIDParam, 'params'), validate(StatusSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body as { status: typeof VALID_STATUSES[number] };

    // Status-spezifische Zeitstempel setzen
    const extra: Record<string, string> = {};
    if (status === 'paid'     && !req.body.paid_at)    extra.paid_at    = new Date().toISOString();
    if (status === 'shipped'  && !req.body.shipped_at) extra.shipped_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders')
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, order_number, status')
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Bestellung nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders/:id/invoice — Rechnung als PDF
router.get('/:id/invoice', validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !order) { res.status(404).json({ error: 'Bestellung nicht gefunden.' }); return; }

    // Rechnungsnummer holen oder neu vergeben
    let invoiceNumber = order.invoice_number as string | null;
    if (!invoiceNumber) {
      const prefix = process.env.INVOICE_PREFIX ?? 'RE';
      const year   = new Date().getFullYear();

      const { data: seqData } = await supabase.rpc('nextval', { seq_name: 'invoice_seq' }).single();
      // Fallback: manuelle Zählung falls RPC nicht verfügbar
      const seq = (seqData as number | null) ?? Date.now();
      invoiceNumber = `${prefix}-${year}-${String(seq).padStart(5, '0')}`;

      await supabase
        .from('orders')
        .update({ invoice_number: invoiceNumber })
        .eq('id', req.params.id);
    }

    const items = (order.order_items as Array<{ product_name: string; quantity: number; price: number }>) ?? [];
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = Math.max(0, (order.total as number) - subtotal);

    const shop = {
      name:       process.env.SHOP_NAME       ?? 'Mein Shop',
      street:     process.env.SHOP_STREET     ?? 'Musterstraße 1',
      zip:        process.env.SHOP_ZIP        ?? '12345',
      city:       process.env.SHOP_CITY       ?? 'Musterstadt',
      country:    process.env.SHOP_COUNTRY    ?? 'Deutschland',
      email:      process.env.SHOP_EMAIL      ?? process.env.SMTP_FROM_EMAIL ?? '',
      phone:      process.env.SHOP_PHONE,
      vatId:      process.env.SHOP_VAT_ID,
      taxNumber:  process.env.SHOP_TAX_NUMBER,
    };

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber,
      orderNumber:   order.order_number as string,
      invoiceDate:   new Date().toISOString(),
      deliveryDate:  (order.paid_at as string | null) ?? (order.created_at as string),
      paidAt:        order.paid_at as string | null,
      paymentMethod: order.payment_method as string | null,
      items:         items.map(i => ({ name: i.product_name, quantity: i.quantity, price: i.price })),
      total:         order.total as number,
      shipping,
      address:       order.shipping_address as { firstName?: string; lastName?: string; street?: string; zip?: string; city?: string; country?: string } | null,
      shop,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rechnung_${invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/orders/:id/refund — automatische Stripe-Erstattung (nur Owner)
router.post('/:id/refund', requireOwner, validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .single();

    if (oErr || !order) { res.status(404).json({ error: 'Bestellung nicht gefunden.' }); return; }

    const refundableStatuses = ['paid', 'shipped', 'delivered'];
    if (!refundableStatuses.includes(order.status as string)) {
      res.status(409).json({ error: `Status "${order.status as string}" kann nicht erstattet werden.` });
      return;
    }

    const paymentIntentId = order.stripe_payment_intent_id as string | null;
    if (!paymentIntentId) {
      res.status(409).json({ error: 'Keine Stripe-Payment-Intent-ID gefunden — manuelle Erstattung erforderlich.' });
      return;
    }

    // Stripe-Erstattung auslösen
    const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });

    if (refund.status !== 'succeeded' && refund.status !== 'pending') {
      res.status(502).json({ error: `Stripe-Erstattung fehlgeschlagen: ${refund.status}` });
      return;
    }

    // Order-Status auf refunded setzen
    await supabase
      .from('orders')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    // Lagerbestand zurückbuchen
    const items = (order.order_items as Array<{ product_id: string; quantity: number }>) ?? [];
    void (async () => {
      for (const item of items) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
        if (prod) {
          await supabase.from('products').update({ stock: (prod.stock as number) + item.quantity }).eq('id', item.product_id);
        }
      }
    })().catch(e => console.error('Stock-Rückbuchung fehlgeschlagen:', e));

    // Kunden-E-Mail (non-blocking)
    if (order.user_id) {
      void supabase.auth.admin.getUserById(String(order.user_id)).then(({ data }) => {
        const email = data?.user?.email;
        if (email) {
          void sendMail({
            to:      email,
            subject: `Erstattung für Bestellung ${order.order_number as string}`,
            html:    `<p>Hallo,<br><br>deine Bestellung <strong>${order.order_number as string}</strong> wurde erstattet. Der Betrag erscheint in 5–10 Werktagen auf deinem Konto.</p>`,
          }).catch(e => console.error('Erstattungs-Mail fehlgeschlagen:', e));
        }
      });
    }

    res.json({ ok: true, refundId: refund.id, status: refund.status });
  } catch (err) {
    next(err);
  }
});

const AddressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName:  z.string().min(1).max(100),
  street:    z.string().min(1).max(200),
  zip:       z.string().min(4).max(20),
  city:      z.string().min(1).max(100),
  country:   z.string().min(1).max(100),
});

// PATCH /api/admin/orders/:id/address — Lieferadresse korrigieren (nur vor Versand sinnvoll)
router.patch('/:id/address', validate(UUIDParam, 'params'), validate(AddressSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, street, zip, city, country } = req.body as z.infer<typeof AddressSchema>;

    const { data, error } = await supabase
      .from('orders')
      .update({
        shipping_address: { firstName, lastName, street, zip, city, country },
        updated_at:       new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('id, shipping_address, tracking_number')
      .single();

    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Bestellung nicht gefunden.' }); return; }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;

import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { supabase }     from '../lib/supabase';
import { stripe }       from '../lib/stripe';
import { requireAdmin, requireOwner } from '../middleware/adminAuth';
import { validate, UUIDParam } from '../lib/validate';
import { generateInvoicePdf }  from '../lib/invoice-pdf';
import { sendMail }     from '../lib/mailer';
import { createNotification } from '../lib/notify';

const router = Router();
router.use(requireAdmin);

const VALID_STATUSES = [
  'pending', 'paid', 'shipped', 'delivered', 'cancelled', 'payment_failed', 'refunded',
] as const;

const StatusSchema = z.object({
  status: z.enum(VALID_STATUSES, { errorMap: () => ({ message: 'Ungültiger Status.' }) }),
});

const OrderQuerySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(500).default(50),
  status: z.enum(VALID_STATUSES).optional(),
  search: z.string().trim().max(100).optional(),
});

// GET /api/admin/orders — alle Bestellungen (paginated)
router.get('/', validate(OrderQuerySchema, 'query'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = req.query as unknown as z.infer<typeof OrderQuerySchema>;
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at, user_id, payment_method', { count: 'exact' })
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

const ReturnQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

// GET /api/admin/orders/return-requests — alle Rücksendeanträge
router.get('/return-requests', validate(ReturnQuerySchema, 'query'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = req.query as unknown as z.infer<typeof ReturnQuerySchema>;
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('return_requests')
      .select('*, orders(order_number, total, user_id, payment_method)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw error;
    res.json({ data: data ?? [], total: count ?? 0, page, limit });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/return-requests/:id — Status + Label aktualisieren
router.patch('/return-requests/:id', validate(UUIDParam, 'params'), validate(ReturnStatusSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, label_url, admin_note } = req.body as z.infer<typeof ReturnStatusSchema>;

    // Antrag mit Order-Daten laden (für Stripe + Email)
    const { data: returnReq, error: rrErr } = await supabase
      .from('return_requests')
      .select('*, orders(order_number, total, user_id, stripe_payment_intent_id, order_items(product_id, quantity))')
      .eq('id', req.params.id)
      .single();

    if (rrErr || !returnReq) { res.status(404).json({ error: 'Antrag nicht gefunden.' }); return; }

    const rr   = returnReq as Record<string, unknown>;
    const order = rr.orders as Record<string, unknown> | null;

    // ── Refund-Logik wenn Status → "refunded" ──────────────────────────────
    if (status === 'refunded' && order?.stripe_payment_intent_id) {
      const paymentIntentId = order.stripe_payment_intent_id as string;
      const orderTotal      = parseFloat(String(order.total ?? '0'));

      // Rückerstattungsbetrag berechnen
      const returnItems = rr.return_items as Array<{ productId: string; quantity: number; price: string }> | null;
      let refundAmountCents: number;

      if (returnItems && returnItems.length > 0) {
        // Teilrückerstattung: Summe der zurückgeschickten Artikel
        const itemsTotal = returnItems.reduce(
          (sum, item) => sum + parseFloat(item.price) * item.quantity,
          0
        );
        refundAmountCents = Math.round(itemsTotal * 100);
      } else {
        // Vollrückerstattung
        refundAmountCents = Math.round(orderTotal * 100);
      }

      // Stripe-Erstattung auslösen (non-blocking, Fehler werden geloggt)
      try {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount:         refundAmountCents,
        });

        // Bestellstatus auf "refunded" setzen (nur bei Vollerstattung)
        const allItemsReturned = !returnItems || returnItems.length === 0 ||
          (order.order_items as Array<unknown>).length === returnItems.length;
        if (allItemsReturned) {
          await supabase
            .from('orders')
            .update({ status: 'refunded', updated_at: new Date().toISOString() })
            .eq('id', String(rr.order_id));
        }

        // Lagerbestand für zurückgeschickte Artikel zurückbuchen (non-blocking)
        const itemsToRestore = returnItems ?? (order.order_items as Array<{ product_id: string; quantity: number }>);
        void (async () => {
          for (const item of itemsToRestore) {
            const pid = (item as Record<string, unknown>).productId ?? (item as Record<string, unknown>).product_id;
            if (!pid) continue;
            const { data: prod } = await supabase.from('products').select('stock').eq('id', pid as string).single();
            if (prod) {
              await supabase.from('products')
                .update({ stock: (prod.stock as number) + item.quantity })
                .eq('id', pid as string);
            }
          }
        })().catch(e => console.error('Stock-Rückbuchung nach Refund fehlgeschlagen:', e));

      } catch (stripeErr) {
        console.error('Stripe-Refund fehlgeschlagen:', stripeErr);
        res.status(502).json({ error: 'Stripe-Erstattung fehlgeschlagen. Bitte manuell im Stripe-Dashboard erstatten.' });
        return;
      }
    }

    // Antrag aktualisieren
    const { data: updated, error: upErr } = await supabase
      .from('return_requests')
      .update({ status, label_url: label_url ?? null, admin_note: admin_note ?? null, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (upErr) throw upErr;
    if (!updated) { res.status(404).json({ error: 'Antrag nicht gefunden.' }); return; }

    // ── Benachrichtigungen + automatisches Ticket ──────────────────────────
    const userId  = order?.user_id ? String(order.user_id) : null;
    const orderNr = String(order?.order_number ?? '');

    const notifyStatuses = ['approved', 'rejected', 'label_sent', 'refunded'] as const;
    type NotifyStatus = typeof notifyStatuses[number];
    const shouldNotify = (notifyStatuses as readonly string[]).includes(status) &&
      (status !== 'label_sent' || !!label_url);

    if (shouldNotify && userId) {
      void (async () => {
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(userId);
          const email = authData?.user?.email ?? null;

          type Notification = { subject: string; text: string; html: string };
          const n: Notification | null = (() => {
            const s = status as NotifyStatus;
            if (s === 'approved') return {
              subject: `Rücksendung für Bestellung ${orderNr} genehmigt`,
              text:    `Deine Rücksendeanfrage für Bestellung ${orderNr} wurde genehmigt. Wir schicken dir in Kürze ein Rücksendeetikett per E-Mail.`,
              html:    `<p>Hallo,<br><br>deine Rücksendeanfrage für Bestellung <strong>${orderNr}</strong> wurde <strong>genehmigt</strong>.<br><br>Du erhältst in Kürze ein kostenloses Rücksendeetikett per E-Mail. Klebe es auf das Paket und gib es in einer Postfiliale ab.</p>`,
            };
            if (s === 'rejected') return {
              subject: `Rücksendung für Bestellung ${orderNr} abgelehnt`,
              text:    `Deine Rücksendeanfrage für Bestellung ${orderNr} wurde leider abgelehnt.${admin_note ? ` Begründung: ${admin_note}` : ''}`,
              html:    `<p>Hallo,<br><br>leider konnten wir deine Rücksendeanfrage für Bestellung <strong>${orderNr}</strong> nicht genehmigen.<br><br>${admin_note ? `Begründung: ${admin_note}<br><br>` : ''}Bei Fragen wende dich bitte an unseren Support.</p>`,
            };
            if (s === 'label_sent') return {
              subject: `Rücksendeetikett für Bestellung ${orderNr}`,
              text:    `Dein Rücksendeetikett für Bestellung ${orderNr} ist fertig: ${label_url}`,
              html:    `<p>Hallo,<br><br>dein Rücksendeetikett für Bestellung <strong>${orderNr}</strong> ist fertig.<br><br><a href="${label_url ?? ''}">Etikett herunterladen →</a><br><br>Klebe das Etikett auf das Paket und gib es in einer Postfiliale ab. Nach Eingang des Pakets bearbeiten wir deine Rückerstattung.</p>`,
            };
            if (s === 'refunded') return {
              subject: `Rückerstattung für Bestellung ${orderNr} bestätigt`,
              text:    `Deine Rückerstattung für Bestellung ${orderNr} wurde veranlasst. Der Betrag wird in 3–5 Werktagen gutgeschrieben.`,
              html:    `<p>Hallo,<br><br>deine Rückerstattung für Bestellung <strong>${orderNr}</strong> wurde veranlasst.<br><br>Der Betrag wird in 3–5 Werktagen auf deinem ursprünglichen Zahlungsmittel gutgeschrieben.<br><br>Bei Fragen melde dich jederzeit bei uns.</p>`,
            };
            return null;
          })();

          if (!n) return;

          // 1. Automatisches geschlossenes Ticket als Nachweis im User-Account
          const { data: ticket } = await supabase
            .from('tickets')
            .insert({
              user_id:  userId,
              subject:  n.subject,
              message:  n.text,
              category: 'order',
              status:   'closed',
              reply:    n.text,
              replied_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (ticket?.id) {
            await supabase
              .from('ticket_messages')
              .insert({ ticket_id: ticket.id, sender: 'admin', text: n.text });
          }

          // 2. E-Mail zusätzlich versenden
          if (email) {
            void sendMail({ to: email, subject: n.subject, html: n.html })
              .catch(e => console.error('Return-Status-Mail fehlgeschlagen:', e));
          }
        } catch (e) {
          console.error('Return-Benachrichtigung fehlgeschlagen:', e);
        }
      })();
    }

    res.json(updated);
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

    // "refunded" darf nie manuell gesetzt werden — nur über den Stripe-Refund-Endpoint
    if (status === 'refunded') {
      res.status(403).json({ error: 'Status "Erstattet" kann nur über die Rückerstattungsfunktion gesetzt werden.' });
      return;
    }

    // Nur Owner darf Bestellungen ohne Stripe-Zahlung manuell auf "paid" setzen
    if (status === 'paid' && req.adminRole !== 'owner') {
      const { data: orderCheck } = await supabase
        .from('orders')
        .select('stripe_payment_intent_id')
        .eq('id', req.params.id)
        .single();
      if (!orderCheck?.stripe_payment_intent_id) {
        res.status(403).json({ error: 'Nur der Inhaber kann Bestellungen ohne Stripe-Zahlung als bezahlt markieren.' });
        return;
      }
    }

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
router.get('/:id/invoice', requireAdmin, validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

// POST /api/admin/orders/:id/refund — Vier-Augen-Prinzip für Rückerstattungen
// Schwellen-Konstanten
const MOD_LIMIT       = 50;    // mod darf direkt bis 50 € erstatten
const TEAM_LEAD_LIMIT = 500;   // team_lead darf direkt bis 500 € erstatten
const OWNER_THRESHOLD = 2000;  // ab hier nur Owner genehmigungsberechtigt

router.post('/:id/refund', requireAdmin, validate(UUIDParam, 'params'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const orderTotal  = parseFloat(String(order.total ?? '0'));
    const role        = req.adminRole!;
    const requesterId = req.adminUserId;

    // ── Direkte Ausführung prüfen ──────────────────────────────────────────────
    const canExecuteDirectly =
      role === 'owner' ||
      (role === 'team_lead' && orderTotal <= TEAM_LEAD_LIMIT) ||
      (role === 'mod'       && orderTotal <= MOD_LIMIT);

    if (canExecuteDirectly) {
      // Stripe-Erstattung direkt auslösen
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

      // Lagerbestand zurückbuchen (non-blocking)
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
      return;
    }

    // ── Antrag erstellen (Vier-Augen-Prinzip) ─────────────────────────────────
    // Prüfen ob bereits ein offener Antrag existiert
    const { data: existingRequest } = await supabase
      .from('refund_requests')
      .select('id')
      .eq('order_id', req.params.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      res.status(409).json({ error: 'Für diese Bestellung existiert bereits ein offener Erstattungsantrag.' });
      return;
    }

    // Bestimme wer genehmigen darf
    const requiredApproverRole = orderTotal >= OWNER_THRESHOLD ? 'owner' : 'team_lead_or_owner';

    const { data: newRequest, error: reqErr } = await supabase
      .from('refund_requests')
      .insert({
        order_id:           req.params.id,
        order_number:       order.order_number as string,
        amount:             orderTotal,
        requested_by:       requesterId ?? null,
        requested_by_role:  role,
        status:             'pending',
        required_approver:  requiredApproverRole,
        created_at:         new Date().toISOString(),
        updated_at:         new Date().toISOString(),
      })
      .select('id')
      .single();

    if (reqErr || !newRequest) {
      throw reqErr ?? new Error('Erstattungsantrag konnte nicht erstellt werden.');
    }

    // Admin-Notification
    const approverHint = orderTotal >= OWNER_THRESHOLD
      ? 'Nur der Inhaber kann diesen Antrag genehmigen.'
      : 'Team-Lead oder Inhaber muss genehmigen.';
    void createNotification(
      'refund_request',
      `Erstattungsantrag: Bestellung ${order.order_number as string}`,
      `${role} beantragt Rückerstattung über € ${orderTotal.toFixed(2)}. ${approverHint}`,
      `/admin/refund-requests/${newRequest.id as string}`,
    ).catch(e => console.error('Refund-Request-Notification fehlgeschlagen:', e));

    res.status(200).json({ pending: true, requestId: newRequest.id });
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

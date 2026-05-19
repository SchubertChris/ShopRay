import { z } from 'zod';
import { Router, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { supabase } from '../lib/supabase';
import { stripe }   from '../lib/stripe';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { checkoutRateLimit } from '../middleware/security';
import { validate, UUIDParam } from '../lib/validate';

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────
const PAYMENT_METHOD_MAP: Record<string, Stripe.Checkout.SessionCreateParams.PaymentMethodType[]> = {
  card:           ['card'],
  paypal:         ['paypal'],
  klarna:         ['klarna'],
  'bank-transfer': ['sepa_debit'],
};

const CheckoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid('Ungültige Produkt-ID'),
      quantity:  z.number().int('Menge muss eine ganze Zahl sein').min(1, 'Mindestmenge: 1').max(100, 'Maximalmenge: 100'),
    }),
  ).min(1, 'Mindestens ein Artikel erforderlich').max(50, 'Maximal 50 verschiedene Artikel'),
  shippingAddress: z.object({
    firstName: z.string().trim().max(100).optional(),
    lastName:  z.string().trim().max(100).optional(),
    street:    z.string().trim().max(200).optional(),
    zip:       z.string().trim().max(10).optional(),
    city:      z.string().trim().max(100).optional(),
    country:   z.string().trim().max(100).optional(),
  }).optional(),
  paymentMethod: z.string().optional(),
  guestEmail: z.string().trim().email('Ungültige E-Mail-Adresse').optional(),
});

type CheckoutBody = z.infer<typeof CheckoutSchema> & { guestEmail?: string };

// GET /api/orders — eigene Bestellungen
router.get('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id — einzelne Bestellung (nur eigene)
router.get('/:id', requireAuth, validate(UUIDParam, 'params'), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Bestellung nicht gefunden' });
      return;
    }

    // Rücksendungsantrag für diese Bestellung mitliefern (falls vorhanden)
    const { data: returnReq } = await supabase
      .from('return_requests')
      .select('id, status, label_url, created_at')
      .eq('order_id', req.params.id)
      .maybeSingle();

    res.json({ ...data, return_request: returnReq ?? null });
  } catch (err) {
    next(err);
  }
});

const ReturnReasonSchema = z.object({
  reason: z.string().trim().min(5, 'Bitte gib einen Grund an (min. 5 Zeichen).').max(1000),
});

// POST /api/orders/:id/cancel — Bestellung stornieren (nur pending/paid)
router.post('/:id/cancel', requireAuth, validate(UUIDParam, 'params'), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('id, status, stripe_payment_intent_id, order_items(product_id, quantity)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single();

    if (oErr || !order) { res.status(404).json({ error: 'Bestellung nicht gefunden.' }); return; }

    if (!['pending', 'paid'].includes(order.status as string)) {
      res.status(409).json({ error: 'Diese Bestellung kann nicht mehr storniert werden. Bitte nutze die Rücksendeoption.' });
      return;
    }

    // Stripe-Erstattung wenn bereits bezahlt
    if (order.status === 'paid' && order.stripe_payment_intent_id) {
      await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id as string });
    }

    await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
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

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/return — Rücksendung beantragen (nur delivered, max. 30 Tage)
router.post('/:id/return', requireAuth, validate(UUIDParam, 'params'), validate(ReturnReasonSchema), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason } = req.body as z.infer<typeof ReturnReasonSchema>;

    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('id, status, created_at, user_id')
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single();

    if (oErr || !order) { res.status(404).json({ error: 'Bestellung nicht gefunden.' }); return; }

    if (order.status !== 'delivered') {
      res.status(409).json({ error: 'Rücksendungen sind nur für gelieferte Bestellungen möglich.' });
      return;
    }

    // 30-Tage-Rückgabefenster
    const daysSince = (Date.now() - new Date(order.created_at as string).getTime()) / 86_400_000;
    if (daysSince > 30) {
      res.status(409).json({ error: 'Das Rückgabefenster (30 Tage nach Kauf) ist abgelaufen.' });
      return;
    }

    // Doppel-Antrag verhindern
    const { data: existing } = await supabase
      .from('return_requests')
      .select('id')
      .eq('order_id', req.params.id)
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: 'Für diese Bestellung wurde bereits eine Rücksendung beantragt.' });
      return;
    }

    const { data: returnReq, error: rErr } = await supabase
      .from('return_requests')
      .insert({ order_id: req.params.id, user_id: req.userId, reason })
      .select('id, status, created_at')
      .single();

    if (rErr || !returnReq) throw rErr;
    res.status(201).json({ ok: true, returnRequest: returnReq });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/checkout — Stripe Checkout Session (Auth optional für Gastbestellungen)
router.post('/checkout', optionalAuth, checkoutRateLimit, validate(CheckoutSchema), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, shippingAddress, paymentMethod, guestEmail } = req.body as CheckoutBody;

    // Gäste müssen eine E-Mail angeben
    if (!req.userId && !guestEmail) {
      res.status(400).json({ error: 'Für Gastbestellungen ist eine E-Mail-Adresse erforderlich.' });
      return;
    }

    // Preise IMMER aus der Datenbank — Client-Preise werden ignoriert
    const productIds = [...new Set(items.map(i => i.productId))];
    const { data: dbProducts, error: dbErr } = await supabase
      .from('products')
      .select('id, name, price, image_url, tax_rate, stock')
      .in('id', productIds)
      .eq('active', true);

    if (dbErr || !dbProducts?.length) {
      res.status(400).json({ error: 'Produkte nicht gefunden oder nicht verfügbar.' });
      return;
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        res.status(400).json({ error: `Produkt ${item.productId} nicht gefunden.` });
        return;
      }
      if ((product.stock as number) < item.quantity) {
        res.status(409).json({
          error: `"${product.name as string}" ist nicht mehr ausreichend auf Lager.`,
          code:  'OUT_OF_STOCK',
        });
        return;
      }
    }

    const lineItems = items.map(item => {
      const product = productMap.get(item.productId)!;
      return {
        product,
        quantity:        item.quantity,
        unitAmountCents: Math.round(Number(product.price) * 100),
      };
    });

    const orderNumber = `#${Date.now().toString().slice(-6)}`;

    const addressWithEmail = shippingAddress
      ? { ...shippingAddress, ...(guestEmail ? { email: guestEmail } : {}) }
      : (guestEmail ? { email: guestEmail } : null);

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id:          req.userId ?? null,
        order_number:     orderNumber,
        status:           'pending',
        total:            (lineItems.reduce((s, i) => s + i.unitAmountCents * i.quantity, 0) / 100).toFixed(2),
        shipping_address: addressWithEmail,
        payment_method:   paymentMethod ?? 'card',
      })
      .select()
      .single();

    if (orderErr || !order) throw orderErr ?? new Error('Order konnte nicht erstellt werden');

    await supabase.from('order_items').insert(
      lineItems.map(({ product, quantity, unitAmountCents }) => ({
        order_id:     order.id,
        product_id:   product.id,
        product_name: product.name,
        quantity,
        price:        (unitAmountCents / 100).toFixed(2),
        image_url:    product.image_url ?? null,
      })),
    );

    const stripePaymentMethods = PAYMENT_METHOD_MAP[paymentMethod ?? 'card'] ?? ['card'];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: stripePaymentMethods,
      mode:                 'payment',
      ...(guestEmail ? { customer_email: guestEmail } : {}),
      line_items: lineItems.map(({ product, quantity, unitAmountCents }) => ({
        price_data: {
          currency:     'eur',
          product_data: { name: product.name, images: product.image_url ? [product.image_url] : [] },
          unit_amount:  unitAmountCents,
        },
        quantity,
      })),
      metadata:    { orderId: order.id },
      success_url: `${process.env.CLIENT_URL}/order-success?order=${order.id}`,
      cancel_url:  `${process.env.CLIENT_URL}/cart`,
    });

    await supabase.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    res.json({ checkoutUrl: session.url });
  } catch (err) {
    next(err);
  }
});

export default router;

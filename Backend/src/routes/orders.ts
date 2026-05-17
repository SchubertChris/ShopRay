import { z } from 'zod';
import { Router, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { supabase } from '../lib/supabase';
import { stripe }   from '../lib/stripe';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { checkoutRateLimit } from '../middleware/security';
import { validate, UUIDParam } from '../lib/validate';

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────
const PAYMENT_METHOD_MAP: Record<string, Stripe.Checkout.SessionCreateParams.PaymentMethodType[]> = {
  card:           ['card'],
  paypal:         ['paypal'],
  klarna:         ['klarna'],
  'bank-transfer': ['sofort'],
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
});

type CheckoutBody = z.infer<typeof CheckoutSchema>;

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
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/checkout — Stripe Checkout Session
router.post('/checkout', requireAuth, checkoutRateLimit, validate(CheckoutSchema), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body as CheckoutBody;

    // Preise IMMER aus der Datenbank — Client-Preise werden ignoriert
    const productIds = [...new Set(items.map(i => i.productId))];
    const { data: dbProducts, error: dbErr } = await supabase
      .from('products')
      .select('id, name, price, image_url, tax_rate')
      .in('id', productIds)
      .eq('active', true);

    if (dbErr || !dbProducts?.length) {
      res.status(400).json({ error: 'Produkte nicht gefunden oder nicht verfügbar.' });
      return;
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    for (const item of items) {
      if (!productMap.has(item.productId)) {
        res.status(400).json({ error: `Produkt ${item.productId} nicht gefunden.` });
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

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id:          req.userId,
        order_number:     orderNumber,
        status:           'pending',
        total:            (lineItems.reduce((s, i) => s + i.unitAmountCents * i.quantity, 0) / 100).toFixed(2),
        shipping_address: shippingAddress ?? null,
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
      })),
    );

    const stripePaymentMethods = PAYMENT_METHOD_MAP[paymentMethod ?? 'card'] ?? ['card'];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: stripePaymentMethods,
      mode:                 'payment',
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

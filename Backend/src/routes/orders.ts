import { Router, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { stripe }  from '../lib/stripe';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/orders — eigene Bestellungen (Auth required)
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

// GET /api/orders/:id — eine Bestellung (Auth required, nur eigene)
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

// POST /api/orders/checkout — Stripe Checkout Session erstellen
router.post('/checkout', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, shippingAddress } = req.body as {
      items: Array<{ productId: string; name: string; price: number; quantity: number; imageUrl?: string }>;
      shippingAddress?: Record<string, string>;
    };

    if (!items?.length) {
      res.status(400).json({ error: 'Keine Artikel übergeben' });
      return;
    }

    // Order in DB anlegen (Status: pending)
    const orderNumber = `#${Date.now().toString().slice(-6)}`;
    const total       = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id:          req.userId,
        order_number:     orderNumber,
        status:           'pending',
        total:            (total / 100).toFixed(2),
        shipping_address: shippingAddress ?? null,
      })
      .select()
      .single();

    if (orderErr || !order) throw orderErr ?? new Error('Order konnte nicht erstellt werden');

    // Order-Items speichern
    await supabase.from('order_items').insert(
      items.map(i => ({
        order_id:     order.id,
        product_id:   i.productId,
        product_name: i.name,
        quantity:     i.quantity,
        price:        (i.price / 100).toFixed(2),
      })),
    );

    // Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode:                 'payment',
      line_items: items.map(i => ({
        price_data: {
          currency:     'eur',
          product_data: {
            name:   i.name,
            images: i.imageUrl ? [i.imageUrl] : [],
          },
          unit_amount: i.price, // in Cent
        },
        quantity: i.quantity,
      })),
      metadata:    { orderId: order.id },
      success_url: `${process.env.CLIENT_URL}/bestellung-erfolgreich?order=${order.id}`,
      cancel_url:  `${process.env.CLIENT_URL}/warenkorb`,
    });

    // Stripe Session-ID in Order speichern
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    next(err);
  }
});

export default router;

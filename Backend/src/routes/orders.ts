import { Router, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { stripe }  from '../lib/stripe';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { checkoutRateLimit } from '../middleware/security';

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
router.post('/checkout', requireAuth, checkoutRateLimit, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, shippingAddress } = req.body as {
      items: Array<{ productId: string; quantity: number }>;
      shippingAddress?: Record<string, string>;
    };

    if (!items?.length) {
      res.status(400).json({ error: 'Keine Artikel übergeben' });
      return;
    }

    // Mengen validieren
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        res.status(400).json({ error: 'Ungültige Produkt-ID' });
        return;
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        res.status(400).json({ error: 'Ungültige Menge' });
        return;
      }
    }

    // Preise IMMER aus der Datenbank laden — niemals vom Client übernehmen
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

    // Sicherstellen, dass alle angeforderten Produkte in der DB sind
    for (const item of items) {
      if (!productMap.has(item.productId)) {
        res.status(400).json({ error: `Produkt ${item.productId} nicht gefunden.` });
        return;
      }
    }

    // Gesamtsumme aus DB-Preisen berechnen (in Cent für Stripe)
    const lineItems = items.map(item => {
      const product = productMap.get(item.productId)!;
      return {
        product,
        quantity: item.quantity,
        unitAmountCents: Math.round(Number(product.price) * 100),
      };
    });

    const totalCents = lineItems.reduce((sum, i) => sum + i.unitAmountCents * i.quantity, 0);

    // Order in DB anlegen (Status: pending)
    const orderNumber = `#${Date.now().toString().slice(-6)}`;

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id:          req.userId,
        order_number:     orderNumber,
        status:           'pending',
        total:            (totalCents / 100).toFixed(2),
        shipping_address: shippingAddress ?? null,
      })
      .select()
      .single();

    if (orderErr || !order) throw orderErr ?? new Error('Order konnte nicht erstellt werden');

    // Order-Items speichern
    await supabase.from('order_items').insert(
      lineItems.map(({ product, quantity, unitAmountCents }) => ({
        order_id:     order.id,
        product_id:   product.id,
        product_name: product.name,
        quantity,
        price:        (unitAmountCents / 100).toFixed(2),
      })),
    );

    // Stripe Checkout Session — Preise aus DB
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode:                 'payment',
      line_items: lineItems.map(({ product, quantity, unitAmountCents }) => ({
        price_data: {
          currency:     'eur',
          product_data: {
            name:   product.name,
            images: product.image_url ? [product.image_url] : [],
          },
          unit_amount: unitAmountCents,
        },
        quantity,
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

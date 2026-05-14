import { Router, Request, Response, NextFunction } from 'express';
import { stripe }   from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { sendMail, orderConfirmationHtml } from '../lib/mailer';
import Stripe from 'stripe';

const router = Router();

// POST /api/webhook/stripe
// express.raw() ist in index.ts für diese Route registriert
router.post('/stripe', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    res.status(400).json({ error: 'Webhook-Signatur fehlt' });
    return;
  }

  let event: Stripe.Event;

  try {
    // Signatur-Verifikation verhindert gefälschte Webhook-Calls
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, secret);
  } catch (err) {
    console.error('Webhook Signatur ungültig:', err);
    res.status(400).json({ error: 'Ungültige Webhook-Signatur' });
    return;
  }

  try {
    switch (event.type) {

      // Zahlung erfolgreich
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        const { data: order, error } = await supabase
          .from('orders')
          .update({
            status:            'paid',
            stripe_session_id: session.id,
            paid_at:           new Date().toISOString(),
          })
          .eq('id', orderId)
          .select('*, order_items(*), profiles(name, email)')
          .single();

        if (error || !order) { console.error('Order-Update fehlgeschlagen:', error); break; }

        const customerEmail = session.customer_details?.email ?? order.profiles?.email;
        const customerName  = session.customer_details?.name  ?? order.profiles?.name ?? 'Kunde';

        if (customerEmail) {
          await sendMail({
            to:      customerEmail,
            subject: `Bestellbestätigung ${order.order_number}`,
            html:    orderConfirmationHtml({
              customerName,
              orderNumber: order.order_number,
              total:       order.total,
              items: order.order_items.map((i: { product_name: string; quantity: number; price: string }) => ({
                name: i.product_name, qty: i.quantity, price: i.price,
              })),
            }),
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent  = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (!orderId) break;
        await supabase.from('orders').update({ status: 'payment_failed' }).eq('id', orderId);
        break;
      }

      case 'charge.refunded': {
        const charge  = event.data.object as Stripe.Charge;
        const orderId = charge.metadata?.orderId;
        if (!orderId) break;
        await supabase.from('orders').update({ status: 'refunded' }).eq('id', orderId);
        break;
      }

      default:
        break;
    }

    res.json({ received: true });

  } catch (err) {
    next(err);
  }
});

export default router;

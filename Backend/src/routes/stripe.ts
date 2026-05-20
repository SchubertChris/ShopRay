import { Router, Request, Response, NextFunction } from 'express';
import { stripe }   from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { sendMail, sendMailWithAttachment, orderConfirmationHtml } from '../lib/mailer';
import { generateInvoicePdf } from '../lib/invoice-pdf';
import { sendPushToAll } from './admin-push';
import Stripe from 'stripe';

const router = Router();

async function generateInvoiceAndSend(orderId: string, customerEmail: string): Promise<void> {
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();

  if (!order) return;

  const prefix = process.env.INVOICE_PREFIX ?? 'RE';
  const year   = new Date().getFullYear();
  const count  = await supabase.from('orders').select('id', { count: 'exact', head: true }).not('invoice_number', 'is', null);
  const seq    = (count.count ?? 0) + 1;
  const invoiceNumber = `${prefix}-${year}-${String(seq).padStart(5, '0')}`;

  await supabase.from('orders').update({ invoice_number: invoiceNumber }).eq('id', orderId);

  const items = (order.order_items as Array<{ product_name: string; quantity: number; price: number }>) ?? [];
  const subtotal = items.reduce((s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0);
  const shipping = Math.max(0, (order.total as number) - subtotal);

  const shop = {
    name:      process.env.SHOP_NAME       ?? 'Mein Shop',
    street:    process.env.SHOP_STREET     ?? 'Musterstraße 1',
    zip:       process.env.SHOP_ZIP        ?? '12345',
    city:      process.env.SHOP_CITY       ?? 'Musterstadt',
    country:   process.env.SHOP_COUNTRY    ?? 'Deutschland',
    email:     process.env.SHOP_EMAIL      ?? process.env.SMTP_FROM_EMAIL ?? '',
    phone:     process.env.SHOP_PHONE,
    vatId:     process.env.SHOP_VAT_ID,
    taxNumber: process.env.SHOP_TAX_NUMBER,
  };

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber,
    orderNumber:  order.order_number as string,
    invoiceDate:  new Date().toISOString(),
    deliveryDate: (order.paid_at as string | null) ?? (order.created_at as string),
    paidAt:       order.paid_at as string | null,
    paymentMethod: order.payment_method as string | null,
    items:        items.map((i: { product_name: string; quantity: number; price: number }) => ({
      name: i.product_name, quantity: i.quantity, price: i.price,
    })),
    total:    order.total as number,
    shipping,
    address:  order.shipping_address as { firstName?: string; lastName?: string; street?: string; zip?: string; city?: string; country?: string } | null,
    shop,
  });

  await sendMailWithAttachment({
    to:       customerEmail,
    subject:  `Rechnung ${invoiceNumber} — ${order.order_number as string}`,
    html:     `<p>Hallo,<br><br>anbei deine Rechnung für Bestellung <strong>${order.order_number as string}</strong>. Danke für deinen Einkauf!</p>`,
    filename: `Rechnung_${invoiceNumber}.pdf`,
    content:  pdfBuffer,
  });
}

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
            status:                    'paid',
            stripe_session_id:         session.id,
            stripe_payment_intent_id:  typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null,
            paid_at:                   new Date().toISOString(),
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

        // Lagerbestand abziehen: SKU-Stock wenn Variante, sonst Produkt-Stock (non-blocking)
        const orderItems = order.order_items as Array<{ product_id: string; quantity: number; sku_id?: string | null }>;
        void (async () => {
          for (const item of orderItems) {
            if (item.sku_id) {
              const { data: sku } = await supabase
                .from('product_skus')
                .select('stock')
                .eq('id', item.sku_id)
                .single();
              if (sku) {
                await supabase
                  .from('product_skus')
                  .update({ stock: Math.max(0, (sku.stock as number) - item.quantity) })
                  .eq('id', item.sku_id);
              }
            } else {
              const { data: prod } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.product_id)
                .single();
              if (prod) {
                await supabase
                  .from('products')
                  .update({ stock: Math.max(0, (prod.stock as number) - item.quantity) })
                  .eq('id', item.product_id);
              }
            }
          }
        })().catch(e => console.error('Stock-Update fehlgeschlagen:', e));

        // Gutschein-Verwendungszähler hochsetzen (non-blocking)
        const usedCode = session.metadata?.discountCode;
        if (usedCode) {
          void (async () => {
            const { data: dc } = await supabase
              .from('discount_codes')
              .select('id, uses')
              .filter('code', 'ilike', usedCode)
              .single();
            if (dc) {
              await supabase
                .from('discount_codes')
                .update({ uses: (dc.uses as number) + 1 })
                .eq('id', dc.id);
            }
          })().catch(e => console.error('Discount uses update fehlgeschlagen:', e));
        }

        // Push-Benachrichtigung an alle Admin-Geräte (non-blocking)
        sendPushToAll({
          title: `Neue Bestellung ${order.order_number}`,
          body:  `${customerName} — € ${Number(order.total).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`,
          url:   `/orders/${order.id}`,
        }).catch(err => console.error('Push fehlgeschlagen:', err));

        // Rechnung generieren und per E-Mail versenden (non-blocking)
        if (customerEmail) {
          generateInvoiceAndSend(order.id as string, customerEmail).catch(e =>
            console.error('Rechnung-Generierung fehlgeschlagen:', e)
          );
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

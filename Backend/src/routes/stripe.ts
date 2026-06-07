import { Router, Request, Response, NextFunction } from 'express';
import { stripe }   from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { sendMail, sendMailWithAttachment, orderConfirmationHtml } from '../lib/mailer';
import { generateInvoicePdf } from '../lib/invoice-pdf';
import { sendPushToAll } from './admin-push';
import { createNotification } from '../lib/notify';
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
  const { data: invoiceData, error: invoiceError } = await supabase.rpc('next_invoice_number', { p_prefix: prefix, p_year: year });
  if (invoiceError || !invoiceData) throw new Error('Rechnungsnummer konnte nicht generiert werden');
  const invoiceNumber = invoiceData as string;

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

        // Idempotenz: Stripe liefert Events mind. einmal — doppelte Verarbeitung verhindern
        const { data: idempotencyCheck } = await supabase.from('orders').select('status').eq('id', orderId).single();
        if (idempotencyCheck?.status === 'paid') break;

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

        // ── Lagerbestand ATOMAR abziehen + Reservierung freigeben ───────────
        // decrement_stock = einzelnes UPDATE-Statement, kein Read-Then-Write.
        // Fehler → Admin-Notification statt stiller console.error.
        const orderItems = order.order_items as Array<{ product_id: string; quantity: number; sku_id?: string | null }>;
        void (async () => {
          try {
            for (const item of orderItems) {
              const { error: rpcErr } = await supabase.rpc('decrement_stock', {
                p_product_id: item.product_id,
                p_quantity:   item.quantity,
                ...(item.sku_id ? { p_sku_id: item.sku_id } : {}),
              });
              if (rpcErr) throw new Error(`decrement_stock Fehler (${item.product_id}): ${rpcErr.message}`);
            }

            // Reservierung freigeben (idempotent — kein Fehler wenn bereits weg)
            await supabase.rpc('release_reservation', { p_stripe_session_id: session.id });

            // Low-Stock-Warnung wenn Lagerbestand ≤ 5 (non-blocking, kein throw)
            for (const item of orderItems) {
              void (async () => {
                try {
                  if (item.sku_id) {
                    const { data: sku } = await supabase
                      .from('product_skus')
                      .select('stock, product_id')
                      .eq('id', item.sku_id)
                      .single();
                    if (sku && (sku.stock as number) <= 5) {
                      await createNotification(
                        'low_stock',
                        'Niedriger Lagerbestand',
                        `SKU ${item.sku_id} — noch ${sku.stock as number} Stück`,
                        `/products/${item.product_id}`,
                      );
                    }
                  } else {
                    const { data: prod } = await supabase
                      .from('products')
                      .select('stock, name')
                      .eq('id', item.product_id)
                      .single();
                    if (prod && (prod.stock as number) <= 5) {
                      await createNotification(
                        'low_stock',
                        'Niedriger Lagerbestand',
                        `${prod.name as string} — noch ${prod.stock as number} Stück`,
                        `/products/${item.product_id}`,
                      );
                    }
                  }
                } catch { /* Low-Stock-Check ist non-critical — ignorieren */ }
              })();
            }

          } catch (e) {
            console.error('[stripe.webhook] Stock-Update fehlgeschlagen:', e);
            // Admin wird benachrichtigt — kein stiller Fehler mehr
            void createNotification(
              'payment_failed',
              'Lagerbestand-Update fehlgeschlagen',
              `Bestellung ${order.order_number as string} — Lagerbestand bitte manuell prüfen`,
              `/orders`,
            );
          }
        })();

        // Push-Benachrichtigung an alle Admin-Geräte (non-blocking)
        sendPushToAll({
          title: `Neue Bestellung ${order.order_number}`,
          body:  `${customerName} — € ${Number(order.total).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`,
          url:   `/orders/${order.id}`,
        }).catch(err => console.error('Push fehlgeschlagen:', err));

        void createNotification(
          'new_order',
          `Neue Bestellung eingegangen`,
          `${session.customer_email ?? 'Gast'} — ${((session.amount_total ?? 0) / 100).toFixed(2)} €`,
          `/orders`,
        );

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
        void createNotification(
          'payment_failed',
          'Zahlung fehlgeschlagen',
          `Betrag: ${((event.data.object as Stripe.PaymentIntent).amount / 100).toFixed(2)} €`,
        );
        break;
      }

      // ── Session abgelaufen → Reservierungen freigeben + Bestellung stornieren ──
      case 'checkout.session.expired': {
        const expiredSession = event.data.object as Stripe.Checkout.Session;

        // Lager-Reservierung freigeben (idempotent)
        try {
          await supabase.rpc('release_reservation', { p_stripe_session_id: expiredSession.id });
        } catch (e) {
          console.error('[stripe.webhook] release_reservation fehlgeschlagen:', e);
        }

        // Discount-Claim zurückgeben (nur wenn ein UUID-artiger discountCodeId im Metadata steht)
        const expiredDiscountCodeId = expiredSession.metadata?.discountCodeId;
        if (expiredDiscountCodeId && /^[0-9a-f-]{36}$/i.test(expiredDiscountCodeId)) {
          try {
            await supabase.rpc('release_discount_claim', { p_discount_id: expiredDiscountCodeId });
          } catch (e) {
            console.error('[stripe.webhook] release_discount_claim fehlgeschlagen:', e);
          }
        }

        // Zugehörige Bestellung auf 'cancelled' setzen (nur wenn noch pending)
        const expiredOrderId = expiredSession.metadata?.orderId;
        if (expiredOrderId) {
          try {
            await supabase
              .from('orders')
              .update({ status: 'cancelled' })
              .eq('id', expiredOrderId)
              .eq('status', 'pending');
          } catch (e) {
            console.error('[stripe.webhook] Order-Cancel fehlgeschlagen:', e);
          }
        }
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

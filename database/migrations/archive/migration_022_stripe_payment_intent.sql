-- Migration 022: stripe_payment_intent_id in orders speichern
-- Wird beim checkout.session.completed Webhook befüllt
-- Wird für automatische Stripe-Erstattungen benötigt

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Index für schnelles Nachschlagen bei Webhook-Events
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent
  ON orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

GRANT ALL ON orders TO service_role;

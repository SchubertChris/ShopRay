-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION 033 — Stock-Reservierungen + Atomarer Lagerbestand-Abzug        ║
-- ║  Problem gelöst:                                                            ║
-- ║  1. Race Condition: nicht-atomarer Read-Then-Write beim Abzug              ║
-- ║  2. Keine Reservierung: zwei Leute kaufen denselben letzten Artikel         ║
-- ║  3. Fire-and-Forget: stille Fehler ohne Admin-Benachrichtigung             ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── 1. Reservierungstabelle ────────────────────────────────────────────────────
-- Hält den Lagerbestand für aktive Stripe-Checkout-Sessions "fest".
-- Wird automatisch freigegeben wenn die Session bezahlt wird oder abläuft.

CREATE TABLE IF NOT EXISTS stock_reservations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text        NOT NULL,
  order_id          uuid        REFERENCES orders(id) ON DELETE CASCADE,
  product_id        uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku_id            uuid        REFERENCES product_skus(id) ON DELETE SET NULL,
  quantity          int         NOT NULL CHECK (quantity > 0),
  expires_at        timestamptz NOT NULL,
  created_at        timestamptz DEFAULT now()
);

-- Indizes für schnelle Suche nach Session-ID, Ablauf, Produkt + SKU
CREATE INDEX IF NOT EXISTS idx_stock_res_session ON stock_reservations(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_stock_res_expires  ON stock_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_stock_res_product  ON stock_reservations(product_id) WHERE sku_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_res_sku      ON stock_reservations(sku_id)      WHERE sku_id IS NOT NULL;

-- ── 2. Atomarer Lagerbestand-Abzug ────────────────────────────────────────────
-- Ein einziges UPDATE-Statement — kein Read-Then-Write, kein Race Condition.
-- GREATEST(0, ...) verhindert negative Werte (Edge Case: doppelter Webhook-Call).

CREATE OR REPLACE FUNCTION decrement_stock(
  p_product_id uuid,
  p_quantity   int,
  p_sku_id     uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_sku_id IS NOT NULL THEN
    UPDATE product_skus
    SET    stock = GREATEST(0, stock - p_quantity)
    WHERE  id    = p_sku_id;
  ELSE
    UPDATE products
    SET    stock = GREATEST(0, stock - p_quantity)
    WHERE  id    = p_product_id;
  END IF;
END;
$$;

-- ── 3. Reservierung anlegen (Batch) ───────────────────────────────────────────
-- Wird direkt nach Stripe-Session-Erstellung aufgerufen.
-- p_items Format: [{"product_id":"…","sku_id":"…"|"","quantity":1}, …]
-- Leerer String bei sku_id wird zu NULL normalisiert.

CREATE OR REPLACE FUNCTION reserve_stock(
  p_stripe_session_id text,
  p_order_id          uuid,
  p_items             jsonb,
  p_expires_at        timestamptz DEFAULT (now() + interval '2 hours')
)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO stock_reservations (
      stripe_session_id, order_id, product_id, sku_id, quantity, expires_at
    )
    VALUES (
      p_stripe_session_id,
      p_order_id,
      (item->>'product_id')::uuid,
      NULLIF(item->>'sku_id', '')::uuid,
      (item->>'quantity')::int,
      p_expires_at
    );
  END LOOP;
END;
$$;

-- ── 4. Reservierung freigeben ─────────────────────────────────────────────────
-- Wird aufgerufen bei: checkout.session.completed + checkout.session.expired.
-- Idempotent (DELETE ist immer sicher, auch wenn kein Eintrag existiert).

CREATE OR REPLACE FUNCTION release_reservation(p_stripe_session_id text)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM stock_reservations WHERE stripe_session_id = p_stripe_session_id;
END;
$$;

-- ── 5. Grants ─────────────────────────────────────────────────────────────────
GRANT ALL ON TABLE stock_reservations              TO service_role;
GRANT EXECUTE ON FUNCTION decrement_stock          TO service_role;
GRANT EXECUTE ON FUNCTION reserve_stock            TO service_role;
GRANT EXECUTE ON FUNCTION release_reservation      TO service_role;

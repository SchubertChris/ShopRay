-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION 034 — Atomare Discount-Reservierung (TOCTOU-Fix)                ║
-- ║  Problem gelöst:                                                            ║
-- ║  Zwei parallele Checkouts mit demselben max_uses=1 Code konnten beide       ║
-- ║  den Rabatt erhalten, weil die Prüfung (READ) und der Zähler (WRITE)        ║
-- ║  getrennte Operationen waren (Time-of-Check vs. Time-of-Use).              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── 1. Claim: Rabatt atomar reservieren ──────────────────────────────────────
-- Ein einzelnes UPDATE ... RETURNING — row-level lock verhindert Race Condition.
-- Gibt die Rabatt-Daten zurück oder NULL wenn der Code ungültig/erschöpft ist.

CREATE OR REPLACE FUNCTION claim_discount(
  p_code        text,
  p_order_total numeric
)
RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_id     uuid;
  v_type   text;
  v_value  numeric;
  v_amount numeric;
BEGIN
  UPDATE discount_codes
  SET    uses = uses + 1
  WHERE  lower(code) = lower(p_code)
    AND  active      = true
    AND  (expires_at IS NULL OR expires_at > now())
    AND  (max_uses   IS NULL OR uses < max_uses)
    AND  (min_order  IS NULL OR min_order <= p_order_total)
  RETURNING id, type, value INTO v_id, v_type, v_value;

  IF v_id IS NULL THEN RETURN NULL; END IF;

  IF v_type = 'percent' THEN
    v_amount := round(p_order_total * v_value / 100, 2);
  ELSE
    v_amount := least(v_value, p_order_total);
  END IF;

  RETURN jsonb_build_object(
    'id',     v_id,
    'type',   v_type,
    'value',  v_value,
    'amount', v_amount
  );
END;
$$;

-- ── 2. Release: Claim zurückgeben (Session abgelaufen / Fehler) ───────────────
-- Idempotent — GREATEST(0,...) verhindert negative Zähler.

CREATE OR REPLACE FUNCTION release_discount_claim(p_discount_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE discount_codes
  SET    uses = GREATEST(0, uses - 1)
  WHERE  id = p_discount_id;
END;
$$;

-- ── 3. Grants ──────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION claim_discount          TO service_role;
GRANT EXECUTE ON FUNCTION release_discount_claim  TO service_role;

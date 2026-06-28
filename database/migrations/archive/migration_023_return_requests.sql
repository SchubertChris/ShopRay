-- Migration 023: Rücksendungsanfragen (Return Requests)
-- Kunden können für gelieferte Bestellungen eine Rücksendung beantragen.
-- Admin verarbeitet den Antrag und hinterlegt die Tracking-URL für das Rücksendeetikett.

CREATE TABLE IF NOT EXISTS return_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'requested'
                          CHECK (status IN ('requested','approved','rejected','label_sent','received','refunded')),
  label_url   TEXT,
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order  ON return_requests (order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user   ON return_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests (status);

-- RLS: Kunde sieht nur eigene Anträge
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_select_own_returns"
  ON return_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "customer_insert_own_returns"
  ON return_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Service-Role (Backend) darf alles
GRANT ALL ON return_requests TO service_role;

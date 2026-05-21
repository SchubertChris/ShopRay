-- Migration 031: team_lead Rolle + refund_requests Tabelle

-- 1. profiles: role-Constraint um team_lead erweitern
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'mod', 'team_lead', 'owner', 'admin'));

-- 2. refund_requests Tabelle
CREATE TABLE IF NOT EXISTS refund_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number       TEXT NOT NULL,
  amount             NUMERIC(10,2) NOT NULL,
  requested_by       TEXT NOT NULL,        -- 'owner' oder Supabase-UUID
  requested_by_role  TEXT NOT NULL,        -- 'owner' | 'team_lead' | 'mod'
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected')),
  approved_by        TEXT,                 -- 'owner' oder Supabase-UUID
  approved_by_role   TEXT,
  approved_at        TIMESTAMPTZ,
  rejected_reason    TEXT,
  stripe_refund_id   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Index für häufige Abfragen
CREATE INDEX IF NOT EXISTS refund_requests_status_idx  ON refund_requests(status);
CREATE INDEX IF NOT EXISTS refund_requests_order_id_idx ON refund_requests(order_id);

-- 4. RLS
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_refund_requests" ON refund_requests;
CREATE POLICY "service_role_all_refund_requests" ON refund_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Grants
GRANT ALL ON refund_requests TO service_role;

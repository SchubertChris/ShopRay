-- Migration 025: Gutscheincodes / Discount Codes
-- Erstellt discount_codes Tabelle und erweitert orders-Tabelle

CREATE TABLE IF NOT EXISTS discount_codes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('percent', 'fixed')),
  value       numeric(10,2) NOT NULL CHECK (value > 0),
  min_order   numeric(10,2) NOT NULL DEFAULT 0,
  max_uses    integer,
  uses        integer     NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  expires_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive unique index für Code-Lookup
CREATE UNIQUE INDEX IF NOT EXISTS discount_codes_code_idx ON discount_codes (lower(code));

-- Orders-Tabelle um Rabatt-Felder erweitern
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_code   text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2);

-- RLS: nur Service-Role darf schreiben (Backend nutzt service role)
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on discount_codes" ON discount_codes;
CREATE POLICY "Service role full access on discount_codes"
  ON discount_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grants (Backend-Zugriff via service_role)
GRANT ALL ON public.discount_codes TO service_role;

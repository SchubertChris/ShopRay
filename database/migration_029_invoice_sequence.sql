-- migration_029_invoice_sequence.sql
-- Atomare Rechnungsnummer-Sequenz (GoBD / § 14 Abs. 4 UStG)
-- Ersetzt den race-condition-anfälligen COUNT+1-Ansatz in stripe.ts

-- Sequenz-Tabelle: eine Zeile pro Präfix+Jahr-Kombination
CREATE TABLE IF NOT EXISTS invoice_sequences (
  prefix  TEXT    NOT NULL,
  year    INTEGER NOT NULL,
  last_seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, year)
);

-- Service Role darf lesen und schreiben
GRANT SELECT, INSERT, UPDATE ON invoice_sequences TO service_role;

-- RPC: gibt die nächste lückenlose Rechnungsnummer zurück
-- Aufruf: SELECT next_invoice_number('RE', 2025)
-- Gibt zurück: 'RE-2025-00001'
CREATE OR REPLACE FUNCTION next_invoice_number(
  p_prefix TEXT,
  p_year   INTEGER
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seq INTEGER;
BEGIN
  INSERT INTO invoice_sequences (prefix, year, last_seq)
  VALUES (p_prefix, p_year, 1)
  ON CONFLICT (prefix, year)
  DO UPDATE SET last_seq = invoice_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  RETURN p_prefix || '-' || p_year || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$;

-- Nur service_role darf die Funktion aufrufen
REVOKE EXECUTE ON FUNCTION next_invoice_number(TEXT, INTEGER) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION next_invoice_number(TEXT, INTEGER) TO service_role;

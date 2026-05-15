-- migration_005: Versandkosten-Einstellungen (Singleton)
-- Führe diese Migration im Supabase SQL-Editor aus

CREATE TABLE IF NOT EXISTS shipping_settings (
  id           int         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  standard     numeric(6,2) NOT NULL DEFAULT 4.90,
  express      numeric(6,2) NOT NULL DEFAULT 9.90,
  free_above   numeric(8,2) NOT NULL DEFAULT 50.00,
  delivery     text         NOT NULL DEFAULT '2–4 Werktage',
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;

-- Jeder darf lesen (öffentlich für Frontend)
CREATE POLICY "shipping_settings_read_public"
  ON shipping_settings FOR SELECT
  USING (true);

-- Nur Service-Role darf schreiben (Backend nutzt Service-Role Key)
CREATE POLICY "shipping_settings_write_service"
  ON shipping_settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Singleton-Zeile anlegen
INSERT INTO shipping_settings (id, standard, express, free_above, delivery)
VALUES (1, 4.90, 9.90, 50.00, '2–4 Werktage')
ON CONFLICT (id) DO NOTHING;

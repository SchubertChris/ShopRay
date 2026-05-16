-- Migration 004: Kategorien-Tabelle
-- Führe diese Migration in Supabase → SQL Editor aus.

CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  "order"    INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bestehende Kategorien aus Produkten übernehmen (optional)
INSERT INTO categories (name)
SELECT DISTINCT category
FROM   products
WHERE  category IS NOT NULL
  AND  category <> ''
ON CONFLICT (name) DO NOTHING;

-- RLS aktivieren (kein öffentlicher Lesezugriff nötig — API liest für Frontend)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Lesezugriff für authentifizierte Nutzer (API-Server liest mit Service-Key)
CREATE POLICY "categories_read" ON categories
  FOR SELECT USING (true);

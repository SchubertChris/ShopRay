-- Migration 007: categories-Tabelle
-- Erstellt eine verwaltbare Kategorien-Liste.
-- products.category (TEXT) bleibt erhalten — der Admin trägt Kategorien
-- hier ein und weist sie Produkten über das Produkt-Formular zu.

CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  "order"    INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories ("order", name);

-- Bestehende Kategorien eintragen (aus den Seed-Produkten)
INSERT INTO public.categories (name, "order") VALUES
  ('Wohnen',    0),
  ('Deko',      1),
  ('Küche',     2),
  ('Textilien', 3),
  ('Kunst',     4)
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Jeder darf lesen (für Produktfilter im Shop)
CREATE POLICY "Kategorien öffentlich lesen"
  ON public.categories FOR SELECT USING (TRUE);

-- Nur Service-Role darf schreiben (Admin-Backend nutzt service_role)
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL    ON public.categories TO service_role;

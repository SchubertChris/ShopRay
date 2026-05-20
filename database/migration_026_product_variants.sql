-- Migration 026: Produktvarianten (Optionsgruppen, Werte, SKUs)
-- Ausführen in: Supabase → SQL Editor

-- ── variant_options ───────────────────────────────────────────────────────────
-- Optionsgruppen pro Produkt (z.B. "Größe", "Farbe")
CREATE TABLE IF NOT EXISTS public.variant_options (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0
);

-- ── variant_option_values ─────────────────────────────────────────────────────
-- Einzelne Werte pro Gruppe (z.B. "S", "M", "L", "Rot", "Blau")
CREATE TABLE IF NOT EXISTS public.variant_option_values (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID    NOT NULL REFERENCES public.variant_options(id) ON DELETE CASCADE,
  value     TEXT    NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0
);

-- ── product_skus ──────────────────────────────────────────────────────────────
-- Eine Zeile pro Varianten-Kombination mit eigenem Lagerbestand und Preisaufschlag
CREATE TABLE IF NOT EXISTS public.product_skus (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID          NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  combination  JSONB         NOT NULL,      -- {"Größe": "M", "Farbe": "Rot"}
  stock        INTEGER       NOT NULL DEFAULT 0,
  price_offset NUMERIC(10,2) NOT NULL DEFAULT 0,
  sku_code     TEXT,
  active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── order_items: sku_id ergänzen ──────────────────────────────────────────────
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS sku_id UUID REFERENCES public.product_skus(id) ON DELETE SET NULL;

-- ── RLS aktivieren ───────────────────────────────────────────────────────────
ALTER TABLE public.variant_options       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_skus          ENABLE ROW LEVEL SECURITY;

-- Öffentliches Lesen (Kunden müssen Varianten + SKU-Preise sehen)
CREATE POLICY "anon_read_variant_options"
  ON public.variant_options FOR SELECT USING (TRUE);

CREATE POLICY "anon_read_variant_option_values"
  ON public.variant_option_values FOR SELECT USING (TRUE);

CREATE POLICY "anon_read_product_skus"
  ON public.product_skus FOR SELECT USING (active = TRUE);

-- service_role: vollen Zugriff für das Backend
CREATE POLICY "service_role_all_variant_options"
  ON public.variant_options FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_all_variant_option_values"
  ON public.variant_option_values FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_all_product_skus"
  ON public.product_skus FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Grants
GRANT SELECT ON public.variant_options       TO anon, authenticated;
GRANT SELECT ON public.variant_option_values TO anon, authenticated;
GRANT SELECT ON public.product_skus          TO anon, authenticated;
GRANT ALL    ON public.variant_options       TO service_role;
GRANT ALL    ON public.variant_option_values TO service_role;
GRANT ALL    ON public.product_skus          TO service_role;

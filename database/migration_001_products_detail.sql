-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 001 — Produktdetail-Felder
-- ══════════════════════════════════════════════════════════════════════════════
-- Ausführen: Supabase Dashboard → SQL Editor → Inhalt einfügen → Run
-- Sicher: Alle ADD COLUMN IF NOT EXISTS — kann auch nach Erstausführung erneut
--         ausgeführt werden, ohne Fehler zu verursachen.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tax_rate         NUMERIC(5,2)  NOT NULL DEFAULT 19,
  ADD COLUMN IF NOT EXISTS rich_description TEXT,
  ADD COLUMN IF NOT EXISTS highlights       JSONB         NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certifications   JSONB         NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lmiv             JSONB,
  ADD COLUMN IF NOT EXISTS dealer_links     JSONB         NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS documents        JSONB         NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.tax_rate         IS 'MwSt.-Satz in Prozent (0, 7 oder 19)';
COMMENT ON COLUMN public.products.rich_description IS 'HTML-Fließtext für die Detailseite';
COMMENT ON COLUMN public.products.highlights       IS 'USP-Stichpunkte als JSON-Array ["...", "..."]';
COMMENT ON COLUMN public.products.certifications   IS 'Siegel/Zertifikate als JSON-Array ["Bio", "Vegan"]';
COMMENT ON COLUMN public.products.lmiv             IS 'LMIV-Pflichtangaben als JSON-Objekt (optional)';
COMMENT ON COLUMN public.products.dealer_links     IS 'Händlerlinks als JSON-Array [{label, href}]';
COMMENT ON COLUMN public.products.documents        IS 'Dokumente als JSON-Array [{label, href, type}]';

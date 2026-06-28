-- Migration 014: shop_settings-Tabelle + categories.image_url
-- Ausführen in: Supabase Dashboard → SQL Editor

-- ── shop_settings (Singleton-Row, id = 1) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id          INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name        TEXT        NOT NULL DEFAULT 'Mein Shop',
  description TEXT        DEFAULT '',
  url         TEXT        DEFAULT '',
  email       TEXT        DEFAULT '',
  phone       TEXT        DEFAULT '',
  street      TEXT        DEFAULT '',
  zip         TEXT        DEFAULT '',
  city        TEXT        DEFAULT '',
  country     TEXT        DEFAULT 'Deutschland',
  vat_id      TEXT        DEFAULT '',
  tax_number  TEXT        DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vorausgefüllte Defaults (anpassbar im Admin-Panel)
INSERT INTO public.shop_settings (id, name, description, url, email, country) VALUES
  (1, 'ShopRay', 'Dein Online-Shop', 'https://deinshop.de', 'hello@deinshop.de', 'Deutschland')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop-Infos öffentlich lesen" ON public.shop_settings FOR SELECT USING (TRUE);

GRANT SELECT ON public.shop_settings TO anon, authenticated;
GRANT ALL    ON public.shop_settings TO service_role;

-- ── categories.image_url ──────────────────────────────────────────────────────
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url TEXT;

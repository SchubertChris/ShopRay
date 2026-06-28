-- ─── Produkt-Bildergalerie ────────────────────────────────────────────────────
-- Fügt ein JSONB-Array für mehrere Produktbilder hinzu.
-- Das erste Element entspricht image_url (Hauptbild).
-- Ausführen im Supabase SQL Editor (einmalig).

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Bestehende image_url-Werte in das images-Array migrieren
UPDATE public.products
   SET images = jsonb_build_array(image_url)
 WHERE image_url IS NOT NULL
   AND images = '[]'::jsonb;

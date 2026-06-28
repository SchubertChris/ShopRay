-- Migration 024: return_items — welche Artikel werden zurückgeschickt
-- Ausführen im Supabase SQL-Editor

ALTER TABLE public.return_requests
  ADD COLUMN IF NOT EXISTS return_items JSONB;

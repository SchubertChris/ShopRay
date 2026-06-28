-- Migration 010: payment_method + image_url in Bestellungen speichern
-- Ausführen in: Supabase > SQL Editor

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;

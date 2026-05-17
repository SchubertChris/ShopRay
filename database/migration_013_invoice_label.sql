-- Migration 013 — Rechnungsnummer + Versandlabel
-- Ausführen im Supabase SQL-Editor

CREATE SEQUENCE IF NOT EXISTS public.invoice_seq START 1;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS label_b64      TEXT;

GRANT USAGE ON SEQUENCE public.invoice_seq TO service_role;

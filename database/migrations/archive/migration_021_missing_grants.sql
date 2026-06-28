-- Migration 021: Fehlende service_role Grants + Ticket Priority-Spalte
-- Ausführen in: Supabase → SQL Editor
-- Idempotent: kann mehrfach ausgeführt werden ohne Schaden.

-- ── service_role Grants ───────────────────────────────────────────────────────
-- Tabellen die via Migration angelegt wurden und ggf. keinen Grant haben.
-- GRANTs sind idempotent (kein Fehler wenn Grant schon existiert).

GRANT ALL ON public.admin_login_log       TO service_role;
GRANT ALL ON public.pending_mod_invites   TO service_role;
GRANT ALL ON public.admin_config          TO service_role;
GRANT ALL ON public.admin_totp            TO service_role;
GRANT ALL ON public.contact_inquiries     TO service_role;
GRANT ALL ON public.shipping_settings     TO service_role;
GRANT ALL ON public.shop_settings         TO service_role;
GRANT ALL ON public.push_subscriptions    TO service_role;
GRANT ALL ON public.categories            TO service_role;
GRANT ALL ON public.ticket_messages       TO service_role;

-- Sequenzen (für BIGSERIAL-Spalten wie admin_totp.id)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ── Ticket Priority-Spalte ────────────────────────────────────────────────────
-- Fügt die priority-Spalte hinzu wenn sie noch nicht existiert (Migration 019).
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal'
  CHECK (priority IN ('normal', 'high', 'urgent'));

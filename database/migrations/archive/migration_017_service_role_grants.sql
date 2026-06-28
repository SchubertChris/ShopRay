-- Migration 017: Fehlende service_role GRANTs für Backend-only-Tabellen
-- Ausführen in: Supabase → SQL Editor
--
-- Hintergrund: Tabellen die per Migration angelegt wurden (nicht via schema.sql)
-- erhalten in Supabase keine automatischen service_role Grants. Ohne diese Grants
-- schlagen Supabase-Queries vom Backend mit 42501 (insufficient privilege) fehl.

-- Admin Login-Log (Migration 002 — war im migration_004 Grant-Set vergessen)
GRANT ALL ON public.admin_login_log     TO service_role;

-- Mod-Einladungen + Admin-Konfiguration (Migration 015)
GRANT ALL ON public.pending_mod_invites TO service_role;
GRANT ALL ON public.admin_config        TO service_role;

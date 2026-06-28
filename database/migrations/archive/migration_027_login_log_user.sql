-- ─── Login-Log: Benutzerinfo ───────────────────────────────────────────────────
-- Fügt role + email zur admin_login_log-Tabelle hinzu.
-- Ausführen im Supabase SQL Editor (einmalig).

ALTER TABLE public.admin_login_log
  ADD COLUMN IF NOT EXISTS role  text,
  ADD COLUMN IF NOT EXISTS email text;

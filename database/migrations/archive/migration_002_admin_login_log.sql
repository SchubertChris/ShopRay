-- ─── Admin Login Log ──────────────────────────────────────────────────────────
-- Speichert jeden erfolgreichen Admin-Login mit IP, Browser und Zeitstempel.
-- Ausführen im Supabase SQL Editor (einmalig).

CREATE TABLE IF NOT EXISTS public.admin_login_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL    DEFAULT now(),
  ip_address text        NOT NULL,
  user_agent text,
  success    boolean     NOT NULL    DEFAULT true
);

-- Row Level Security aktivieren (Backend nutzt Service-Role-Key → immer Vollzugriff)
ALTER TABLE public.admin_login_log ENABLE ROW LEVEL SECURITY;

-- Index für schnelle Abfragen nach Datum
CREATE INDEX IF NOT EXISTS idx_admin_login_log_created_at
  ON public.admin_login_log (created_at DESC);

-- Automatisches Aufräumen: Einträge älter als 90 Tage löschen.
-- Optional: als scheduled function in Supabase einrichten.
-- DELETE FROM public.admin_login_log WHERE created_at < now() - INTERVAL '90 days';

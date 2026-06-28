-- Migration 015: Pending-Mod-Einladungen + Admin-Konfiguration
-- Ausführen in: Supabase → SQL Editor

-- ── pending_mod_invites ───────────────────────────────────────────────────────
-- Speichert E-Mails für Mitarbeiter die eingeladen wurden aber noch keinen Account haben.
-- Wird vom Backend (service_role) verwaltet — kein öffentlicher Zugriff.
CREATE TABLE IF NOT EXISTS public.pending_mod_invites (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        UNIQUE NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pending_mod_invites ENABLE ROW LEVEL SECURITY;
-- Keine RLS-Policies → nur service_role hat Zugriff (Backend)

-- ── admin_config ──────────────────────────────────────────────────────────────
-- Speichert den Admin-Passwort-Hash, damit er über das Admin-UI geändert werden kann.
-- Fällt auf ADMIN_PASSWORD_HASH Env-Var zurück wenn leer.
-- Immer nur eine Zeile (id = 1).
CREATE TABLE IF NOT EXISTS public.admin_config (
  id            INTEGER     PRIMARY KEY DEFAULT 1,
  password_hash TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
-- Keine RLS-Policies → nur service_role hat Zugriff (Backend)

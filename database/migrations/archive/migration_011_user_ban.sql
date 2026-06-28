-- ══════════════════════════════════════════════════════════════════════════════
-- ShopRay — Migration 011: User Ban / Kontosperrung
-- Stand: 2026-05-17
-- ══════════════════════════════════════════════════════════════════════════════
-- Fügt Sperr-Felder zur profiles-Tabelle hinzu.
-- Ausführen: Supabase → SQL Editor → Inhalt einfügen → Run
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ,  -- NULL = dauerhaft gesperrt
  ADD COLUMN IF NOT EXISTS ban_reason   TEXT;

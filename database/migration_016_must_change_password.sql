-- Migration 016: Pflicht-Passwortänderung für neue Mitarbeiter
-- Ausführen in: Supabase → SQL Editor

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

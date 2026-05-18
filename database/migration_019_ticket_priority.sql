-- Migration 019: Priority-Spalte zu tickets hinzufügen
-- Ausführen in: Supabase → SQL Editor

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal'
  CHECK (priority IN ('normal', 'high', 'urgent'));

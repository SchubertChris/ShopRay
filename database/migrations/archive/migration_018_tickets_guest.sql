-- Migration 018: Tickets für Gäste öffnen
-- Ausführen in: Supabase → SQL Editor

-- 1. user_id nullable machen (DROP CONSTRAINT, dann re-add als nullable FK)
ALTER TABLE public.tickets
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. guest_email Spalte hinzufügen
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS guest_email TEXT
  CHECK (guest_email IS NULL OR guest_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- 3. Sicherstellen: entweder user_id ODER guest_email muss gesetzt sein
ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_user_or_guest_required
  CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL);

-- 4. service_role benötigt vollen Zugriff (für Backend-Route)
GRANT ALL ON public.tickets TO service_role;

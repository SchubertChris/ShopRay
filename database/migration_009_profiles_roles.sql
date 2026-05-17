-- migration_009: Role-System — owner, admin, mod, customer
-- Führe diese Migration im Supabase SQL-Editor aus

-- 1. Alten CHECK-Constraint entfernen und durch erweiterten ersetzen
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'mod', 'customer'));

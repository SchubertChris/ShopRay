-- migration_008: Email-Spalte zu profiles + Trigger update
-- Führe diese Migration im Supabase SQL-Editor aus

-- 1. Email-Spalte ergänzen (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Trigger-Funktion updaten — speichert jetzt auch Email bei Registrierung
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger neu anlegen (falls fehlend oder veraltet)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Bestehende auth.users ohne profiles-Eintrag nachholen
--    (z.B. User die sich vor dieser Migration registriert haben)
INSERT INTO public.profiles (id, name, email)
SELECT
  u.id,
  u.raw_user_meta_data->>'name',
  u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 5. Email in bestehenden profiles aktualisieren wo sie noch fehlt
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

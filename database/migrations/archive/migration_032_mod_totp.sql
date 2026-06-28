-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 032 — TOTP für Mitarbeiter (Mod + Team Lead)
-- Idempotent: CREATE TABLE IF NOT EXISTS, DO-Block für Unique-Constraint
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mod_totp (
  id         bigserial    PRIMARY KEY,
  user_id    uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret     text         NOT NULL,
  created_at timestamptz  NOT NULL DEFAULT now()
);

-- Unique-Constraint idempotent hinzufügen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mod_totp_user_id_unique'
  ) THEN
    ALTER TABLE mod_totp ADD CONSTRAINT mod_totp_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

GRANT ALL ON mod_totp                   TO service_role;
GRANT ALL ON SEQUENCE mod_totp_id_seq   TO service_role;

-- ── Admin 2FA / TOTP ─────────────────────────────────────────────────────────
-- Speichert das TOTP-Secret für den einzigen Admin-Account.
-- Wenn eine Zeile existiert → 2FA aktiviert; keine Zeile → 2FA deaktiviert.

CREATE TABLE IF NOT EXISTS public.admin_totp (
  id         BIGSERIAL   PRIMARY KEY,
  secret     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nur der Backend-Service-Key darf schreiben (Admin-Panel nutzt Service Key)
ALTER TABLE public.admin_totp ENABLE ROW LEVEL SECURITY;

-- Keine RLS-Policies → nur Service Key (backend) hat Zugriff

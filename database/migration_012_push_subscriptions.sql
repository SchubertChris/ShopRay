-- Migration 012: Push-Subscription-Tabelle für Web Push Notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nur Backend-Service-Role darf lesen/schreiben (kein Kunden-Zugriff)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Service-Role umgeht RLS automatisch — kein Policy nötig

-- ─── Admin Notifications + Tasks ───────────────────────────────────────────────
-- Notification Center (automatische System-Events) + Aufgaben-System (manuell).
-- Ausführen im Supabase SQL Editor (einmalig).

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text        NOT NULL,
  title      text        NOT NULL,
  body       text,
  link       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Wer hat welche Notification gelesen
CREATE TABLE IF NOT EXISTS public.admin_notification_reads (
  notification_id uuid NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
  user_key        text NOT NULL,  -- 'owner' oder Supabase-Auth-UUID des Mods
  read_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_key)
);

-- ── Tasks ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text,
  assigned_to uuid,                         -- Supabase auth.users.id des Mods, NULL = alle
  priority    text        NOT NULL DEFAULT 'normal',  -- 'low' | 'normal' | 'high' | 'urgent'
  status      text        NOT NULL DEFAULT 'open',    -- 'open' | 'in_progress' | 'done'
  due_date    date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at
  ON public.admin_notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notification_reads_user_key
  ON public.admin_notification_reads (user_key);

CREATE INDEX IF NOT EXISTS idx_admin_tasks_status_assigned
  ON public.admin_tasks (status, assigned_to);

-- ── Row Level Security ─────────────────────────────────────────────────────────
ALTER TABLE public.admin_notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_reads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_tasks               ENABLE ROW LEVEL SECURITY;

-- Service-Role hat vollen Zugriff (Backend nutzt Service-Role-Key)
DROP POLICY IF EXISTS "service_notifications_all"      ON public.admin_notifications;
DROP POLICY IF EXISTS "service_notification_reads_all" ON public.admin_notification_reads;
DROP POLICY IF EXISTS "service_tasks_all"              ON public.admin_tasks;

CREATE POLICY "service_notifications_all"
  ON public.admin_notifications FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_notification_reads_all"
  ON public.admin_notification_reads FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_tasks_all"
  ON public.admin_tasks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Grants (Backend-Zugriff via service_role)
GRANT ALL ON public.admin_notifications      TO service_role;
GRANT ALL ON public.admin_notification_reads TO service_role;
GRANT ALL ON public.admin_tasks              TO service_role;

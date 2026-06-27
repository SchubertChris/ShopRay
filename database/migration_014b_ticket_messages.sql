-- Migration 014: ticket_messages — Chat-Nachrichten pro Ticket
-- Ausführen im Supabase SQL-Editor

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID        NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender     TEXT        NOT NULL CHECK (sender IN ('customer', 'admin')),
  text       TEXT        NOT NULL CHECK (char_length(text) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_messages_ticket_id_created_at_idx
  ON public.ticket_messages (ticket_id, created_at);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Idempotente Policy-Erstellung (kein IF NOT EXISTS in PostgreSQL → Exception abfangen)
DO $$ BEGIN
  CREATE POLICY "customer_read_own_messages" ON public.ticket_messages
    FOR SELECT USING (
      ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "customer_insert_own_messages" ON public.ticket_messages
    FOR INSERT WITH CHECK (
      sender = 'customer' AND
      ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- authenticated: Kunden können lesen + schreiben
GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
-- service_role: Backend-Endpunkte (Admin-Antworten) umgehen RLS
GRANT ALL ON public.ticket_messages TO service_role;

-- Supabase Realtime aktivieren (für Kunden-Frontend)
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- Bestehende Ticket-Nachrichten migrieren (nur Tickets ohne vorhandene Zeile)
INSERT INTO public.ticket_messages (ticket_id, sender, text, created_at)
SELECT id, 'customer', message, created_at
FROM public.tickets
WHERE message IS NOT NULL AND message != ''
  AND id NOT IN (SELECT DISTINCT ticket_id FROM public.ticket_messages);

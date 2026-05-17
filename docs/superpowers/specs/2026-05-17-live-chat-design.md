# Live-Chat System — Design Spec
**Datum:** 2026-05-17  
**Status:** Approved  
**Scope:** Frontend · Backend · Admin (alle 3 Projekte)

---

## Ziel

Das bestehende Ticket-System wird zu einem echten Konversations-Chat ausgebaut. Jedes Support-Ticket ist gleichzeitig ein Chat-Thread. Kunden können Nachrichten schreiben und Antworten in Echtzeit empfangen — ohne Drittanbieter, vollständig im eigenen Stack.

---

## Entscheidungen (aus Brainstorming)

| Frage | Entscheidung |
|---|---|
| Chat-Widget Position (Kunde) | Dedizierte `/chat`-Seite → leitet auf `/account/tickets/new` |
| Admin-Ansicht | Neuer Tab „Chats" im bestehenden `/admin/support` |
| Ticket / Chat Verhältnis | Tickets ARE Chats — ein System, kein paralleles |
| Realtime-Technologie (Kunde) | Supabase Realtime (direkt im Frontend) |
| Realtime-Technologie (Admin) | Polling alle 2s wenn Chat-Panel offen |
| Ansatz | `ticket_messages` Tabelle (Option 1) |

---

## Datenbank

### Neue Tabelle: `ticket_messages`

```sql
CREATE TABLE ticket_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender     TEXT NOT NULL CHECK (sender IN ('customer', 'admin')),
  text       TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON ticket_messages (ticket_id, created_at);

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Kunde sieht nur Nachrichten eigener Tickets
CREATE POLICY "customer_own_messages" ON ticket_messages
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid())
  );

-- Kunde darf eigene Nachrichten schreiben
CREATE POLICY "customer_insert_own" ON ticket_messages
  FOR INSERT WITH CHECK (
    sender = 'customer' AND
    ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid())
  );

GRANT USAGE ON SEQUENCE ticket_messages_id_seq TO authenticated;
GRANT SELECT, INSERT ON ticket_messages TO authenticated;
-- Admin schreibt über service_role (Backend) → kein RLS-Problem
```

### Bestehende `tickets`-Tabelle
Bleibt **unverändert**. `message` (erste Nachricht des Kunden) und `reply` (letzte Admin-Antwort) bleiben erhalten — neue Logik: beim Ticket-Erstellen wird `message` automatisch als erste Zeile in `ticket_messages` gespiegelt. `reply` wird weiterhin beim letzten Admin-Post gesetzt (für E-Mail-Notification Kompatibilität).

---

## Backend (Express)

### Neue Datei: `Backend/src/routes/tickets-messages.ts`

```
GET  /api/tickets/:id/messages      → Alle Nachrichten des Tickets (auth required, nur eigene)
POST /api/tickets/:id/messages      → Kunde sendet Nachricht (text: string, 1–5000 Zeichen)
```

### Erweiterung: `Backend/src/routes/admin-tickets.ts`

```
GET  /api/admin/tickets/:id/messages    → Admin lädt alle Nachrichten eines Tickets
POST /api/admin/tickets/:id/messages    → Admin sendet Nachricht → Push an Kunden
```

**POST admin reply — Seiteneffekte:**
1. Eintrag in `ticket_messages` (sender: 'admin')
2. `tickets.reply` + `tickets.replied_at` + `tickets.updated_at` setzen (Kompatibilität)
3. Push-Notification an Kunden (wenn Subscription vorhanden)

### Ticket-Erstellen (bestehend erweitern)
`POST /api/tickets` — nach Eintrag in `tickets` → erste Zeile in `ticket_messages` mit `sender: 'customer'` und dem `description`-Text anlegen.

---

## Frontend (Kunde)

### `Frontend/src/features/tickets/`

**Neue Typen (`ticket.types.ts` erweitern):**
```typescript
export interface TicketMessage {
  id:        string;
  ticketId:  string;
  sender:    'customer' | 'admin';
  text:      string;
  createdAt: string;
}
```

**Neuer Service (`ticketService.ts` erweitern):**
- `getTicketMessages(ticketId: string): Promise<TicketMessage[]>`
- `sendTicketMessage(ticketId: string, text: string): Promise<TicketMessage>`

**Neuer Hook:** `useTicketChat(ticketId)` — lädt Nachrichten, hält Supabase Realtime Subscription, gibt `messages`, `send`, `loading` zurück.

### Neue Seite: `Frontend/src/pages/user/ticket-detail.tsx`

Route: `/account/tickets/:id`

Layout:
- Header: Betreff + Status-Badge + Zurück-Link
- Chat-Bereich: scrollbarer Nachrichtenverlauf als Bubbles
  - Kunden-Nachrichten: rechts, Primärfarbe
  - Admin-Nachrichten: links, gedämpft (Avatar „SR")
- Footer: Eingabefeld + Senden-Button (disabled wenn `closed`)
- Hinweis bei geschlossenem Ticket: „Gespräch geschlossen — neues Ticket erstellen"

**Supabase Realtime:** Channel `ticket_messages:ticket_id=eq.{id}` — `INSERT`-Events → neue Nachricht direkt in lokalen State appenden.

### `/chat` Seite
Leitet mit `<Navigate to="/account/tickets/new" replace />` weiter — kein Inhalt mehr, kein doppeltes System.

### `/account/tickets` Liste
Zeilen-Klick navigiert zu `/account/tickets/:id`. Letzte Nachricht + Zeitstempel als Preview in der Zeile anzeigen (optional, nice-to-have).

---

## Admin

### `Admin/src/pages/support/index.tsx` — erweiterter Tab

Neuer Tab **„Chats"** neben den bestehenden Tabs (Alle / Offen / In Bearbeitung):
- Zeigt alle Tickets sortiert nach `last_message_at` (letzter Nachricht)
- Badge im Sidebar: Anzahl Tickets mit ungelesener Admin-Aufgabe

**Split-View (wie Ticket-Detail heute):**
- Links: Konversationsliste
- Rechts: Chat-Panel mit Nachrichtenverlauf als Bubbles + Eingabefeld

**Polling:** `useEffect` mit `setInterval(2000)` wenn ein Chat-Panel offen ist → `GET /api/admin/tickets/:id/messages` → State aktualisieren wenn neue Nachrichten vorhanden.

**Admin-Antwort senden:** `POST /api/admin/tickets/:id/messages` → optimistisches UI-Update.

### Neue API-Funktion in `Admin/src/api/adminApi.ts`
- `getTicketMessages(ticketId: string): Promise<TicketMessage[]>`
- `sendAdminMessage(ticketId: string, text: string): Promise<TicketMessage>`

---

## Datenmigration (bestehende Tickets)

Beim ersten Deploy: bestehende Tickets mit gesetztem `message`-Feld bekommen automatisch eine erste `ticket_messages`-Zeile (Einmal-Migration im SQL-Editor):

```sql
INSERT INTO ticket_messages (ticket_id, sender, text, created_at)
SELECT id, 'customer', message, created_at
FROM tickets
WHERE message IS NOT NULL AND message != ''
ON CONFLICT DO NOTHING;
```

---

## SCSS — neue Klassen

**Frontend:**
- `.ticket-chat` — Container
- `.ticket-chat__messages` — scrollbarer Bereich
- `.chat-bubble` + `--customer` / `--admin` — Nachrichten-Bubbles
- `.ticket-chat__input-bar` — Eingabebereich unten

**Admin:**
- `.chat-panel__messages` — Nachrichtenverlauf im Admin
- `.chat-bubble--admin-sent` — Admin-eigene Nachrichten (rechts)

---

## Nicht im Scope

- Datei-Anhänge in Nachrichten
- Tipp-Indikator (Typing indicator)
- Gelesen-Status / Read Receipts
- Mehrere gleichzeitige Admin-Agenten
- KI-Bot / automatische Antworten

---

## Migration

Neue Datei: `database/migration_014_ticket_messages.sql`  
Für Frisch-Install: in `database/schema.sql` integrieren.

---

## Implementierungsreihenfolge

1. DB-Migration (`ticket_messages` Tabelle)
2. Backend: neue Endpoints + Ticket-Erstell-Hook
3. Frontend: Types → Service → Hook → Detailseite → SCSS
4. Admin: API-Funktionen → Chat-Tab → Polling
5. `/chat` Weiterleitung
6. TypeScript-Check alle 3 Projekte
7. Bestehende Tickets migrieren (SQL einmalig)

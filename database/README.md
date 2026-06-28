# ShopRay — Datenbank

Alle SQL-Dateien werden im **Supabase SQL-Editor** ausgeführt (kein Migrations-Tool nötig).

## Was du brauchst

| Datei | Wofür |
|---|---|
| **`schema.sql`** | **Das Wichtigste.** Vollständiges Schema (Migrationen 001–035 konsolidiert). Einmal im Supabase-SQL-Editor ausführen → fertige, sichere Datenbank. Mehr braucht eine Frisch-Installation **nicht**. |
| `seed.sql` | Optional: Beispiel-Produkte/-Kategorien zum Testen. **Achtung:** löscht vorhandene Test-Daten. |

## `migrations/archive/`

Die einzelnen, historischen Migrationen — jede ist **eine** Schema-Änderung über die Zeit. **Für eine Frisch-Installation NICHT nötig**, denn `schema.sql` enthält sie alle bereits konsolidiert.

Du brauchst sie nur, wenn du eine **ältere, bereits laufende** Datenbank inkrementell hochziehen willst: führe die Migrationen, die du noch nicht eingespielt hast, der Reihe nach aus.

> **Wichtig:** `migration_035_security_hardening.sql` (RLS-Härtung) muss auf **jeder** bestehenden Datenbank nachgezogen werden — in `schema.sql` ist sie für Frisch-Installationen bereits enthalten.

## Pflege (für Entwickler)

`schema.sql` ist die **Single Source of Truth**. Neue Schema-Änderungen direkt in `schema.sql` einpflegen (und parallel in der Live-DB ausführen). Neue nummerierte Migrationsdateien im Archiv anzulegen lohnt sich nur, wenn mehrere Datenbanken auf unterschiedlichen Ständen inkrementell aktualisiert werden müssen — bei einer einzelnen Installation genügt `schema.sql`.

# /project:session — Session-State aktualisieren

Hält `CLAUDE_SESSION.md` synchron mit dem aktuellen Implementierungsstand.
Verhindert Kontextverlust beim nächsten Compacting oder Session-Start.

## Wann ausführen

- Nach einem abgeschlossenen Feature-Block
- Vor einer längeren Pause
- Wenn der Kontext merklich voll wird
- Nach jedem Commit

## Ablauf

1. `PROJECT_DOCUMENTS.md` lesen — neueste Einträge identifizieren
2. Bestehende `CLAUDE_SESSION.md` lesen
3. Folgende Abschnitte updaten:

### Implementierungsstand
- Was ist neu fertig? → In "Vollständig implementiert" eintragen
- Was war geplant und ist jetzt fertig? → Aus "Offene Aufgaben" streichen

### Offene Aufgaben
- Was ist noch offen? → Liste aktuell halten
- Neue Aufgaben die im Gespräch aufgetaucht sind → ergänzen

### Wichtige Entscheidungen
- Neue Architektur-Entscheidungen die im Chat getroffen wurden → dokumentieren
- Geänderte Patterns → updaten

### Datum im Header
- `Letzte Aktualisierung` auf heutiges Datum setzen

## Regeln

- Nur Fakten — nichts dokumentieren was noch nicht existiert
- Kurz und präzise — kein Fließtext, nur strukturierte Listen
- Kein Code in CLAUDE_SESSION.md — nur Beschreibungen
- Datum immer aktualisieren

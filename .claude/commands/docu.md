# /project:docu — Dokumentation synchronisieren

Hält alle Dokumentations-Dateien aktuell.

## Ablauf

1. **explorer** — Scannt src/ auf neue/geänderte Dateien seit letztem Docu-Update.
2. **docu-agent** — Aktualisiert:
   - `PROJECT_DOCUMENTS.md` — Changelog-Einträge für alle Änderungen (Datum + Oneliner)
   - `PROJECT_STRUCTURE.md` — Neue Ordner/Dateien eintragen
   - JSDoc-Kommentare in neuen Types/Interfaces (nur wo noch keine vorhanden)

## Regeln

- Keine inhaltlichen Änderungen am Code, nur Dokumentation
- Datum immer im Format YYYY-MM-DD
- Oneliner: Was wurde gebaut, nicht wie
- Keine redundanten Einträge für Dateien die schon dokumentiert sind

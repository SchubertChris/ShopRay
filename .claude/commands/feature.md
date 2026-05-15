# /project:feature — Neues Feature implementieren

Workflow für neue Seiten, Komponenten oder Funktionen.

## Ablauf

1. **architecture-agent** — Analysiert bestehende Struktur, definiert Dateiplan, Types und Interfaces. Kein Code schreiben, nur planen.
2. **`frontend-design` Skill** — Aktivieren für Design-Konzept, visuelle Sprache, Interaction-Patterns. Erst danach Code schreiben.
3. **frontend-agent** — Implementiert React-Komponenten, SCSS-Klassen, Page-Integration. Hält sich strikt an CLAUDE.md (keine Inline-Styles, 7-1 SCSS, typisiert).
3. **code-review-agent** — Prüft Konformität mit CLAUDE.md, sucht Bugs, prüft TypeScript.
4. **docu-agent** — Aktualisiert PROJECT_DOCUMENTS.md und PROJECT_STRUCTURE.md.

## Übergabe-Format zwischen Agenten

Jeder Agent übergibt dem nächsten:
- Was wurde erstellt/geändert (Dateipfade)
- Offene Fragen oder Probleme
- TypeScript-Status (Fehler ja/nein)

## Abbruch-Bedingungen

- TypeScript-Fehler nach Schritt 2 → nicht weiter, fix zuerst
- code-review-agent findet kritische Issues → zurück zu frontend-agent

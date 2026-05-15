# /project:fix — Bug fixen

Workflow für Fehler, Crashes und falsche Behavior.

## Ablauf

1. **debug-agent** — Reproduziert den Bug, findet Root Cause, beschreibt den Fix.
2. **refactor-agent** — Setzt den Fix um, prüft ob ähnliche Bugs an anderer Stelle existieren (grep).
3. **code-review-agent** — Verifiziert dass der Fix korrekt ist und keine Regression einführt.

## Was debug-agent immer prüft

- Fehlermeldung vollständig lesen und verstehen
- Stack Trace zurückverfolgen
- Alle Stellen im Code finden wo das Problem auftreten könnte
- Minimal-Reproduktion beschreiben

## Abbruch-Bedingungen

- Bug kann nicht reproduziert werden → User fragen für mehr Kontext
- Fix würde Architektur grundlegend ändern → erst mit User abstimmen

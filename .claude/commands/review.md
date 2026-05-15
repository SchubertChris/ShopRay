# /project:review — Code-Review

Prüft alle zuletzt geänderten Dateien auf Qualität und CLAUDE.md-Konformität.

## Ablauf

1. **explorer** — Findet alle Dateien die seit dem letzten Review geändert wurden.
2. **code-review-agent** — Reviewt jede Datei auf:
   - TypeScript-Vollständigkeit (alle Props, States, Returns typisiert)
   - SCSS-Konformität (keine Inline-Styles, CSS-Variablen statt Hex)
   - Keine ungenutzten Imports oder Variablen
   - Konsistenz mit bestehenden Patterns
   - Sicherheit (keine XSS-Risiken, keine hardcodierten Secrets)

## Output-Format

Für jede Datei:
- ✅ OK oder ⚠️ Warnung oder ❌ Kritisch
- Konkrete Zeile + Problem + Fix-Vorschlag

## Nach dem Review

Kritische Issues (❌) sofort fixen. Warnungen (⚠️) sammeln und User entscheiden lassen.

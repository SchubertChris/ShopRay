# /project:refactor — Code aufräumen

Verbessert Code-Qualität ohne das Verhalten zu ändern.

## Ablauf

1. **explorer** — Analysiert Scope: welche Dateien, wie groß, welche Muster.
2. **code-review-agent** — Identifiziert konkrete Probleme: Duplikate, schlechte Namen, zu große Komponenten, fehlende Types.
3. **refactor-agent** — Setzt Verbesserungen um. Regel: Eine Sache auf einmal, kein Mixed-Scope.
4. **code-review-agent** — Verifiziert: Behavior unverändert? TypeScript sauber? Tests noch grün?

## Was refactor-agent NICHT macht

- Keine neuen Features hinzufügen
- Keine Behavior-Änderungen
- Keine Abhängigkeiten hinzufügen oder entfernen
- Kein Umstrukturieren von Feature-Grenzen ohne Absprache

## Sicherheitsnetz

`npx tsc --noEmit` nach jedem Refactor-Schritt pflicht.

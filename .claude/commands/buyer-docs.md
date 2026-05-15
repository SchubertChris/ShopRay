# /project:buyer-docs — Käufer-Dokumentation aktualisieren

Hält `SETUP.md` synchron mit dem aktuellen Codestand.
Schreibt immer auf Anfänger-Niveau — klar, konkret, ohne Fachbegriffe.

## Ablauf

1. **explorer** — Liest `PROJECT_DOCUMENTS.md` und vergleicht die letzten Einträge
   mit dem Stand des letzten SETUP.md-Updates (Versionsdatum im Header).
   Findet alle Änderungen seit dem letzten Update.

2. **buyer-docu-agent** — Aktualisiert `SETUP.md`:
   - Neue Features → in "Features-Übersicht" eintragen
   - Neue `.env`-Variablen → in "Umgebungsvariablen" dokumentieren
   - Neue Themes → in "Theme wählen" ergänzen
   - Neue Rechtliche Seiten → in "Rechtliches anpassen" ergänzen
   - Neue Provider → in jeweiligem Provider-Abschnitt ergänzen

## Regeln

- Kein Code, nur Dokumentation
- Schreibstil: Du-Form, kurze Sätze, Schritt-für-Schritt
- Keine Fachbegriffe ohne Erklärung in Klammern
- Datum im SETUP.md-Header auf heutiges Datum aktualisieren
- Nur Abschnitte ändern die wirklich betroffen sind — nichts umstrukturieren

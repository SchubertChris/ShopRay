# /project:launch — Pre-Launch-Check vor Template-Verkauf

Vollständige Prüfung bevor das Template verkauft wird.
Gibt ein klares **VERKAUF OK / NICHT BEREIT** Urteil.

## Ablauf

### Phase 1 — Legal (legal-agent)
Führt den vollständigen Legal-Audit durch:
- DSGVO / Cookie-Consent korrekt?
- Impressum-Pflichtfelder als Platzhalter markiert?
- AGB mit korrektem Widerrufsrecht (14 Tage)?
- Keine echten Firmen-/Markenangaben in Demo-Daten?
- Template-Lizenz definiert?

### Phase 2 — Code-Qualität (code-review-agent)
Prüft alle seit letztem Commit geänderten Dateien:
- Keine Inline-Styles
- Keine Hex-Werte
- Keine `any`-Types
- Keine hardcodierten Secrets
- `npx tsc --noEmit` ohne Fehler

### Phase 3 — Dokumentations-Check (explorer)
Prüft ob alle Docs aktuell sind:
- `SETUP.md` — Versionsdatum aktuell? Alle Features dokumentiert?
- `SETUP.en.md` — Auf gleichem Stand wie deutsche Version?
- `QUICKSTART.md` — Alle Schritte korrekt? Kein falscher Admin-Login?
- `Admin/README.md` — Aktuell?
- `CLAUDE_SESSION.md` — Offene Aufgaben bekannt?

### Phase 4 — Käufer-Erfahrungs-Check
Manuell durch Claude beantwortet:
- [ ] Kann ein Anfänger mit QUICKSTART.md in 15 Min loslegen?
- [ ] Sind alle `.env.example` Dateien vollständig?
- [ ] Sind alle Migrations-Dateien in der richtigen Reihenfolge dokumentiert?
- [ ] Gibt es hardcodierte URLs/Emails die ein Käufer ändern muss?
- [ ] Sind alle "TODO"-Kommentare im Code für Käufer sichtbar/erklärend?

## Output-Format

```
╔══════════════════════════════════════════════════╗
║  ShopRay — Pre-Launch Check — [DATUM]            ║
╠══════════════════════════════════════════════════╣
║  Gesamturteil: VERKAUF OK ✅ / NICHT BEREIT ❌  ║
╚══════════════════════════════════════════════════╝

Legal         ✅/❌  [Kurzfazit]
Code-Qualität ✅/❌  [Kurzfazit]
Dokumentation ✅/❌  [Kurzfazit]
Käufer-UX     ✅/❌  [Kurzfazit]

── BLOCKER (❌) — muss vor Verkauf behoben werden ──
[Konkrete Issues]

── EMPFEHLUNGEN (⚠️) ───────────────────────────────
[Nice-to-have vor Verkauf]
```

## Wichtig
Dieser Check ersetzt keine professionelle Rechtsberatung.
Der legal-agent gibt einen Hinweis, keinen Rechtsbescheid.

# Skill: Webapp Testing

Manueller Test-Prozess für neue Features und Regressions-Checks.

## Test-Reihenfolge

### 1. Smoke Test (immer zuerst)
- App startet ohne Console-Fehler?
- Alle Routen erreichbar (kein weißer Screen)?
- TypeScript sauber (`npx tsc --noEmit`)?

### 2. Feature Test (Happy Path)
Schritt für Schritt den normalen User-Flow durchgehen:
- Was ist der Einstiegspunkt?
- Was soll der User tun können?
- Was ist das erwartete Ergebnis?

### 3. Edge Cases
- Leere States (keine Produkte, leerer Warenkorb)
- Lange Texte / viele Items
- Schnelles Klicken (Doppelklick, Race Conditions)
- Navigation während Aktion läuft

### 4. Theme-Check
Alle 8 Themes durchschalten:
- [ ] sage-light / sage-dark
- [ ] navy-light / navy-dark
- [ ] terra-light / terra-dark
- [ ] electric-light / electric-dark

### 5. Responsive Check
- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1280px+)

### 6. Regressions-Check
Welche bestehenden Features könnten durch die Änderung betroffen sein?
- Navigation (Header, Footer, Mobile-Nav)
- Theme-Switching (View Transition)
- Bestehende Pages auf derselben Route

## Report-Format
| Feature | Happy Path | Edge Cases | Themes | Mobile | Status |
|---|---|---|---|---|---|
| Warenkorb | ✅ | ⚠️ Doppelklick | ✅ | ✅ | ⚠️ |

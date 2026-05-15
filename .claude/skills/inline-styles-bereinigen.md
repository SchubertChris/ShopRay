# Skill: Inline-Styles → SCSS migrieren

Bereinigt CLAUDE.md-Verstöße in bestehenden Komponenten.

## Vorgehen pro Datei

1. Alle `style={{ ... }}` in der TSX-Datei finden (grep)
2. Für jede Gruppe ähnlicher Styles: BEM-Klasse definieren
3. SCSS-Datei für die Komponente anlegen oder erweitern
4. `className` in TSX ersetzen
5. Style-Attribut entfernen
6. TypeScript-Check

## Ausnahmen (darf inline bleiben)
- Dynamische Werte die sich zur Laufzeit ändern (z.B. `width: progress + '%'`)
- CSS Custom Properties setzen (`style={{ '--vt-x': x }}`)
- Einmalige, wirklich nicht wiederverwendbare Positionierung

## Schlechtes Beispiel
```tsx
<div style={{ display: 'flex', gap: '1rem', padding: '2rem' }}>
```

## Gutes Beispiel
```tsx
// TSX
<div className="product-grid">
// SCSS
.product-grid { display: flex; gap: 1rem; padding: 2rem; }
```

## Checkliste
- [ ] Keine style={{ }} außer Ausnahmen
- [ ] Neue SCSS-Klassen in richtiger Datei
- [ ] In `_index.scss` forwarded
- [ ] `npx tsc --noEmit` sauber

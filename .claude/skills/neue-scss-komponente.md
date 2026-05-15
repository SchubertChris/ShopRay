# Skill: Neue SCSS-Komponente anlegen

Schritt-für-Schritt für jede neue UI-Komponente.

## Schritte

1. Datei anlegen: `src/sass/components/_<name>.scss`
2. BEM-Struktur definieren:
   ```scss
   .komponent {
     // Block
     &__element { }   // Element
     &--modifier { }  // Modifier
   }
   ```
3. Nur CSS-Variablen verwenden (`var(--clr-*)`, `var(--radius-*)` etc.)
4. Responsive mit `@include respond-to('md') { }` aus `_mixins.scss`
5. In `src/sass/components/_index.scss` forwarden:
   ```scss
   @forward 'name';
   ```
6. In der React-Komponente: nur Klassen-Namen, kein style={}

## Checkliste
- [ ] Datei existiert in `components/`
- [ ] In `_index.scss` eingetragen
- [ ] Keine Hex-Werte
- [ ] Keine Inline-Styles in TSX
- [ ] `npx tsc --noEmit` sauber

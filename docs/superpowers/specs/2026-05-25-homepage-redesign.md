# Homepage Redesign — Design Spec
**Datum:** 2026-05-25  
**Projekt:** ShopRay Frontend  
**Scope:** `Frontend/src/pages/home/` + Theme-System + Nav-Sonderverhalten

---

## Ziel

Die aktuelle Homepage (`home.tsx`, ~800 Zeilen, GSAP-lastig, HeroCanvas, Hero-Slot-Karussell) ruckelt auf Mobile und wirkt wie ein Template-Demo. Sie wird komplett neu aufgebaut als **Story-Driven Landing Page**: jede Sektion beantwortet die nächste unbewusste Frage des Besuchers, volle Breite ohne globalen Container-Wrapper, kein GSAP, kein Canvas.

Datenbankanbindung (Produkte, Kategorien via Supabase) bleibt vollständig erhalten.

---

## Story-Architektur

| # | Sektion | Frage die beantwortet wird | Stimmung |
|---|---------|--------------------------|---------|
| 1 | Hero | "Wer bist du?" | Dunkel, dramatisch, still |
| 2 | Trust Bar | — | Unterschwellig, schnell |
| 3 | Bestseller | "Was bekomme ich?" | Hell, konkret, edge-to-edge |
| 4 | Kategorien | "Was ist euer Universum?" | Dunkel, filmisch, volle Breite |
| 5 | Reviews | "Kann ich euch trauen?" | Dunkel, intim, menschlich |
| 6 | Newsletter | "Wie bleibe ich dabei?" | Hell, offen, einladend |

Visueller Rhythmus: Hell ↔ Dunkel ↔ Hell wechseln als Kapitel-Marker. Keine Sektion sieht wie die vorherige aus.

---

## Navigation — Bottom-Reveal Nav

### Konzept
Die Homepage verwendet **kein globales Header-Layout**. Stattdessen eigenes Layout (`HomeLayout.tsx`) ohne `<Header>`. Die Nav ist tief in den Hero eingebaut.

### Verhalten
- **Initial:** `position: absolute; bottom: 0; left: 0; width: 100vw` — sitzt am untersten Rand des 100vh-Hero
- **Nach Scroll-Schwelle** (scroll >= heroHeight - navHeight): `position: fixed; top: 0` — gleitet nach oben, bleibt sticky
- Transition: `transform + position` Wechsel via IntersectionObserver auf Hero-Ende-Marker
- **Tab-Stil:** Horizontale Links mit `border-bottom` Underline auf aktiver Seite
- **Hover:** `::after` Pseudo-Element mit Primaryfarbe + `opacity: 0 → 1` Übergang (0.3s)
- **Aktiver Tab:** `::before` mit `border-bottom: 2px solid var(--clr-primary)` sichtbar
- Logo links, Links zentriert, Cart + Account rechts
- **Mobile:** Hamburger-Button → Slide-In Panel von links (full-height, `transform: translateX(-100%) → 0`)

### Nav-Links
Identisch zur aktuellen `Header.tsx`: Shop, Kollektionen, Über uns, FAQ, Kontakt — plus Cart-Icon, Account-Icon.

---

## Sektionen — Detail

### 1. Hero (100vh)

**Layout:** Volle Breite, 100dvh. Kein Container.  
**Inhalt:**
- Linke Hälfte: Eyebrow-Label (klein, uppercase), riesige Haupt-Headline (2–3 Zeilen, Cormorant Garamond), Sub-Text, CTA-Button
- Rechte Hälfte (Desktop): Großes Produktfoto oder Farbfeld (CSS-Gradient fallback)
- Bottom: Bottom-Reveal Nav (absolut positioniert)

**Animation:** CSS `@keyframes` — Headline-Wörter mit `clip + translateY` beim Page-Load. Kein GSAP. Kein Canvas.

**Hintergrund:** `var(--clr-dark-surface)` mit radialem Primary-Glow oben rechts. Kein Bild-Dependency für den Start — Bild kann später via `IMAGES` Config eingebunden werden.

---

### 2. Trust Bar

**Layout:** Full-bleed, 48px hoch, `background: var(--clr-secondary)`.  
**Inhalt:** CSS marquee (`animation: marquee 32s linear infinite`). 8 Trust-Items mit Trennstrichen.  
**Neu:** Kein GSAP-Fade-in. Einfach immer sichtbar.

---

### 3. Bestseller

**Layout:** Full-bleed `100vw`. Kein `max-width` Wrapper.  
**Sektions-Kopf:** Riesige Eyebrow + Titel linksbündig, `padding-inline: 6vw`. "Alle ansehen"-Link rechts.  
**Grid:** `padding-inline: 6vw`. 2-col Mobile, 4-col Desktop. Cards schneiden links leicht an (`margin-left: -4px`).  
**Hintergrund:** `var(--clr-background)` (hell).  
**Animation:** IntersectionObserver — Cards `opacity: 0 → 1` + `transform: translateY(20px) → 0` bei Eintritt. Kein Stagger-Overhead, einfaches CSS-Transition auf `.is-visible` Klasse.

---

### 4. Kategorien

**Layout:** Full-bleed. Jede Kategorie ist ein **horizontales Band** das die volle Breite einnimmt.  
**Band-Höhe:** 160px Mobile, 220px Desktop.  
**Inhalt pro Band:**
- Linkes Drittel: Kategorie-Nummer (groß, monospace, 10% opacity) + Name (groß, bold)
- Rechtes Drittel: Artikel-Anzahl + Arrow-Icon
- Hintergrund: Kategorie-Bild (object-fit: cover, full-band) mit Scrim-Gradient für Lesbarkeit
- Fallback ohne Bild: Primary→Accent Gradient

**Hover:** Bild scale 1.03, Brightness leicht erhöht (CSS transition, kein JS).  
**Hintergrund Sektion:** `var(--clr-dark-surface)` — dunkle Kapitel-Sektion.

---

### 5. Reviews

**Layout:** Full-bleed. Kein zentrierter Card-Grid. Stattdessen: asymmetrisches Editorial-Layout.  
**Hintergrund:** `var(--clr-dark-surface)` — dunkel, intim.

**Desktop-Layout (2-spaltig, edge-to-edge):**
- Linke Spalte (60%): **Ein dominanter Review** — riesiges dekoratives Anführungszeichen (`"`, Cormorant Garamond, ~15rem, `var(--clr-primary)`, 15% opacity) als Hintergrund-Element. Darunter der Zitat-Text groß (1.5–2rem, Cormorant Garamond, Kursiv). Name + Sternebewertung klein darunter.
- Rechte Spalte (40%): Zwei **kompakte Supporting-Reviews** vertikal gestapelt. Nur Zitat (1rem), Name, Sterne. Kein Card-Box-Border. Trenner: dünne horizontale Linie zwischen den beiden.
- Sektions-Label oben links: kleine Eyebrow + Titel ("Was andere sagen") — kein Centered-Titel.

**Mobile:** Vollständig gestapelt. Großes Hauptzitat zuerst, darunter die zwei kleineren. Kein Grid.

**Was es nicht ist:** Kein Card-Raster, kein `max-width: 900px`, kein `border: 1px solid` Kartenboxen, kein gleichmäßiger 3-Spalten-Grid.

**Animation:** IntersectionObserver — linke Spalte revealed `translateX(-30px) → 0`, rechte Spalte `translateX(30px) → 0`. Zeitversetzt (0.15s delay rechts).

---

### 6. Newsletter

**Layout:** Full-bleed. Zwei-Spalten (Desktop): Links riesige Serif-Typografie ("Bleib dabei." o.ä.), rechts Formular.  
**Mobile:** Gestapelt, Titel oben, Form unten.  
**Hintergrund:** `var(--clr-background)` — hell, öffnend, kein Abschluss-Gefühl.  
**Kein dekorativer Orb mehr.** Typografie ist die Dekoration.

---

## 5. Theme: Gold (Candlescope-Palette)

Palette-ID: `gold` → ergibt `gold-dark` und `gold-light`.

```scss
gold-light:
  text:          #0A0806   // fast Schwarz, warmer Braunton (Candlescope)
  background:    #F2EDE2   // Pergament-Weiß
  surface:       #EEE9DE   // leicht dunkler als BG
  primary:       #C9A84C   // Candlescope Gold — unveränderlich
  secondary:     #E2DDD2   // warme Border-Farbe
  accent:        #A8892E   // dunkleres Gold für Hover/Accent
  shadow:        rgba(10, 8, 6, 0.06)
  glass:         rgba(242, 237, 226, 0.80)
  dark-surface:  #0A0806   // für Hero-Sektion im Light-Mode
  on-dark:       #F5F0E8   // Cream-Weiß auf dunklem Hintergrund

gold-dark:
  text:          #F5F0E8   // warmes Cream (Candlescope)
  background:    #080808   // Candlescope Schwarz
  surface:       #111111   // leicht heller als BG
  primary:       #C9A84C   // Gold bleibt Gold
  secondary:     #1a1a1a   // dunkles Surface für Karten
  accent:        #A8892E   // dunkleres Gold
  shadow:        rgba(0, 0, 0, 0.60)
  glass:         rgba(8, 8, 8, 0.85)
  dark-surface:  #0d0d0d   // für Hero-Sektion im Dark-Mode
  on-dark:       #F5F0E8
```

**Anpassungen in `_variables.scss`:** Theme-Map erweitern.  
**Anpassungen in `_root.scss`:** `[data-theme="gold-light"]` + `[data-theme="gold-dark"]` Regeln ergänzen.  
**Anpassungen in `theme.ts`:** `Palette` Type + `PALETTES` Array um `gold` erweitern.

---

## Performance-Strategie

| Was | Vorher | Nachher |
|-----|--------|---------|
| Animationen | GSAP (JS-Thread) | CSS `@keyframes` + IntersectionObserver |
| Scroll-Effects | GSAP ScrollTrigger | Keiner (kein Parallax) |
| Canvas | HeroCanvas (250 Shapes @ 60fps) | Komplett entfernt |
| Hero-Slot | CSS-Animation + setInterval | Komplett entfernt |
| Quick-View Modal | Im Home-Baum | Komplett entfernt |
| Theme-Dock | Im Home-Baum | Komplett entfernt |
| Datei-Größe | ~800 Zeilen | Ziel: ~350 Zeilen |

**IntersectionObserver Pattern:**
```tsx
// Einmaliger Observer für alle Reveal-Elemente
// data-reveal Attribut auf Elementen → .is-visible bei Eintritt
// CSS: [data-reveal] { opacity: 0; transform: translateY(20px); transition: ... }
//      [data-reveal].is-visible { opacity: 1; transform: none; }
```

---

## Datei-Struktur

```
Frontend/src/pages/home/
  home.tsx          ← komplett neu (ersetzt alten Stand)
  HomeLayout.tsx    ← NEU: Layout ohne globalen Header, mit Bottom-Reveal Nav
  index.ts          ← unverändert

Frontend/src/sass/pages/home/
  _home.scss        ← komplett neu

Frontend/src/sass/abstracts/
  _variables.scss   ← gold-dark + gold-light ergänzen

Frontend/src/sass/base/
  _root.scss        ← gold-dark + gold-light theme rules

Frontend/src/config/
  theme.ts          ← Palette type + PALETTES array erweitern
```

**Bestehende Verbindungen die erhalten bleiben:**
- `useProducts()` → Produkte aus Supabase
- `useCategories()` → Kategorien aus Supabase
- `useCart()` → Warenkorb-State
- `useAuth()` → Auth-State für Nav-Icons
- `ProductCard` Komponente → unverändert
- `ChatWidget` → unverändert (Portal, unabhängig vom Layout)
- `ROUTES` Config → Nav-Links
- `IMAGES` Config → Hero-Bild (optional)

---

## Was entfernt wird

- `HeroCanvas.tsx` — Datei löschen
- Alle GSAP-Imports in `home.tsx`
- `hero-slot`, `hero-glass`, `editorial-hero__list`, `editorial-hero__scroll` CSS + JSX
- `brand-split`, `usp-grid`, `usp-card` CSS + JSX
- `ThemeDock` / `ThemePanel` CSS + JSX
- Quick-View-Modal JSX
- `drawerOpen`, `quickView`, `toast`, `skeletons`, `slotIdx` State
- `scroll-pulse`, `hero-slot-scroll`, `orb-breathe`, `orb-spin` Keyframes (nicht mehr gebraucht)

---

## Out of Scope

- Produktdetailseiten
- Checkout / Cart-Seite
- Auth-Flow
- Admin-Bereich
- Andere Pages als die Homepage

# 🎨 Shop Theme Cheat Sheet

Dieses Dokument dient als Leitfaden für die konsistente Nutzung von Farben und Elementen im gesamten Shop.

---

## 🌓 Theme-Logik (Sage Green Stack)


| Variable | Light Mode | Dark Mode | Einsatzbereich |
| :--- | :--- | :--- | :--- |
| `--clr-text` | `#1a1c1b` | `#eef1ef` | Fließtext, Überschriften, Icons. |
| `--clr-background`| `#f8f9f8` | `#121413` | Seitenhintergrund (große Flächen). |
| `--clr-primary` | `#557c6d` | `#779c8d` | Haupt-Buttons (CTA), Brand-Elemente. |
| `--clr-secondary` | `#e2e8e4` | `#2a332f` | Cards, Borders, Input-Hintergründe. |
| `--clr-accent` | `#81b1a0` | `#4e7e6c` | Hover-Effekte, Badges, Highlights. |

---

## 📐 Styling-Regeln (Best Practices)

### 1. Rahmen & Linien (Borders)
Nutze Borders sparsam. Wenn nötig, verwende die `secondary` Farbe.
*   **Regel:** `border: 1px solid var(--clr-secondary);`
*   **Modern-Tipp:** Verzichte auf Borders bei Cards und nutze stattdessen `background: var(--clr-secondary);` mit viel Padding.

### 2. Buttons & Interaktion
*   **Primary Button:** `background: var(--clr-primary); color: #fff;` (Der "Kaufen" Button).
*   **Secondary Button:** `border: 1px solid var(--clr-primary); color: var(--clr-primary);` (Der "Details" Button).
*   **Hover-State:** Ändere den Hintergrund zu `accent` oder reduziere die Opacity auf 0.9.

### 3. Abstände (Spacing)
Ein moderner Shop atmet. Nutze großzügige Abstände:
*   **Card-Padding:** `2rem` (32px)
*   **Section-Spacing:** `5rem` (80px) bis `8rem` (128px)

### 4. Schatten (Shadows)
Schatten sollten im Light-Mode fast unsichtbar sein:
*   **Light:** `box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);`
*   **Dark:** `box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);`

---

## 🛠️ SCSS Snippets

### Mixin Anwendung (`_root.scss`)
```scss
:root {
  @include set-theme-vars('light');
}

[data-theme='dark'] {
  @include set-theme-vars('dark');
}
```

### Die perfekte Produkt-Card
```scss
.product-card {
  background: var(--clr-secondary); // Subtiler Kontrast zum Background
  border-radius: 12px;
  padding: 1.5rem;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  }

  &__title {
    color: var(--clr-text);
    margin-bottom: 0.5rem;
  }
}
```

---

## 💡 Goldene Regel: 60-30-10
*   **60% Background:** Halte den Shop hell und sauber.
*   **30% Secondary:** Nutze Grau/Grün-Töne für die Struktur.
*   **10% Primary:** Nutze die kräftige Farbe nur für Dinge, die der User **klicken** soll.

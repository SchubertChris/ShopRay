# Concepts — Setup-Anleitung für Käufer

> Letzte Aktualisierung: 2026-05-14

Willkommen! Diese Anleitung erklärt Schritt für Schritt, wie du das Template auf deinen eigenen Shop anpasst.  
Du brauchst keine tiefen Programmierkenntnisse — alle wichtigen Einstellungen sind an einer zentralen Stelle gebündelt.

---

## Inhaltsverzeichnis

1. [Shop-Namen ändern](#1-shop-namen-ändern)
2. [Optionale Features ein- und ausschalten](#2-optionale-features-ein--und-ausschalten)
3. [Bilder einbinden](#3-bilder-einbinden)
4. [Farben und Theme anpassen](#4-farben-und-theme-anpassen)
5. [Supabase einbinden (Datenbank & Auth)](#5-supabase-einbinden)
6. [Stripe einbinden (Zahlungen)](#6-stripe-einbinden)
7. [SMTP einbinden (E-Mail-Versand)](#7-smtp-einbinden)
8. [Deployment auf Vercel](#8-deployment-auf-vercel)

---

## 1. Shop-Namen ändern

Dein Shop-Name wird **überall automatisch** verwendet — im Header, Footer, Login, Registrierung und im Browser-Tab.  
Du musst ihn nur an **einer einzigen Stelle** ändern:

**Datei:** `src/config/app.ts`

```ts
export const APP_NAME = 'Concepts'; // ← Hier deinen Shop-Namen eintragen
```

**So gehst du vor:**

1. Öffne die Datei `src/config/app.ts`
2. Ersetze `'Concepts'` durch deinen gewünschten Shop-Namen (z.B. `'Mein Shop'`)
3. Speichern — fertig. Der Name erscheint sofort überall.

---

## 2. Optionale Features ein- und ausschalten

Manche Funktionen sind optional. Du kannst sie mit einem einfachen `true` / `false` ein- oder ausschalten.

**Datei:** `src/config/features.ts`

```ts
export const FEATURES = {
  wishlist: true,   // Wunschliste (Herzchen-Button, Wunschliste-Seite)
  reviews:  true,   // Produktbewertungen
  tickets:  true,   // Support-Tickets im Kundenkonto
  lmiv:     false,  // Nährwertangaben (nur für Lebensmittel relevant)
};
```

**Erklärung der Features:**

| Feature | Was es tut | Wann ausschalten? |
|---|---|---|
| `wishlist` | Herzchen-Button auf Produkten, Wunschliste-Seite im Konto | Wenn du keine Merkliste brauchst |
| `reviews` | Bewertungs-Tab auf der Produktseite | Wenn du keine Kundenbewertungen zeigen willst |
| `tickets` | Support-Ticket-System im Kundenkonto | Wenn du Support anders abwickelst |
| `lmiv` | Inhaltsstoffe & Nährwerttabelle | Nur für Lebensmittel-Shops relevant |

**So gehst du vor:**

1. Öffne `src/config/features.ts`
2. Setze `true` für Features die du willst, `false` für Features die du nicht brauchst
3. Speichern — die Buttons, Seiten und Navigation passen sich automatisch an

> **Wichtig:** Die Kern-Funktionen (Produkte, Warenkorb, Kasse, Login, Bestellungen) können nicht ausgeschaltet werden — diese sind die Basis des Shops.

---

## 3. Bilder einbinden

Alle Bilder des Shops werden an **einer einzigen Stelle** konfiguriert.  
Du brauchst nur die Bild-URLs eintragen — der Rest passiert automatisch.

**Datei:** `src/config/images.ts`

```ts
export const IMAGES = {
  hero: {
    home:  'https://deine-domain.com/hero-home.jpg',  // Startseite Hintergrundbild
    about: 'https://deine-domain.com/hero-about.jpg', // Über-uns Hintergrundbild
    shop:  '',  // leer lassen = Farbgradient aus dem Theme
  },
  products: [
    'https://deine-domain.com/produkt-1.jpg',  // Produkt-Variante 1
    'https://deine-domain.com/produkt-2.jpg',  // Produkt-Variante 2
    // … insgesamt 8 Varianten (werden automatisch rotiert)
  ],
};
```

### Was die Zahlen bedeuten

| Bereich | Was es steuert |
|---|---|
| `hero.home` | Hintergrundbild auf der Startseite |
| `hero.about` | Hintergrundbild auf der Über-uns-Seite |
| `hero.shop` | Hintergrundbild in der Produktübersicht (leer = Gradient) |
| `products[0–7]` | 8 Produkt-Platzhalterbilder, nach Produkt-ID rotiert |

### Wie die Bilder in das Design passen

Das Template legt automatisch einen **Farb-Tint** aus dem aktiven Theme über jedes Bild.  
Das bedeutet: Wenn du das Farbschema änderst, passen sich alle Bilder farblich an — ohne dass du die Bilder neu austauschen musst.

- **Produkt-Bilder:** Subtiler Gradient-Overlay in den Theme-Farben (ca. 22 % Deckkraft)
- **Hero-Bilder:** Farbige Lichtblobs aus `--clr-primary` und `--clr-accent` als Overlay

### Wo du kostenlose Bilder findest

| Seite | Kosten | Hinweis |
|---|---|---|
| [unsplash.com](https://unsplash.com) | kostenlos | Hochwertige Fotos, kommerziell nutzbar |
| [pexels.com](https://pexels.com) | kostenlos | Fotos & Videos, kommerziell nutzbar |
| [pixabay.com](https://pixabay.com) | kostenlos | Breit gefächert, kommerziell nutzbar |

### Bilder leer lassen

Wenn du ein Feld leer lässt (`''`), greift automatisch ein **Farbgradient** aus dem Theme als Fallback — kein Bild nötig. So funktioniert das Template auch ohne eigene Fotos.

### So gehst du vor

1. Öffne `src/config/images.ts`
2. Ersetze die URLs durch Links zu deinen eigenen Bildern (oder lass Felder leer)
3. Speichern — alle Bilder werden sofort überall im Shop aktualisiert

> **Tipp:** Verwende möglichst Bilder in guter Qualität — für Hero-Bereiche mindestens 1920 × 1080 px, für Produkt-Bilder mindestens 800 × 1000 px (Hochformat).

---

## 4. Farben und Theme anpassen

*(Folgt in Kürze)*

---

## 5. Supabase einbinden

*(Folgt in Kürze)*

---

## 6. Stripe einbinden

*(Folgt in Kürze)*

---

## 7. SMTP einbinden

*(Folgt in Kürze)*

---

## 8. Deployment auf Vercel

*(Folgt in Kürze)*

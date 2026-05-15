<!-- @claude Das Projekt soll Grundlegen nur ein Gerüst/ Default Shop werden so das ich es als Paket Verkaufen kan low/mid/enterprice 
Hier soll nur die struktur im detail für anfänger dokumentiert werden aus sicht des verkäufers professionell und erklärend in simpler Sprache nicht zu Fachlich aber präzise wie er wo was ein und umstellen kann -->


# 📂 Projekt-Struktur (Shop) – Handbuch

Dieses Dokument erklärt dir, wo du welchen Code ablegst. Ziel ist es, dass dein Projekt auch bei 100 Dateien noch übersichtlich bleibt.

---

## 🏗️ Core Verzeichnisse (src/)
*Hier liegen die Dinge, die die gesamte App am Laufen halten.*

- **`api/`**: Der "Postbote". Hier stellst du ein, wie deine App mit dem Server spricht (z. B. Axios-Setup).
- **`config/`**: Das "Gehirn". Hier stehen feste Werte wie Links (`routes.ts`) oder Einstellungen, die du nur einmal ändern willst, damit sie überall aktuell sind.
- **`hooks/`**: Deine "Werkzeuge". Kleine Helfer für technische Aufgaben (z. B. "Ist der User am Handy oder PC?").
- **`lib/`**: Die "Steckdose" für Fremdanbieter. Hier wird z. B. Firebase oder Stripe konfiguriert, bevor du es in der App nutzt.
- **`providers/`**: Die "Schutzhülle". Diese Dateien umschließen deine App, damit überall bekannt ist: "Ist jemand eingeloggt?" oder "Welches Design-Thema nutzen wir?".
- **`stores/`**: Der "Kurzzeit-Speicher". Hier liegen Daten, die die ganze App wissen muss (z. B. "Ist der Darkmode an?").
- **`types/`**: Das "Wörterbuch". Hier definierst du für TypeScript exakt, wie ein Produkt oder ein User aussieht, um Fehler beim Tippen zu vermeiden.
- **`test/`**: Die "Übungsfläche". Hier liegen Beispieldaten, um Funktionen zu testen, ohne echtes Geld oder echte User zu nutzen.
- **`utils/`**: Der "Taschenrechner". Einfache Funktionen, die nur etwas umrechnen (z. B. eine Zahl in "19,99 €" verwandeln).

---

## 📦 Features (Business Logik)
*Das ist das Herzstück. Jedes Modul (z. B. Warenkorb, Login) ist eine eigene kleine Welt.*

**Regel:** Wenn du am Login arbeitest, bleibst du zu 95% in `features/auth/`.
- **`api/`**: Die Befehle, um z. B. genau diesen Login-Request zu senden.
- **`components/`**: Die Bausteine für dieses Feature (z. B. das Eingabefeld für das Passwort).
- **`hooks/`**: Die Logik für dieses Feature (z. B. "Prüfe, ob das Passwort lang genug ist").
- **`index.ts`**: Das "Eingangstor". Hier schreibst du rein, was andere Teile der App von diesem Feature sehen dürfen. Alles andere bleibt "privat" im Ordner.

---

## 🎨 Stylesystem (sass/)
*Hier wird es hübsch. Wir nutzen das 7-1 System (Ordnung für CSS).*

- **`abstracts/`**: Die "Farbpalette". Hier stehen nur Variablen (Farben, Abstände). Sie erzeugen selbst kein Design, sondern liefern die Infos.
- **`base/`**: Das "Fundament". Hier legst du fest, wie Standards wie Schriftarten oder Abstände generell aussehen sollen.
- **`components/` / `layouts/`**: Das "Make-up" für deine Buttons, Eingabefelder oder die Anordnung von Header und Footer.
- **`pages/`**: Spezielle Styles, die es wirklich NUR auf einer Seite (z. B. der Startseite) gibt.
- **`themes/`**: Der "Lichtschalter". Hier wird geregelt, wie Farben sich im Dark- oder Light-Mode ändern.

---

## 💡 Wichtig für die Arbeit:
1. **Kein Chaos:** Leg eine neue Datei niemals "einfach so" in `src/`. Such dir den passenden Ordner.
2. **Namen sind wichtig:** Nenne Dateien so, dass man sofort weiß, was sie tun (z. B. `useCart.ts` statt `logic.ts`).
3. **Frage dich immer:** "Braucht die ganze App diese Info?" -> Wenn ja: `src/`. "Braucht nur der Shop das?" -> Wenn ja: `features/products/`.

---

## 🆕 Neue Dateien (Stand 2026-05-15/16)

- **`src/pages/auth/reset-password.tsx`**: Passwort-Zurücksetzen-Seite (Supabase `PASSWORD_RECOVERY` Event).
- **`src/pages/info/shipping.tsx`**: Versand- & Rückgabe-Seite — Infos kommen jetzt dynamisch aus der Backend-API.
- **`src/pages/shop/checkout.tsx`**: Versandkosten-Berechnung jetzt dynamisch (kein Hardcode).
- **`src/features/products/components/ImageGallery.tsx`**: Galerie-Komponente für mehrere Produkt-Bilder.

## 🆕 Neue Ordner (Stand 2026-05-14)

- **`features/products/components/`**: UI-Komponenten für das Produkt-Feature (aktuell: `ImageGallery.tsx` — Galerie mit Thumbnail-Leiste, Fade-Animation beim Wechsel).

## 🆕 Neue Ordner (Stand 2026-05-11)

- **`pages/support/`**: Chat-Widget-Seite (`chat.tsx`) und Support-Portal-Seite (`portal.tsx`) — Platzhalter-Seiten für externe Chat- und Helpdesk-Anbieter (Intercom, Zendesk etc.).
- **`sass/pages/support/`**: SCSS für beide Support-Seiten (`_chat.scss`, `_portal.scss`).

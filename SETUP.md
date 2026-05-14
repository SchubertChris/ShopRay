# ShopRay — Setup Guide

**Version:** 1.3.0 | **Letzte Aktualisierung:** 2026-05-14

Dieser Guide führt dich Schritt für Schritt durch die Einrichtung deines ShopRay-Templates —
von der Installation bis zum fertigen, live geschalteten Shop.

---

## Inhalt

1. [Voraussetzungen](#1-voraussetzungen)
2. [Installation](#2-installation)
3. [Umgebungsvariablen einrichten](#3-umgebungsvariablen-einrichten)
4. [Datenbank einrichten (Supabase Schema)](#4-datenbank-einrichten)
5. [Supabase anbinden (Auth & API)](#5-supabase-anbinden)
6. [Stripe anbinden (Zahlungen)](#6-stripe-anbinden)
7. [Backend starten & Webhook einrichten](#7-backend--webhook)
8. [E-Mail-Versand einrichten](#8-e-mail-versand-einrichten)
9. [Theme wählen](#9-theme-wählen)
10. [Shop-Name & Basiseinstellungen](#10-shop-name--basiseinstellungen)
11. [Features aktivieren oder deaktivieren](#11-features-aktivieren-oder-deaktivieren)
12. [Produkte befüllen](#12-produkte-befüllen)
13. [Rechtliche Texte anpassen](#13-rechtliche-texte-anpassen)
14. [Admin-Bereich einrichten](#14-admin-bereich)
15. [Deployment (Veröffentlichen)](#15-deployment)
16. [Was gehört zu welchem Paket?](#16-pakete--was-gehört-wozu)
17. [Technologie & Open Source](#17-technologie--open-source)

---

## 1. Voraussetzungen

Bevor du anfängst, stelle sicher dass folgende Programme installiert sind:

| Programm | Version | Download |
|---|---|---|
| **Node.js** | 18 oder neuer | https://nodejs.org |
| **npm** | kommt mit Node.js | — |
| **Git** | beliebig | https://git-scm.com |

Außerdem benötigst du Accounts bei:
- **Supabase** (kostenlos) — https://supabase.com
- **Stripe** (kostenlos, Gebühren nur pro Transaktion) — https://stripe.com

---

## 2. Installation

Öffne dein Terminal (Windows: PowerShell, Mac: Terminal) und führe folgende Befehle aus:

```bash
# 1. In den Frontend-Ordner wechseln
cd ShopRay/Frontend

# 2. Alle Abhängigkeiten installieren (dauert ca. 1–2 Minuten)
npm install

# 3. Umgebungsvariablen vorbereiten
cp ../.env.example ../.env
```

Jetzt `.env`-Datei öffnen und befüllen (nächster Abschnitt erklärt jeden Wert).

```bash
# 4. Entwicklungsserver starten
npm run dev
```

Der Shop öffnet sich unter **http://localhost:5173**

---

## 3. Umgebungsvariablen einrichten

Die Datei `.env` im Hauptordner enthält alle geheimen Zugangsdaten.

> **Wichtig:** Die `.env`-Datei darf **niemals** in Git hochgeladen werden. Sie ist bereits in `.gitignore` eingetragen.

### Alle Variablen im Überblick

```env
# ── Dein Backend ──────────────────────────────────────────────────────────────
# Wenn du ein eigenes Backend betreibst (z.B. Node.js API):
VITE_API_URL=https://api.deinshop.de
# Lokal entwickeln:
# VITE_API_URL=http://localhost:3000

# ── Supabase (Datenbank & Login) ──────────────────────────────────────────────
VITE_SUPABASE_URL=https://xxxx.supabase.co        # Deine Supabase-Projekt-URL
VITE_SUPABASE_ANON_KEY=eyJ...                      # Dein öffentlicher API-Key

# ── Stripe (Zahlungen) ────────────────────────────────────────────────────────
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxx               # NUR der öffentliche Key!

# ── E-Mail ────────────────────────────────────────────────────────────────────
VITE_SMTP_FROM=bestellung@deinshop.de             # Absender-Adresse

# ── Shop-Daten ────────────────────────────────────────────────────────────────
VITE_SHOP_NAME=Mein Shop Name
VITE_SHOP_URL=https://meinshop.de
VITE_SHOP_CURRENCY=EUR
VITE_SHOP_LOCALE=de-DE

# ── Features ein/aus ──────────────────────────────────────────────────────────
VITE_FEATURE_REVIEWS=true       # Produktbewertungen
VITE_FEATURE_WISHLIST=true      # Wunschliste
VITE_FEATURE_LIVE_CHAT=false    # Live-Chat (erst aktivieren wenn Anbieter konfiguriert)
```

---

## 4. Datenbank einrichten

Bevor du Supabase verbindest, musst du das Datenbankschema einmalig anlegen.
Das Schema erstellt alle nötigen Tabellen und Sicherheitsregeln automatisch.

### Schritt 1 — Schema ausführen

1. Gehe zu **supabase.com → Dein Projekt → SQL Editor**
2. Öffne die Datei `database/schema.sql` aus deinem ShopRay-Ordner
3. Kopiere den gesamten Inhalt in den SQL Editor
4. Klicke **"Run"**

Das war's. Folgende Tabellen werden angelegt:

| Tabelle | Inhalt |
|---|---|
| `profiles` | Kundendaten (Name, Adresse, Rolle) |
| `products` | Produkte (Preis, Beschreibung, Lager) |
| `orders` | Bestellungen mit Status-Verlauf |
| `order_items` | Einzelne Artikel je Bestellung |
| `reviews` | Produktbewertungen |
| `tickets` | Support-Tickets |

### Was passiert automatisch

- Wenn sich ein Nutzer registriert → Profil wird automatisch angelegt
- Wenn eine Bewertung geändert wird → Produkt-Rating wird aktualisiert
- Alle Tabellen haben **Row Level Security (RLS)** — jeder Nutzer sieht nur seine eigenen Daten

---

## 5. Supabase anbinden

ShopRay kommt mit **4 Farbpaletten**, jede verfügbar in **Dark und Light Mode** — macht 8 Themes gesamt.

### Überblick der Paletten

| Palette | Charakter | Geeignet für |
|---|---|---|
| **sage** | Naturgrün, beruhigend | Nahrungsergänzung, Bio, Wellness, Gesundheit |
| **navy** | Dunkelblau, professionell | Premium, B2B, Elektronik, Versicherungen |
| **terra** | Erdtöne, warm | Mode, Lifestyle, Wohnen, Handwerk |
| **electric** | Leuchtendes Blau, modern | Streetwear, Gaming, Tech, Jugendliche |

### Standard-Theme ändern

Öffne die Datei [Frontend/src/providers/ThemeProvider.tsx](Frontend/src/providers/ThemeProvider.tsx).

Suche nach diesen zwei Zeilen (ca. Zeile 28–31):

```tsx
const [palette, setPaletteState] = useState<Palette>(
  () => (localStorage.getItem('sr-palette') as Palette) ?? 'sage'
```

Ersetze `'sage'` durch deine gewünschte Palette:

```tsx
  () => (localStorage.getItem('sr-palette') as Palette) ?? 'navy'   // ← hier ändern
```

Und für den Standard-Mode (hell oder dunkel), direkt darunter:

```tsx
const [mode, setModeState] = useState<ThemeMode>(
  () => (localStorage.getItem('sr-mode') as ThemeMode) ?? 'light'   // 'light' oder 'dark'
```

> **Hinweis:** Der Benutzer kann das Theme auch selbst über den Theme-Umschalter im Shop ändern. Deine Einstellung hier gilt nur als Standard für Neu-Besucher.

---

## 5. Supabase anbinden

Supabase ist die Datenbank und übernimmt das Benutzer-Login.

### Schritt 1 — Projekt erstellen

1. Gehe zu https://supabase.com und melde dich an
2. Klicke auf **"New Project"**
3. Wähle als Region **"Central EU (Frankfurt)"** — wichtig für DSGVO
4. Vergib einen Projektnamen und ein sicheres Datenbankpasswort
5. Warte ca. 2 Minuten bis das Projekt bereit ist

### Schritt 2 — API-Keys kopieren

1. In deinem Supabase-Projekt: **Settings → API**
2. Kopiere **"Project URL"** → in `.env` als `VITE_SUPABASE_URL`
3. Kopiere **"anon public"** Key → in `.env` als `VITE_SUPABASE_ANON_KEY`

> **Nicht verwechseln:** Kopiere den `anon`-Key, **nicht** den `service_role`-Key. Der `service_role`-Key darf nie ins Frontend.

### Schritt 3 — Datenbank-Schema einrichten

Das SQL-Schema liegt unter `Backend/database/schema.sql`. Führe es in Supabase aus:

1. In Supabase: **SQL Editor → New Query**
2. Inhalt von `schema.sql` hineinkopieren
3. Auf **"Run"** klicken

Danach sind alle nötigen Tabellen (users, orders, products, tickets, reviews) angelegt.

### Schritt 4 — Authentifizierung konfigurieren

1. In Supabase: **Authentication → Settings**
2. **Site URL** setzen: deine Domain (z.B. `https://meinshop.de`)
3. Unter **Email** → Confirm Email: je nach Bedarf aktivieren
4. Optional: **Redirect URLs** für Passwort-Zurücksetzen eintragen

---

## 6. Stripe anbinden

Stripe übernimmt die Zahlungsabwicklung (Kreditkarte, SEPA, Apple Pay etc.).

### Schritt 1 — Konto und Keys

1. Gehe zu https://stripe.com und melde dich an
2. Im Dashboard: **Developers → API Keys**
3. Kopiere den **"Publishable key"** (beginnt mit `pk_live_`) → in `.env` als `VITE_STRIPE_PUBLIC_KEY`

> **Wichtig:** Den **"Secret key"** (`sk_live_...`) **niemals** ins Frontend — nur ins Backend!

### Schritt 2 — Testmodus

Während der Entwicklung arbeite mit Test-Keys (`pk_test_...`). So kannst du Zahlungen simulieren ohne echtes Geld zu bewegen.

Testkarte die immer funktioniert: `4242 4242 4242 4242`, Ablaufdatum: beliebig in der Zukunft, CVC: beliebig.

### Schritt 3 — Webhook einrichten (für Bestellbestätigungen)

Der Webhook wird in Schritt 7 nach dem Backend-Deployment eingerichtet.

---

## 7. Backend & Webhook einrichten

Das Backend ist für Stripe-Zahlungen, Bestellverarbeitung und E-Mails zuständig.
Es läuft als separates Vercel-Projekt.

### Schritt 1 — Backend lokal starten

```bash
cd Backend
npm install
npm run dev
# → http://localhost:5000
# Test: http://localhost:5000/api/health → {"status":"ok"}
```

### Schritt 2 — Stripe Webhook lokal testen

Installiere die [Stripe CLI](https://stripe.com/docs/stripe-cli) und führe aus:

```bash
stripe login
stripe listen --forward-to localhost:5000/api/webhook/stripe
```

Die CLI zeigt einen **Webhook Signing Secret** (`whsec_...`) — trage ihn in `Backend/.env` als `STRIPE_WEBHOOK_SECRET` ein.

Testzahlung auslösen:
```bash
stripe trigger checkout.session.completed
```

### Schritt 3 — Backend deployen (Vercel)

1. Vercel → **"Add New Project"**
2. Repository auswählen → Root Directory: **`Backend`**
3. Alle Variablen aus `Backend/.env` eintragen
4. Deploy

### Schritt 4 — Stripe Webhook in Produktion

Nach dem Deployment:

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://DEINE-BACKEND-URL.vercel.app/api/webhook/stripe`
3. Events auswählen:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. **Signing Secret** kopieren → in Vercel Backend-Projekt als `STRIPE_WEBHOOK_SECRET`

### Backend-Endpoints Übersicht

| Methode | Route | Beschreibung |
|---|---|---|
| GET | `/api/health` | Status-Check |
| POST | `/api/webhook/stripe` | Stripe-Events (intern) |
| GET | `/api/products` | Alle aktiven Produkte |
| GET | `/api/products/:slug` | Einzelnes Produkt |
| POST | `/api/orders/checkout` | Stripe Checkout starten |
| GET | `/api/orders` | Eigene Bestellungen (Auth) |
| GET | `/api/customers/me` | Eigenes Profil (Auth) |
| GET | `/api/customers/me/export` | DSGVO-Datenexport (Auth) |
| DELETE | `/api/customers/me` | Konto löschen (DSGVO Art. 17) |

---

## 8. E-Mail-Versand einrichten

Der Shop sendet automatisch E-Mails für:
- Bestellbestätigungen
- Passwort vergessen
- Ticket-Antworten

### Empfohlene Anbieter

| Anbieter | Kostenlos bis | Link |
|---|---|---|
| **Resend** | 3.000 E-Mails/Monat | https://resend.com |
| **Postmark** | 100 E-Mails/Monat | https://postmarkapp.com |
| **AWS SES** | 62.000 E-Mails/Monat | https://aws.amazon.com/ses |

### Einrichtung (Beispiel: Resend)

1. Account erstellen auf https://resend.com
2. Domain verifizieren (DNS-Einträge setzen — Resend erklärt das Schritt für Schritt)
3. **API Key** erstellen
4. Den Key als Umgebungsvariable im Backend setzen: `SMTP_API_KEY=re_xxxx`
5. In `.env` die Absender-Adresse setzen: `VITE_SMTP_FROM=bestellung@deinedomain.de`

> **Hinweis:** SMTP wird nur im Backend genutzt — kein API-Key kommt ins Frontend.

---

## 8. Shop-Name & Basiseinstellungen

### Shop-Name ändern

Öffne [Frontend/src/config/app.ts](Frontend/src/config/app.ts):

```ts
export const APP_NAME     = 'Dein Shop Name';   // ← hier ändern
export const APP_VERSION  = '1.0.0';
export const APP_LOCALE   = 'de-DE';            // Sprache
export const APP_CURRENCY = 'EUR';              // Währung
```

### Versandkosten & Freikauf-Grenze

Öffne [Frontend/src/config/constants.ts](Frontend/src/config/constants.ts):

```ts
export const FREE_SHIPPING_THRESHOLD = 50;    // Ab welchem Betrag kostenloser Versand (€)
export const SHIPPING_COST           = 4.95;  // Versandkosten (€)
```

---

## 9. Features aktivieren oder deaktivieren

### Schnell per .env (Feature Flags)

Ändere in der `.env`-Datei den Wert auf `true` oder `false`:

```env
VITE_FEATURE_REVIEWS=true      # Produktbewertungen anzeigen
VITE_FEATURE_WISHLIST=true     # Wunschliste aktivieren
VITE_FEATURE_LIVE_CHAT=false   # Live-Chat (z.B. Intercom, Tidio)
```

### Features vollständig entfernen (für das Lite-Paket)

Wenn du ein bestimmtes Feature komplett herausnehmen möchtest, entferne folgende Dateien und Verweise:

| Feature | Zu entfernen |
|---|---|
| **Bewertungen** | `src/features/reviews/` + Tab in `product-detail.tsx` |
| **Wunschliste** | `src/features/wishlist/` + `wishlist.tsx` + Herz-Buttons in Karten |
| **Support-Tickets** | `src/features/tickets/` + `tickets.tsx` + `ticket-new.tsx` + Nav-Eintrag |
| **Live-Chat** | `src/pages/support/chat.tsx` + Route in `router/index.tsx` |
| **Support-Portal** | `src/pages/support/portal.tsx` + Route in `router/index.tsx` |
| **Cookie-Consent** | `src/features/consent/` + Einbindung in `MainLayout.tsx` |

Nach jeder Änderung: `npx tsc --noEmit` ausführen um TypeScript-Fehler zu prüfen.

---

## 10. Produkte befüllen

### Aktueller Stand (Mock-Daten)

Im Template sind Beispiel-Produkte hinterlegt unter:
`Frontend/src/features/products/data/products.data.ts`

Diese Daten sind nur für die Vorschau gedacht und müssen durch echte Daten ersetzt werden.

### Option A — Backend-API (empfohlen)

Die API-Funktionen sind bereits vorbereitet in `src/features/products/api/productService.ts`.
Verbinde dein Backend und die Produktdaten kommen automatisch aus der Datenbank.

### Option B — Statische Daten anpassen

Öffne `products.data.ts` und passe das Array direkt an:

```ts
export const PRODUCTS: Product[] = [
  {
    id:          1,
    slug:        'mein-produkt',        // URL-freundlicher Name
    name:        'Mein Produkt',
    price:       '29.99',
    oldPrice:    '39.99',               // null wenn kein Rabatt
    badge:       'NEU',                 // null wenn kein Badge
    discount:    '-25%',                // null wenn kein Rabatt
    rating:      4.7,
    reviews:     128,
    category:    'Vitamine',
    description: 'Produktbeschreibung hier…',
    stock:       50,
    // LMIV-Pflichtangaben (für Nahrungsergänzungsmittel):
    lmiv: {
      ingredients:  'Vitamin C (L-Ascorbinsäure), Füllstoff Mikrokristalline Cellulose',
      allergens:    [],
      servingSize:  '1 Kapsel',
      netContent:   '60 Kapseln',
      nutrients: [
        { name: 'Vitamin C', per100g: '1.000 mg', perServing: '1.000 mg', nrv: '1.250 %' },
      ],
      usage:        '1 Kapsel täglich zu einer Mahlzeit',
      storageHint:  'Kühl und trocken lagern. Außer Reichweite von Kindern',
      warnings:     ['Die empfohlene tägliche Verzehrmenge nicht überschreiten'],
      manufacturer: 'Hersteller GmbH, Musterstraße 1, 12345 Musterstadt',
    },
  },
];
```

---

## 11. Rechtliche Texte anpassen

> **Wichtig:** Die rechtlichen Texte im Template sind **Platzhalter**. Du musst sie vor dem Launch anpassen — am besten mit einem Anwalt oder einem Dienst wie eRecht24 oder Trusted Shops.

### Was du unbedingt anpassen musst

| Seite | Datei | Was ändern |
|---|---|---|
| **Impressum** | `src/pages/info/impressum.tsx` | Name, Adresse, Telefon, E-Mail, Handelsregisternummer (UG) |
| **Datenschutz** | `src/pages/info/privacy.tsx` | Deinen Namen als Verantwortlichen, Datenschutz-E-Mail, konkrete Auftragsverarbeiter (Supabase-URL, Stripe-URL) |
| **AGB** | `src/pages/info/terms.tsx` | Shop-Name, Zahlungsarten, Lieferzeiten, produktspezifische Klauseln |

### Für Nahrungsergänzungsmittel zusätzlich

- **BfR-Meldung** vor dem ersten Verkauf (Bundesamt für Risikobewertung)
- **LMIV-Angaben** auf jeder Produktseite vollständig ausfüllen (Zutaten, Nährwerte, Allergene)
- **Health Claims** prüfen: Nur EU-zugelassene Aussagen über Wirkungen verwenden

### Datenschutz-E-Mail eintragen

In `src/pages/user/my-data.tsx` und `src/pages/info/privacy.tsx` an allen Stellen ersetzen:

```
datenschutz@Concepts.de  →  datenschutz@deinedomain.de
```

---

## 12. Admin-Bereich

Der Admin-Bereich ist ein **separates Projekt** (`Admin/`) und läuft unabhängig vom Shop-Frontend. Er ist für den Shop-Betreiber gedacht — nicht für Kunden.

### Was der Admin-Bereich kann

| Bereich | Funktion |
|---|---|
| **Dashboard** | Umsatz, Bestellungen, Kunden auf einen Blick |
| **Produkte** | Produkte anlegen, bearbeiten, Bilder hochladen |
| **Bestellungen** | Status verwalten (Neu → Bezahlt → Versendet → Zugestellt) |
| **Kunden** | Kundenliste, Bestellhistorie, DSGVO-Export und -Löschung |
| **Support** | Eingehende Tickets beantworten |
| **Einstellungen** | Shop-Name, Theme, Versandkosten, SMTP |

### Standard-Login (unbedingt ändern!)

> **Wichtig:** Diese Zugangsdaten sind nur für die erste Einrichtung. Vor dem Launch durch echte Zugangsdaten über Supabase Auth ersetzen.

```
E-Mail:   admin@shop.de
Passwort: admin123
```

So änderst du die Zugangsdaten dauerhaft:
- Öffne `Admin/src/stores/authStore.ts`
- Die `login`-Funktion enthält den Platzhalter-Check
- Ersetze ihn durch echte Supabase Auth (Anleitung folgt in Abschnitt 5)

### Admin lokal starten

```bash
cd Admin
npm install
npm run dev
# läuft auf http://localhost:5174
```

### Admin deployen (Vercel)

Der Admin wird als **eigenes Vercel-Projekt** deployed — getrennt vom Shop:

1. Gehe zu https://vercel.com → **"Add New Project"**
2. Wähle dasselbe Repository
3. **Root Directory** setzen auf: `Admin`
4. Auf **"Deploy"** klicken
5. Eigene Domain vergeben, z. B. `admin.deinshop.de` (unter **Settings → Domains**)

> Der Admin sollte nie auf einer öffentlich bekannten URL liegen. Eigene Domain mit Passwortschutz ist empfohlen.

### Admin-URL im Überblick

| Umgebung | URL |
|---|---|
| Lokal | `http://localhost:5174` |
| Vercel (Beispiel) | `https://shopray-admin.vercel.app` |
| Produktiv (empfohlen) | `https://admin.deinshop.de` |

---

## 13. Deployment

### Empfohlen: Vercel (einfachste Option)

1. Gehe zu https://vercel.com und melde dich mit GitHub an
2. Klicke auf **"Add New Project"**
3. Wähle dein ShopRay-Repository
4. **Root Directory** setzen auf: `Frontend`
5. Alle Umgebungsvariablen aus deiner `.env`-Datei in Vercel eintragen (unter **Settings → Environment Variables**)
6. Auf **"Deploy"** klicken

Der Shop ist danach unter einer `*.vercel.app`-Adresse erreichbar. Für deine eigene Domain: **Settings → Domains**.

### Andere Optionen

| Anbieter | Hinweis |
|---|---|
| **Netlify** | Ähnlich wie Vercel, ebenfalls kostenlos |
| **GitHub Pages** | Nur für statische Seiten, eingeschränkt |
| **Hetzner / VPS** | Für volle Kontrolle — braucht mehr technisches Wissen |

### Build-Befehl für alle Anbieter

```bash
cd Frontend && npm run build
# Output-Ordner: Frontend/dist
```

---

## 14. Pakete — Was gehört wozu

ShopRay ist modular aufgebaut. Je nach Paket kannst du Features hinzufügen oder weglassen:

| Feature | Lite | Pro | Enterprise |
|---|---|---|---|
| Shop, Warenkorb, Checkout | ✅ | ✅ | ✅ |
| 4 Themes (Dark + Light) | ✅ | ✅ | ✅ |
| DSGVO-Paket (Consent, Meine Daten) | ✅ | ✅ | ✅ |
| Kundenkonto + Bestellhistorie | ✅ | ✅ | ✅ |
| Wunschliste | ❌ | ✅ | ✅ |
| Produktbewertungen | ❌ | ✅ | ✅ |
| Support-Tickets | ❌ | ✅ | ✅ |
| Live-Chat Integration | ❌ | ❌ | ✅ |
| LMIV-Nährwerttabelle | ❌ | ✅ | ✅ |
| **Admin-Bereich** | ❌ | ✅ | ✅ |
| Source Code | ❌ | ✅ | ✅ |
| Prioritäts-Support | ❌ | ❌ | ✅ |

---

## 17. Technologie & Open Source

ShopRay basiert fast vollständig auf Open-Source-Technologien. Du bist nicht dauerhaft an einen bestimmten Anbieter gebunden — die meisten Teile kannst du austauschen oder selbst betreiben.

### Überblick: Was ist Open Source?

| Technologie | Rolle | Lizenz | Selbst hostbar |
|---|---|---|---|
| **React** | Frontend-Framework | MIT | — |
| **TypeScript** | Sprache | Apache 2.0 | — |
| **Vite** | Build-Tool | MIT | — |
| **Express.js** | Backend-Server | MIT | — |
| **Nodemailer** | E-Mail-Versand | MIT | — |
| **Zustand** | State Management | MIT | — |
| **PostgreSQL** | Datenbank | PostgreSQL License | ✅ ja |
| **Supabase** | Auth + Datenbank-Host | Apache 2.0 | ✅ ja |
| **Stripe** | Zahlungsabwicklung | proprietär (closed) | ❌ nein |

**Einzige Ausnahme: Stripe.** Stripe ist ein externer Zahlungsdienst — sein Code läuft ausschließlich auf Stripes eigenen Servern. In ShopRay wird Stripe nur über HTTP-Aufrufe angesprochen. Du hast keinen Zugriff auf Stripes Quellcode und brauchst ihn nicht.

---

### Supabase selbst hosten

Supabase ist vollständig Open Source und kann auf einem eigenen Server betrieben werden — ohne Cloud-Abhängigkeit.

**Was du brauchst:**
- Einen VPS (z.B. Hetzner, Contabo) mit mindestens 4 GB RAM
- Docker

**Offizieller Self-Hosting Guide:**
https://supabase.com/docs/guides/self-hosting/docker

**Einzige Anpassung in ShopRay:**
In deiner `.env`-Datei tauschst du die Supabase-URL aus:
```env
# Vorher (Supabase Cloud):
VITE_SUPABASE_URL=https://xxxx.supabase.co

# Nachher (selbst gehostet):
VITE_SUPABASE_URL=https://supabase.deineserver.de
```

Die Datenbank selbst ist normales PostgreSQL — dein Schema (`database/schema.sql`) funktioniert auf jeder PostgreSQL-Installation identisch.

---

### Stripe-Alternativen

Wenn du Stripe nicht verwenden möchtest, kannst du das Backend gegen einen anderen Anbieter tauschen. Nur die Datei `Backend/src/routes/orders.ts` und der Webhook-Handler `Backend/src/routes/stripe.ts` müssen angepasst werden.

| Alternative | Besonderheit |
|---|---|
| **Mollie** | Beliebt in DACH, unterstützt iDEAL, SEPA |
| **PayPal** | Breite Akzeptanz, eigener SDK |
| **Lemon Squeezy** | Übernimmt EU-VAT, ideal für digitale Produkte |
| **Paddle** | Ähnlich wie Lemon Squeezy, Merchant of Record |

> **Empfehlung:** Für physische Produkte im DACH-Raum ist Stripe die zuverlässigste Wahl. Für digitale Produkte (Templates, Software) übernimmt Lemon Squeezy die Umsatzsteuer automatisch.

---

### Fazit: Kein Lock-in

Du kannst ShopRay betreiben ohne einem einzigen Cloud-Anbieter dauerhaft zu vertrauen:

- **Supabase** → selbst hosten mit Docker
- **Stripe** → gegen Mollie, PayPal oder Paddle tauschen
- **Vercel** → gegen Netlify, Hetzner oder jeden anderen Hoster tauschen
- **Datenbank** → normales PostgreSQL, portierbar auf jeden Server

Der gesamte Code bleibt bei dir. Kein Vendor hält deinen Shop als Geisel.

---

## Hilfe & Support

Bei Fragen zum Template:
- GitHub Issues: [Link zu deinem Repo]
- E-Mail: [deine Support-Adresse]

Bei Fragen zu externen Diensten:
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs

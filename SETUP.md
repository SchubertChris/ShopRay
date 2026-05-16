# ShopRay — Setup Guide

**Version:** 1.6.0 | **Letzte Aktualisierung:** 2026-05-17

Dieser Guide führt dich Schritt für Schritt durch die Einrichtung deines ShopRay-Templates —
von der Installation bis zum fertigen, live geschalteten Shop.

---

## Inhalt

1. [Voraussetzungen](#1-voraussetzungen)
2. [Installation](#2-installation)
3. [Umgebungsvariablen einrichten](#3-umgebungsvariablen-einrichten)
4. [Datenbank einrichten](#4-datenbank-einrichten)
5. [Supabase anbinden](#5-supabase-anbinden)
6. [Stripe anbinden](#6-stripe-anbinden)
7. [Backend starten & Webhook einrichten](#7-backend--webhook)
8. [E-Mail-Versand einrichten](#8-e-mail-versand-einrichten)
9. [Theme wählen](#9-theme-wählen)
10. [Shop-Name & Firmendaten einrichten](#10-shop-name--firmendaten-einrichten)
11. [Features aktivieren oder deaktivieren](#11-features-aktivieren-oder-deaktivieren)
12. [Produkte befüllen](#12-produkte-befüllen)
13. [Rechtliche Texte anpassen](#13-rechtliche-texte-anpassen)
14. [Admin-Bereich einrichten](#14-admin-bereich-einrichten)
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
- **Vercel** (kostenlos) — https://vercel.com

---

## 2. Installation

ShopRay besteht aus drei separaten Projekten in einem Repository: **Frontend**, **Backend** und **Admin**.

### Schritt 1 — Abhängigkeiten installieren

Öffne dein Terminal und führe folgende Befehle aus:

```bash
# Frontend
cd ShopRay/Frontend && npm install

# Backend
cd ../Backend && npm install

# Admin
cd ../Admin && npm install
```

### Schritt 2 — Umgebungsvariablen vorbereiten

Jedes Projekt hat eine eigene `.env`-Datei:

```bash
# Frontend
cp ShopRay/Frontend/.env.example ShopRay/Frontend/.env

# Backend
cp ShopRay/Backend/.env.example ShopRay/Backend/.env

# Admin
cp ShopRay/Admin/.env.example ShopRay/Admin/.env
```

### Schritt 3 — Entwicklungsserver starten

```bash
# Terminal 1 — Frontend
cd ShopRay/Frontend && npm run dev
# → http://localhost:5173

# Terminal 2 — Backend
cd ShopRay/Backend && npm run dev
# → http://localhost:5000

# Terminal 3 — Admin
cd ShopRay/Admin && npm run dev
# → http://localhost:5174
```

---

## 3. Umgebungsvariablen einrichten

> **Wichtig:** `.env`-Dateien dürfen **niemals** in Git hochgeladen werden. Sie sind bereits in `.gitignore` eingetragen.

### Frontend/.env

```env
VITE_API_URL=https://api.deinshop.de         # URL deines Backends
VITE_SUPABASE_URL=https://xxxx.supabase.co   # Supabase Projekt-URL
VITE_SUPABASE_ANON_KEY=eyJ...                # Supabase anon Key (public)
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxx          # Stripe publishable Key
```

### Backend/.env

```env
SUPABASE_URL=https://xxxx.supabase.co        # Supabase Projekt-URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...             # Supabase service_role Key (geheim!)
STRIPE_SECRET_KEY=sk_live_xxxx              # Stripe Secret Key (geheim!)
STRIPE_WEBHOOK_SECRET=whsec_xxxx            # Stripe Webhook Signing Secret
JWT_SECRET=ein-sehr-langer-zufaelliger-string
ADMIN_PASSWORD_HASH=$2b$12$...              # bcrypt-Hash deines Admin-Passworts
CLIENT_URL=https://deinshop.de              # Shop-URL (für Stripe Redirect nach Zahlung)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxxx
SMTP_FROM_EMAIL=bestellung@deinshop.de
ADMIN_URL=https://admin.deinshop.de
NODE_ENV=production
DEMO_MODE=false                             # true = alle Schreibzugriffe im Admin gesperrt
```

### Admin/.env

```env
VITE_API_URL=https://api.deinshop.de         # URL deines Backends
```

---

## 4. Datenbank einrichten

Alle Datenbankänderungen liegen als SQL-Dateien im Ordner `database/`. Sie müssen einmalig im Supabase SQL-Editor ausgeführt werden.

### Schritt 1 — Schema anlegen

1. Gehe zu **supabase.com → Dein Projekt → SQL Editor**
2. Öffne `database/schema.sql`, kopiere den Inhalt und klicke **"Run"**

Das legt folgende Tabellen an:

| Tabelle | Inhalt |
|---|---|
| `profiles` | Kundendaten (Name, Adresse, Rolle) |
| `products` | Produkte (Preis, Beschreibung, Lager) |
| `orders` | Bestellungen mit Status-Verlauf |
| `order_items` | Einzelne Artikel je Bestellung |
| `reviews` | Produktbewertungen |
| `tickets` | Support-Tickets |

### Schritt 2 — Migrationen ausführen

Führe die Migrationen **der Reihe nach** aus — jede als eigene Query im SQL Editor:

| Datei | Was sie macht |
|---|---|
| `database/migration_001_products_detail.sql` | Erweiterte Produktfelder (Highlights, Zertifikate, LMIV) |
| `database/migration_002_admin_login_log.sql` | Login-Protokoll für den Admin-Bereich |
| `database/migration_003_product_images.sql` | Supabase Storage Bucket für Produktbilder |
| `database/migration_004_grants.sql` | Berechtigungen für alle Tabellen |
| `database/migration_005_shipping_settings.sql` | Versandkosten-Konfiguration |
| `database/migration_006_admin_totp.sql` | Admin-2FA Tabelle (TOTP) |
| `database/migration_007_categories.sql` | Kategorien-Tabelle für den Admin-Bereich |

> **Reihenfolge wichtig:** Führe die Migrationen immer in der Reihenfolge 001 → 002 → … → 007 aus.

### Was passiert automatisch

- Wenn sich ein Nutzer registriert → Profil wird automatisch angelegt
- Wenn eine Bewertung geändert wird → Produkt-Rating wird aktualisiert
- Alle Tabellen haben **Row Level Security (RLS)** — jeder Nutzer sieht nur seine eigenen Daten

---

## 5. Supabase anbinden

### Schritt 1 — Projekt erstellen

1. Gehe zu https://supabase.com und melde dich an
2. Klicke auf **"New Project"**
3. Wähle als Region **"Central EU (Frankfurt)"** — wichtig für DSGVO
4. Vergib einen Projektnamen und ein sicheres Datenbankpasswort
5. Warte ca. 2 Minuten bis das Projekt bereit ist

### Schritt 2 — API-Keys kopieren

1. In deinem Supabase-Projekt: **Settings → API**
2. Kopiere **"Project URL"** → in beide `.env`-Dateien als `VITE_SUPABASE_URL` (Frontend) und `SUPABASE_URL` (Backend)
3. Kopiere **"anon public"** Key → in `Frontend/.env` als `VITE_SUPABASE_ANON_KEY`
4. Kopiere **"service_role"** Key → in `Backend/.env` als `SUPABASE_SERVICE_ROLE_KEY`

> **Nicht verwechseln:** Der `anon`-Key kommt ins Frontend, der `service_role`-Key nur ins Backend. Der `service_role`-Key hat vollen Datenbankzugriff — er darf nie öffentlich werden.

### Schritt 3 — Authentifizierung konfigurieren

1. In Supabase: **Authentication → URL Configuration**
2. **Site URL** setzen: deine Shop-Domain (z.B. `https://meinshop.de`)
3. Unter **Redirect URLs** folgende Einträge hinzufügen:
   ```
   https://meinshop.de/auth/reset-password
   http://localhost:5173/auth/reset-password
   ```
   Diese URL wird für den Passwort-Zurücksetzen-Link in der E-Mail benötigt.

### Schritt 4 — E-Mail-Bestätigung deaktivieren

Standardmäßig schickt Supabase nach der Registrierung eine Bestätigungs-E-Mail. Bis du einen eigenen SMTP-Server eingerichtet hast, solltest du das deaktivieren:

1. In Supabase: **Authentication → Sign In / Providers → Email**
2. Den Toggle **"Confirm email"** ausschalten
3. **Save** klicken

> Wenn du später einen eigenen SMTP-Anbieter einrichtest (Abschnitt 8), kannst du dies wieder aktivieren.

### Schritt 5 — 2-Faktor-Authentifizierung aktivieren (empfohlen)

ShopRay unterstützt TOTP-basierte 2FA (Google Authenticator, Authy etc.) für Kundenkonten.

1. In Supabase: **Authentication → Sign In / Up**
2. Unter **Multi-Factor Authentication** → **TOTP** auf **Enabled** setzen

Kunden können 2FA danach selbst in ihren Kontoeinstellungen aktivieren.

### Schritt 6 — Google-Login einrichten (optional)

ShopRay unterstützt Login und Registrierung mit einem Google-Konto. Dafür brauchst du eine Google Cloud-App.

**Google Cloud Console:**

1. Gehe zu https://console.cloud.google.com
2. Neues Projekt anlegen (oder ein bestehendes verwenden)
3. **APIs & Dienste → OAuth-Zustimmungsbildschirm** → "Extern" auswählen → App-Name + E-Mail ausfüllen
4. **APIs & Dienste → Anmeldedaten → Anmeldedaten erstellen → OAuth 2.0-Client-ID**
5. Anwendungstyp: **Webanwendung**
6. Autorisierte Weiterleitungs-URIs hinzufügen:
   ```
   https://DEINE-SUPABASE-URL.supabase.co/auth/v1/callback
   ```
   (Die URL findest du in Supabase unter Settings → API → Project URL)
7. **Client-ID** und **Client-Secret** kopieren

**In Supabase:**

1. **Authentication → Sign In / Providers → Google**
2. Toggle **"Enable"** einschalten
3. **Client ID** und **Client Secret** aus Google eintragen
4. **Save**

Nach diesem Schritt funktionieren die "Mit Google anmelden" und "Mit Google registrieren" Buttons im Shop automatisch.

### Schritt 7 — E-Mail-Templates anpassen (optional)

1. In Supabase: **Authentication → Email Templates**
2. Passe die Vorlagen für "Confirm signup", "Reset Password" und "Magic Link" mit deinem Shop-Namen und deiner Marke an

---

## 6. Stripe anbinden

### Schritt 1 — Konto und Keys

1. Gehe zu https://stripe.com und melde dich an
2. Im Dashboard: **Developers → API Keys**
3. Kopiere den **"Publishable key"** (beginnt mit `pk_live_`) → `Frontend/.env` als `VITE_STRIPE_PUBLIC_KEY`
4. Kopiere den **"Secret key"** (beginnt mit `sk_live_`) → `Backend/.env` als `STRIPE_SECRET_KEY`

> **Wichtig:** Den Secret Key niemals ins Frontend — nur ins Backend!

### Schritt 2 — Testmodus

Während der Entwicklung arbeite mit Test-Keys (`pk_test_...`, `sk_test_...`). Testkarte die immer funktioniert: `4242 4242 4242 4242`, Ablaufdatum: beliebig in der Zukunft, CVC: beliebig.

### Schritt 3 — Webhook einrichten

Der Webhook wird nach dem Backend-Deployment eingerichtet (siehe Schritt 7).

---

## 7. Backend & Webhook

> **Hinweis:** Das Backend hat eingebautes Rate-Limiting (100 Anfragen / 15 Minuten global, strengere Limits für Login und Checkout). Bei einem Serverneustart werden die Limits zurückgesetzt.

### Schritt 1 — Backend lokal starten

```bash
cd Backend
npm install
npm run dev
# Test: http://localhost:5000/api/health → {"status":"ok"}
```

### Schritt 2 — Stripe Webhook lokal testen

Installiere die [Stripe CLI](https://stripe.com/docs/stripe-cli) und führe aus:

```bash
stripe login
stripe listen --forward-to localhost:5000/api/webhook/stripe
```

Die CLI zeigt einen **Webhook Signing Secret** (`whsec_...`) — trage ihn in `Backend/.env` als `STRIPE_WEBHOOK_SECRET` ein.

### Schritt 3 — Backend deployen (Vercel)

Sieh Abschnitt 15 für die vollständige Deployment-Anleitung mit Vercel.

### Schritt 4 — Stripe Webhook in Produktion

Nach dem Deployment:

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://DEINE-BACKEND-URL.vercel.app/api/webhook/stripe`
3. Events: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`
4. **Signing Secret** kopieren → in Vercel Backend-Projekt als `STRIPE_WEBHOOK_SECRET`

### Backend-Endpunkte Übersicht

| Methode | Route | Beschreibung |
|---|---|---|
| GET | `/api/health` | Status-Check |
| POST | `/api/webhook/stripe` | Stripe-Events (intern) |
| GET | `/api/products` | Alle aktiven Produkte |
| GET | `/api/products/:slug` | Einzelnes Produkt |
| GET | `/api/settings/shipping` | Versandkosten-Einstellungen (öffentlich) |
| POST | `/api/orders/checkout` | Stripe Checkout starten |
| GET | `/api/orders` | Eigene Bestellungen (Auth) |
| GET | `/api/customers/me` | Eigenes Profil (Auth) |
| GET | `/api/customers/me/export` | DSGVO-Datenexport (Auth) |
| DELETE | `/api/customers/me` | Konto löschen (DSGVO Art. 17) |
| POST | `/api/contact` | Kontaktanfrage senden |
| POST | `/api/admin/login` | Admin-Login |
| GET | `/api/admin/products` | Alle Produkte (Admin) |
| GET | `/api/admin/categories` | Kategorien-Liste (Admin) |
| POST | `/api/admin/categories` | Kategorie anlegen (Admin) |
| DELETE | `/api/admin/categories/:id` | Kategorie löschen (Admin) |
| GET | `/api/admin/reviews` | Bewertungen verwalten (Admin) |
| PATCH | `/api/admin/reviews/:id/verify` | Bewertung freischalten (Admin) |
| PATCH | `/api/admin/reviews/:id/reject` | Bewertung ablehnen (Admin) |
| DELETE | `/api/admin/reviews/:id` | Bewertung löschen (Admin) |
| GET | `/api/admin/customers` | Kundenliste (Admin) |
| GET | `/api/admin/customers/:id` | Kundenprofil + DSGVO-Export (Admin) |
| PATCH | `/api/admin/customers/:id/role` | Kundenrolle ändern (Admin) |
| DELETE | `/api/admin/customers/:id` | Kunden löschen (Admin) |
| GET | `/api/admin/orders` | Bestellungen (Admin) |
| PATCH | `/api/admin/orders/:id/status` | Bestellstatus ändern (Admin) |
| PUT | `/api/admin/settings/shipping` | Versandkosten speichern (Admin) |

---

## 8. E-Mail-Versand einrichten

Der Shop sendet automatisch E-Mails für Bestellbestätigungen, Passwort-Reset und Ticket-Antworten.

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
4. In `Backend/.env` eintragen:
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASS=re_xxxx
   SMTP_FROM_EMAIL=bestellung@deinshop.de
   ```

> **Hinweis:** SMTP wird nur im Backend genutzt — kein API-Key kommt ins Frontend.

---

## 9. Theme wählen

ShopRay kommt mit **4 Farbpaletten**, jede in **Dark und Light Mode** — macht 8 Themes gesamt.

| Palette | Charakter | Geeignet für |
|---|---|---|
| **sage** | Naturgrün, beruhigend | Bio, Wellness, Gesundheit |
| **navy** | Dunkelblau, professionell | Premium, B2B, Elektronik |
| **terra** | Erdtöne, warm | Mode, Lifestyle, Wohnen |
| **electric** | Leuchtendes Blau, modern | Streetwear, Gaming, Tech |

### Standard-Theme ändern

Öffne [Frontend/src/providers/ThemeProvider.tsx](Frontend/src/providers/ThemeProvider.tsx) und ändere den Standardwert:

```tsx
// Palette: 'sage' | 'navy' | 'terra' | 'electric'
() => (localStorage.getItem('sr-palette') as Palette) ?? 'sage'

// Mode: 'light' | 'dark'
() => (localStorage.getItem('sr-mode') as ThemeMode) ?? 'light'
```

> Der Benutzer kann das Theme selbst über den Theme-Umschalter im Shop ändern. Deine Einstellung gilt nur als Standard für Neu-Besucher.

---

## 10. Shop-Name & Firmendaten einrichten

Alle Shop- und Firmendaten sind zentral in einer Datei konfiguriert:
[Frontend/src/config/app.ts](Frontend/src/config/app.ts)

Änderungen dort werden automatisch in Header, Footer, Impressum, Datenschutz und Widerrufsbelehrung übernommen.

```ts
export const APP_NAME    = 'Dein Shop Name';
export const APP_URL     = 'https://deine-domain.de';
export const APP_TAGLINE = 'Kurzer Slogan für den Footer';

export const APP_COMPANY = {
  owner:   'Max Mustermann',
  street:  'Musterstraße 1',
  zip:     '12345',
  city:    'Musterstadt',
  country: 'Deutschland',
  ustId:   'DE 123 456 789',
  hrb:     '',
};

export const APP_CONTACT = {
  email:   'hello@deine-domain.de',
  phone:   '+49 30 000 000 00',
  address: 'Musterstraße 1, 12345 Musterstadt',
};
```

> **Wichtig:** Trage echte Daten ein — Platzhalter sind nicht für den Live-Betrieb geeignet. Falsche Impressumsangaben sind abmahnfähig.

---

## 11. Features aktivieren oder deaktivieren

Ändere in `Frontend/src/config/features.ts` die Werte:

```ts
export const FEATURES = {
  reviews:  true,   // Produktbewertungen
  wishlist: true,   // Wunschliste
  tickets:  true,   // Support-Tickets
  chat:     false,  // Live-Chat
};
```

### Features vollständig entfernen

| Feature | Zu entfernen |
|---|---|
| **Bewertungen** | `src/features/reviews/` + Tab in `product-detail.tsx` |
| **Wunschliste** | `src/features/wishlist/` + `wishlist.tsx` + Herz-Buttons |
| **Support-Tickets** | `src/features/tickets/` + `tickets.tsx` + `ticket-new.tsx` |
| **Live-Chat** | `src/pages/support/chat.tsx` + Route in `router/index.tsx` |

Nach jeder Änderung: `npx tsc --noEmit` ausführen um TypeScript-Fehler zu prüfen.

---

## 12. Produkte befüllen

Produkte werden über den **Admin-Bereich** angelegt (empfohlen) oder direkt per SQL in die Datenbank eingefügt.

### Option A — Admin-Bereich (empfohlen)

1. Admin-Panel öffnen → **Produkte → Neues Produkt**
2. Alle Felder ausfüllen: Name, Preis, Beschreibung, Bilder, Kategorie
3. Auf **"Speichern"** klicken — das Produkt ist sofort im Shop sichtbar

### Option B — Seed-Daten (für Tests)

Im Ordner `database/seed.sql` liegt eine Datei mit Beispielprodukten. Diese kannst du einmalig im SQL Editor ausführen um den Shop mit Testdaten zu befüllen.

---

## 13. Rechtliche Texte anpassen

> **Wichtig:** Die rechtlichen Texte im Template sind Platzhalter. Vor dem Launch anpassen — am besten mit einem Anwalt oder einem Dienst wie eRecht24 oder Trusted Shops.

### Firmendaten — werden automatisch übernommen

Wenn du deine Daten in `Frontend/src/config/app.ts` einträgst (Abschnitt 10), werden sie automatisch in folgende Seiten übernommen:
- `/impressum` — Name, Adresse, USt-ID, Kontakt
- `/datenschutz` — Name des Verantwortlichen, Kontakt-E-Mail
- `/widerruf` — Unternehmensanschrift im Widerrufsformular

### Restliche Texte manuell prüfen

| Seite | Datei | Was anpassen |
|---|---|---|
| **AGB** | `src/pages/info/terms.tsx` | Zahlungsarten, Lieferzeiten |
| **Datenschutz** | `src/pages/info/privacy.tsx` | Auftragsverarbeiter eintragen |
| **Widerruf** | `src/pages/info/widerruf.tsx` | Prüfen ob Muster passt |
| **Versand** | Automatisch aus Admin-Panel | Kein manueller Eingriff nötig |

### Newsletter — wichtiger Hinweis

Das Template enthält kein Double-Opt-In. Nach § 7 Abs. 2 Nr. 3 UWG ist ein bestätigter Opt-In für Werbemails Pflicht. Wenn du einen Newsletter anbietest, musst du einen externen Anbieter (Mailchimp, Brevo, Klaviyo) integrieren.

### Für Nahrungsergänzungsmittel zusätzlich

- **BfR-Meldung** vor dem ersten Verkauf
- **LMIV-Angaben** auf jeder Produktseite vollständig ausfüllen
- **Health Claims** prüfen: Nur EU-zugelassene Aussagen verwenden

---

## 14. Admin-Bereich einrichten

Der Admin-Bereich ist ein separates Projekt (`Admin/`) und läuft unabhängig vom Shop-Frontend.

### Was der Admin-Bereich kann

| Bereich | Funktion |
|---|---|
| **Dashboard** | Umsatz, Bestellungen, Kunden auf einen Blick |
| **Produkte** | Anlegen, bearbeiten (Stift-Icon oder Doppelklick), Bilder hochladen |
| **Bestellungen** | Status verwalten (Neu → Bezahlt → Versendet → Zugestellt) |
| **Kunden** | Kundenliste, Bestellhistorie, DSGVO-Export (Art. 20) und -Löschung (Art. 17) |
| **Kategorien** | Kategorien anlegen, Reihenfolge festlegen, löschen |
| **Bewertungen** | Freischalten, ablehnen oder löschen — mit Tab-Filter |
| **Support** | Eingehende Kontaktanfragen und Tickets beantworten |
| **Einstellungen → Versand** | Versandkosten, Gratisversand-Grenze, Lieferzeit live konfigurieren |
| **Einstellungen → Sicherheit** | Login-Protokoll — jeder Admin-Login wird aufgezeichnet |

### Versandkosten konfigurieren

Die Versandkosten werden **ausschließlich im Admin-Panel** eingestellt — keine Codeänderung nötig:

1. Admin-Panel → **Einstellungen → Versand**
2. Standardversand, Expressversand, Gratisversand-Grenze und Lieferzeit einstellen
3. Auf **"Speichern"** klicken

Änderungen werden sofort im Checkout und auf der Versand-Infoseite des Shops sichtbar.

### Admin-Login einrichten

**Schritt 1 — Sicheres Passwort hashen:**

```bash
cd Backend
node -e "const b = require('bcrypt'); b.hash('DEIN-PASSWORT', 12).then(h => console.log(h));"
```

Den Hash (`$2b$12$...`) in `Backend/.env` als `ADMIN_PASSWORD_HASH` eintragen.

**Schritt 2 — JWT Secret generieren:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'));"
```

Den Wert in `Backend/.env` als `JWT_SECRET` eintragen.

> **Wichtig:** Das Standard-Passwort aus dem Template muss vor dem Launch geändert werden!

### Admin lokal starten

```bash
cd Admin && npm install && npm run dev
# → http://localhost:5174
```

---

## 15. Deployment

ShopRay besteht aus drei separaten Vercel-Projekten im gleichen GitHub-Repository (**Monorepo**).

### Schritt 1 — GitHub Repository einrichten

1. Erstelle ein neues **privates** Repository auf https://github.com/new
2. Kein README, kein .gitignore anhaken
3. In deinem ShopRay-Ordner:

```bash
git remote add origin git@github.com:DEIN-USERNAME/ShopRay.git
git push -u origin main
```

### Schritt 2 — Drei Vercel-Projekte anlegen

Für **Frontend**, **Backend** und **Admin** je ein eigenes Vercel-Projekt:

1. https://vercel.com → **"Add New Project"**
2. GitHub-Repository auswählen
3. **Root Directory** setzen — das ist entscheidend:

| Vercel-Projekt | Root Directory | Framework |
|---|---|---|
| shopray (Frontend) | `Frontend` | Vite |
| shopray-backend | `Backend` | Node.js |
| shopray-admin | `Admin` | Vite |

4. Alle Umgebungsvariablen aus der jeweiligen `.env`-Datei in Vercel eintragen (**Settings → Environment Variables**)
5. Deployen

### Schritt 3 — GitHub mit bestehenden Vercel-Projekten verbinden

Falls du bereits Vercel-Projekte hast und nachträglich GitHub verbindest:

1. Vercel → Dein Projekt → **Settings → Git**
2. **"Connect Git Repository"** → GitHub → dein Repo auswählen
3. Vercel → **Settings → Build and Deployment → Root Directory** → passenden Ordner eintragen
4. **Save** klicken

Ab jetzt deployed Vercel automatisch bei jedem `git push`.

### Schritt 4 — Eigene Domain (empfohlen)

| Projekt | Empfohlene Domain |
|---|---|
| Frontend | `deinshop.de` |
| Backend | `api.deinshop.de` |
| Admin | `admin.deinshop.de` |

In Vercel: **Settings → Domains → Add** → Domain eintragen → DNS-Einträge wie angegeben setzen.

> Der Admin sollte nie auf einer öffentlich bekannten URL liegen. Eigene Domain mit Passwortschutz empfohlen.

### Schritt 5 — Nach dem Deployment prüfen

Öffne diese URLs und prüfe ob alles funktioniert:

| URL | Erwartetes Ergebnis |
|---|---|
| `https://BACKEND-URL/api/health` | `{"status":"ok"}` |
| `https://SHOP-URL` | Shop-Startseite lädt |
| `https://ADMIN-URL` | Login-Seite erscheint |
| `https://SHOP-URL/register` | Registrierung funktioniert |
| `https://SHOP-URL/login` | Login funktioniert |

Wenn `/api/health` nicht `{"status":"ok"}` zurückgibt, prüfe die Umgebungsvariablen im Vercel Backend-Projekt.

### Schritt 6 — Demo-Modus (optional)

Wenn du ShopRay als Demo präsentieren möchtest ohne dass Änderungen dauerhaft gespeichert werden:

1. In Vercel Backend-Projekt → **Settings → Environment Variables**
2. `DEMO_MODE` auf `true` setzen → Redeploy

Im Demo-Modus sind alle schreibenden Admin-Operationen gesperrt (HTTP 403). Login, Logout und alle GET-Requests funktionieren normal. Zum Zurücksetzen der Demo-Daten: `database/seed.sql` im Supabase SQL-Editor ausführen.

---

## 16. Pakete — Was gehört wozu

| Feature | Lite | Pro | Enterprise |
|---|---|---|---|
| Shop, Warenkorb, Checkout | ✅ | ✅ | ✅ |
| 4 Themes (Dark + Light) | ✅ | ✅ | ✅ |
| DSGVO-Paket (Consent, Meine Daten) | ✅ | ✅ | ✅ |
| Kundenkonto + Bestellhistorie | ✅ | ✅ | ✅ |
| 2-Faktor-Authentifizierung (TOTP) | ✅ | ✅ | ✅ |
| Wunschliste | ❌ | ✅ | ✅ |
| Produktbewertungen | ❌ | ✅ | ✅ |
| Support-Tickets | ❌ | ✅ | ✅ |
| Live-Chat Integration | ❌ | ❌ | ✅ |
| LMIV-Nährwerttabelle | ❌ | ✅ | ✅ |
| **Admin-Bereich** | ❌ | ✅ | ✅ |
| **Admin: Versandkosten konfigurieren** | ❌ | ✅ | ✅ |
| **Admin: Kategorien-Manager** | ❌ | ✅ | ✅ |
| **Admin: Bewertungs-Moderation** | ❌ | ✅ | ✅ |
| Source Code | ❌ | ✅ | ✅ |
| Prioritäts-Support | ❌ | ❌ | ✅ |

---

## 17. Technologie & Open Source

ShopRay basiert fast vollständig auf Open-Source-Technologien.

| Technologie | Rolle | Lizenz | Selbst hostbar |
|---|---|---|---|
| **React** | Frontend-Framework | MIT | — |
| **TypeScript** | Sprache | Apache 2.0 | — |
| **Vite** | Build-Tool | MIT | — |
| **Express.js** | Backend-Server | MIT | — |
| **Zod** | Input-Validierung | MIT | — |
| **Nodemailer** | E-Mail-Versand | MIT | — |
| **Zustand** | State Management | MIT | — |
| **PostgreSQL** | Datenbank | PostgreSQL License | ✅ ja |
| **Supabase** | Auth + Datenbank-Host | Apache 2.0 | ✅ ja |
| **Stripe** | Zahlungsabwicklung | proprietär | ❌ nein |

### Supabase selbst hosten

Supabase ist vollständig Open Source und kann auf einem eigenen Server betrieben werden:

- VPS mit mindestens 4 GB RAM (z.B. Hetzner, Contabo)
- Docker
- Offizieller Guide: https://supabase.com/docs/guides/self-hosting/docker

In der `.env` einfach die URL tauschen:
```env
VITE_SUPABASE_URL=https://supabase.deineserver.de
SUPABASE_URL=https://supabase.deineserver.de
```

### Stripe-Alternativen

| Alternative | Besonderheit |
|---|---|
| **Mollie** | Beliebt in DACH, unterstützt iDEAL, SEPA |
| **PayPal** | Breite Akzeptanz |
| **Lemon Squeezy** | Übernimmt EU-VAT, ideal für digitale Produkte |
| **Paddle** | Merchant of Record, automatische Steuerabwicklung |

---

## Hilfe & Support

Bei Fragen zum Template:
- GitHub Issues: https://github.com/SchubertChris/ShopRay/issues
- E-Mail: [deine Support-Adresse]

Bei Fragen zu externen Diensten:
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs

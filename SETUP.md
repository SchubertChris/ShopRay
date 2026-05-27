# ShopRay — Setup Guide

**Version:** 2.0.0 | **Letzte Aktualisierung:** 2026-05-27

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
9. [Rechnungen einrichten](#9-rechnungen-einrichten)
10. [DHL Versandlabels einrichten](#10-dhl-versandlabels-einrichten)
11. [Push-Benachrichtigungen einrichten](#11-push-benachrichtigungen-einrichten)
12. [Newsletter (Brevo) einrichten](#12-newsletter-brevo-einrichten)
13. [Theme wählen](#13-theme-wählen)
14. [Shop-Name & Firmendaten einrichten](#14-shop-name--firmendaten-einrichten)
15. [Features aktivieren oder deaktivieren](#15-features-aktivieren-oder-deaktivieren)
16. [Produkte befüllen](#16-produkte-befüllen)
17. [Rechtliche Texte anpassen](#17-rechtliche-texte-anpassen)
18. [Admin-Bereich einrichten](#18-admin-bereich-einrichten)
19. [Deployment (Veröffentlichen)](#19-deployment)
20. [Was gehört zu welchem Paket?](#20-pakete--was-gehört-wozu)
21. [Technologie & Open Source](#21-technologie--open-source)

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
# ── Supabase ─────────────────────────────────────────────────────────────────
SUPABASE_URL=https://xxxx.supabase.co        # Supabase Projekt-URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...             # Supabase service_role Key (geheim!)

# ── Stripe ───────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_xxxx              # Stripe Secret Key (geheim!)
STRIPE_WEBHOOK_SECRET=whsec_xxxx            # Stripe Webhook Signing Secret

# ── Admin-Auth ────────────────────────────────────────────────────────────────
JWT_SECRET=ein-sehr-langer-zufaelliger-string
ADMIN_PASSWORD_HASH=$2b$12$...              # bcrypt-Hash deines Admin-Passworts
ADMIN_URL=https://admin.deinshop.de         # Admin-Panel-URL — MUSS exakt stimmen!

# ── URLs ──────────────────────────────────────────────────────────────────────
CLIENT_URL=https://deinshop.de              # Shop-URL (für Stripe Redirect nach Zahlung)
NODE_ENV=production
DEMO_MODE=false                             # true = alle Schreibzugriffe im Admin gesperrt

# ── E-Mail (SMTP) ─────────────────────────────────────────────────────────────
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxxx
SMTP_FROM_EMAIL=bestellung@deinshop.de
SMTP_FROM_NAME=Mein Shop                    # Absendername in E-Mails

# ── Shop-Daten für Rechnungs-PDF (§14 UStG) ──────────────────────────────────
# Diese Angaben erscheinen auf jeder generierten Rechnung
SHOP_NAME=Mein Shop GmbH
SHOP_STREET=Musterstraße 1
SHOP_ZIP=12345
SHOP_CITY=Musterstadt
SHOP_COUNTRY=Deutschland
SHOP_EMAIL=info@deinshop.de
SHOP_PHONE=+49 30 000 000 00               # optional
SHOP_VAT_ID=DE123456789                    # Umsatzsteuer-ID (empfohlen)
SHOP_TAX_NUMBER=12/345/67890               # Steuernummer (alternative zu VAT_ID)
INVOICE_PREFIX=RE                          # Rechnungsnummern-Präfix (RE-2026-00001)

# ── DHL Versandlabels ─────────────────────────────────────────────────────────
# Credentials aus dem DHL Geschäftskunden-Portal (developer.dhl.com)
DHL_API_KEY=dein-dhl-api-key               # DHL Business API Key
DHL_BILLING_NUMBER=12345678012082          # 14-stellige Abrechnungsnummer aus DHL-Vertrag
DHL_SHIPPER_NAME=Mein Shop GmbH            # Absender-Name auf dem Label
DHL_SHIPPER_STREET=Musterstraße 1          # Absender-Straße + Hausnummer
DHL_SHIPPER_ZIP=12345                      # Absender-PLZ
DHL_SHIPPER_CITY=Musterstadt               # Absender-Stadt
DHL_SANDBOX=true                           # auf false setzen für echte Labels in Produktion

# ── Push-Benachrichtigungen (VAPID) ──────────────────────────────────────────
# Einmalig generieren: node -e "require('web-push').generateVAPIDKeys()"
VAPID_PUBLIC_KEY=BGJBw...                  # VAPID Public Key (beginnt mit B)
VAPID_PRIVATE_KEY=FazEa...                 # VAPID Private Key (geheim!)
VAPID_EMAIL=mailto:admin@deinshop.de       # Kontakt-E-Mail für Push-Service
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

> **Frisch-Installation:** `schema.sql` aus Schritt 1 enthält bereits alle Änderungen bis Migration 029. Du musst danach **nur noch Migrationen 030–032** ausführen.
>
> **Bestehende Datenbank aktualisieren:** Führe alle Migrationen die du noch nicht ausgeführt hast einzeln der Reihe nach aus.

#### Pflicht nach Frisch-Installation (030–032)

| Datei | Was sie macht |
|---|---|
| `database/migration_030_discount_atomic.sql` | Atomarer Rabatt-Zähler (race-condition-sicher bei parallelen Bestellungen) |
| `database/migration_031_team_lead_refund_requests.sql` | Teamleiter-Rolle + Erstattungsanträge-Tabelle (4-Augen-Prinzip) |
| `database/migration_032_mod_totp.sql` | 2-Faktor-Authentifizierung für Mitarbeiter (Mods) |

#### Vollständige Migrations-Übersicht (für bestehende DB-Updates)

| Datei | Was sie macht |
|---|---|
| `database/migration_001_products_detail.sql` | Erweiterte Produktfelder (Highlights, Zertifikate, LMIV, Rich-Text) |
| `database/migration_002_admin_login_log.sql` | Login-Protokoll für den Admin-Bereich |
| `database/migration_003_product_images.sql` | Supabase Storage Bucket für Produktbilder |
| `database/migration_004_grants.sql` | Berechtigungen für alle Tabellen |
| `database/migration_005_shipping_settings.sql` | Versandkosten-Konfiguration |
| `database/migration_006_admin_totp.sql` | Admin-2FA Tabelle (TOTP) |
| `database/migration_007_categories.sql` | Kategorien-Tabelle für den Admin-Bereich |
| `database/migration_008_profiles_email.sql` | E-Mail-Spalte in Kundenprofilen + automatischer Trigger |
| `database/migration_009_profiles_roles.sql` | Rollen-Erweiterung (Teamleiter-Rolle) |
| `database/migration_010_order_payment_method.sql` | Zahlungsmethode + Produktbild in Bestellungen |
| `database/migration_011_user_ban.sql` | Kunden-Sperrsystem (Ban/Unban) |
| `database/migration_012_push_subscriptions.sql` | Push-Benachrichtigungen (Web Push) |
| `database/migration_013_invoice_label.sql` | Rechnungsnummern + DHL-Tracking-Spalten |
| `database/migration_014_ticket_messages.sql` | Ticket-Chat (Nachrichten-Verlauf) |
| `database/migration_014_shop_settings_categories_image.sql` | Shop-Einstellungen + Kategorie-Bilder |
| `database/migration_015_mod_invites_admin_config.sql` | Mitarbeiter-Einladungen + Admin-Konfiguration in DB |
| `database/migration_016_must_change_password.sql` | Passwort-Wechsel-Pflicht beim ersten Login |
| `database/migration_017_service_role_grants.sql` | Fehlende Backend-Berechtigungen (service_role) |
| `database/migration_018_tickets_guest.sql` | Gast-Tickets (Support ohne Kundenkonto) |
| `database/migration_019_ticket_priority.sql` | Ticket-Prioritätsstufen (niedrig / normal / hoch / dringend) |
| `database/migration_020_cleanup_testdata.sql` | Bereinigung von Testdaten |
| `database/migration_021_missing_grants.sql` | Weitere fehlende Berechtigungen |
| `database/migration_022_stripe_payment_intent.sql` | Stripe Payment Intent ID in Bestellungen |
| `database/migration_023_return_requests.sql` | Rücksendungsanfragen-Tabelle |
| `database/migration_024_return_items.sql` | Artikel in Rücksendungen (JSONB) |
| `database/migration_025_discount_codes.sql` | Gutscheincodes-System |
| `database/migration_026_product_variants.sql` | Produktvarianten (Größe, Farbe, eigener Lagerbestand pro Variante) |
| `database/migration_027_login_log_user.sql` | Rolle + E-Mail im Login-Protokoll |
| `database/migration_028_notifications_tasks.sql` | Notification Center + Aufgaben-System |
| `database/migration_029_invoice_sequence.sql` | Atomare Rechnungsnummer-Sequenz (GoBD-konform) |
| `database/migration_030_discount_atomic.sql` | Atomarer Rabatt-Zähler (race-condition-sicher) |
| `database/migration_031_team_lead_refund_requests.sql` | Teamleiter-Rolle + Erstattungsanträge |
| `database/migration_032_mod_totp.sql` | 2FA für Mitarbeiter |

> **Reihenfolge wichtig:** Führe die Migrationen immer in der angezeigten Reihenfolge aus. Alle Dateien sind idempotent — mehrfaches Ausführen verursacht keine Fehler.

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

## 9. Rechnungen einrichten

ShopRay generiert automatisch eine GoBD-konforme PDF-Rechnung, sobald eine Bestellung bezahlt wurde. Die Rechnung wird:
- **automatisch** per E-Mail an den Kunden geschickt (mit Stripe Webhook)
- im **Admin-Bereich** auf der Bestelldetailseite als Download bereitgestellt

### Pflichtangaben eintragen (§14 UStG)

Trage in `Backend/.env` deine Firmendaten ein — sie erscheinen auf jeder Rechnung:

```env
SHOP_NAME=Mein Shop GmbH
SHOP_STREET=Musterstraße 1
SHOP_ZIP=12345
SHOP_CITY=Musterstadt
SHOP_COUNTRY=Deutschland
SHOP_EMAIL=info@deinshop.de
SHOP_PHONE=+49 30 000 000 00    # optional
SHOP_VAT_ID=DE123456789         # Umsatzsteuer-ID (z.B. DE123456789)
SHOP_TAX_NUMBER=12/345/67890    # Steuernummer (Finanzamt)
INVOICE_PREFIX=RE               # Rechnungsnummer-Präfix (RE-2026-00001, RE-2026-00002, …)
```

> **USt-IdNr. vs. Steuernummer:** Für B2C-Shops reicht die Steuernummer. Wenn du auch B2B-Rechnungen schreibst oder EU-weit verkaufst, empfehlen wir zusätzlich die USt-IdNr. Trage einfach beide ein — die Rechnung zeigt automatisch was vorhanden ist.

### Rechnungsnummern

Rechnungsnummern werden fortlaufend vergeben (z.B. `RE-2026-00001`, `RE-2026-00002`, …). Die Vergabe ist idempotent — wird eine Bestellung mehrfach abgerufen, bleibt die Nummer gleich. Das erfüllt die GoBD-Anforderung nach Unabänderlichkeit.

### Rechnung manuell herunterladen

Admin-Panel → **Bestellungen** → Bestellung öffnen → Button **"Rechnung"** oben rechts.

---

## 10. DHL Versandlabels einrichten

DHL-Labels werden direkt aus dem Admin-Panel erstellt — ohne DHL-Portal öffnen zu müssen.

### Voraussetzungen

- **DHL Geschäftskunden-Account** mit aktiviertem API-Zugang
- API-Zugang beantragen unter: https://developer.dhl.com → "DHL Parcel DE Shipping" → Sandbox/Production Access

### Schritt 1 — DHL Credentials eintragen

```env
DHL_API_KEY=dein-dhl-api-key
DHL_BILLING_NUMBER=12345678012082   # 14-stellige Abrechnungsnummer aus deinem DHL-Vertrag
DHL_SHIPPER_NAME=Mein Shop GmbH
DHL_SHIPPER_STREET=Musterstraße 1  # Straße + Hausnummer
DHL_SHIPPER_ZIP=12345
DHL_SHIPPER_CITY=Musterstadt
DHL_SANDBOX=true                    # Für Tests: true. Für echte Labels: false
```

**Wo finde ich die Abrechnungsnummer?** Im DHL Geschäftskunden-Portal unter **Mein DHL → Produkte & Verträge**. Sie ist 14-stellig und beginnt mit deiner 8-stelligen EKP-Nummer.

### Schritt 2 — Sandbox testen

Mit `DHL_SANDBOX=true` werden Labels gegen die DHL-Testumgebung erstellt. Die Labels sind nicht für den echten Versand geeignet, aber perfekt zum Testen.

Sandbox-Zugangsdaten für Tests: https://developer.dhl.com/api-reference/parcel-de-shipping-post-parcel-germany-v2#section/Authentication/ApiKeyAuth

### Schritt 3 — Auf Produktion umstellen

```env
DHL_SANDBOX=false
```

Danach werden echte Labels erstellt und dem Kunden wird bei Erstellung automatisch der Status **"Versendet"** gesetzt.

### Label erstellen (Admin-Panel)

Admin-Panel → **Bestellungen** → Bestellung öffnen → Button **"DHL Label"** → Paketgewicht eingeben → **"Label erstellen & herunterladen"**

Das Label wird als PDF heruntergeladen. Die DHL-Sendungsnummer wird in der Bestellung gespeichert und als Tracking-Link angezeigt.

---

## 11. Push-Benachrichtigungen einrichten

Der Admin kann sich Browser-Push-Benachrichtigungen aktivieren — er wird sofort benachrichtigt wenn eine neue Bestellung eingeht.

### Unterstützte Geräte

| Gerät | Anforderung |
|---|---|
| **Desktop (Chrome, Firefox, Edge)** | Funktioniert direkt im Browser |
| **Android (Chrome)** | Funktioniert direkt im Browser |
| **iPhone/iPad** | Erfordert iOS 16.4+ und "Zum Home-Bildschirm hinzufügen" |

### Schritt 1 — VAPID-Keys generieren (einmalig)

```bash
cd Backend
node -e "const wp = require('web-push'); const keys = wp.generateVAPIDKeys(); console.log(JSON.stringify(keys, null, 2));"
```

Das gibt aus:
```json
{
  "publicKey": "BGJBw...",
  "privateKey": "FazEa..."
}
```

Trage beide Werte in `Backend/.env` ein:
```env
VAPID_PUBLIC_KEY=BGJBw...
VAPID_PRIVATE_KEY=FazEa...
VAPID_EMAIL=mailto:admin@deinshop.de
```

> **Wichtig:** Die Keys dürfen nur einmal generiert werden. Wenn du neue Keys generierst, müssen alle vorhandenen Push-Abonnements erneuert werden (Nutzer müssen sich neu anmelden).

### Schritt 2 — Push aktivieren (Admin-Panel)

1. Admin-Panel öffnen → **Einstellungen → Benachrichtigungen**
2. Auf **"Benachrichtigungen aktivieren"** klicken
3. Browser-Freigabe bestätigen

Danach erscheint eine Push-Benachrichtigung bei jeder neuen Bestellung — auch wenn der Browser minimiert ist.

---

## 12. Newsletter (Brevo) einrichten

Das Template enthält eine fertige Backend-Route für Newsletter-Anmeldungen. Alles was du brauchst ist ein kostenloser Brevo-Account.

> **Warum Brevo?** Brevo ist EU-gehostet, DSGVO-konform und hat Double-Opt-In direkt eingebaut — gesetzlich vorgeschrieben in Deutschland (§ 7 Abs. 2 Nr. 3 UWG).

### Schritt 1 — Brevo-Account anlegen

1. Gehe auf **https://www.brevo.com** und erstelle einen kostenlosen Account
2. E-Mail-Adresse bestätigen und einloggen

### Schritt 2 — Kontaktliste anlegen

1. Im Brevo-Dashboard: **Contacts → Lists → Create a list**
2. Namen vergeben (z.B. „Shop Newsletter")
3. Die **Listen-ID** notieren — eine Zahl, sichtbar in der URL (z.B. `/lists/3` → ID ist `3`)

### Schritt 3 — API-Schlüssel erstellen

1. Oben rechts auf deinen **Account-Namen** klicken → **SMTP & API**
2. Tab **API Keys** → **Generate a new API key**
3. Namen vergeben (z.B. „ShopRay"), auf **Generate** klicken
4. Den angezeigten Schlüssel sofort kopieren — er wird nur einmal angezeigt!

### Schritt 4 — Env-Variablen setzen

Trage diese Werte in `Backend/.env` und in Vercel (**Settings → Environment Variables**) ein:

```env
# Pflicht
BREVO_API_KEY=xkeysib-...           # dein API-Schlüssel aus Schritt 3
BREVO_LIST_ID=3                     # Listen-ID aus Schritt 2

# Optional — Double-Opt-In (empfohlen für Deutschland)
BREVO_DOI_TEMPLATE_ID=1             # Template-ID (siehe Schritt 5)
BREVO_REDIRECT_URL=https://deine-domain.de/newsletter-bestaetigt
```

### Schritt 5 — Double-Opt-In einrichten (empfohlen)

Double-Opt-In bedeutet: der Kunde bekommt nach der Anmeldung eine E-Mail und muss darin auf einen Link klicken. Erst dann landet er in der Liste. Das ist in Deutschland gesetzlich vorgeschrieben.

**Template in Brevo anlegen:**

1. **Campaigns → Email Templates → Create a template**
2. Template-Typ: **Confirmation** (Bestätigungs-E-Mail)
3. Einen Text schreiben, z.B.:
   > *Hallo, klicke auf den Button um deine Anmeldung zu bestätigen.*
4. Den Button mit dem Platzhalter `{{ doubleoptin }}` verknüpfen — Brevo ersetzt das automatisch durch den Bestätigungslink
5. Template speichern → die **Template-ID** notieren (steht in der URL)
6. Diese ID als `BREVO_DOI_TEMPLATE_ID` eintragen

> **Ohne `BREVO_DOI_TEMPLATE_ID`:** Der Kontakt wird direkt in die Liste eingetragen (kein Bestätigungs-E-Mail). Nur verwenden wenn du die Einwilligung anderweitig nachweisen kannst.

### Schritt 6 — Newsletter-Feature aktivieren

In `Frontend/src/config/features.ts`:

```ts
newsletter: true,   // Newsletter-Formular auf der Startseite anzeigen
```

### So funktioniert es im Hintergrund

Wenn ein Besucher seine E-Mail eingibt und auf „Jetzt anmelden" klickt:

1. Das Frontend sendet die E-Mail an `POST /api/newsletter/subscribe`
2. Das Backend prüft die E-Mail-Adresse (Format, max. 254 Zeichen)
3. Brevo wird aufgerufen — mit DOI: Bestätigungs-E-Mail wird verschickt; ohne DOI: direkte Listenzuweisung
4. Bereits angemeldete Adressen werden still ignoriert (kein Fehler)
5. Der Besucher sieht „Fast geschafft! Prüf deine E-Mails…"

### Was passiert wenn `BREVO_API_KEY` nicht gesetzt ist?

Die Route gibt trotzdem `200 OK` zurück — der Shop funktioniert normal, die Anmeldung wird lautlos verworfen. So entstehen keine sichtbaren Fehler wenn du den Newsletter noch nicht konfiguriert hast.

---

## 13. Theme wählen

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

## 14. Shop-Name & Firmendaten einrichten

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

## 15. Features aktivieren oder deaktivieren

Ändere in `Frontend/src/config/features.ts` die Werte:

```ts
export const FEATURES = {
  reviews:    true,   // Produktbewertungen
  wishlist:   true,   // Wunschliste
  tickets:    true,   // Support-Tickets
  lmiv:       false,  // Nährwertangaben (nur für Lebensmittel / Supplements)
  newsletter: true,   // Newsletter-Formular auf der Startseite (erfordert Brevo — Abschnitt 12)
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

## 16. Produkte befüllen

Produkte werden über den **Admin-Bereich** angelegt (empfohlen) oder direkt per SQL in die Datenbank eingefügt.

### Option A — Admin-Bereich (empfohlen)

1. Admin-Panel öffnen → **Produkte → Neues Produkt**
2. Alle Felder ausfüllen: Name, Preis, Beschreibung, Bilder, Kategorie
3. Auf **"Speichern"** klicken — das Produkt ist sofort im Shop sichtbar

### Produktvarianten einrichten (Größe, Farbe, Material …)

Wenn dein Produkt in verschiedenen Ausführungen erhältlich ist (z.B. Größen S/M/L oder Farben Rot/Blau), kannst du Varianten anlegen. Jede Variante hat ihren eigenen Lagerbestand.

**Voraussetzung:** Migration 026 muss ausgeführt sein (siehe Abschnitt 4).

**So geht's:**

1. Ein bestehendes Produkt öffnen: Admin-Panel → **Produkte → Produkt bearbeiten**
2. Auf der rechten Seite findest du den Bereich **"Varianten"**
3. Klicke auf **"Optionsgruppe hinzufügen"** — z.B. „Größe"
4. Trage die Werte ein (z.B. S, M, L, XL) und bestätige jeden Wert mit Enter
5. Weitere Optionsgruppen hinzufügen (z.B. „Farbe" → Rot, Blau) — bis zu 3 Gruppen möglich
6. Klicke auf **"SKU-Matrix generieren"** — das System erstellt automatisch alle Kombinationen (z.B. S/Rot, S/Blau, M/Rot, …)
7. Für jede Kombination Lagerbestand und optional einen Preisaufschlag eintragen
8. Auf **"Varianten speichern"** klicken

**Was passiert im Shop:**
- Der Kunde sieht Auswahlfelder für jede Optionsgruppe
- Ausverkaufte Kombinationen werden automatisch durchgestrichen
- Der Preis passt sich sofort an wenn du einen Preisaufschlag gesetzt hast
- Jede Variante hat ihren eigenen Lagerbestand — wird nach einer Bestellung automatisch abgezogen

**Kein Variantensystem nötig?** Produkte ohne Varianten funktionieren genauso wie bisher — das Feature ist vollständig optional.

### Gutscheincodes anlegen

Mit Gutscheincodes kannst du Rabatte für Kunden erstellen. Ein Code kann prozentual (z.B. 10 % auf die Bestellsumme) oder als Festbetrag (z.B. 5 € Rabatt) konfiguriert werden.

**Voraussetzung:** Migration 025 muss ausgeführt sein (siehe Abschnitt 4).

**So geht's:**

1. Admin-Panel → **Gutscheincodes → Neuer Code**
2. Folgende Felder ausfüllen:
   - **Code** — z.B. `SOMMER10` (Kunden geben diesen Code im Checkout ein, Groß-/Kleinschreibung egal)
   - **Typ** — Prozent (%) oder Festbetrag (€)
   - **Wert** — z.B. 10 für 10 % oder 5 für 5 €
   - **Mindestbestellwert** — z.B. 30 € (optional, 0 = kein Minimum)
   - **Max. Einlösungen** — wie oft darf der Code insgesamt eingelöst werden (leer = unbegrenzt)
   - **Gültig bis** — optionales Ablaufdatum
3. Auf **"Speichern"** klicken

**Was passiert im Shop:** Der Kunde tippt den Code im Checkout ein — der Rabatt wird sofort angezeigt und vom Bestellbetrag abgezogen. Nach einer erfolgreichen Zahlung wird der Einlösungszähler automatisch erhöht.

---

### Option B — Seed-Daten (für Tests)

Im Ordner `database/seed.sql` liegt eine Datei mit Beispielprodukten. Diese kannst du einmalig im SQL Editor ausführen um den Shop mit Testdaten zu befüllen.

---

## 17. Rechtliche Texte anpassen

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

### Newsletter — rechtlicher Hinweis

Das Template enthält eine fertige Brevo-Integration mit Double-Opt-In (§ 7 Abs. 2 Nr. 3 UWG). Richte Brevo ein wie in **Abschnitt 12** beschrieben und setze `BREVO_DOI_TEMPLATE_ID` — dann ist die gesetzliche Pflicht zur Einwilligung erfüllt. Ohne DOI-Template werden Kontakte direkt eingetragen, was nur zulässig ist wenn die Einwilligung anderweitig nachgewiesen werden kann.

### Für Nahrungsergänzungsmittel zusätzlich

- **BfR-Meldung** vor dem ersten Verkauf
- **LMIV-Angaben** auf jeder Produktseite vollständig ausfüllen
- **Health Claims** prüfen: Nur EU-zugelassene Aussagen verwenden

---

## 18. Admin-Bereich einrichten

Der Admin-Bereich ist ein separates Projekt (`Admin/`) und läuft unabhängig vom Shop-Frontend.

### Was der Admin-Bereich kann

| Bereich | Funktion |
|---|---|
| **Dashboard** | Umsatz, Bestellungen, Kunden auf einen Blick — Klick auf Bestellung öffnet Details |
| **Dashboard** | Umsatz, Bestellungen, Kunden auf einen Blick — Klick auf Bestellung öffnet Details |
| **Analytics** | Umsatz- und Bestellungsverlauf als Diagramm, Top-Produkte, Bestellstatus-Verteilung, KPI-Karten — für 7, 30 oder 90 Tage |
| **Produkte** | Anlegen, bearbeiten, Bilder hochladen, CSV-Massenimport, Varianten (Größe/Farbe/…) |
| **Bestellungen** | Status verwalten, Rechnung als PDF herunterladen, DHL-Versandlabel erstellen |
| **Kunden** | Kundenliste, Bestellhistorie, DSGVO-Export (Art. 20), Kunden sperren (Ban) |
| **Kategorien** | Kategorien anlegen, Reihenfolge festlegen, löschen |
| **Bewertungen** | Freischalten, ablehnen oder löschen — mit Tab-Filter |
| **Gutscheincodes** | Rabattcodes anlegen (Prozent oder Festbetrag), Gültigkeitsdauer, Mindestbestellwert, max. Einlösungen |
| **Support** | Eingehende Kontaktanfragen und Tickets beantworten |
| **Einstellungen → Versand** | Versandkosten, Gratisversand-Grenze, Lieferzeit live konfigurieren |
| **Einstellungen → Sicherheit** | Login-Protokoll — jeder Admin-Login wird aufgezeichnet |
| **Einstellungen → Benachrichtigungen** | Push-Benachrichtigungen aktivieren (neue Bestellungen auf Smartphone) |

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

## 19. Deployment

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

### Häufige Fehler nach dem Deployment

**CORS-Fehler im Admin ("Access-Control-Allow-Origin fehlt")**

Ursache: `ADMIN_URL` oder `CLIENT_URL` im Backend-Projekt stimmen nicht exakt mit der echten URL überein.

Lösung:
1. Vercel → **Backend-Projekt → Settings → Environment Variables**
2. `ADMIN_URL` auf die exakte URL des Admin-Panels setzen (z.B. `https://admin.deinshop.de`)
3. `CLIENT_URL` auf die exakte URL des Shops setzen (z.B. `https://deinshop.de`)
4. Backend neu deployen (Vercel → **Deployments → Redeploy**)

> **Tipp:** Vercel erstellt bei jedem Deployment auch eine Preview-URL (z.B. `shopray-admin-xxxx.vercel.app`). Das Admin-Panel erlaubt automatisch alle `*.vercel.app`-Unterdomains — du musst also nur deine eigene Domain in `ADMIN_URL` eintragen.

**Admin-Login schlägt fehl (500)**

Prüfe ob `JWT_SECRET` und `ADMIN_PASSWORD_HASH` in den Vercel Umgebungsvariablen gesetzt sind (Abschnitt 17).

### Schritt 6 — Demo-Modus (optional)

Wenn du ShopRay als Demo präsentieren möchtest ohne dass Änderungen dauerhaft gespeichert werden:

1. In Vercel Backend-Projekt → **Settings → Environment Variables**
2. `DEMO_MODE` auf `true` setzen → Redeploy

Im Demo-Modus sind alle schreibenden Admin-Operationen gesperrt (HTTP 403). Login, Logout und alle GET-Requests funktionieren normal. Zum Zurücksetzen der Demo-Daten: `database/seed.sql` im Supabase SQL-Editor ausführen.

---

## 20. Pakete — Was gehört wozu

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

## 21. Technologie & Open Source

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

## 21. Marketing, SEO & GEO einrichten

Alle Marketing- und SEO-Einstellungen werden in **einer zentralen Datei** konfiguriert:
`Frontend/src/config/app.ts`

Danach Vercel neu deployen — alles wird automatisch aktiv.

---

### Google Tag Manager (GTM) — empfohlen

GTM ist der einfachste Weg um **alle** Marketing-Tools einzubinden:
Google Analytics 4, Meta/Facebook Pixel, TikTok Pixel, LinkedIn Insight, Hotjar — alles ohne Code-Änderung direkt über die GTM-Oberfläche.

**Schritt 1 — GTM-Konto anlegen:**
1. [tagmanager.google.com](https://tagmanager.google.com) aufrufen
2. Neues Konto → Container-Typ: **Web**
3. Die Container-ID notieren — sie sieht so aus: `GTM-XXXXXXX`

**Schritt 2 — ID in `app.ts` eintragen:**
```typescript
// Frontend/src/config/app.ts
export const APP_GTM_ID = 'GTM-XXXXXXX';  // ← deine ID hier
```

**Schritt 3 — Deployen und prüfen:**
Nach dem Deploy in Google Tag Manager → Vorschau → deine Shop-URL testen.

**Danach in GTM konfigurieren (ohne Code):**
- **Google Analytics 4:** Tag → Google Analytics → GA4-Konfiguration → Mess-ID eintragen
- **Meta Pixel:** Tag → Benutzerdefinierter HTML → Meta Pixel Code einfügen
- **TikTok Pixel:** genauso als benutzerdefinierter HTML-Tag

> Solange `APP_GTM_ID` leer ist (`''`), wird kein GTM-Code geladen — kein Performance-Einfluss.

---

### Google Search Console — kostenlos, wichtig

Damit Google deinen Shop indexiert und du siehst wie er rankt.

**Einrichten:**
1. [search.google.com/search-console](https://search.google.com/search-console) aufrufen
2. Property hinzufügen → deine Shop-Domain eingeben
3. Verifizierung per **DNS-Eintrag** (einfachste Methode — bei deinem Domain-Anbieter)
4. Sitemap einreichen:

```
https://deine-api-domain.de/sitemap.xml
```

Die Sitemap wird **automatisch vom Backend generiert** — alle aktiven Produkte sind immer aktuell enthalten. Du musst sie nicht manuell pflegen.

> **Wichtig:** In `Frontend/public/robots.txt` die Sitemap-URL auf deine echte Backend-Domain anpassen:
> ```
> Sitemap: https://api.dein-shop.de/sitemap.xml
> ```

---

### SEO — was automatisch passiert

ShopRay setzt automatisch für jede Seite:

| Was | Wo sichtbar |
|---|---|
| Seiten-Titel (`<title>`) | Browser-Tab + Google-Suchergebnis |
| Meta-Beschreibung | Google-Snippet unter dem Link |
| Open Graph Tags | Facebook, LinkedIn, WhatsApp Vorschau |
| Twitter/X Card | Twitter Vorschau |
| Canonical URL | Verhindert Duplicate Content |
| Produktfoto als Vorschaubild | Social-Media-Share von Produktseiten |
| Kategorie-Name im Titel | z.B. "Küche | Dein Shop" statt "Alle Produkte" |

**JSON-LD Structured Data (für Google & AI-Suchen):**
| Schema | Seite | Effekt |
|---|---|---|
| `Product` + `Offer` | Produktseiten | Google Shopping-Integration, Preis im Suchergebnis |
| `AggregateRating` | Produktseiten | ⭐⭐⭐⭐⭐ Sterne im Google-Suchergebnis |
| `Review` | Produktseiten | Einzelne Bewertungen für KI-Suchen |
| `BreadcrumbList` | Produktseiten | Breadcrumb im Google-Suchergebnis |
| `shippingDetails` | Produktseiten | Lieferzeit + kostenloser Versand in Google Shopping |
| `MerchantReturnPolicy` | Produktseiten | "30 Tage kostenlose Rückgabe" direkt in Google |
| `Organization` | Startseite | Markenidentität für KI + Google Knowledge Panel |
| `WebSite` + `SearchAction` | Startseite | Google Sitelinks-Suche |
| `FAQPage` | Startseite | FAQ direkt im Google-Suchergebnis aufklappbar |

---

### OG-Bild einrichten (Social-Media-Vorschau)

Das OG-Bild erscheint wenn jemand einen Link zu deinem Shop teilt — auf Facebook, WhatsApp, LinkedIn etc.

**Anforderungen:**
- Format: **PNG oder JPG** (kein SVG — wird von Social Media nicht unterstützt)
- Größe: **1200 × 630 Pixel**
- Dateiname: `og-image.png`
- Ablageort: `Frontend/public/og-image.png`

Die Datei mit deinem Shop-Logo und -Design erstellen und in `public/` ablegen.
In `app.ts` ist der Pfad bereits korrekt eingetragen: `APP_OG_IMAGE = '/og-image.png'`

> Auf **Produktseiten** wird automatisch das erste Produktfoto als Vorschaubild verwendet — kein manueller Eingriff nötig.

---

### Social-Media-Links einrichten

In `Frontend/src/config/app.ts` die echten URLs eintragen:

```typescript
export const APP_SOCIALS = {
  instagram: 'https://instagram.com/dein-shop',
  x:         'https://x.com/dein-shop',
  facebook:  'https://facebook.com/dein-shop',
  youtube:   '',           // leer lassen wenn nicht vorhanden
  tiktok:    '',
};
```

Leere Strings (`''`) werden im Footer ausgeblendet. Platzhalter `'#'` zeigen den Icon trotzdem — lieber leer lassen.

---

### GEO — Auffindbarkeit in KI-Suchen (ChatGPT, Perplexity, Bing Copilot)

GEO (Generative Engine Optimization) sorgt dafür dass KI-Suchmaschinen deinen Shop korrekt verstehen, zitieren und empfehlen.

ShopRay liefert dafür zwei Dateien:

**`/llms.txt`** — Kurzübersicht für KI-Crawler
- Produktangebot, Versand, Zahlung, Rückgabe
- Wird von ChatGPT, Perplexity & Co. automatisch gelesen

**`/llms-full.txt`** — Vollständiger Kontext
- Technische Architektur, Rechtliches, SEO-Infos
- Für tiefere AI-Verarbeitung

**Was du anpassen solltest:**
Beide Dateien in `Frontend/public/` öffnen und die Platzhalter-Texte (Versandzeitraum, Rückgabefrist, Produktkategorien) auf deinen echten Shop anpassen. Je genauer die Infos, desto besser zitieren KI-Suchen deinen Shop.

---

### Google Shopping (optional)

Mit dem korrekten `Product`-Schema auf Produktseiten ist dein Shop bereits für **Google Shopping Actions** vorbereitet. Um auch in der Shopping-Tab zu erscheinen:

1. [Google Merchant Center](https://merchants.google.com) Konto anlegen
2. Domain verifizieren
3. Produktfeed einrichten — die Sitemap (`/sitemap.xml`) kann als Ausgangspunkt dienen
4. Alternativ: In GTM den **Google Ads Conversion-Tracking**-Tag einrichten

---

## Hilfe & Support

Bei Fragen zum Template:
- GitHub Issues: https://github.com/SchubertChris/ShopRay/issues
- E-Mail: [deine Support-Adresse]

Bei Fragen zu externen Diensten:
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs

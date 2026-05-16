# ShopRay — Endabnahme-Testplan

**Stand:** 2026-05-16  
**Umgebung:** Lokale Dev-Umgebung + Supabase Test-Projekt  
**Stripe-Modus:** Test (`sk_test_...` Key vorausgesetzt)  
**Tester:** Chris Schubert

---

## Voraussetzungen

Bevor du anfängst, sicherstellen:

- [ ] Backend läuft auf `localhost:5000`
- [ ] Frontend läuft auf `localhost:5173`
- [ ] Admin läuft auf `localhost:5174` (oder separater Port)
- [ ] Supabase-Projekt aktiv, alle 6 Migrations ausgeführt (schema + 002–006)
- [ ] `.env` Dateien korrekt befüllt (Stripe Test-Key, JWT_SECRET, ADMIN_PASSWORD_HASH etc.)
- [ ] Stripe Webhook lokal via `stripe listen --forward-to localhost:5000/api/webhook/stripe` aktiv

---

## 1 — Admin Login & 2FA

### 1.1 Login ohne 2FA
- [ ] `POST /api/admin/login` mit falschem Passwort → 401 + generische Fehlermeldung
- [ ] 5× falsches Passwort innerhalb 15min → 429 Lockout
- [ ] Richtiges Passwort → Cookie `adminSession` wird gesetzt, Redirect ins Dashboard
- [ ] `/api/admin/check` mit gültigem Cookie → 200
- [ ] Nach Logout → Cookie gelöscht, `/api/admin/check` → 401

### 1.2 2FA einrichten
- [ ] Admin Settings → Sicherheit → "2FA aktivieren" Schaltfläche erscheint (Status: OFF)
- [ ] Klick → QR-Code wird angezeigt + Base32-Secret darunter
- [ ] Google Authenticator / Aegis / Bitwarden öffnen → QR scannen
- [ ] 6-stelligen Code eingeben → "Bestätigen" → Erfolgsmeldung, Status: ON
- [ ] Seite neu laden → Status: ON bleibt

### 1.3 Login mit aktivierter 2FA
- [ ] Admin Logout → neu zur Login-Seite
- [ ] Passwort eingeben → kein Dashboard, stattdessen TOTP-Formular erscheint
- [ ] Falschen Code eingeben → 401
- [ ] Richtigen Code eingeben → `adminSession` gesetzt, Redirect Dashboard
- [ ] `totpPending` Cookie nach erfolgreichem TOTP → automatisch gelöscht

### 1.4 2FA deaktivieren
- [ ] Settings → Sicherheit → "2FA deaktivieren"
- [ ] TOTP-Code zur Bestätigung eingeben
- [ ] Status wechselt zurück auf OFF
- [ ] Nächster Login: direkt nach Passwort → kein TOTP-Schritt

---

## 2 — Shop-Frontend

### 2.1 Produktliste & Suche
- [ ] Shop-Seite lädt Produkte aus Supabase (keine Hardcodes)
- [ ] Suchfeld: nach Produktname suchen → korrekte Ergebnisse
- [ ] Kategorie-Filter funktioniert
- [ ] Leerer Warenkorb-State korrekt angezeigt

### 2.2 Produktdetail
- [ ] Produktseite öffnen → alle Felder geladen (Name, Preis, Bilder, Beschreibung)
- [ ] Image Gallery: Thumbnails klickbar, Hauptbild wechselt
- [ ] LMIV-Daten sichtbar (Nährwerte, Zutaten, Allergene)
- [ ] "In den Warenkorb" → Menge zählt korrekt hoch
- [ ] Toast / Feedback erscheint

### 2.3 Warenkorb
- [ ] Menge ändern → Gesamtpreis aktualisiert sich live
- [ ] Artikel entfernen → aus Warenkorb verschwindet
- [ ] Warenkorb-Inhalt bleibt nach Seiten-Reload erhalten (localStorage)

### 2.4 Checkout-Seite
- [ ] Checkout-Formular erscheint (Name, E-Mail, Adresse, Zahlungsmethode)
- [ ] Klarna-Logo vollständig sichtbar, "a" nicht abgeschnitten
- [ ] Stripe-Logo / Karte vollständig sichtbar
- [ ] Pflichtfelder: Submit ohne Daten → Validierungsfehler
- [ ] Korrekt ausfüllen → "Kaufen"-Button aktiv

---

## 3 — Stripe Zahlungsfluss (Test-Modus)

> **Stripe Test-Karten:**  
> Erfolgreiche Zahlung: `4242 4242 4242 4242` | beliebige zukünftige Verfallszeit | beliebiger CVC  
> Zahlung abgelehnt: `4000 0000 0000 0002`  
> 3D Secure required: `4000 0025 0000 3155`

### 3.1 Erfolgreiche Zahlung
- [ ] Checkout ausfüllen → "Kaufen" → Redirect zu Stripe Hosted Checkout
- [ ] Stripe-Seite: Bestellzusammenfassung korrekt (Artikel, Preise, Versandkosten)
- [ ] Testkarte `4242 4242 4242 4242` eingeben → "Zahlen"
- [ ] Redirect zur Success-Page (`/checkout/success`)
- [ ] Stripe Webhook empfangen (Terminal: `stripe listen` zeigt `checkout.session.completed`)
- [ ] Bestellung in Supabase → Status `paid`, `paid_at` gesetzt
- [ ] Bestellung im Admin-Panel unter "Bestellungen" sichtbar
- [ ] Bestell-E-Mail an Kunden wird versendet (SMTP-Log prüfen)

### 3.2 Abgebrochene Zahlung
- [ ] Checkout starten → auf Stripe-Seite "Zurück" oder Tab schließen
- [ ] Redirect zur Cancel-Page (`/checkout/cancel`)
- [ ] Supabase: Bestellung existiert entweder nicht oder bleibt `pending`

### 3.3 Abgelehnte Karte
- [ ] Testkarte `4000 0000 0000 0002` → Stripe zeigt Fehler "Karte abgelehnt"
- [ ] Kein Redirect zur Success-Page

---

## 4 — Admin Panel — Bestellungen

- [ ] Bestellungsliste lädt (paginiert)
- [ ] Bestellung öffnen → vollständige Details: Artikel, Preise, Lieferadresse, Kundendaten
- [ ] Status ändern (z.B. `paid` → `shipped`) → Speichern → `shipped_at` in DB gesetzt
- [ ] Timeline in Bestelldetail aktualisiert sich korrekt
- [ ] Zurück zur Liste → Status-Badge aktualisiert

---

## 5 — Admin Panel — Produkte

- [ ] Produktliste lädt
- [ ] Neues Produkt erstellen → alle Pflichtfelder ausfüllen → Speichern → erscheint in Liste
- [ ] Bild hochladen → erscheint in Supabase Storage, Thumbnail in Formular sichtbar
- [ ] Mehrere Bilder hochladen → Gallery im Frontend funktioniert
- [ ] Produkt bearbeiten → Änderungen nach Speichern sofort im Frontend sichtbar
- [ ] Produkt löschen → aus Liste + Frontend verschwunden

---

## 6 — Admin Panel — Kunden

- [ ] Kundenliste lädt mit echten Supabase-Auth-Benutzern
- [ ] Kundendetail öffnen → Name, E-Mail, Bestellhistorie korrekt
- [ ] Bestellsummen berechnet (`totalSpent`, `avgOrder`, `lastOrder`)
- [ ] Kunde löschen → Bestätigungs-Dialog → löscht aus Auth + Profil

---

## 7 — Admin Panel — Einstellungen

- [ ] Versandkosten-Einstellung speichern → `shipping_settings` Tabelle aktualisiert
- [ ] Frontend checkout reflektiert neue Versandkosten sofort (nach Reload)
- [ ] Mindestbestellwert für kostenlosen Versand funktioniert
- [ ] Login-Protokoll (letzte 50 Einträge) zeigt IP, User-Agent, Erfolg/Fehler

---

## 8 — Auth (Kundenseite)

- [ ] Registrierung: E-Mail + Passwort → Bestätigungs-E-Mail kommt an
- [ ] Login: korrekte Zugangsdaten → Session aktiv
- [ ] Login: falsches Passwort → Fehlermeldung
- [ ] Passwort vergessen → Reset-E-Mail → neues Passwort setzen → Login funktioniert
- [ ] Kunden-TOTP (falls aktiviert): MFA-Schritt erscheint nach Login
- [ ] Logout → Session gelöscht

---

## 9 — DSGVO & Rechtliches

- [ ] Cookie-Consent-Banner erscheint beim ersten Besuch
- [ ] "Ablehnen" → keine Tracking-Cookies gesetzt
- [ ] "Akzeptieren" → Präferenz gespeichert, Banner kommt beim Reload nicht mehr
- [ ] Impressum-Seite lädt (`/impressum`)
- [ ] Datenschutz-Seite lädt (`/datenschutz`)
- [ ] AGB-Seite lädt (`/agb`)
- [ ] "Meine Daten" → eingeloggter Nutzer kann Daten einsehen und Löschantrag stellen
- [ ] Kontaktformular → Nachricht landet in Supabase `contacts` Tabelle + E-Mail-Alarm

---

## 10 — Edge Cases & Sicherheit

- [ ] Direkter Aufruf von Admin-Routen ohne Cookie → 401
- [ ] Abgelaufener `adminSession` Cookie → 401, Redirect zum Login
- [ ] SQL-Injection-Versuch in Suchfelder → kein Datenbankfehler (Supabase parametrisiert)
- [ ] XSS: `<script>alert(1)</script>` in Produktname → escaped in HTML
- [ ] Großer Datei-Upload (>10MB) → Backend-Limit greift (413)
- [ ] Rate Limit: `POST /api/admin/login` > 10× schnell → 429
- [ ] Bilder: Rechtsklick auf Produktbild → Kontextmenü unterdrückt (Content-Schutz)
- [ ] Text auf Shop-Seiten: Markieren nicht möglich (`user-select: none`)

---

## 11 — Responsive / Dark Mode

- [ ] Frontend auf Mobilgerät (375px): Shop, Produktdetail, Checkout korrekt dargestellt
- [ ] Admin auf Tablet (768px): Sidebar kollabiert, Tabellen scrollbar
- [ ] Dark Mode: alle Seiten (Frontend + Admin) vollständig in Dark Mode funktional
- [ ] Light Mode: alle Seiten vollständig in Light Mode funktional
- [ ] Theme-Wechsel: kein Layout-Shift, kein FOUC

---

## Abnahme-Checkliste

| Bereich | Bestanden | Anmerkung |
|---|---|---|
| Admin Login & 2FA | | |
| Stripe Zahlungsfluss | | |
| Produktverwaltung | | |
| Bestellverwaltung | | |
| Kundenverwaltung | | |
| Einstellungen | | |
| Kunden-Auth | | |
| DSGVO / Rechtliches | | |
| Sicherheit | | |
| Responsive / Dark Mode | | |

**Gesamtergebnis:** ☐ Bestanden &nbsp;&nbsp; ☐ Nacharbeiten erforderlich

---

## Stripe Webhook lokal einrichten

```bash
# Stripe CLI installieren (falls noch nicht vorhanden)
# https://stripe.com/docs/stripe-cli

# Webhook lokal forwarden
stripe listen --forward-to localhost:5000/api/webhook/stripe

# Den angezeigten Webhook-Secret in Backend/.env eintragen:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Bekannte Einschränkungen (Stand 2026-05-16)

- **Google OAuth** — Login-Button im UI vorhanden, aber noch nicht verdrahtet
- **Kategorie-Manager** — Kategorien sind noch nicht persistent (Admin-Einstellung fehlt noch)
- **`SETUP.en.md`** — englische Dokumentation ist veraltet (v1.1.0)

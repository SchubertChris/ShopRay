# ShopRay — Testplan
Stand: 2026-05-17

---

## Haupt-Links

| | Lokal | Produktion |
|---|---|---|
| **Frontend** | http://localhost:5173 | https://shopray-indol.vercel.app |
| **Admin** | http://localhost:5174 | https://shopray-admin.vercel.app |
| **Supabase** | — | https://supabase.com/dashboard |
| **Stripe** | — | https://dashboard.stripe.com/test |

---

## Alle Seiten

<details>
<summary>Frontend — vollständige Linkliste</summary>

| Seite | Lokal | Produktion |
|---|---|---|
| Startseite | http://localhost:5173 | https://shopray-indol.vercel.app |
| Kategorien | http://localhost:5173/kategorien | https://shopray-indol.vercel.app/kategorien |
| Suche | http://localhost:5173/suche | https://shopray-indol.vercel.app/suche |
| Warenkorb | http://localhost:5173/cart | https://shopray-indol.vercel.app/cart |
| Checkout | http://localhost:5173/checkout | https://shopray-indol.vercel.app/checkout |
| Bestellung erfolgreich | http://localhost:5173/order-success | https://shopray-indol.vercel.app/order-success |
| Login | http://localhost:5173/login | https://shopray-indol.vercel.app/login |
| Registrieren | http://localhost:5173/register | https://shopray-indol.vercel.app/register |
| Passwort vergessen | http://localhost:5173/forgot-password | https://shopray-indol.vercel.app/forgot-password |
| Account Dashboard | http://localhost:5173/account/dashboard | https://shopray-indol.vercel.app/account/dashboard |
| Bestellhistorie | http://localhost:5173/account/orders | https://shopray-indol.vercel.app/account/orders |
| Wunschliste | http://localhost:5173/account/wishlist | https://shopray-indol.vercel.app/account/wishlist |
| Tickets | http://localhost:5173/account/tickets | https://shopray-indol.vercel.app/account/tickets |
| Ticket erstellen | http://localhost:5173/account/tickets/new | https://shopray-indol.vercel.app/account/tickets/new |
| Einstellungen | http://localhost:5173/account/settings | https://shopray-indol.vercel.app/account/settings |
| Adressen | http://localhost:5173/account/addresses | https://shopray-indol.vercel.app/account/addresses |
| Meine Daten | http://localhost:5173/account/my-data | https://shopray-indol.vercel.app/account/my-data |
| Über uns | http://localhost:5173/about | https://shopray-indol.vercel.app/about |
| Kontakt | http://localhost:5173/contact | https://shopray-indol.vercel.app/contact |
| FAQ | http://localhost:5173/faq | https://shopray-indol.vercel.app/faq |
| Versand | http://localhost:5173/versand | https://shopray-indol.vercel.app/versand |
| Support-Portal | http://localhost:5173/support | https://shopray-indol.vercel.app/support |
| Impressum | http://localhost:5173/impressum | https://shopray-indol.vercel.app/impressum |
| Datenschutz | http://localhost:5173/datenschutz | https://shopray-indol.vercel.app/datenschutz |
| AGB | http://localhost:5173/agb | https://shopray-indol.vercel.app/agb |
| Widerruf | http://localhost:5173/widerruf | https://shopray-indol.vercel.app/widerruf |

</details>

<details>
<summary>Admin — vollständige Linkliste</summary>

| Seite | Lokal | Produktion |
|---|---|---|
| Login | http://localhost:5174/login | https://shopray-admin.vercel.app/login |
| Dashboard | http://localhost:5174 | https://shopray-admin.vercel.app |
| Produkte | http://localhost:5174/products | https://shopray-admin.vercel.app/products |
| Produkt erstellen | http://localhost:5174/products/new | https://shopray-admin.vercel.app/products/new |
| Bestellungen | http://localhost:5174/orders | https://shopray-admin.vercel.app/orders |
| Kunden | http://localhost:5174/customers | https://shopray-admin.vercel.app/customers |
| Bewertungen | http://localhost:5174/reviews | https://shopray-admin.vercel.app/reviews |
| Kategorien | http://localhost:5174/categories | https://shopray-admin.vercel.app/categories |
| Tickets | http://localhost:5174/support | https://shopray-admin.vercel.app/support |
| Anfragen | http://localhost:5174/inquiries | https://shopray-admin.vercel.app/inquiries |
| Einstellungen | http://localhost:5174/settings | https://shopray-admin.vercel.app/settings |

</details>

---

## Stripe Testkarten

| Nummer | Ergebnis |
|---|---|
| `4242 4242 4242 4242` | Zahlung erfolgreich |
| `4000 0000 0000 9995` | Karte abgelehnt |
| `4000 0025 0000 3155` | 3D-Secure Bestätigung |

Ablauf: beliebig in der Zukunft · CVC: beliebig · PLZ: beliebig

---

## Voraussetzung vor dem ersten Test

**Vercel Frontend — einmalig prüfen:**
- Vercel → shopray → Settings → Environment Variables → `VITE_API_URL` muss **leer / nicht gesetzt** sein
- Ist sie gesetzt → löschen → Redeploy abwarten
- Grund: Das Frontend nutzt jetzt Vercel Rewrites für alle API-Calls (kein CORS-Problem)

**Lokale Entwicklung:**
- `Frontend/.env.development` → `VITE_API_URL=http://localhost:5000`

---

## Bekannte Einschränkungen (nicht als Bug werten)

| Punkt | Status |
|---|---|
| Gast-Checkout | Bewusst deaktiviert — Login ist Pflicht |
| Google OAuth | Button vorhanden, noch nicht verdrahtet |
| Bilder (WebP) | WebP-Konvertierung noch ausstehend |
| Land-Auswahl bei Adressen | Noch Freitext, Dropdown kommt später |

---

## Test-Reihenfolge

Ich teste von außen nach innen: erst was der Käufer sieht, dann was dahinter passiert.

---

### 1 — Smoke Test (2 Minuten)

Bevor ich irgendetwas anklicke: lädt alles überhaupt?

- [ ] Frontend-Startseite öffnet ohne Fehler (kein Blank Screen, kein 500)
- [ ] Cookie-Banner erscheint sofort beim ersten Besuch
- [ ] Cookie-Banner: Akzeptieren schließt ihn — nach Reload kommt er nicht mehr
- [ ] Admin-Login-Seite öffnet
- [ ] Browser-Konsole (F12): keine roten Errors auf der Startseite
- [ ] Network-Tab: kein API-Call wirft 401 oder 500

---

### 2 — Kritischer Pfad: Kaufen (wichtigster Flow)

Das ist der einzige Flow der Geld bringt — bricht hier etwas, ist alles andere egal.

- [ ] Produkt auf Startseite anklicken → Detailseite lädt
- [ ] „In den Warenkorb" → Header-Badge zeigt `1`
- [ ] Warenkorb öffnen → Artikel + Preis korrekt
- [ ] „Zur Kasse" ohne Login → Redirect zu `/login`
- [ ] Einloggen → automatisch zurück zu `/checkout`
- [ ] Checkout-Formular ausfüllen, Karte `4242 4242 4242 4242` eingeben
- [ ] Stripe-Redirect → Bestätigungs-Button → zurück zu `/order-success`
- [ ] Bestellbestätigungs-Mail kommt an (Bestellnummer, Artikel, Betrag)
- [ ] Bestellung erscheint unter `/account/orders` mit Status `paid`
- [ ] Bestellung erscheint im Admin unter `/orders` mit Status `paid`

---

### 3 — Warenkorb-Logik

- [ ] Menge erhöhen → Zwischensumme + Gesamtpreis passen sich an
- [ ] Artikel entfernen → verschwindet, Gesamtpreis korrigiert
- [ ] Unter Versandkostenfrei-Grenze: Versandkosten-Hinweis sichtbar
- [ ] Über Versandkostenfrei-Grenze: „Versandkostenfrei" Banner
- [ ] Leerer Warenkorb: Empty-State mit Weitershoppen-Link

---

### 4 — Authentifizierung

- [ ] Registrierung (neue E-Mail + Passwort) → eingeloggt, Profil in Supabase angelegt
- [ ] Logout → Startseite, `/account/*` geblockt
- [ ] Login (E-Mail + Passwort) → Session aktiv
- [ ] Google OAuth → Google-Consent-Screen → eingeloggt, kein Duplikat-Account
- [ ] Passwort vergessen → E-Mail eingeben → Reset-Mail kommt an
- [ ] Reset-Link öffnen → neues Passwort setzen → Login mit neuem Passwort klappt
- [ ] Direktaufruf `/account/dashboard` ohne Session → Redirect zu `/login`

---

### 5 — Nutzerbereich

- [ ] Dashboard: Bestellübersicht + Schnelllinks sichtbar
- [ ] Bestellhistorie: eigene Bestellungen mit Status, Datum, Betrag
- [ ] Bestelldetail (Zeile klicken): Artikel, Menge, Versandadresse, Zeitstempel
- [ ] Wunschliste: Herzbutton auf Produktkarte toggelt, Badge im Header aktualisiert
- [ ] Wunschliste-Seite: Artikel sichtbar, entfernen klappt
- [ ] Ticket erstellen → erscheint in Liste unter „Offen"
- [ ] Ticket-Tabs: Alle / Offen / In Bearbeitung / Gelöst filtern korrekt
- [ ] Einstellungen: Passwort ändern → Erfolgsmeldung
- [ ] Adressen: neue Adresse hinzufügen → erscheint in Liste, als Standard setzen klappt
- [ ] Meine Daten: Name + Telefon speichern → Erfolgsmeldung

---

### 6 — Admin: Einstieg & Echtdaten

Hier prüfe ich zuerst ob echte Daten ankommen — kein Mock.

- [ ] Login mit korrektem Passwort → Dashboard
- [ ] Login mit falschem Passwort → Fehlermeldung, kein Zugang
- [ ] Dashboard: Stat-Karten zeigen echte Zahlen (nicht alle 0 oder identisch)
- [ ] Dashboard: „Letzte Bestellungen" zeigt echte Bestellungen
- [ ] Sidebar-Badges neben Bestellungen + Tickets: Zahl stimmt mit echtem Stand überein
- [ ] Seite neu laden nach Login → bleibt eingeloggt
- [ ] Browser-Tab schließen + neu öffnen → ausgeloggt (sessionStorage geleert — korrekt)

---

### 7 — Admin: 2FA

- [ ] Einstellungen → 2FA einrichten → QR-Code scannen (Authenticator App)
- [ ] Logout → Login → TOTP-Code eingeben → Zugang
- [ ] Falscher TOTP-Code → Fehlermeldung

---

### 8 — Admin: Bestellungen

- [ ] Bestellliste: echte Daten, Status-Badge korrekt gefärbt
- [ ] Zeile klicken → Detailpanel: Artikel, Adresse, Zeitstempel, Kundename
- [ ] Status ändern (z.B. → `shipped`) → in Liste sofort aktualisiert, Supabase geprüft
- [ ] Mobil: Detailpanel öffnet als Bottom-Sheet, swipe-to-dismiss funktioniert

---

### 9 — Admin: Kunden & DSGVO

- [ ] Kundenliste: echte Daten, kein Mock
- [ ] Kunden-Detail: Bestellungen + Tickets + Bewertungen des Kunden sichtbar
- [ ] DSGVO-Export: JSON-Download mit `orders`, `tickets`, `reviews`, `exportedAt`
- [ ] Kunden löschen → Bestätigungsdialog → Account aus `profiles` + Supabase Auth weg
- [ ] Mobil: Detail-Panel als Bottom-Sheet + swipe-to-dismiss

---

### 10 — Admin: Produkte & Kategorien

- [ ] Produktliste: Status, Preis, Kategorie sichtbar
- [ ] Neues Produkt erstellen → erscheint in Liste und im Frontend-Shop
- [ ] Produkt bearbeiten → Änderungen im Frontend sofort sichtbar
- [ ] Produkt deaktivieren → nicht mehr im Frontend-Shop sichtbar
- [ ] Bild hochladen → Thumbnail sichtbar, in Supabase Storage gespeichert
- [ ] Neue Kategorie erstellen → erscheint sofort, im Frontend-Filter verfügbar
- [ ] Doppelte Kategorie eingeben → Fehlermeldung
- [ ] Kategorie löschen → verschwindet nach Bestätigung

---

### 11 — Admin: Bewertungen, Tickets, Anfragen

- [ ] Bewertungen: ausstehende + freigegebene sichtbar, Tab-Filter korrekt
- [ ] Bewertung freischalten → Badge wechselt, Bewertung im Frontend-Produkt sichtbar
- [ ] Bewertung ablehnen/löschen → weg nach Bestätigung
- [ ] Ticket-Liste: echte Daten, Status-Tabs filtern korrekt
- [ ] Ticket öffnen → Kundennachricht sichtbar, Antwort schreiben + Status setzen → gespeichert
- [ ] Anfragen (`/inquiries`): Kontaktformular-Einträge sichtbar

---

### 12 — Admin: Einstellungen

- [ ] Versandkosten ändern → im Checkout sofort wirksam (neu laden)
- [ ] Login-Protokoll: letzte Einträge mit Datum + IP sichtbar

---

### 13 — Demo-Modus

- [ ] `DEMO_MODE=true` in Backend `.env` setzen, Server neu starten
- [ ] Admin-Login → funktioniert
- [ ] Produkt speichern → HTTP 403, Toast-Fehlermeldung
- [ ] GET-Requests (Listen, Detail) → funktionieren normal
- [ ] `DEMO_MODE` wieder entfernen → alles schreibbar

---

### 14 — Rechtliches & Content-Schutz

- [ ] Impressum, Datenschutz, AGB, Widerruf: alle Seiten erreichbar, kein Platzhalter-Text
- [ ] Rechtsklick auf Produktbild → kein Browser-Kontextmenü
- [ ] Text auf Produktseite markieren → nicht möglich (user-select: none)
- [ ] 404: beliebige falsche URL → Not-Found-Page, kein Blank Screen

---

### 15 — Mobil & Cross-Browser

- [ ] iOS Safari: nach Login kein Viewport-Zoom auf dem Dashboard
- [ ] iOS Safari: kompletter Kaufprozess durchführbar
- [ ] Android Chrome: Navigation + Warenkorb funktionieren
- [ ] Desktop Chrome + Firefox: keine roten Konsolenfehler
- [ ] Dark Mode + Light Mode: beide Themes auf allen Seiten ohne Darstellungsfehler

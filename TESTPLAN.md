# ShopRay — Testplan
Stand: 2026-05-18 (v3 — inkl. Bug-Fixes: SEPA, Zahlungsabbruch, Filter, Mobile, Kategorien, Shop-Settings)

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

**Frontend**

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

**Admin**

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
| DHL-Label | Nur mit gültigem DHL-Business-Account + Env-Vars — in Sandbox testbar |
| Rechnungs-PDF | Nur mit gesetzten SHOP_* Env-Vars vollständig (sonst Platzhalter-Daten) |
| Push-Benachrichtigungen | Nur mit gesetzten VAPID Env-Vars in Vercel aktiv |
| Zahlungsmethode SEPA | „Bank-Transfer" läuft über SEPA-Lastschrift (Sofortüberweisung ist deprecated) |
| Shop-Settings | Erfordert Migration 014 in Supabase — ohne Migration werden Env-Var-Werte angezeigt |

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
- [ ] **Zahlungsabbruch:** Stripe-Seite öffnen → Browser-Zurück-Button → zurück zu `/checkout` → Warenkorb ist noch voll (nicht geleert)
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
- [ ] Dashboard: Zeile in „Letzte Bestellungen" anklicken → öffnet Bestelldetail-Seite
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
- [ ] Grid-View / Tabellen-View Toggle (Symbol oben rechts) → wechselt Ansicht, bleibt nach Reload
- [ ] Zeile klicken → Detailseite öffnet mit Artikel, Adresse, Zeitstempel, Kundename
- [ ] Status ändern (z.B. → `shipped`) → speichern → Status aktualisiert
- [ ] **Rechnung herunterladen:** Button „Rechnung" oben rechts → PDF-Download startet, Dateiname `Rechnung_RE-...pdf`
- [ ] Rechnung öffnen: Bestellnummer, Kundenadresse, Artikel mit Menge + Preis, Netto/MwSt/Brutto sichtbar
- [ ] **Lieferadresse bearbeiten** (nur wenn kein Label erstellt): Button „Bearbeiten" im Adress-Card → Modal öffnet mit vorausgefüllten Feldern → speichern → Adresse aktualisiert
- [ ] Adresse ohne Pflichtfelder speichern → Fehlermeldung
- [ ] **DHL-Label erstellen:** Button „DHL Label" → Modal mit Gewichtseingabe → Label erstellen → PDF-Download startet, Tracking-Nummer erscheint in Verlauf-Card
- [ ] Nach Label-Erstellung: „DHL Label"-Button zeigt „Label erstellt" (disabled), Adress-Bearbeiten-Button weg, stattdessen gelbe Infobox mit DHL-Links
- [ ] Tracking-Link in Verlauf-Card klicken → öffnet DHL-Sendungsverfolgung in neuem Tab
- [ ] Mobil: Detailseite lädt korrekt, Buttons bedienbar
- [ ] **Erstattet-Filter:** Tab „Erstattet" in Bestellliste → zeigt nur Bestellungen mit Status `refunded`
- [ ] Mobil Bottom-Sheet: Bestellung anklicken → Detail-Panel öffnet → Seite scrollt nicht mit (nur Panel scrollt)

---

### 9 — Admin: Kunden & DSGVO

- [ ] Kundenliste: echte Daten, kein Mock
- [ ] Grid-View / Tabellen-View Toggle → wechselt Ansicht, bleibt nach Reload erhalten
- [ ] Kunden-Detail: Bestellungen + Tickets + Bewertungen des Kunden sichtbar
- [ ] DSGVO-Export: JSON-Download mit `orders`, `tickets`, `reviews`, `exportedAt`
- [ ] **Ban-System:** Kunden-Detail → „Sperren"-Button → Modal mit Grund + optional Ablaufdatum
- [ ] Ban bestätigen → Status-Badge wechselt auf „Gesperrt", E-Mail an Kunden gesendet
- [ ] Gesperrter Kunde versucht Login → Fehlermeldung (nicht einloggbar)
- [ ] Ban mit Ablaufdatum testen: Datum in der Vergangenheit → Sperre automatisch aufgehoben
- [ ] Dauerhafter Ban: kein Ablaufdatum → Kunde bleibt dauerhaft gesperrt
- [ ] „Entsperren"-Button → Sperre aufgehoben, Login wieder möglich
- [ ] Kunden löschen → Bestätigungsdialog → Account aus `profiles` + Supabase Auth weg
- [ ] Mobil: Detail-Panel als Bottom-Sheet + swipe-to-dismiss

---

### 10 — Admin: Produkte & Kategorien

- [ ] Produktliste: Status, Preis, Kategorie sichtbar
- [ ] Grid-View / Tabellen-View Toggle → wechselt Ansicht, bleibt nach Reload erhalten
- [ ] Neues Produkt erstellen → erscheint in Liste und im Frontend-Shop
- [ ] Produkt bearbeiten → Änderungen im Frontend sofort sichtbar
- [ ] Produkt deaktivieren → nicht mehr im Frontend-Shop sichtbar
- [ ] Bild hochladen → Thumbnail sichtbar, in Supabase Storage gespeichert
- [ ] **CSV-Import:** Button „CSV importieren" → Modal öffnet, Datei auswählen (`.csv`)
- [ ] CSV-Vorschau: erste Zeilen + Spaltenzuordnung sichtbar, Importanzahl korrekt
- [ ] Import bestätigen → Produkte erscheinen in der Liste, keine Duplikate
- [ ] Fehlerhafte CSV (falsche Spalten) → Fehlermeldung, kein Import
- [ ] Neue Kategorie erstellen → erscheint sofort, im Frontend-Filter verfügbar
- [ ] **Kategorie-Bild:** Neue Kategorie mit Bild-URL anlegen → Bild erscheint in Grid-Ansicht (statt Tag-Icon)
- [ ] Kategorien im Frontend-Shop: Kategorie-Filter auf /suche kommt dynamisch aus DB (nicht hardcoded)
- [ ] **„Mehr laden"-Test:** Mehr als 8 Produkte im Shop → „Mehr laden" klicken → neue Karten erscheinen sichtbar (kein Z-Index-Bug)
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
- [ ] **Shop-Einstellungen:** Einstellungen → Shop-Info → Name + Adresse + E-Mail laden aus DB → ändern → speichern → Erfolgsmeldung
- [ ] Shop-Name-Änderung: nach Speichern in DB gespeichert (kein Verlust nach Reload)
- [ ] **Push-Benachrichtigungen:** „Push aktivieren"-Button → Browser-Berechtigungsdialog erscheint
- [ ] Berechtigung erteilen → Bestätigung sichtbar, Subscription in Supabase `push_subscriptions` gespeichert
- [ ] Neue Bestellung aufgeben (Schritt 2) → Push-Benachrichtigung erscheint im Browser (nur wenn VAPID Env-Vars gesetzt sind)

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

---

### 16 — Candlescope: ShopRay-Vermarktung

Diese Tests prüfen die ShopRay-Präsentation auf candlescope.de (separate Vercel-App).

| Seite | Lokal | Produktion |
|---|---|---|
| ShopRay-Teaser (Homepage) | http://localhost:5173 | https://candlescope.de |
| ShopRay-Seite | http://localhost:5173/shopray | https://candlescope.de/shopray |

**Homepage-Teaser**

- [ ] Teaser-Block zwischen „Die Marke"-Section und „Featured Produkt" sichtbar
- [ ] Tag-Pills (React 19, Supabase, Stripe …) erscheinen korrekt
- [ ] „Mehr erfahren"-Button → navigiert zu `/shopray`
- [ ] „Live-Demo"-Button → öffnet `shopray-indol.vercel.app` in neuem Tab
- [ ] 4 Stat-Boxen (12 Pages, 30+ Routen, One-Push, Einmalig) korrekt dargestellt
- [ ] Teaser-Card im Dark-Mode und Light-Mode ohne Darstellungsfehler

**ShopRay-Seite `/shopray`**

- [ ] Seite lädt ohne Fehler (kein Blank Screen, keine roten Konsolenfehler)
- [ ] Eigener Hero sichtbar: Titel animiert Buchstabe für Buchstabe
- [ ] Hero: 2 schwebende Screenshots (Shop + Admin) erscheinen im Hero
- [ ] Screenshots im Hero: Floating-Animation läuft durch (kein Stillstand)
- [ ] Screenshot-Galerie (5 Bilder, 3+2-Grid): alle Bilder laden korrekt
- [ ] Screenshot-Galerie: Hover-Effekt (leichter Lift) funktioniert auf allen 5 Karten
- [ ] Browser-Chrome in `ScreenshotFrame`: 3 Punkte + URL-Leiste + Live-Indikator sichtbar
- [ ] Feature-Karten (8 Stück): Icons + Texte vollständig, kein Overflow
- [ ] „Was du bekommst"-Section: AccountDash-Screenshot rechts + 4 Infra-Karten links
- [ ] „Für wen"-Section: 3 Karten mit Icons sichtbar
- [ ] Pricing-Section: Preisboxen korrekt dargestellt
- [ ] „Jetzt kaufen"-Button → öffnet korrekten Ziellink in neuem Tab
- [ ] „Live-Demo"-Button → öffnet `shopray-indol.vercel.app` in neuem Tab

**Theme-Wechsel**

- [ ] ShopRay-Seite im Dark-Mode: alle Hintergründe und Texte korrekt (`--cs-*` Variablen)
- [ ] ShopRay-Seite im Light-Mode: keine hartcodierten dunklen Farben sichtbar
- [ ] Theme-Toggle (Header) auf `/shopray` → Seite wechselt sofort ohne Reload
- [ ] Screenshot-Rahmen (Browser-Chrome) passt sich dem Theme an
- [ ] Hero-Hintergrund (Gold-Blur + Ambient-Grid) sichtbar in beiden Modes

**Candlescope-Deployment**

- [ ] Nach `git push origin main` im CS-OP-Repo: Vercel baut `cs-op-frontend` automatisch
- [ ] Vercel-Build-Status: kein Build-Fehler (TypeScript + Vite sauber)
- [ ] `candlescope.de/shopray` live erreichbar nach Deploy

---

### 17 — Datenbank-Seed ausführen (vor dem End-Test)

**Einmalig ausführen bevor alle Tests starten:**

1. Supabase SQL Editor öffnen: https://supabase.com/dashboard/project/ikopnwugsohiehzpxxzu/sql/new
2. Inhalt von `database/seed_supplements.sql` einfügen → Run
3. Ergebnis: 6 Kategorien + 12 Supplement-Produkte, alle alten Daten weg

**Was der Seed NICHT anfasst:** User-Accounts (profiles), Versandeinstellungen, Admin-2FA

---

### 18 — End-Test: Vollständiger Durchlauf

Reihenfolge: genau so durchführen — jeder Schritt baut auf dem vorherigen auf.

**A — Setup**
- [ ] Seed ausgeführt (Abschnitt 17)
- [ ] Vercel: alle 3 Projekte haben Status READY (kein rotes X)
- [ ] Backend Health-Check: https://shopray-backend.vercel.app/api/health → `{ "ok": true }`

**B — Als neuer Kunde (frische Session, kein Login)**
- [ ] Startseite lädt, alle Produkte sichtbar
- [ ] Kategorie-Filter: „Protein" → zeigt nur Protein-Produkte
- [ ] Suche: „Creatin" → Creatin Monohydrat erscheint
- [ ] Produktdetail öffnen (z.B. Whey Protein): Galerie, Preis, Tabs
- [ ] Tab „Inhaltsstoffe & Nährwerte" → Nährwerttabelle sichtbar
- [ ] Tab „Bewertungen" → „Noch keine Bewertungen" sichtbar (korrekt, Seed hat keine)
- [ ] „Das könnte dich auch interessieren" → weitere Protein-Produkte sichtbar
- [ ] „In den Warenkorb" → Badge zeigt `1`
- [ ] Warenkorb öffnen → Artikel zentriert, Preis korrekt
- [ ] „Zur Kasse" ohne Login → Redirect zu `/login`

**C — Registrierung & Login**
- [ ] Neue E-Mail registrieren → eingeloggt, Profil in Supabase angelegt
- [ ] Logout → wieder Gast
- [ ] Login (E-Mail + Passwort) → Session aktiv
- [ ] Direktaufruf `/account/dashboard` ohne Session → Redirect zu `/login`

**D — Kompletter Kaufprozess**
- [ ] Produkt in Warenkorb legen → Warenkorb öffnen
- [ ] Menge erhöhen (→ 2) → Gesamtpreis verdoppelt
- [ ] Artikel entfernen → leerer Warenkorb + Empty-State
- [ ] Zweites Produkt in Warenkorb → Zur Kasse
- [ ] Stripe Checkout: Karte `4242 4242 4242 4242`, beliebige Daten
- [ ] **Abbruch testen:** Stripe-Seite → Zurück → Checkout wieder offen, Warenkorb noch voll
- [ ] Zahlung durchführen → Zurück zu `/order-success` → Bestätigungsseite
- [ ] Bestellung unter `/account/orders` mit Status `paid` sichtbar
- [ ] Bestellbestätigungs-Mail kommt an (Bestellnummer, Artikel, Betrag)

**E — Wunschliste & Bewertung**
- [ ] Herzbutton auf Produktkarte → Badge im Header + Wunschliste-Seite
- [ ] Wunschliste: Artikel sichtbar, entfernen klappt
- [ ] Produktdetail → Tab „Bewertungen" → Bewertungsformular sichtbar (eingeloggt)
- [ ] Bewertung schreiben (5 Sterne, Titel, Text) → abschicken → erscheint in Liste
- [ ] Rating-Zahl auf Produkt-Karte aktualisiert sich (Trigger)

**F — Admin-Durchlauf**
- [ ] Admin-Login: https://shopray-admin.vercel.app/login
- [ ] Dashboard: Stat-Karten zeigen echte Zahlen (Bestellung aus Schritt D sichtbar)
- [ ] Dashboard: Zeile in „Letzte Bestellungen" anklicken → öffnet Bestelldetail direkt
- [ ] Bestellungen: Test-Bestellung mit Status `paid` sichtbar
- [ ] Grid-View / Tabellen-View Toggle in Bestellliste → wechselt Ansicht, bleibt nach Reload
- [ ] Bestellung anklicken → Detailseite: Artikel, Adresse, Zeitstempel, Kundenname korrekt
- [ ] **Rechnung herunterladen:** Button „Rechnung" → PDF-Download startet, Datei öffnen: Bestellnummer, Kundenadresse, Artikel mit Netto/MwSt/Brutto sichtbar
- [ ] **Lieferadresse bearbeiten:** Button „Bearbeiten" im Adress-Card → Modal öffnet mit vorausgefüllten Feldern → Straße ändern → speichern → Adresse aktualisiert
- [ ] **DHL-Label erstellen:** Button „DHL Label" → Gewicht eingeben (z.B. 500g) → „Label erstellen" → PDF-Download + Tracking-Nummer in Verlauf-Card sichtbar
- [ ] Nach Label: „DHL Label" zeigt „Label erstellt" (deaktiviert), Adress-Bearbeiten-Button weg, gelbe Infobox mit DHL-Links sichtbar
- [ ] Status → `shipped` setzen → gespeichert, Frontend-Account zeigt `shipped`
- [ ] Produkte: alle 12 Produkte der Liste sichtbar
- [ ] Grid-View / Tabellen-View Toggle in Produktliste → wechselt Ansicht, bleibt nach Reload
- [ ] Neues Produkt anlegen → erscheint im Frontend
- [ ] Bild hochladen → Thumbnail sichtbar, Supabase Storage prüfen
- [ ] Produkt deaktivieren → verschwindet im Frontend-Shop
- [ ] Kategorien: alle 6 sichtbar, neue Kategorie anlegen
- [ ] Kunden: Test-Account aus Schritt C sichtbar
- [ ] Grid-View Toggle in Kundenliste → wechselt Ansicht
- [ ] **Kunden sperren:** Test-Account → „Sperren" → Grund eingeben → Ban bestätigen → Status-Badge + E-Mail an Kunden
- [ ] Gesperrter Kunde im Frontend einloggen → Fehlermeldung
- [ ] Kunden wieder entsperren → Login wieder möglich
- [ ] Ticket erstellen (als User): `/account/tickets/new` → im Admin unter Tickets sichtbar
- [ ] Ticket beantworten + Status `closed` → gespeichert
- [ ] Einstellungen → Versandkosten ändern → im Frontend-Warenkorb wirksam
- [ ] Login-Protokoll: Test-Login aus Schritt F sichtbar

**G — Admin 2FA (falls noch nicht aktiviert)**
- [ ] Admin → Einstellungen → 2FA → QR-Code scannen (Google Authenticator / Aegis)
- [ ] Logout → Login → TOTP-Code eingeben → Zugang

**H — DSGVO-Check**
- [ ] Cookie-Banner erscheint beim ersten Besuch (neues Browser-Tab / Inkognito)
- [ ] Ablehnen → kein Tracking, kein Google Analytics
- [ ] `/account/my-data` → persönliche Daten sichtbar, DSGVO-Export funktioniert
- [ ] Konto löschen: Account-Einstellungen → Löschanfrage → Account weg

**I — Geräte & Theme**
- [ ] Dark Mode ↔ Light Mode: alle Seiten ohne Darstellungsfehler
- [ ] Mobile (375px): Startseite, Produktdetail, Warenkorb, Checkout durchklicken
- [ ] Tablet (768px): Layout korrekt, keine Overflow-Bugs
- [ ] Rechtsklick auf Produktbild → kein Browser-Kontextmenü (Content-Schutz)

---

### 19 — Pre-Launch Checkliste (vor Verkauf / Live-Betrieb)

Diese Punkte MÜSSEN erledigt sein bevor das Template an Kunden geht.

**Sicherheit**
- [ ] Neues Admin-Passwort generieren + Hash in Backend `.env` + Vercel aktualisieren
- [ ] Neuen JWT_SECRET generieren: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- [ ] `NODE_ENV=production` in Backend `.env` + Vercel setzen
- [ ] Admin 2FA aktivieren (Abschnitt 18-G)
- [ ] Supabase: „Email Confirmations" wieder einschalten (Auth → Settings)
- [ ] `VITE_ADMIN_SLUG` in Vercel: sicherer, nicht-erratbarer Pfad (kein `/admin`)

**Stripe**
- [ ] Stripe Live-Keys einsetzen (statt Test-Keys) in Backend `.env` + Vercel
- [ ] Stripe Webhook: Live-Endpoint registrieren + neuen `STRIPE_WEBHOOK_SECRET` setzen
- [ ] Live-Testzahlung mit echter Karte durchführen

**Rechnungen (Pflicht vor Live-Betrieb)**
- [ ] `SHOP_NAME`, `SHOP_STREET`, `SHOP_ZIP`, `SHOP_CITY`, `SHOP_COUNTRY` in Vercel (Backend) setzen
- [ ] `SHOP_EMAIL`, `SHOP_PHONE` (optional), `SHOP_VAT_ID` oder `SHOP_TAX_NUMBER` setzen
- [ ] `INVOICE_PREFIX` setzen (z.B. `RE`) — danach nie mehr ändern (GoBD)
- [ ] Test-Rechnung herunterladen: alle Pflichtfelder (§14 UStG) sichtbar, kein Platzhalter-Text
- [ ] Nach Stripe-Zahlung: Rechnung automatisch per E-Mail versendet (Postfach prüfen)

**DHL Versandlabels**
- [ ] `DHL_API_KEY`, `DHL_BILLING_NUMBER` (14-stellig) in Vercel (Backend) setzen
- [ ] `DHL_SHIPPER_NAME`, `DHL_SHIPPER_STREET`, `DHL_SHIPPER_ZIP`, `DHL_SHIPPER_CITY` setzen
- [ ] `DHL_SANDBOX=true` für Tests, `DHL_SANDBOX=false` für echte Labels
- [ ] Test-Label erstellen (Sandbox) → PDF öffnen, Tracking-Nummer sichtbar

**Push-Benachrichtigungen**
- [ ] `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` in Vercel (Backend) setzen
- [ ] Push im Admin aktivieren → Berechtigung erteilen → Test-Bestellung → Push empfangen

**Inhalte**
- [ ] Alle Produkt-Platzhalter durch echte Produkte ersetzen
- [ ] Produktbilder hochladen (Admin → Produkt → Bild) — idealerweise WebP
- [ ] Bilder zu WebP konvertieren: squoosh.app (519 KB Einsparpotenzial)
- [ ] Impressum + Datenschutz + AGB: echte Firmendaten eintragen
- [ ] Kontakt-E-Mail in `APP_CONTACT` anpassen
- [ ] SMTP konfigurieren: `SMTP_PASS` + `SMTP_FROM_EMAIL` in Backend `.env`

**Offene Features (noch nicht implementiert)**
- [ ] Rollen-System Frontend: Guards + RLS für `admin | mod | customer` (DB-Schema fertig)
- [ ] Google OAuth: finaler Test (Button ist da, Callback prüfen)

**Dokumentation**
- [ ] SETUP.md an Käufer-Anleitung anpassen (Firmennamen, Beispielprodukte)
- [ ] `CREDENTIALS_PRIVATE.txt` sicher aufbewahren (1Password / Bitwarden) — niemals committen

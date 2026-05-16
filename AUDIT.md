# ShopRay — Systematischer Audit-Plan
Stand: 2026-05-16

---

## Aufbau

Dieser Plan deckt 4 Schichten ab:

1. **Käufer-Journey** — Wie erlebt jemand der ShopRay kauft das Projekt?
2. **Kunden-Journey** — Wie erlebt der End-Kunde den Shop auf dem Handy?
3. **Technischer Audit** — Was läuft unter der Haube?
4. **Verbesserungsideen** — Was können wir dem Template-Käufer leichter machen?

---

## SCHICHT 1 — Template-Käufer-Journey
### "Ich habe ShopRay gekauft. Was jetzt?"

Das ist die kritischste Strecke. Wenn der Käufer scheitert, ist alles andere egal.

### 1.1 Erster Eindruck (Repo öffnen)
- [ ] Sieht der Käufer sofort eine README mit klarem Einstieg?
- [ ] Ist SETUP.md verständlich ohne Vorkenntnisse?
- [ ] Sind alle Schritte in der richtigen Reihenfolge?
- [ ] Gibt es eine klare Trennung: "Was du brauchst" vs. "Was du tust"?

**Gedankenexperiment:** Jemand kauft das Template auf einem Marketplace.
Er öffnet den ZIP. Was sieht er zuerst? Findet er sich zurecht?

### 1.2 Voraussetzungen verstehen
- [ ] Node.js — wird erklärt wo man es herunterlädt?
- [ ] Git — wird erklärt?
- [ ] Vercel-Account — ist der Prozess Schritt für Schritt beschrieben?
- [ ] Supabase-Account — dasselbe?
- [ ] Stripe-Account — dasselbe?

**Kritischer Punkt:** Viele Käufer sind keine Entwickler.
Sie stolpern über Begriffe wie "environment variable" oder "bcrypt hash".
→ Jeder Fachbegriff muss entweder erklärt oder durch eine einfachere Formulierung ersetzt werden.

### 1.3 Supabase einrichten
- [ ] Schritt: Neues Projekt anlegen → beschrieben?
- [ ] Schritt: SQL ausführen (schema.sql + alle migrations) → beschrieben?
- [ ] Schritt: Anon Key + URL kopieren → wo findet man das? Screenshot hilfreich?
- [ ] Schritt: "Enable email confirmations" ausschalten → beschrieben?
- [ ] Schritt: Storage Bucket anlegen (product-images) → beschrieben?

### 1.4 Stripe einrichten
- [ ] Test-Mode vs. Live-Mode — ist das erklärt?
- [ ] API Keys finden und eintragen → beschrieben?
- [ ] Webhook-Secret — was ist das, wo findet man es → beschrieben?
- [ ] Stripe Webhook auf Vercel registrieren (URL `/api/webhook/stripe`) → beschrieben?

### 1.5 Admin-Passwort setzen
- [ ] Was ist ein bcrypt-Hash? Weiß der Käufer das?
- [ ] Gibt es ein Tool-Link oder einen Befehl um einen Hash zu generieren?
- [ ] Steht der Befehl `node -e "..."` klar in der SETUP.md?

### 1.6 Deployment auf Vercel
- [ ] Werden alle 3 Projekte einzeln erklärt (Frontend, Admin, Backend)?
- [ ] Env-Variablen pro Projekt — welche gehören wohin?
- [ ] Root Directory Einstellung — wird erklärt?
- [ ] Nach Deployment: wie testet der Käufer ob alles läuft?

### 1.7 Erstes Login nach Setup
- [ ] Käufer öffnet /admin → Login funktioniert?
- [ ] Käufer registriert einen Test-Kunden → funktioniert?
- [ ] Käufer gibt eine Test-Bestellung auf → funktioniert?

---

## SCHICHT 2 — End-Kunden-Journey (Mobile First)
### "Ich öffne den Shop auf meinem Handy"

### 2.1 Ankunft (Cold Start)
- [ ] Seite lädt unter 3 Sekunden (LTE-Simulation)?
- [ ] Kein Layout-Shift (CLS) beim Laden?
- [ ] Schriftgröße lesbar ohne Zoom?
- [ ] Cookie-Banner erscheint korrekt, nicht über wichtige Inhalte?
- [ ] Cookie-Banner auf Mobile vollständig sichtbar (Buttons nicht abgeschnitten)?

### 2.2 Navigation auf Mobile
- [ ] Hamburger-Menü öffnet und schließt?
- [ ] Alle Links im Menü klickbar (44px Mindestgröße)?
- [ ] Menü schließt nach Link-Klick automatisch?
- [ ] Zurück-Button / Geste des Browsers funktioniert?
- [ ] Logo führt zur Startseite?

### 2.3 Produktsuche & Stöbern
- [ ] Produktgrid auf Mobile: 1 Spalte lesbar?
- [ ] Produktbilder laden korrekt, nicht verzerrt?
- [ ] Kategorie-Filter auf Mobile bedienbar?
- [ ] Suchfeld auf Mobile tippbar (kein Zoom beim Fokus)?
- [ ] "Mehr laden" Button erreichbar?
- [ ] Scrollen auf der Produktliste flüssig?

### 2.4 Produktdetail auf Mobile
- [ ] Hauptbild vollständig sichtbar?
- [ ] Thumbnail-Leiste scrollbar wenn mehrere Bilder?
- [ ] Preis gut lesbar (Schriftgröße, Kontrast)?
- [ ] "In den Warenkorb" Button immer erreichbar (sticky oder weit genug unten)?
- [ ] LMIV-Nährwerttabelle auf Mobile lesbar (kein horizontaler Overflow)?
- [ ] Bewertungs-Sterne sichtbar?
- [ ] Breadcrumb / Zurück-Navigation?

### 2.5 Warenkorb auf Mobile
- [ ] Warenkorb-Icon zeigt Badge mit Anzahl?
- [ ] Warenkorb-Seite auf Mobile übersichtlich?
- [ ] Menge erhöhen/verringern: Buttons groß genug?
- [ ] Gesamtpreis prominent sichtbar?
- [ ] "Zur Kasse" Button prominent?

### 2.6 Checkout auf Mobile
- [ ] Formularfelder korrekte Tastatur (Email = E-Mail-Tastatur, Tel = Zahlen)?
- [ ] Felder groß genug zum Antippen?
- [ ] Fehlermeldungen erscheinen direkt beim Feld?
- [ ] Zahlungsarten-Auswahl auf Mobile bedienbar?
- [ ] Klarna-Logo vollständig sichtbar?
- [ ] Stripe-Redirect funktioniert auf Mobile-Browser?

### 2.7 Stripe auf Mobile
- [ ] Stripe-Checkout-Seite öffnet korrekt (kein Blank-Tab)?
- [ ] Karteneingabe auf Mobile möglich?
- [ ] Nach Zahlung: Redirect zurück zur Success-Page?
- [ ] Success-Page auf Mobile korrekt dargestellt?

### 2.8 Konto-Registrierung auf Mobile
- [ ] /register auf Mobile korrekt dargestellt?
- [ ] Formularfelder gut bedienbar?
- [ ] Passwort-Anzeigen-Toggle funktioniert?
- [ ] Nach Registrierung: automatisch eingeloggt?

### 2.9 Konto-Bereich auf Mobile
- [ ] Tab-Bar unten: alle Tabs erreichbar?
- [ ] Logout-Button sichtbar und erreichbar?
- [ ] Dashboard-Übersicht auf Mobile lesbar?
- [ ] Bestellhistorie auf Mobile scrollbar?
- [ ] Wunschliste: Karten sichtbar (nicht opacity:0)?
- [ ] Adressen: Formular auf Mobile bedienbar?
- [ ] Einstellungen: Felder erreichbar?
- [ ] Meine Daten / DSGVO: Text lesbar, Buttons erreichbar?

### 2.10 Rechtliche Seiten auf Mobile
- [ ] /impressum lädt und ist lesbar?
- [ ] /datenschutz lädt und ist lesbar?
- [ ] /agb lädt und ist lesbar?
- [ ] FAQ-Seite lädt?

---

## SCHICHT 3 — Technischer Audit

### 3.1 API-Endpoints (Backend)
- [ ] `GET /api/health` → 200
- [ ] `GET /api/products` → Array mit Produkten
- [ ] `GET /api/products/:slug` → einzelnes Produkt
- [ ] `POST /api/orders` → neue Bestellung
- [ ] `POST /api/webhook/stripe` → 200 (mit gültigem Payload)
- [ ] `GET /api/settings/shipping` → Versandeinstellungen
- [ ] `POST /api/admin/login` → Cookie gesetzt
- [ ] `GET /api/admin/check` → 200 (mit Cookie) / 401 (ohne)
- [ ] `GET /api/admin/orders` → Bestellliste
- [ ] `GET /api/admin/products` → Produktliste
- [ ] `PUT /api/admin/settings/shipping` → gespeichert

### 3.2 Datenbank (Supabase)
- [ ] Alle 6 Migrations ausgeführt?
- [ ] RLS Policies aktiv (Tabellen nicht öffentlich schreibbar)?
- [ ] `products` Tabelle: Daten vorhanden?
- [ ] `orders` Tabelle: schreibbar über Backend?
- [ ] `shipping_settings` Singleton (id=1) vorhanden?
- [ ] `admin_login_log` Tabelle vorhanden?
- [ ] `admin_totp` Tabelle vorhanden?
- [ ] Storage Bucket `product-images` public lesbar?

### 3.3 Auth (Supabase Auth)
- [ ] Registrierung erstellt User in `auth.users`?
- [ ] Login gibt Session zurück?
- [ ] Token-Refresh funktioniert?
- [ ] Logout löscht Session?
- [ ] "Passwort vergessen" sendet E-Mail?
- [ ] Reset-Link setzt neues Passwort korrekt?

### 3.4 E-Mail (SMTP)
- [ ] Bestellbestätigung wird gesendet?
- [ ] Kontaktformular-Alarm wird gesendet?
- [ ] Passwort-Reset-E-Mail kommt an?
- [ ] Absender-Name korrekt (kein "noreply@supabase.io")?

### 3.5 Sicherheit
- [ ] Admin-Routen ohne Cookie → 401?
- [ ] 5× falsches Admin-PW → Lockout?
- [ ] Stripe Webhook ohne gültige Signatur → 400?
- [ ] CORS: Backend akzeptiert nur Frontend + Admin URLs?
- [ ] Produktbilder: Rechtsklick blockiert?
- [ ] Text: user-select: none aktiv?
- [ ] HTTPS überall (kein HTTP-Mix)?

### 3.6 Performance
- [ ] Lighthouse Score Frontend > 80?
- [ ] Produktliste lädt unter 2s?
- [ ] Bilder laden lazy (unterhalb des Folds)?
- [ ] JS-Bundle: kein Chunk > 200KB?

---

## SCHICHT 4 — Was können wir dem Template-Käufer leichter machen?

### 4.1 Was ist aktuell schwer?

| Problem | Warum schwer | Verbesserungsidee |
|---|---|---|
| bcrypt-Hash generieren | Braucht Terminal-Wissen | Script oder Web-Tool in SETUP.md verlinken |
| 3 separate Vercel-Projekte deployen | Viele Schritte, leicht zu verwechseln | Schritt-für-Schritt mit Screenshots |
| Supabase Migrations ausführen | SQL-Editor nicht intuitiv | GIF/Video zeigen wo der Editor ist |
| Stripe Webhook registrieren | URL muss nach Deployment eingetragen werden | Erklären wann genau dieser Schritt kommt |
| "Enable email confirmations" ausschalten | Versteckt in Sign In / Providers | Direkter Screenshot-Link |
| Env-Variablen welche wohin | Verwirrend bei 3 Projekten | Tabelle: Variable → Projekt |

### 4.2 Konkrete nächste Schritte (Priorität)

1. **SETUP.md** — Abschnitt "Admin-Passwort" mit einem `node`-Einzeiler ergänzen
2. **SETUP.md** — Env-Variablen-Tabelle: welche Variable in welches Vercel-Projekt
3. **SETUP.md** — Supabase Screenshot-Referenzen (wo ist der SQL-Editor)
4. **SETUP.md** — Nach-Deployment-Check: 5 URLs die der Käufer prüfen soll
5. **QUICKSTART.md** — bereits vorhanden, aber prüfen ob Reihenfolge stimmt

### 4.3 Was der Käufer auf dem Handy sehen wird

Der Template-Käufer testet seinen Shop wahrscheinlich zuerst auf dem Handy.
Das ist sein "Wow"-Moment oder sein "das kaufe ich nicht"-Moment.

**Goldene Pfade die auf Mobile sauber laufen müssen:**
1. Startseite öffnen → Produkt anklicken → In den Warenkorb → Checkout → Zahlen
2. Konto registrieren → Einloggen → Dashboard → Logout
3. Produkt auf Wunschliste → Wunschliste öffnen → Produkt sichtbar

**Was noch fehlt für einen perfekten Mobile-Eindruck:**
- [ ] PWA-Manifest (App-Icon wenn User "zum Homescreen hinzufügen")
- [ ] Splash Screen für Mobile
- [ ] Bilder in WebP (519 KB Einsparpotenzial laut Lighthouse)

---

## Testreihenfolge empfohlen

```
1. API Health-Check → Backend läuft?
2. Shop-Startseite → Frontend läuft?
3. Admin-Login → Admin läuft?
4. Test-Kunde registrieren
5. Produktliste durchsehen
6. Produkt kaufen (Stripe Test)
7. Bestellung im Admin prüfen
8. Konto-Bereich durchklicken
9. Alles auf Mobile wiederholen
10. Dark Mode prüfen
```

---

## Offene Bugs (Stand 2026-05-16)

| Bug | Status | Fix |
|---|---|---|
| Google OAuth | Offen | Button da, nicht verdrahtet |
| Bilder → WebP | Offen | Manuell via squoosh.app |
| SETUP.en.md veraltet | Offen | v1.1.0, nicht aktuell |

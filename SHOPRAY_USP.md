# ShopRay — USP & Wettbewerbsvergleich

> Verkäufliches Shop-Template · Stand Mai 2026  
> React · TypeScript · Supabase · Stripe · Vercel

---

## Das Wichtigste in 30 Sekunden

ShopRay ist ein **vollständiges, sofort produktionsfertiges Shop-System** das einmalig gekauft und beliebig oft betrieben werden kann — ohne monatliche Plattformgebühren, ohne Transaktionsgebühren, mit vollem Code-Zugriff.

Kein Plugin-Chaos. Kein Vendor Lock-in. Kein Abo.

---

## USPs im Detail

### 1. Einmalzahlung — kein Abo, keine Transaktionsgebühren
Shopify kostet ab 29 $/Monat — plus 0,5–2 % auf jeden Umsatz.  
ShopRay: einmal kaufen, für immer betreiben. Bei 10.000 € Monatsumsatz spart der Käufer allein an Transaktionsgebühren bis zu **200 €/Monat**.

### 2. Vollständiger Code-Besitz
Der Käufer bekommt den kompletten Quellcode. Kein API-Limit, keine Plattform die abgestellt werden kann, keine erzwungenen Updates. Anpassungen ohne Grenzen.

### 3. PCI DSS SAQ A — Zahlungskonformität ohne Aufwand
Stripe Checkout (Redirect-Ansatz): Kartendaten fließen **niemals** durch den eigenen Server. Automatische SCA/3DS-Authentifizierung nach PSD2. Der Betreiber hat die niedrigste PCI-Verpflichtung (SAQ A) — ohne einen einzigen Handgriff.

### 4. GoBD-konforme Rechnungen out of the box
Automatische PDF-Rechnungen nach **§14 UStG** — fortlaufende Rechnungsnummern via PostgreSQL-Sequence, unveränderlich, revisionssicher. Sofort finanzamtstauglich. Bei WooCommerce kostet das allein als Plugin 80–200 €/Jahr.

### 5. DSGVO komplett integriert
- Cookie Consent Banner
- Datenlöschung auf Knopfdruck (Recht auf Vergessenwerden)
- DSGVO-Datenexport (Auskunftspflicht)
- Datenschutzerklärung, Impressum, AGB, Widerruf — alles als fertige Seiten enthalten

### 6. DHL Business API — Versandlabels direkt im Admin
Keine manuelle DHL-Weiterleitung. Label erstellen, herunterladen, Tracking-Nummer automatisch an den Kunden — alles in einem System.

### 7. Rollenbasiertes Admin-System (RBAC)
- **Owner**: Vollzugriff + Passwort- und TOTP-Schutz
- **Mod**: Eingeschränkter Zugriff per E-Mail-Invite (kein Vorregistrieren nötig)
- Audit-sicher: Login-Protokoll, API-Guards auf allen sensitiven Routen

### 8. 2FA für Kunden und Admin
TOTP (Google Authenticator, Authy) — sowohl für Endkunden als auch für den Owner. Enterprise-Security ab Tag 1.

### 9. Modernes Tech-Stack ohne Legacy-Ballast
React 19 · TypeScript · Express · Supabase (PostgreSQL + Auth + Storage) · Vercel  
Kein PHP. Kein WordPress. Kein Plugin-Ökosystem das gepatcht werden muss.

### 10. Ein Push — drei Deployments
Monorepo-Struktur: `git push origin main` deployt automatisch Frontend, Admin-Panel und Backend auf Vercel. Kein DevOps-Wissen erforderlich.

### 11. Dark Mode, Light Mode, Theme-Paletten
Vollständig durchdachte Dark/Light-Implementierung inkl. mehrerer Farbpaletten — ohne nachträgliches Hacking.

### 12. CSV & KI-Import für Produkte
Produkte per CSV-Datei bulk-importieren. Inkl. **„KI-Prompt kopieren"**-Button — fertiger Prompt für ChatGPT/Claude der das CSV-Format erklärt und sofort nutzbare Produktdaten liefert.

### 13. Web Push Notifications
PWA-ready, Service Worker, VAPID — Kunden erhalten Push-Benachrichtigungen bei neuen Bestellungen. Native App-Feeling ohne App Store.

---

## Wettbewerbsvergleich

| Feature | **ShopRay** | Shopify | WooCommerce | Shopware (Community) |
|---|---|---|---|---|
| **Einmalzahlung** | ✅ | ❌ Abo ab 29 $/Mo | ✅ (aber Plugins kosten) | ✅ (Community gratis, aber komplex) |
| **Transaktionsgebühren** | ✅ Keine | ❌ 0,5–2 % | ✅ Keine | ✅ Keine |
| **Code-Eigentum** | ✅ Vollständig | ❌ SaaS | ✅ Open Source | ✅ Open Source |
| **Admin-Panel included** | ✅ Vollständig | ✅ | ✅ WP-Admin | ✅ |
| **Setup-Aufwand** | ✅ Gering | ✅ Sehr gering | ⚠️ Hoch (Plugins) | ❌ Sehr hoch |
| **PCI DSS (Karten)** | ✅ SAQ A (Stripe Redirect) | ✅ | ⚠️ Plugin-abhängig | ⚠️ Plugin-abhängig |
| **PSD2 / SCA** | ✅ Automatisch | ✅ | ⚠️ Plugin-abhängig | ⚠️ Konfig nötig |
| **DSGVO out of the box** | ✅ Vollständig | ⚠️ Grundlegend | ⚠️ Plugin nötig | ⚠️ Konfig nötig |
| **GoBD-Rechnungen** | ✅ Automatisch | ❌ App nötig (teuer) | ❌ Plugin ~100 €/Jahr | ⚠️ Plugin nötig |
| **DHL Integration** | ✅ Business API v2 | ❌ App nötig | ❌ Plugin nötig | ❌ Plugin nötig |
| **RBAC (Rollen)** | ✅ Owner + Mod | ⚠️ Begrenzt | ⚠️ Plugin nötig | ✅ |
| **2FA (Admin)** | ✅ TOTP | ✅ | ⚠️ Plugin nötig | ✅ |
| **2FA (Kunden)** | ✅ TOTP | ❌ | ❌ | ❌ |
| **Dark / Light Mode** | ✅ | ⚠️ Theme-abhängig | ⚠️ Theme-abhängig | ⚠️ Theme-abhängig |
| **Web Push / PWA** | ✅ | ❌ | ❌ | ❌ |
| **KI-Import (CSV)** | ✅ | ❌ | ❌ | ❌ |
| **Hosting-Freiheit** | ✅ Vercel / beliebig | ❌ Nur Shopify | ✅ | ✅ |
| **Tech-Stack** | React + TS + Supabase | Liquid (proprietär) | PHP + WordPress | PHP + Symfony |
| **Performance** | ✅ Vercel Edge | ✅ | ⚠️ Server-abhängig | ⚠️ Server-abhängig |

---

## Was ShopRay nicht ist

Damit der Käufer realistische Erwartungen hat:

- **Kein Marktplatz** — keine eingebaute SEO-Reichweite wie Amazon oder Etsy
- **Kein Drag-and-Drop-Builder** — Anpassungen brauchen minimale Entwicklungskenntnisse (oder einen Entwickler)
- **Kein 24/7-Plattform-Support** — der Käufer ist selbst verantwortlich für seinen Betrieb (wie bei allen selbstgehosteten Lösungen)

---

## Für wen ist ShopRay gemacht?

| Zielgruppe | Passt? |
|---|---|
| Entwickler die ein fertiges Fundament wollen | ✅ Perfekt |
| Agenturen die Shops für Kunden bauen | ✅ Perfekt — einmal kaufen, mehrfach deployen |
| Kleinunternehmer mit technischem Grundverständnis | ✅ Mit SETUP.md sofort startklar |
| Jemand der null Code anfassen will | ⚠️ Eher Shopify |
| Enterprise mit eigener IT-Abteilung | ✅ Solide Basis, anpassbar |

---

## Rechtliche Stärken (Deutschland / EU)

| Anforderung | Status |
|---|---|
| §14 UStG (Rechnungspflicht) | ✅ Automatische GoBD-konforme PDFs |
| GoBD (Unveränderlichkeit) | ✅ PostgreSQL-Sequence, kein manuelles Nummernvergabe |
| DSGVO Art. 17 (Löschrecht) | ✅ Löschen auf Knopfdruck |
| DSGVO Art. 20 (Auskunft) | ✅ Datenexport im Kundenkonto |
| PSD2 (Starke Kundenauthentifizierung) | ✅ Stripe Checkout |
| Widerrufsrecht (§312g BGB, 14 Tage) | ✅ Fertige Widerrufsseite + Rückgabe-System |
| Impressumspflicht (TMG) | ✅ Fertige Impressumsseite |
| Cookie Consent (ePrivacy) | ✅ ConsentBanner integriert |

---

*ShopRay · github.com/SchubertChris · Stand 2026-05-20*

---

---

# Ehrlicher Vergleich — Vor- & Nachteile

> Ungeschönt. Auch die eigenen Schwächen.

---

## ShopRay

| ✅ Vorteile | ❌ Nachteile |
|---|---|
| Einmalzahlung — kein Abo, kein Vendor Lock-in | Technisches Setup nötig (Env-Vars, Supabase, Stripe) |
| Keine Transaktionsgebühren | Kein Drag-and-Drop-Editor |
| Vollständiger Code-Besitz | Kein Plugin-Ökosystem — alles muss selbst gebaut werden |
| PCI DSS SAQ A, PSD2, DSGVO out of the box | Kleine Community — kein öffentliches Forum, kein Stack Overflow |
| GoBD-konforme Rechnungen automatisch | Kein eingebautes E-Mail-Marketing (Newsletter etc.) |
| DHL Business API direkt integriert | Kein Multi-Language-Support (aktuell nur Deutsch) |
| Moderner Stack (React, TS, Supabase) — gut wartbar | Keine Produktvarianten (Größe/Farbe-Matrix) |
| RBAC mit Owner + Mod-Rollen | Kein Abandoned-Cart-Recovery |
| 2FA für Kunden und Admin | Kein POS (Point of Sale / Ladenkasse) |
| Dark/Light Mode + Paletten | Kein B2B-Modus (keine Staffelpreise, keine Firmenkonten) |
| Web Push / PWA | Kein Gutschein-/Rabattcode-System |
| KI-gestützter CSV-Import | Ein-Personen-Projekt — Bus-Faktor vorhanden |
| Kein monatlicher Plattformausfall-Risiko | Kein Analytics-Dashboard (kein Traffic, keine Conversion-Rate) |

---

## Shopify

| ✅ Vorteile | ❌ Nachteile |
|---|---|
| Extrem einfaches Setup (kein Code) | 29–299 $/Monat — immer |
| 8.000+ Apps im App Store | 0,5–2 % Transaktionsgebühr (außer Shopify Payments) |
| 24/7 Support | Shopify Payments in manchen EU-Ländern nicht verfügbar |
| Gebaut für Nicht-Entwickler | Liquid-Templating — proprietär, schwer zu debuggen |
| Multi-Währung, Multi-Sprache | Kaum echte Code-Kontrolle |
| Abandoned Cart Recovery eingebaut | App-Kosten summieren sich schnell auf 200–500 $/Mo |
| Sehr gute Uptime & Performance | Datenexport eingeschränkt — Vendor Lock-in |
| POS (Kassensystem) | DSGVO-Konformität erfordert Zusatzaufwand |
| Großes Ökosystem, riesige Community | GoBD-Rechnungen nur über teure Drittapps |
| Gut dokumentiert | Bei Kündigung: alle Daten weg |

---

## WooCommerce

| ✅ Vorteile | ❌ Nachteile |
|---|---|
| Core kostenlos | Plugin-Abhängigkeiten (schnell 10–20 Plugins) |
| Riesiges Plugin-Ökosystem | Sicherheitslücken durch veraltete Plugins — häufig |
| WordPress-Vertrautheit (viele kennen es) | Performance ohne Optimierung miserabel |
| SEO-Vorteil durch WordPress | Wartungsaufwand hoch (Updates, Kompatibilität) |
| Sehr flexibel anpassbar | PCI-Compliance plugin-abhängig — oft lückenhaft |
| Große Community | GoBD-Rechnungen: Plugin ~80–200 €/Jahr |
| Viele Hosting-Optionen | DSGVO komplett: Plugin-Kombination nötig |
| Gut für Content-getriebene Shops | Kein einheitliches Admin-Erlebnis |
| | WooCommerce Payments in DE eingeschränkt |
| | PHP/WordPress — technisch veraltet |

---

## Shopware (Community Edition)

| ✅ Vorteile | ❌ Nachteile |
|---|---|
| Deutsches Unternehmen — DSGVO-Verständnis | Sehr steile Lernkurve |
| Starke B2B-Features | Community Edition hat deutliche Funktionslimits vs. Enterprise |
| Headless-fähig (modernes API-first Design) | Setup ohne Entwickler kaum möglich |
| Symfony-Basis — sauber architekturiert | Enterprise-Lizenz sehr teuer (4.000–15.000+ €/Jahr) |
| Aktiv weiterentwickelt | Kleinere Community als Shopify/WooCommerce |
| Gut für komplexe Sortimente | Hosting-Anforderungen hoch |
| Mehrsprachig out of the box | Deutsche Doku teilweise veraltet |
| | GoBD/Rechnungen: Plugin oder Custom |

---

## Zusammenfassung — ehrliche Bewertung (1–5)

| Kriterium | ShopRay | Shopify | WooCommerce | Shopware CE |
|---|---|---|---|---|
| **Einstiegshürde** | 3 | 5 | 2 | 1 |
| **Gesamtkosten (5 Jahre)** | 5 | 1 | 3 | 3 |
| **Flexibilität / Anpassung** | 4 | 2 | 4 | 4 |
| **EU-Rechtskonformität** | 5 | 3 | 2 | 4 |
| **Performance** | 5 | 4 | 2 | 3 |
| **Plugin-Ökosystem** | 1 | 5 | 5 | 3 |
| **Community & Support** | 1 | 5 | 5 | 3 |
| **Sicherheit** | 4 | 4 | 2 | 4 |
| **Feature-Vollständigkeit** | 3 | 5 | 4 | 4 |
| **Moderner Tech-Stack** | 5 | 3 | 1 | 4 |
| **Für Entwickler** | 5 | 2 | 3 | 4 |
| **Für Nicht-Entwickler** | 2 | 5 | 3 | 1 |

> **Legende:** 5 = sehr gut · 1 = schlecht

---

## Fazit in einem Satz pro Produkt

**ShopRay** — Das richtige Tool wenn man einen modernen, rechtssicheren Shop will ohne dauerhaft Plattformgebühren zu zahlen — aber man muss bereit sein, einmal technisch durchzuatmen.

**Shopify** — Beste Wahl für jemanden der schnell starten will und Geld gegen Zeit tauscht. Langfristig teuer.

**WooCommerce** — Mächtig aber chaotisch. Günstig in der Anschaffung, teuer in der Pflege. Nicht empfehlenswert für neue Projekte ohne dedizierten Entwickler.

**Shopware CE** — Die Deutsche Enterprise-Alternative für komplexe B2B-Projekte. Für einen einfachen Consumer-Shop überdimensioniert.

---

*Stand 2026-05-20 · Preise und Features können sich ändern*

# Claude Session State — ShopRay

Diese Datei wird von Claude am Anfang jeder Session gelesen und am Ende/bei Pausen aktualisiert.
Ziel: Kontextverlust durch Compacting verhindern.

**Letzte Aktualisierung:** 2026-06-07 (Session 18 — Security Hardening 5 Phasen + Stock-Reservierung + Stripe-Webhook-Fix)

---

## DEPLOY-CHEATSHEET (immer gültig)

```
# 1. TypeScript prüfen (alle 3 Projekte)
cd Frontend && npx tsc --noEmit
cd Admin    && npx tsc --noEmit
cd Backend  && npx tsc --noEmit

# 2. Pushen
git push origin main   → PRODUCTION auf Vercel (alle 3 Projekte automatisch)
```

**Live-URLs:**
| Projekt | URL |
|---|---|
| Frontend | https://shopray-indol.vercel.app |
| Admin | https://shopray-admin.vercel.app |
| Backend | https://shopray-backend.vercel.app |

---

## Aktueller Implementierungsstand

### Vollständig implementiert (Stand 2026-05-20)

| Bereich | Stand |
|---|---|
| Frontend (React + SCSS) | Vollständig — alle Pages, Features, SEO, Content-Schutz |
| Backend (Express + Zod) | Vollständig — Auth, Produkte, Bestellungen, DHL, Rechnungen, Push |
| Admin Panel | Vollständig — alle Seiten inkl. Notification Center + Aufgaben |
| Admin Auth | Owner (Passwort + TOTP) + Mod (Supabase Auth), sessionStorage, Login-Protokoll |
| RBAC (Rollen-System) | Owner vs. Mod — Backend-Guards (requireOwner), Router-Guards, UI-Guards |
| Mitarbeiter-Invite | Kein Vorregistrieren nötig — Supabase inviteUserByEmail, pending_mod_invites Tabelle |
| Owner-Passwort per UI | PUT /api/admin/password, bcrypt-Hash in admin_config DB (Fallback auf Env-Var) |
| Supabase Schema | Migrations 001–030 — schema.sql auf Stand 029 |
| Stripe | Checkout-Redirect, Webhook, Bestellbestätigung per E-Mail |
| Rechnungen | pdfkit, GoBD-konform (§14 UStG), auto-Email bei Zahlung, PDF-Download im Admin |
| DHL Versandlabels | Business API v2, Sandbox + Produktion, Label-Download, Tracking-Link |
| Web Push Notifications | VAPID, Service Worker, PWA-Manifest, Push bei neuer Bestellung |
| Produktvarianten | Optionsgruppen, SKU-Matrix, Preisaufschlag, Lagerbestand pro Kombination |
| Gutscheincodes | discount_codes Tabelle, Admin-CRUD, Checkout-Validierung |
| Notification Center | Bell-Dropdown (TopBar), Polling 30s, read/unread pro User, 6 Event-Typen |
| Aufgaben-System | /tasks Page, Owner erstellt/löscht, Mods sehen eigene + unzugewiesene, Priorität + Fälligkeit |
| Login-Protokoll | Zeigt role + email pro Eintrag, alle Admins + Mods sichtbar |
| schema.sql (Frisch-Install) | Enthält Migrations 001–029 komplett — 1 File für kompletten DB-Rebuild |
| Security Audit | 27 Sicherheitslücken gefunden + alle geschlossen (Stand 2026-05-20) |
| Docs-Cleanup | .env.examples korrigiert, QUICKSTART.md, SETUP.en.md v1.8.0 — alles gepusht |

### Implementiert in Session 19 (2026-06-25) — GPT-5.5-Audit Gegenprüfung + Fixes

GPT-5.5 lieferte zwei „launch-ready"-Bewertungen. Multi-Agent-Audit (verify + adversarisch) gegen den echten Code: **7 Behauptungen erfunden** (API-URL-Chaos, Service-Key im Admin, Stripe-Redirects falsch, Cart zu früh geleert, Stock ungeprüft, Reviews ungefiltert, CSRF) — **16 bestätigt**. Bestätigte echte Bugs gefixt:

| Fix | Bug | Datei |
|---|---|---|
| B3 🔴 | Versand fehlte in Stripe → Shop verlor Versandkosten | `Backend/routes/orders.ts` (shipping_option + order.total) |
| C2 🟠 | refund/payment_failed fanden Order nie (Metadata nur auf Session) | `orders.ts` payment_intent_data + `stripe.ts` DB-Fallback |
| C1 | Webhook-Idempotenz war TOCTOU-racy | `stripe.ts` atomarer `.eq('status','pending')`-Guard |
| B6 | order_items-Fehler ungeprüft + Orphan-Orders | `orders.ts` Fehlerprüfung + Cleanup |
| F1 | Mail-Templates escapten nur Kontakt | `mailer.ts` escapeHtml in Order/Login/Ban/ModInvite |
| G1 | admin-stats fragte Tabelle `contacts` (existiert nicht) | `admin-stats.ts` → `contact_inquiries` |
| G2 | demoModeGuard nur auf /api/admin | `index.ts` global vor allen Routern |
| A1 | `.env.example` Doppel-`/api` | Frontend + Admin `.env.example` |
| A3 | `vercel.json` hardcodet Backend-Domain | SETUP.md Käufer-Warnung (Domain bleibt — sonst Live-Break) |
| SMTP | Fake-Formular ohne Funktion | `Admin/settings/index.tsx` → Read-only Info-Panel |
| J3 | Legal-Platzhalter ohne Guard | `Frontend/config/goLiveCheck.ts` Dev-Warnung |
| **D1/D2/D3/E2** 🔴 | RLS: role-Eskalation, Fake-Orders, Contact-Spam, Rating zählt unverified | `migration_035` — ausgeführt ✓ (2026-06-26) |
| **I4** 🟡 | TOTP-Secret lag im Klartext in der DB | `Backend/lib/totpCrypto.ts` AES-256-GCM, rückwärtskompat + Lazy-Migration |
| **J4** 🟡 | keine Tests/CI | Vitest (10 Tests, totpCrypto) + `.github/workflows/ci.yml` |

**Deploy:** Commits gruppiert auf `main` gepusht, alle 3 Vercel-Projekte READY (Stand 2026-06-26).
**TOTP_ENC_KEY:** gesetzt ✓ (2026-06-26) — in Vercel shopray-backend + lokal, redeployed, Login durchgeführt → TOTP-Secrets at-rest verschlüsselt (AES-256-GCM).

**Session 19b (2026-06-26) — restliche Dev-Items erledigt (Plan- + Review-Workflow):**
- **I2** ✓ Admin-Auth httpOnly-Cookie + CSRF-Guard (rückwärtskompatibel, Bearer bleibt Fallback). `adminCookie.ts`, `csrf.ts` (global, greift nur bei Cookie-Auth-Mutationen ohne `X-Requested-With`).
- **J1** ✓ `home.tsx` 488→94 + `product-form.tsx` 528→91 in Komponenten/Hooks gesplittet. DOM-Äquivalenz adversarisch verifiziert.
- **B2** ✓ `order-success` lädt echte Bestellnummer via gast-zugänglichem `GET /api/orders/:id/summary` (UUID=Capability, Rate-Limit).
- Verifiziert: Backend tsc + Frontend/Admin Build + 10 Vitest-Tests grün; adversarischer Review 0 Blocker.

**Wirklich noch offen:** nichts Kritisches mehr. Optionale Folge-Tasks: I2b (sessionStorage-Token ganz entfernen sobald Cookie-Pfad in Prod inkl. Mobile verifiziert), toter `totpPending`-Cookie-Read in admin-auth.ts aufräumen.

### Implementiert in Session 18 (2026-06-07)

| Feature | Details |
|---|---|
| **Security Hardening Phase 1 — adminAuth.ts** | `rootIat` in JWT-Payload verankert (erste Login-Zeit, nie überschrieben bei Renewal) → absolute 24h-Session-Grenze. Zentrales `verifyAdminToken()` eliminiert doppelten Code in 4 Guard-Funktionen. Memory-Leak in `_staffCache` behoben: abgelaufene Einträge werden aktiv gelöscht statt nur übersprungen. |
| **Security Hardening Phase 2 — Webhook-Idempotenz** | `checkout.session.completed` prüft jetzt vor der Verarbeitung ob die Bestellung bereits `'paid'` ist → kein Doppel-Versand von E-Mail/Rechnung/Push. |
| **Security Hardening Phase 2 — Discount TOCTOU** | Migration 034: `claim_discount()` RPC (ein atomares `UPDATE...RETURNING` → Row-Lock, kein Read-Then-Write). `release_discount_claim()` für Session-Expiry. Checkout-Route ruft `claim_discount` auf statt freies Lesen; Catch-Block gibt Claim zurück wenn Fehler nach Claim. `checkout.session.expired` ruft `release_discount_claim` auf. `increment_discount_uses` aus Webhook entfernt (war redundant). |
| **Security Hardening Phase 3 — Helmet + Payload** | HSTS explizit mit `maxAge: 31536000, includeSubDomains, preload`. `referrerPolicy`, `frameguard`, `noSniff`, `xssFilter` explizit gesetzt. Bulk-Import bekommt 512kb Payload-Limit (vor globalem 10kb registriert). |
| **Security Hardening Phase 4 — Bulk Import + Error Handler** | Bulk-Insert: sequentielle N-DB-Calls → ein einziger Batch-Insert (`supabase.from.insert(array)`). Error-Handler: Request-Methode + URL im Log (anti-injection gekürzt auf 200 Zeichen), `code`-Feld aus 5xx-Responses entfernt. |
| **Security Hardening Phase 5 — vercel.json Headers** | Frontend + Admin: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection: 0`, `Referrer-Policy`, `HSTS`, `Permissions-Policy`, `Content-Security-Policy`. Backend: HSTS als Belt-and-Suspenders (neben helmet). |
| **Stock-Reservierung (aus Session 17)** | Migration 033 erstellt: `stock_reservations` Tabelle, `decrement_stock`, `reserve_stock`, `release_reservation` RPCs. Orders.ts: Reservierungs-Check vor Checkout. Stripe.ts: atomarer Abzug via `decrement_stock`, `release_reservation` bei Zahlung + Session-Expiry. |
| **FAQ Clearbit-Fix** | Clearbit Logo API abgekündigt — alle Provider-Logos durch inline SVG-Komponenten ersetzt. |

### Implementiert in Session 17 (2026-05-25)

| Feature | Details |
|---|---|
| **Homepage Komplettneubau** | Candlescope-branded Landing Page (Trading Kurse + Merch). 6 Sektionen: Hero (dekorative Kerzen-SVGs), Trust Bar (Marquee), Bestseller-Produkte, Kategorien (2 Karten), Reviews (asymmetrisch), Newsletter. Kein GSAP — alles CSS-only. |
| **HomeLayout + Bottom-Reveal Nav** | Eigenes Layout für `/` (kein Standard-Header). Nav startet `position: fixed; bottom: 0`, wechselt nach Scroll zu `top: 0` mit `hn-slide-top` Keyframe. `useRevealObserver` als shared Hook extrahiert. |
| **HeroCanvas.tsx gelöscht** | War nur in alter home.tsx importiert — komplett entfernt. |
| **Token-Aliase in _root.scss** | `--clr-bg`, `--clr-border`, `--clr-text-muted`, `--clr-avatar-1`, `--clr-avatar-2` als `:root`-Aliases definiert. |
| **supabase/.temp/ in .gitignore** | Supabase CLI Cache-Dateien waren im Repo — entfernt + .gitignore aktualisiert. |
| **Commits** | `dca4e16`, `d7a0161`, `4de84d3`, `82dbb7f`, `03d53e7`, `bbc1cc2`, `26f6975`, `85b2c0c` |

### Implementiert in Session 16 (2026-05-22)

| Feature | Details |
|---|---|
| **Homepage Visual Redesign** | Komplette Animation-Überarbeitung: Lenis Smooth Scroll, GSAP ScrollTrigger. Cormorant Garamond für Hero/Display-Texte. Hero-Titel auf `clamp(5rem, 14vw, 10rem)` vergrößert, hero-glass Container entfernt (direktes Text-Layout). Bento-Karten fliegen aus 6 verschiedenen Richtungen ein. Partikel-Orbit-Ringe (CSS + GSAP scrub gegenläufig) um Brand-Split-Bild. Hero-Parallax für `__bg` + `.hero-canvas`. IntersectionObserver durch GSAP ScrollTrigger ersetzt. |
| **Lenis Integration** | `lenis@1.3.23` in `App.tsx` — `lenis.on('scroll', ScrollTrigger.update)` + GSAP ticker. Smooth scroll für alle Seiten aktiv. |
| **GSAP Animationen** | Hero-Entrance (stagger), Hero-Parallax (scrub), Bento-Fly-In (6 Richtungen), Brand-Split (links/rechts gleichzeitig), Partikel-Ringe (gegenläufig auf scroll), USP-Grid (scale + stagger), Reviews (stagger), FAQ (stagger), Newsletter (stagger) |

### Implementiert in Session 15 (2026-05-22)

| Feature | Details |
|---|---|
| **Mod-2FA (TOTP)** | Mods + Team Leads können eigene TOTP-2FA einrichten. Neue `mod_totp` Tabelle (Migration 032). Login-Flow: nach Credentials → 5-min Pending-Token → `/login/mod/totp`. Settings/Sicherheit für Mods zeigt `ModTwoFactorSettings` (eigene 2FA, kein Login-Log, kein Passwort-Form) |
| **Newsletter-Backend** | Brevo REST-API Integration, DOI-Support (§7 UWG), Rate-Limiting, silent fallback ohne API-Key. SETUP.md v1.9.0 mit Abschnitt 12 (Brevo einrichten) |
| **ChatWidget createPortal** | `overflow-x: clip` von body auf #root verschoben; Widget via createPortal in document.body gerendert — floated korrekt am Viewport |

### Implementiert in Session 14 (2026-05-21)

| Feature | Details |
|---|---|
| **4-Augen-Erstattungssystem** | Neue `team_lead`-Rolle; Betragsgrenzen: Mod ≤50€ direkt, 51–1999€ → pending (TL/Owner), ≥2000€ → pending (Owner only); TL ≤500€ direkt, >500€ → pending (Owner) |
| **refund_requests Tabelle** | Migration 031 — mit RLS, service_role GRANT, Indizes |
| **Admin-Route /refund-requests** | GET (mit Status-Filter), POST /:id/approve, POST /:id/reject — 4-Augen-Prüfung im Backend |
| **RefundRequestsPage** | Filter-Tabs, Tabelle, canApprove-Logik, ConfirmDialog approve/reject mit Ablehnungsgrund |
| **Sidebar team_lead** | CircleDollarSign-NavItem „Erstattungsanträge", role-Label „Teamleiter", ownerOnly-Filter für Settings/Kategorien |
| **Rechnungs-Fix** | `Helvetica-Mono` → `Courier`; Spalten-Layout right-to-left neu berechnet; Zahlungsart + Datum ergänzt |
| **refunded-Blockade** | Manueller Status-Wechsel auf 'refunded' geblockt (Admin UI + Backend 403) |
| **Node.js 24.x** | Backend package.json engines + @types/node auf 24.x |
| **Invoice-Route Security** | `requireAdmin` auf GET /orders/:id/invoice ergänzt |
| **About-Prozessbilder** | IMAGES.about.process Array + getProcessImage()-Helper in images.ts |

### Fixes in Session 13 (2026-05-21)

| Fix | Details |
|---|---|
| ERR_REQUIRE_ESM Crash (alle Routes 500) | `otplib@13` → `@noble/hashes` (pure ESM) → Crash auf Node.js 20. Fix: `otplib@12` (nutzt Node built-in crypto, vollständig CJS). `admin-2fa.ts` + `admin-auth.ts` auf `authenticator.generateSecret/keyuri/verify` API migriert |
| tsconfig Cleanup | `module: Node16` → `CommonJS`, `moduleResolution` + `ignoreDeprecations` entfernt (deprecated/invalid) |
| nodemailer v8→v6 | v8 ist ESM-only — v6 ist CJS-kompatibel |
| Dashboard Bestellbilder | `o.items[0]?.imageUrl` korrekt ausgelesen — Thumbnails in "Letzte Bestellungen" sichtbar |
| Qty-Cap auf Stock-Limit | `+`-Button capped auf `effectiveStock`, disabled bei `qty >= effectiveStock` |

### Fixes in Session 12 (2026-05-20)

| Fix | Details |
|---|---|
| SCSS Build-Fehler | `_notifications.scss` + `_tasks.scss` fehlten `@use abstracts` → Vercel-Build schlug fehl, alle Änderungen seit Session 11 waren nie deployed |
| Returns-Seite Crash | `getReturnRequests` hatte falschen Typ (Array statt paginated Object) → `.filter()` crashte |
| Admin Pagination Limits | Security-Audit hatte `max(100)` gesetzt, Pages brauchten 200 → Backend auf `max(500)`, API-Defaults auf 200, Pages ohne hardcoded Limits |
| Notification Bell 500 | `admin_notifications` Tabelle fehlte Grants → `GRANT ALL TO service_role` manuell ausgeführt |
| Gutscheine 500 | `discount_codes` Tabelle fehlte Grants → `GRANT ALL TO service_role` manuell ausgeführt |
| Migration-Dateien | 025 + 028 um `DROP POLICY IF EXISTS` + `GRANT ALL` ergänzt → idempotent wiederausführbar |

---

## Offene Aufgaben (manuell durch User)

### Supabase-Migrationen noch ausführen
- [ ] **Migration 030** — `increment_discount_uses` RPC — `database/migration_030_discount_atomic.sql`
- [ ] **Migration 031** — team_lead-Rolle + refund_requests — `database/migration_031_team_lead_refund_requests.sql`
- [x] **Migration 032** — `mod_totp` Tabelle (Mod-2FA) — ausgeführt ✓
- [x] **Migration 033** — Stock-Reservierungen + atomarer Abzug — ausgeführt ✓
- [x] **Migration 034** — Atomare Discount-Reservierung (TOCTOU-Fix) — ausgeführt ✓
- [x] **Migration 035** — Security Hardening (RLS role-Schutz, orders/contact INSERT-Revoke, Rating nur verified) — ausgeführt ✓ (2026-06-26)

### Stripe Webhook — Event-Typ ergänzen
- [x] Stripe Dashboard → Webhooks → Event-Typen → `checkout.session.expired` hinzugefügt ✓

> **User hat bestätigt:** Migrations 025–029 + weitere bereits ausgeführt. 030–032 noch ausstehend.

### Vercel Env-Vars prüfen / setzen (Backend)
- [ ] **SHOP_VAT_ID / SHOP_TAX_NUMBER** — für GoBD-Rechnungen Pflicht
- [ ] **SHOP_NAME / SHOP_STREET / SHOP_ZIP / SHOP_CITY / SHOP_COUNTRY** — für Rechnungs-PDF
- [ ] **FRONTEND_URL** — `https://shopray-indol.vercel.app` (für E-Mail-Links)
- [ ] **VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_EMAIL** — für Push-Notifications
- [ ] **DHL_API_KEY / DHL_BILLING_NUMBER / DHL_SHIPPER_*** — für echte DHL-Labels

### Code-Qualität (nice-to-have)
- [ ] **Heading-Reihenfolge** — Lighthouse Accessibility: H-Tags prüfen
- [ ] **Bilder → WebP** — via squoosh.app (519 KB Einsparpotenzial)
- [ ] **Audit-Log** — Admin-Aktionen (wer hat was wann geändert) — noch nicht implementiert
- [ ] **SETUP.en.md** — Database-Abschnitt hat noch nicht alle Migrations (nur bis 026, 030–032 fehlen)

---

## Wichtige Entscheidungen / Architektur

### Admin Auth & RBAC
- **Owner**: bcrypt-Passwort (Hash in `admin_config` DB, Fallback auf `ADMIN_PASSWORD_HASH` Env-Var) + optionales TOTP
- **Team Lead**: Supabase Auth, Rolle `team_lead` in `profiles.role` — JWT encoded mit actualRole
- **Mod**: Supabase Auth (Email + Passwort), Rolle `mod` in `profiles.role`
- Session via Bearer Token in `sessionStorage` (Vercel Cross-Domain Cookie Fix)
- JWT-Payload: `{ role: 'owner' }` oder `{ role: 'team_lead'|'mod', userId }`
- `requireAdmin` = Owner + Team Lead + Mod, `requireTeamLead` = Owner + Team Lead, `requireOwner` = nur Owner
- Erstattungs-Betragsgrenzen: Mod ≤50€, Team Lead ≤500€, Owner unbegrenzt; ≥2000€ immer Owner-only

### Notification Center
- `admin_notifications` — globale Events (new_order, new_ticket, new_inquiry, payment_failed, task_assigned, low_stock)
- `admin_notification_reads` — per-user read-tracking (user_key: 'owner' oder mod-UUID)
- Polling alle 30s im TopBar via `useNotifications` Hook
- Notification-Trigger in: stripe.ts (new_order, payment_failed), tickets.ts (new_ticket), contact.ts (new_inquiry), admin-tasks.ts (task_assigned)

### Aufgaben-System
- `admin_tasks` — assigned_to = Supabase-Auth-UUID des Mods (NULL = alle)
- Owner: alle Tasks sehen, erstellen, löschen
- Mod: nur eigene (assigned_to = userId) + unzugewiesene (NULL)
- Status: open → in_progress → done; Priorität: low / normal / high / urgent

### Produktvarianten
- `variant_options` → `variant_option_values` → `product_skus` (eine Zeile pro Kombination)
- Cart-Key: `${product.id}__${skuId ?? ''}` (gleiche Produkte mit verschiedenen SKUs = separate Cart-Items)
- Backend: Preissicherheit — price_offset immer aus DB geholt, nie vom Client

### Stripe
- Checkout-Redirect (Stripe hosted page) — NICHT Elements
- Webhook: `checkout.session.completed` → Bestellstatus + E-Mail + Rechnung + Push + Notification

### Vercel Monorepo
- 3 separate Vercel-Projekte (Frontend, Admin, Backend)
- **Production Branch: `main`**
- Deploy: `git push origin main` — ein Befehl, alle 3 Projekte

### Admin Pagination (nach Session 12)
- Backend Admin-Routes: `max(500)` — Auth-gated, kein Sicherheitsrisiko
- API-Defaults: `limit = 200` für alle Admin-List-Funktionen (getAdminOrders, getAdminCustomers, getAdminReviews, getReturnRequests)
- Pages: rufen API ohne explizite Limits auf — kein Hardcoding

---

## Datenbank-Migrations-Übersicht

**Frisch-Install:** nur `database/schema.sql` ausführen (enthält 001–029 komplett).

**Bestehende DB updaten:** Migrationen einzeln der Reihe nach im Supabase SQL Editor.
**Wichtig:** Alle Migrations sind idempotent — `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` vor `CREATE POLICY`, `GRANT ALL` am Ende.

| # | Datei | Inhalt |
|---|---|---|
| 001 | migration_001_products_detail.sql | Erweiterte Produktfelder |
| 002 | migration_002_admin_login_log.sql | Login-Protokoll Tabelle |
| 003 | migration_003_product_images.sql | Bildergalerie (images JSONB) |
| 004 | migration_004_grants.sql | Basis-Grants |
| 005 | migration_005_shipping_settings.sql | Versandkosten-Singleton |
| 006 | migration_006_admin_totp.sql | Admin 2FA |
| 007 | migration_007_categories.sql | Kategorien-Tabelle |
| 008 | migration_008_profiles_email.sql | profiles.email + Trigger |
| 009 | migration_009_profiles_roles.sql | Role-Constraint erweitern |
| 010 | migration_010_order_payment_method.sql | payment_method + image_url |
| 011 | migration_011_user_ban.sql | Ban-Felder in profiles |
| 012 | migration_012_push_subscriptions.sql | Web Push Tabelle |
| 013 | migration_013_invoice_label.sql | invoice_number + tracking |
| 014a | migration_014_ticket_messages.sql | Ticket-Chat-Nachrichten |
| 014b | migration_014_shop_settings_categories_image.sql | shop_settings + categories.image_url |
| 015 | migration_015_mod_invites_admin_config.sql | Mod-Invite + Admin-Config |
| 016 | migration_016_must_change_password.sql | must_change_password Flag |
| 017 | migration_017_service_role_grants.sql | Fehlende service_role Grants |
| 018 | migration_018_tickets_guest.sql | Gast-Tickets (user_id nullable) |
| 019 | migration_019_ticket_priority.sql | Ticket-Priorität |
| 020 | migration_020_cleanup_testdata.sql | Testdaten bereinigen |
| 021 | migration_021_missing_grants.sql | Weitere fehlende Grants |
| 022 | migration_022_stripe_payment_intent.sql | stripe_payment_intent_id |
| 023 | migration_023_return_requests.sql | Rücksendungsanfragen |
| 024 | migration_024_return_items.sql | return_items JSONB |
| 025 | migration_025_discount_codes.sql | Gutscheincodes — idempotent ✓ (DROP POLICY IF EXISTS + GRANT) |
| 026 | migration_026_product_variants.sql | Produktvarianten + SKUs |
| 027 | migration_027_login_log_user.sql | Login-Log role + email |
| 028 | migration_028_notifications_tasks.sql | Notification Center + Aufgaben — idempotent ✓ (DROP POLICY IF EXISTS + GRANT) |
| 029 | migration_029_invoice_sequence.sql | Atomare Rechnungsnummer-Sequenz (GoBD) — ausgeführt ✓ |
| 030 | migration_030_discount_atomic.sql | Atomarer Rabatt-Zähler (race-condition-sicher) — noch ausstehend |
| 031 | migration_031_team_lead_refund_requests.sql | team_lead-Constraint + refund_requests-Tabelle — noch ausstehend |
| 032 | migration_032_mod_totp.sql | TOTP für Mitarbeiter (Mod-2FA) — ausgeführt ✓ |
| 030 | migration_030_discount_atomic.sql | Atomarer Rabatt-Zähler (race-condition-sicher) — ausgeführt ✓ |
| 031 | migration_031_team_lead_refund_requests.sql | team_lead-Constraint + refund_requests-Tabelle — ausgeführt ✓ |
| 033 | migration_033_stock_reservation.sql | Stock-Reservierungen + atomarer Abzug — ausgeführt ✓ |
| 034 | migration_034_discount_claim.sql | Atomare Discount-Reservierung (TOCTOU-Fix) — ausgeführt ✓ |
| 035 | migration_035_security_hardening.sql | RLS role-Schutz + orders/contact INSERT-Revoke + Rating nur verified — ausgeführt ✓ (2026-06-26) |

---

## Sicherheits-Constraints (nie vergessen)

- `.env` Dateien niemals lesen ohne explizite User-Anfrage
- DSGVO-Compliance immer proaktiv mitdenken
- Backend: alle Inputs mit Zod validieren, alle Admin-Routes mit `requireAdmin`
- Rechtliche Seiten (Impressum, AGB, Privacy) niemals ohne Rückfrage ändern
- NEVER `window.alert()`, `window.confirm()`, `window.prompt()` — immer eigene Dialoge/Modals
- Keine Inline-Styles in React-Komponenten (SCSS only)

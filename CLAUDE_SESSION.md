# Claude Session State — ShopRay

Diese Datei wird von Claude am Anfang jeder Session gelesen und am Ende/bei Pausen aktualisiert.
Ziel: Kontextverlust durch Compacting verhindern.

**Letzte Aktualisierung:** 2026-05-21 (Session 14 — 4-Augen-Erstattungssystem + Rechnungs-Fixes)

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
- [ ] **Migration 030** — `increment_discount_uses` RPC (atomare Rabatt-Zähler-Erhöhung) — `database/migration_030_discount_atomic.sql`
- [ ] **Migration 031** — team_lead-Rolle + refund_requests-Tabelle — `database/migration_031_team_lead_refund_requests.sql`

> **Stand nach Session 12:** Migrations 025 + 028 Tabellen existieren, Grants wurden manuell gesetzt ✓
> Migration 030 + 031 noch ausstehend.
> **Alternativ bei frischer DB:** Nur `database/schema.sql` ausführen — enthält alles.

### Vercel Env-Vars prüfen / setzen (Backend)
- [ ] **SHOP_VAT_ID / SHOP_TAX_NUMBER** — für GoBD-Rechnungen Pflicht
- [ ] **SHOP_NAME / SHOP_STREET / SHOP_ZIP / SHOP_CITY / SHOP_COUNTRY** — für Rechnungs-PDF
- [ ] **FRONTEND_URL** — `https://shopray-indol.vercel.app` (für E-Mail-Links)
- [ ] **VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_EMAIL** — für Push-Notifications
- [ ] **DHL_API_KEY / DHL_BILLING_NUMBER / DHL_SHIPPER_*** — für echte DHL-Labels

### Code-Qualität (nice-to-have)
- [ ] **Heading-Reihenfolge** — Lighthouse Accessibility: H-Tags prüfen
- [ ] **Bilder → WebP** — via squoosh.app (519 KB Einsparpotenzial)
- [ ] **Mod-2FA** — Mods haben noch kein 2FA (nice-to-have vor Enterprise-Verkauf)
- [ ] **Audit-Log** — Admin-Aktionen (wer hat was wann geändert) — noch nicht implementiert
- [ ] **SETUP.en.md** — Database-Abschnitt hat noch nicht alle Migrations (nur bis 026 sichtbar, 029/030 fehlen)

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

---

## Sicherheits-Constraints (nie vergessen)

- `.env` Dateien niemals lesen ohne explizite User-Anfrage
- DSGVO-Compliance immer proaktiv mitdenken
- Backend: alle Inputs mit Zod validieren, alle Admin-Routes mit `requireAdmin`
- Rechtliche Seiten (Impressum, AGB, Privacy) niemals ohne Rückfrage ändern
- NEVER `window.alert()`, `window.confirm()`, `window.prompt()` — immer eigene Dialoge/Modals
- Keine Inline-Styles in React-Komponenten (SCSS only)

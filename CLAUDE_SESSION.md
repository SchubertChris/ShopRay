# Claude Session State — ShopRay

Diese Datei wird von Claude am Anfang jeder Session gelesen und am Ende/bei Pausen aktualisiert.
Ziel: Kontextverlust durch Compacting verhindern.

**Letzte Aktualisierung:** 2026-05-16

---

## Aktueller Implementierungsstand

### Vollständig implementiert

| Bereich | Stand |
|---|---|
| Frontend (React + SCSS) | Vollständig — alle Pages, Features, SEO |
| Backend (Express + Zod) | Vollständig — Auth, Produkte, Bestellungen, Settings |
| Admin Panel | Vollständig — Produkte, Bestellungen, Kunden, Anfragen, Settings |
| Supabase Schema | 5 Migrations (`schema.sql` + `migration_002` bis `migration_005`) |
| Shipping Settings | DB (singleton) + Backend PUT/GET + Admin UI + Frontend live |
| Admin Login Protokoll | DB + Backend + Admin Security-Tab |
| Produkt-Bilder (Storage) | Supabase Storage + Upload-Route + Admin Formular |
| DSGVO | ConsentBanner, MyData-Seite, Privacy, Impressum, AGB, Löschfunktion |
| LMIV | Nährwerttabelle, Zutaten, Allergene im Produkt-Detail |
| Auth | Supabase Auth, MFA (TOTP), Passwort vergessen, Passwort zurücksetzen |
| SEO | SeoMeta, JsonLd, robots.txt, og-image |
| Dokumentation | SETUP.md v1.4.0, QUICKSTART.md, alle READMEs aktuell |

---

## Offene Aufgaben (Priorität)

### Noch nicht implementiert
- [ ] **Kategorie-Manager** im Admin (persistente Dropdowns statt hartcodierte Liste)
- [ ] **Rollen-System** (`owner | admin | mod | customer`) — aktuell nur ein Admin
- [ ] **Google OAuth** — Button existiert im Login-UI, aber nicht verdrahtet
- [ ] **Stripe-Zahlungsabwicklung** — aktuell nur Mock (Backend-Route-Gerüst vorhanden)
- [ ] `migration_005_shipping_settings.sql` in Supabase SQL Editor ausführen (falls noch nicht geschehen)

### Dokumentation
- [ ] `SETUP.en.md` auf v1.4.0 bringen (aktuell v1.1.0 — sehr veraltet)

---

## Wichtige Entscheidungen / Architektur

### Admin Auth
- **Kein** Supabase Auth für Admin
- Einzelnes Admin-Passwort als bcrypt-Hash in `Backend/.env` (`ADMIN_PASSWORD_HASH`)
- Session via HttpOnly Cookie (`adminSession`)
- Login-Protokoll: Tabelle `admin_login_log` in Supabase

### Shipping Settings
- Singleton-Tabelle in Supabase (`CHECK (id = 1)`)
- Öffentlicher GET-Endpunkt: `GET /api/settings/shipping`
- Geschützter PUT-Endpunkt: `PUT /api/admin/settings/shipping`
- Frontend fetcht on mount, Fallback-Defaults bei Fehler

### Produktbilder
- Supabase Storage, Bucket `product-images`
- Upload-Route: `POST /api/admin/products/upload`
- Multiple Bilder: `images[]` Array in Produkt-Tabelle (jsonb)
- Frontend: `ImageGallery.tsx` mit Thumbnail-Leiste

### Vercel Monorepo
- 3 separate Vercel-Projekte (Frontend, Admin, Backend)
- Root Directory je Projekt: `Frontend`, `Admin`, `Backend`
- GitHub-Repo: `SchubertChris/ShopRay` (private)

---

## Datenbank-Migrations-Reihenfolge

1. `database/schema.sql` — Basistabellen (products, orders, users, contacts, settings)
2. `database/migration_002_admin_login_log.sql` — Admin-Login-Protokoll
3. `database/migration_003_product_images.sql` — Produkt-Bilder (images[] JSONB)
4. `database/migration_005_shipping_settings.sql` — Versandeinstellungen (Singleton)

---

## Sicherheits-Constraints (nie vergessen)

- `.env` Dateien niemals lesen ohne explizite User-Anfrage
- DSGVO-Compliance immer proaktiv mitdenken
- Backend ist Festung: alle Inputs validieren (Zod), alle Admin-Routes mit `requireAdmin` schützen
- Rechtliche Seiten (Impressum, AGB, Privacy) niemals ohne Rückfrage ändern

---

## Git Status

- **Branch:** `dev`
- **Remote:** `git@github.com:SchubertChris/ShopRay.git` (private)
- **Main Branch:** `main` (für PRs)

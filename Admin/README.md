# ShopRay Admin Panel

Das Admin-Panel ist das Backend-Interface für Shop-Betreiber. Es läuft als eigene Vite/React-App auf Port `5174` (lokal) und ist über Vercel als separates Projekt deployed.

---

## Zugang

Der Admin-Bereich verwendet **kein Supabase-Login** — stattdessen gibt es ein einzelnes Admin-Passwort, das als bcrypt-Hash in `Backend/.env` gespeichert ist. Eine Session-Cookie-basierte Authentifizierung (HttpOnly) sichert alle Admin-Requests gegen das Backend ab.

```
URL (lokal):  http://localhost:5174
URL (live):   https://shopray-admin.vercel.app  (oder deine eigene Domain)
Login:        Passwort aus Backend/.env — ADMIN_PASSWORD_HASH
```

Anleitung zum Setzen des Passworts: SETUP.md Abschnitt 9.

---

## Features

| Bereich | Was du dort tust |
|---|---|
| **Produkte** | Produkte anlegen, bearbeiten, deaktivieren, Bilder hochladen |
| **Bestellungen** | Bestellstatus einsehen |
| **Kunden** | Kundenprofile einsehen |
| **Anfragen** | Kontaktanfragen lesen, Status setzen (neu/gelesen/beantwortet) |
| **Einstellungen → Versand** | Versandkosten und Lieferzeiten konfigurieren (wirkt sofort im Shop) |
| **Einstellungen → Sicherheit** | Login-Protokoll der letzten 50 Admin-Logins einsehen |

---

## Produkte verwalten

- **Doppelklick auf eine Zeile** → Produkt bearbeiten
- **Klick auf das Status-Badge** → Produkt aktiv/inaktiv schalten (sofort)
- **Dichte-Button** in der Filterleiste → kompakte oder normale Tabellenansicht
- Bilder werden via Supabase Storage hochgeladen (Drag & Drop im Produkt-Formular)

---

## Lokaler Start

```bash
cd Admin
npm install
npm run dev
# → http://localhost:5174
```

Das Backend muss gleichzeitig laufen (`cd Backend && npm run dev`).

---

## Deployment (Vercel)

Das Admin-Panel ist ein eigenes Vercel-Projekt mit Root Directory `Admin`.  
Umgebungsvariablen (aus `Admin/.env`):

| Variable | Wert |
|---|---|
| `VITE_API_URL` | URL deines Backend-Vercel-Projekts (z.B. `https://shopray-backend.vercel.app`) |

Vollständige Deployment-Anleitung: SETUP.md Abschnitt 15.

---

## Tech Stack

- React 19 + TypeScript + Vite
- SCSS 7-1 BEM (kein CSS-Framework)
- Lucide React (Icons)
- JWT HttpOnly Cookie Auth (via Backend)

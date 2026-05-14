# ShopRay — Quickstart (15 Minuten)

Dieser Guide bringt dich so schnell wie möglich zum laufenden Shop.
Ausführlichere Erklärungen findest du in SETUP.md / SETUP.en.md.

---

## Was du brauchst (5 Min vorbereiten)

- [ ] [Node.js 18+](https://nodejs.org) installiert
- [ ] Account auf [supabase.com](https://supabase.com) (kostenlos)
- [ ] Account auf [stripe.com](https://stripe.com) (kostenlos)

---

## Schritt 1 — Supabase einrichten (3 Min)

1. Neues Projekt erstellen (Region: Frankfurt für DSGVO)
2. Warten bis Projekt bereit ist (~2 Min)
3. **SQL Editor** öffnen → Inhalt von `database/schema.sql` einfügen → **Run**
4. **Settings → API** öffnen und notieren:
   - Project URL
   - `anon` Key
   - `service_role` Key

---

## Schritt 2 — Stripe einrichten (2 Min)

1. **Developers → API Keys** öffnen
2. Notieren:
   - Publishable Key (`pk_test_...`)
   - Secret Key (`sk_test_...`)
3. **Developers → Webhooks → Add endpoint**
   - URL: `https://DEINE-BACKEND-URL/api/webhook/stripe`
   - Events: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`
   - Webhook Secret notieren (`whsec_...`)

---

## Schritt 3 — .env Dateien ausfüllen (2 Min)

```bash
cp Frontend/.env.example  Frontend/.env
cp Admin/.env.example     Admin/.env
cp Backend/.env.example   Backend/.env
```

Werte aus Schritt 1 & 2 eintragen.

---

## Schritt 4 — Lokal starten (2 Min)

**Terminal 1 — Frontend:**
```bash
cd Frontend && npm install && npm run dev
# → http://localhost:5173
```

**Terminal 2 — Admin:**
```bash
cd Admin && npm install && npm run dev
# → http://localhost:5174
# Login: admin@shop.de / admin123  ← vor Launch ändern!
```

**Terminal 3 — Backend:**
```bash
cd Backend && npm install && npm run dev
# → http://localhost:5000
```

---

## Schritt 5 — Stripe Webhook lokal testen (1 Min)

```bash
# Stripe CLI installieren: stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5000/api/webhook/stripe
```

Testkarte: `4242 4242 4242 4242` — Exp: beliebig — CVC: beliebig

---

## Schritt 6 — Deployen (5 Min)

Drei separate Vercel-Projekte anlegen:

| Projekt | Root Directory | Umgebungsvariablen |
|---|---|---|
| Shop (Frontend) | `Frontend` | aus `Frontend/.env` |
| Admin | `Admin` | aus `Admin/.env` |
| Backend | `Backend` | aus `Backend/.env` |

Für den Backend-Webhook: Nach dem Deploy die Vercel-URL als Stripe-Webhook-Endpoint eintragen.

---

**Fertig.** Der Shop läuft.

Nächste Schritte: SETUP.md Abschnitt 8–11 (Shop-Name, Produkte, Rechtliches).

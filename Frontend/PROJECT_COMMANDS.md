<!-- @claude hier Sammelst du Commands die ich und der Käufer jeweils gebrauchen kann zum einen für das Projekt und zum anderen zum lernen -->

# ShopRay — Projekt-Commands

---

## 🚀 Setup & Start

```bash
# Abhängigkeiten installieren (einmalig nach dem Kauf)
npm install

# Entwicklungsserver starten (http://localhost:5173)
npm run dev

# Produktions-Build erstellen (für Deployment)
npm run build

# Build lokal vorschauen
npm run preview
```

---

## 🔑 Umgebungsvariablen (.env)

```bash
# .env Datei aus dem Beispiel erstellen
cp .env.example .env

# Dann .env öffnen und eigene Keys eintragen:
# VITE_API_URL=http://localhost:3000/api
# VITE_STRIPE_PUBLIC_KEY=pk_test_...
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbG...
```

---

## 🧪 Code-Qualität

```bash
# TypeScript-Check (kein Build, nur Typen prüfen)
npx tsc --noEmit

# TypeScript-Check mit Watch-Mode (läuft dauerhaft)
npx tsc --noEmit --watch

# Vite-Build + Type-Check kombiniert
npm run build
```

---

## 📁 Dateien & Struktur

```bash
# Alle Projektdateien auflisten (ohne node_modules, dist, .git)
find . -not -path '*/.*' -not -path '*/node_modules*' -not -path '*/dist*'

# Nur SCSS-Dateien anzeigen
find ./src/sass -name "*.scss"

# Nur TypeScript-Dateien anzeigen
find ./src -name "*.ts" -o -name "*.tsx" | grep -v node_modules

# Bestimmten Text in allen Dateien suchen (z.B. "useCart")
grep -r "useCart" ./src --include="*.tsx"
```

---

## 🎨 SCSS / Styles

```bash
# SCSS wird automatisch von Vite kompiliert — kein separater Befehl nötig

# Alle CSS-Variablen in der Codebase finden
grep -r "var(--" ./src/sass --include="*.scss" | head -30

# Alle Klassen einer Seite anzeigen (z.B. home)
grep -r "\." ./src/sass/pages/home/_home.scss | head -40
```

---

## 💳 Stripe (Zahlungen)

```bash
# Stripe CLI installieren (einmalig) — https://stripe.com/docs/stripe-cli
# Windows: winget install Stripe.StripeCLI

# Stripe Login (einmalig pro Gerät)
stripe login

# Webhook lokal weiterleiten (Backend muss laufen)
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

# Stripe Testdaten zurücksetzen
stripe fixtures reset
```

---

## 🗄️ Supabase (Datenbank & Auth)

```bash
# Supabase CLI installieren (einmalig)
npm install -g supabase

# Supabase Login
supabase login

# Lokale Supabase-Instanz starten (Docker nötig)
supabase start

# Datenbankschema anzeigen
supabase db dump --schema public

# Migrations ausführen
supabase db push

# Supabase stoppen
supabase stop
```

---

## 📦 Pakete verwalten

```bash
# Alle installierten Pakete anzeigen
npm list --depth=0

# Veraltete Pakete anzeigen
npm outdated

# Sicherheitslücken prüfen
npm audit

# Sicherheitslücken automatisch beheben (niedrig)
npm audit fix

# Einzelnes Paket installieren (Beispiel)
npm install axios

# Einzelnes Dev-Paket installieren
npm install -D @types/node
```

---

## 🌐 Deployment (Vercel)

```bash
# Vercel CLI installieren (einmalig)
npm install -g vercel

# Projekt deployen (interaktiv)
vercel

# Direkt in Production deployen
vercel --prod

# Umgebungsvariablen in Vercel setzen
vercel env add VITE_API_URL

# Build-Logs anzeigen
vercel logs
```

---

## 🔍 Debug & Troubleshooting

```bash
# node_modules löschen und neu installieren (bei Paket-Problemen)
rm -rf node_modules && npm install

# Vite Cache leeren
rm -rf node_modules/.vite

# Port 5173 freigeben (falls belegt, Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Port freigeben (Mac/Linux)
lsof -ti:5173 | xargs kill -9
```

---

## 📊 Git

```bash
# Aktuellen Status anzeigen
git status

# Alle Änderungen stagen
git add .

# Commit erstellen
git commit -m "feat: beschreibung der Änderung"

# Auf Remote pushen
git push origin main

# Neuen Feature-Branch erstellen
git checkout -b feature/neues-feature

# Branches anzeigen
git branch -a
```

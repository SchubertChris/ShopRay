# ShopRay Frontend — Entwickler-Einstieg

Diese Datei richtet sich an Entwickler, die an der Frontend-Codebase arbeiten.  
Käufer-Dokumentation: `Frontend/SETUP.md` und `SETUP.md` (Root).

---

## Lokaler Start

```bash
cd Frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | React 19 + Vite |
| Sprache | TypeScript (strict) |
| Styling | SCSS 7-1 BEM (keine CSS-Frameworks) |
| State | Zustand + persist |
| Auth | Supabase (`onAuthStateChange`, TOTP MFA) |
| Routing | React Router v7 |
| HTTP | Axios mit Token-Interceptor |
| SEO | React 19 native hoisting (kein Helmet) |
| Validierung | Zod (Formulare + API-Responses) |

---

## Wichtige Befehle

```bash
# TypeScript-Check (kein Build, nur Typen)
npx tsc --noEmit

# Produktions-Build
npm run build

# Build lokal vorschauen
npm run preview
```

---

## Import-Aliase

```ts
@/           → src/
@components  → src/components
@features    → src/features
@config      → src/config
@providers   → src/providers
@stores      → src/stores
@types       → src/types
@utils       → src/utils
```

---

## Code-Regeln (Kurzversion)

- Keine Inline-Styles — alles via SCSS-Klassen
- Keine Hex-Werte — nur CSS-Variablen (`--clr-*`)
- Feature-Types gehören in das jeweilige `features/<name>/types/` Verzeichnis
- Neue Features → `src/features/<name>/` mit `api/`, `components/`, `hooks/`, `types/`, `index.ts`
- SCSS 7-1 Architektur strikt einhalten

Vollständige Regeln: CLAUDE.md im Root-Verzeichnis.

---

## ESLint (Type-Aware Lint Rules aktivieren)

```js
// eslint.config.js
import tseslint from 'typescript-eslint'

export default tseslint.config({
  extends: [tseslint.configs.recommendedTypeChecked],
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

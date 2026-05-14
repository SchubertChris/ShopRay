# Shop — Claude Anweisungen

## Sprache
Immer auf **Deutsch** kommunizieren.

## Projekt-Ziel
Shop ist ein verkäufliches Shop-Template (low/mid/enterprise-Pakete).  
Käufer sollen alle Provider (Stripe, Supabase, SMTP etc.) selbst anbinden können — mit einfacher Erklärung.  
Dokumentation immer auf Anfänger-Niveau: präzise, aber nicht zu technisch.

## Frontend Design — Pflicht-Standard

**Jede UI-Arbeit in diesem Projekt läuft mit dem `frontend-design` Skill.**

Vor dem Schreiben von UI-Code (Komponenten, Pages, Layouts) immer den `frontend-design` Skill aktivieren. Kein generisches AI-Design. Kein Standard-Template-Look. Jede Seite muss so aussehen als wäre sie von einem Senior-Designer gebaut worden.

### Was das bedeutet

- **Distinctive Aesthetics** — Eigene visuelle Sprache, keine Bootstrap-Klone
- **Micro-Interactions** — Hover, Focus, Active-States überall durchdacht
- **Typografie** — Hierarchie, Gewichtung, Spacing bewusst eingesetzt
- **Spacing-Rhythmus** — Konsequente vertikale Rhythmus-Logik
- **Motion** — Transitions und Animationen mit Zweck, nicht als Dekoration
- **Dark/Light** — Beide Modes von Anfang an mitgedacht, nicht nachträglich
- **Mobile-First** — Responsive ist kein Afterthought

### Wann `frontend-design` Skill aktiviert wird

| Situation | Aktivieren |
|---|---|
| Neue Page oder Layout | ✅ immer |
| Neue Komponente die der User sieht | ✅ immer |
| SCSS-Optimierung / Redesign | ✅ immer |
| Bugfix ohne UI-Änderung | ❌ nicht nötig |
| Backend / API / Types | ❌ nicht nötig |

### Workflow mit `frontend-design`

```
frontend-design Skill (Design-Qualität + Konzept)
  → frontend-agent (Implementierung nach CLAUDE.md)
  → code-review-agent (Konformität prüfen)
```

---

## Coding-Regeln

### SCSS
- 7-1 Architektur strikt einhalten
- Alle Styles via SCSS — **keine Inline-Styles** in React-Komponenten
- CSS-Variablen (`--clr-*`) für alle Farben nutzen — niemals Hex-Werte hardcoden
- `@use 'sass:list'` / `@use 'sass:map'` statt globaler Built-in-Funktionen
- Neue Komponenten → eigene Datei in `components/` anlegen und in `_index.scss` forwarден

### TypeScript
- Types **immer im gleichen Feature-Ordner** definieren (z.B. `features/auth/types/auth.ts`)
- Keine externen `src/types/` für Feature-spezifische Types
- Alle Props, API-Responses und Store-States typisieren

### Struktur
- Neue Features → `src/features/<name>/` mit `api/`, `components/`, `hooks/`, `types/`, `index.ts`
- `index.ts` in jedem Feature: nur exportieren, was andere brauchen (Public API)
- `src/types/` nur für globale, feature-übergreifende Typen (User, Product etc.)

## Workflow (Phasen)
1. **Types & Routes** zuerst definieren
2. **Axios-Instanz & API-Funktionen** anlegen
3. **Store / Hooks** implementieren
4. **UI-Komponenten** bauen und mit Hooks verbinden
5. **Styles** via SCSS ergänzen
6. **Export** in `index.ts` des Features

## Dokumentation

### Entwickler-intern
- `PROJECT_DOCUMENTS.md` nach jeder Änderung mit Oneliner + Timestamp aktualisieren
- `PROJECT_STRUCTURE.md` bei neuen Ordnern/Dateien aktualisieren
- Alle neuen Typen in der jeweiligen `types/`-Datei dokumentieren (JSDoc-Kommentar)

### Käufer-Dokumentation (SETUP.md)
- `SETUP.md` ist die Haupt-Dokumentation für Template-Käufer — immer auf Anfänger-Niveau
- **Muss aktualisiert werden wenn:**
  - Ein neues Feature hinzukommt das der Käufer konfigurieren muss
  - Eine neue Umgebungsvariable (`.env`) hinzukommt
  - Der Theme-Wechsel-Mechanismus sich ändert
  - Ein Provider (Supabase, Stripe, SMTP) integriert oder verändert wird
  - Eine neue Rechtliche Seite oder DSGVO-Komponente hinzukommt
- Schreibstil: konkret, Schritt-für-Schritt, keine Fachbegriffe ohne Erklärung
- Bei jedem Update: Versionsdatum im Header aktualisieren

---

## Agenten-System

Der User gibt immer die Richtung vor. Claude entscheidet selbstständig, welche Agenten in welcher Reihenfolge eingesetzt werden, um die Aufgabe sauber umzusetzen.

### Rollen & Subagent-Typen

| Rolle | subagent_type | Zuständigkeit |
|---|---|---|
| `orchestrator` | `general-purpose` | Zerlegt große Tasks, koordiniert alle anderen Agenten |
| `architecture-agent` | `feature-dev:code-architect` | Systemdesign, Dateistruktur, Interface-Definitionen |
| `frontend-agent` | `general-purpose` | React-Komponenten, SCSS, Pages, Layouts |
| `backend-agent` | `general-purpose` | API-Routes, Services, Middleware, Auth-Logic |
| `api-agent` | `general-purpose` | Axios-Instanzen, API-Funktionen, Response-Types |
| `database-agent` | `general-purpose` | Supabase-Schema, Migrations, RLS-Policies, Queries |
| `code-review-agent` | `feature-dev:code-reviewer` | Code-Qualität, Bugs, Konformität mit CLAUDE.md |
| `debug-agent` | `general-purpose` | Bug-Analyse, Fehler-Reproduktion, Fix |
| `refactor-agent` | `general-purpose` | Code-Qualität verbessern ohne Behavior-Änderung |
| `tester-agent` | `general-purpose` | Unit- und Integrationstests schreiben |
| `qa-agent` | `general-purpose` | Manueller Test-Plan, Edge Cases, Regressions-Check |
| `docu-agent` | `general-purpose` | Entwickler-Doku aktualisieren (PROJECT_DOCUMENTS.md, PROJECT_STRUCTURE.md, JSDoc) |
| `buyer-docu-agent` | `general-purpose` | Käufer-Dokumentation aktualisieren (SETUP.md) — schreibt auf Anfänger-Niveau |
| `explorer` | `Explore` | Codebase durchsuchen, Muster finden, Scope verstehen |

### Workflow-Ketten

**Neue Seite / neues UI-Feature:**
```
architecture-agent → frontend-agent → code-review-agent → docu-agent → buyer-docu-agent (wenn käuferseitig relevant)
```

**Backend-Feature (API + Datenbank):**
```
architecture-agent → [backend-agent ∥ database-agent] → api-agent → code-review-agent → tester-agent
```

**Bug fixen:**
```
debug-agent → refactor-agent (falls nötig) → code-review-agent
```

**SCSS / Design-Optimierung:**
```
frontend-agent → code-review-agent
```

**Refactor:**
```
explorer → code-review-agent → refactor-agent → code-review-agent
```

**Vollständiges Full-Stack-Feature:**
```
orchestrator
  architecture-agent
  ├── frontend-agent ∥ backend-agent ∥ database-agent
  └── api-agent
  code-review-agent → tester-agent → docu-agent → buyer-docu-agent
```

**Buyer-Dokumentation aktualisieren:**
```
explorer (prüft was seit letztem SETUP.md-Update neu ist)
  → buyer-docu-agent (aktualisiert SETUP.md)
```

### Parallel (∥) vs. Sequenziell

**Parallel starten** wenn Agenten unabhängige Dateien bearbeiten (z.B. `frontend-agent` + `database-agent`).  
**Sequenziell** wenn Agent B den Output von Agent A braucht (immer: `architecture-agent` → alle anderen).

### Autonomie-Regeln

**Claude entscheidet selbstständig:**
- Dateien lesen, anlegen, bearbeiten (im definierten Scope)
- Agenten für Analyse und Recherche starten (`explorer`, `code-review-agent`)
- TypeScript-Check nach jeder Änderung (`npx tsc --noEmit`)
- Dokumentation aktualisieren (PROJECT_DOCUMENTS.md, PROJECT_STRUCTURE.md)
- SCSS-Klassen anlegen, bestehende Styles anpassen
- Bestehende Tests fixen

**Claude fragt immer vorher:**
- Neue npm-Pakete installieren
- Neue Feature-Ordnerstruktur anlegen (src/features/<name>/)
- Datenbankschema oder Migrations ändern
- Dateien löschen oder umbenennen
- Scope > 5 Dateien gleichzeitig schreiben
- Externe APIs oder Drittanbieter-Services einbinden

---

## Custom Commands (Slash-Befehle)

Verfügbar über `/project:<name>` in Claude Code:

| Command | Auslöser | Startet |
|---|---|---|
| `/project:feature` | Neue Seite oder Funktion | architecture-agent → frontend-agent → review → docu → buyer-docu-agent |
| `/project:fix` | Bug oder Fehler | debug-agent → refactor → review |
| `/project:review` | Code-Qualitätsprüfung | code-review-agent über alle geänderten Dateien |
| `/project:refactor` | Code aufräumen | explorer → review → refactor → review |
| `/project:docu` | Entwickler-Doku synchronisieren | docu-agent aktualisiert PROJECT_DOCUMENTS.md + PROJECT_STRUCTURE.md |
| `/project:buyer-docs` | Käufer-Doku aktualisieren | buyer-docu-agent aktualisiert SETUP.md nach Code-Änderungen |

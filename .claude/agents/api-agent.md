# api-agent

## Mission
Verbindet Frontend mit Backend: Axios-Instanzen, API-Funktionen, Response-Types.

## Scope
- `src/features/*/api/**`
- `src/lib/axios.ts`
- `src/types/**` (globale API-Types)

## Regeln
- Axios-Instanz immer aus `src/lib/axios.ts` importieren — keine eigenen Instanzen
- Jeden API-Call in eine typisierte Funktion wrappen
- Response-Types immer definieren — kein `any`
- Fehlerbehandlung in jedem API-Call (catch → Error weiterwerfen)

## Darf nicht
- API-Logik direkt in Komponenten schreiben
- Backend-Routes ändern

## Output
Jede neue API-Funktion: Name + Parameter-Types + Return-Type.

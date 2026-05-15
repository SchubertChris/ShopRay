# Skill: Neues Feature scaffolden

Ordnerstruktur und Pflicht-Dateien für jedes neue Feature.

## Ordnerstruktur

```
src/features/<name>/
  api/
    <name>.api.ts       ← Axios-Calls
  components/
    <Name>Component.tsx ← UI-Teile des Features
  hooks/
    use<Name>.ts        ← State + Logic
  types/
    <name>.types.ts     ← Interfaces, Types, Enums
  index.ts              ← Public API (nur exports die andere brauchen)
```

## types/<name>.types.ts Template
```typescript
/** Beschreibung des Haupt-Typs */
export interface <Name> {
  id: string;
  // ...
}

export interface <Name>State {
  items: <Name>[];
  loading: boolean;
  error: string | null;
}
```

## index.ts Template
```typescript
// Nur exportieren was andere Features wirklich brauchen
export type { <Name> } from './types/<name>.types';
export { use<Name> } from './hooks/use<Name>';
```

## Checkliste
- [ ] Alle 5 Ordner angelegt
- [ ] types-Datei mit JSDoc
- [ ] index.ts nur Public-API
- [ ] `PROJECT_STRUCTURE.md` aktualisiert

# Skill: API-Funktion anlegen

Muster für jeden neuen Backend-Call.

## api/<name>.api.ts Template

```typescript
import { apiClient } from '@/lib/axios';
import type { <Name>, Create<Name>Dto } from '../types/<name>.types';

export async function getAll<Name>s(): Promise<<Name>[]> {
  const { data } = await apiClient.get<<Name>[]>('/<name>s');
  return data;
}

export async function get<Name>ById(id: string): Promise<<Name>> {
  const { data } = await apiClient.get<<Name>>(`/<name>s/${id}`);
  return data;
}

export async function create<Name>(dto: Create<Name>Dto): Promise<<Name>> {
  const { data } = await apiClient.post<<Name>>('/<name>s', dto);
  return data;
}
```

## Regeln
- Immer `apiClient` aus `@/lib/axios` — keine eigene Instanz
- Return-Type immer explizit angeben
- Kein try/catch hier — Fehler nach oben weitergeben (Hook fängt sie)
- Kein `any` — lieber `unknown` wenn Type unbekannt

## Checkliste
- [ ] Alle CRUD-Operationen die gebraucht werden
- [ ] Vollständig typisiert
- [ ] In `index.ts` des Features exportiert

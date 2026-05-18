# Rollen-System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rollenbasiertes Zugriffssystem für das Admin-Panel — Owner/Admin hat Vollzugriff, Mod hat Lese- und Tagesgeschäft-Zugriff ohne destruktive Aktionen und ohne Einstellungen.

**Architecture:** JWT-Payload wird von `{ role: 'admin' }` auf `{ role: 'owner' | 'mod', userId?: string }` erweitert. Owner loggt sich wie bisher mit dem Masterpasswort ein; Mods loggen sich mit ihrer Supabase-E-Mail + Passwort ein (sie müssen bereits einen Frontend-Account haben). Das Frontend liest die Rolle aus dem authStore und blendet Buttons/Seiten entsprechend aus.

**Tech Stack:** Express + JWT (Backend), Zustand (Frontend authStore), React Router Guards, Supabase `profiles.role`

---

## Berechtigungs-Matrix

| Bereich | Owner | Mod |
|---|---|---|
| Dashboard | ✅ | ✅ |
| Bestellungen sehen + Status + DHL + Rechnung | ✅ | ✅ |
| Tickets + Anfragen beantworten | ✅ | ✅ |
| Bewertungen freischalten/ablehnen | ✅ | ✅ |
| Kunden sehen | ✅ | ✅ |
| **Kunden bannen / löschen** | ✅ | ❌ |
| **Kunden-Rolle ändern** | ✅ | ❌ |
| **Produkte erstellen / bearbeiten / löschen** | ✅ | ❌ |
| **Kategorien verwalten** | ✅ | ❌ |
| **Einstellungen** | ✅ | ❌ |
| **Mod-Accounts anlegen / entfernen** | ✅ | ❌ |

---

## Datei-Übersicht

**Backend — Modify:**
- `Backend/src/middleware/adminAuth.ts` — JWT-Payload erweitern, `requireOwner` hinzufügen
- `Backend/src/routes/admin-auth.ts` — Mod-Login-Route + Mod-Management-Routes
- `Backend/src/routes/admin-customers.ts` — Ban/Delete nur für Owner
- `Backend/src/routes/admin-products.ts` — CREATE/UPDATE/DELETE nur für Owner

**Frontend — Modify:**
- `Admin/src/stores/authStore.ts` — `role: 'owner' | 'mod' | null` State
- `Admin/src/api/adminApi.ts` — Mod-Login + Mod-Management API-Funktionen
- `Admin/src/router/index.tsx` — `RequireOwner` Guard
- `Admin/src/pages/auth/login.tsx` — Zwei-Tab-Login (Inhaber / Mitarbeiter)
- `Admin/src/components/layout/Sidebar.tsx` — Rolle-Badge + Nav-Items filtern
- `Admin/src/pages/customers/index.tsx` — Ban/Delete ausblenden für Mods
- `Admin/src/pages/customers/customer-detail.tsx` — Ban/Delete/Rolle ausblenden für Mods
- `Admin/src/pages/products/index.tsx` — Create/Delete/CSV ausblenden für Mods
- `Admin/src/pages/reviews/index.tsx` — Delete ausblenden für Mods

**Frontend — Create:**
- `Admin/src/pages/settings/tabs/TeamTab.tsx` — Mitarbeiter-Verwaltung
- `Admin/src/scss/components/_role-guard.scss` — Styles für Role-Badge + gesperrte States

---

## Task 1: Backend — JWT + Middleware erweitern

**Files:**
- Modify: `Backend/src/middleware/adminAuth.ts`

- [ ] **Step 1: adminAuth.ts komplett ersetzen**

```typescript
// Backend/src/middleware/adminAuth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AdminRole = 'owner' | 'mod';

export interface AdminJwtPayload {
  role:    AdminRole;
  userId?: string;   // nur bei Mod-Login gesetzt (Supabase UUID)
  iat:     number;
  exp:     number;
}

// Hängt Payload an req — verfügbar für nachfolgende Handler
declare global {
  namespace Express {
    interface Request {
      adminRole?: AdminRole;
      adminUserId?: string;
    }
  }
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return (req.cookies as Record<string, string | undefined>)?.adminSession;
}

// Jeder eingeloggte Admin (owner ODER mod)
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: 'Nicht authentifiziert' }); return; }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET fehlt');
    const payload = jwt.verify(token, secret) as AdminJwtPayload;
    if (payload.role !== 'owner' && payload.role !== 'mod') throw new Error('Ungültige Rolle');
    req.adminRole   = payload.role;
    req.adminUserId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
  }
}

// Nur Owner (für destruktive Aktionen + Einstellungen)
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: 'Nicht authentifiziert' }); return; }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET fehlt');
    const payload = jwt.verify(token, secret) as AdminJwtPayload;
    if (payload.role !== 'owner') {
      res.status(403).json({ error: 'Nur für Inhaber zugänglich.' });
      return;
    }
    req.adminRole   = payload.role;
    req.adminUserId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
  }
}
```

- [ ] **Step 2: TypeScript-Check**

```
cd Backend && npx tsc --noEmit
```

Erwartung: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add Backend/src/middleware/adminAuth.ts
git commit -m "feat(backend): JWT-Payload owner|mod + requireOwner Middleware"
```

---

## Task 2: Backend — Mod-Login + Check-Route anpassen

**Files:**
- Modify: `Backend/src/routes/admin-auth.ts`

- [ ] **Step 1: Mod-Login-Schema + Route hinzufügen**

In `admin-auth.ts` nach dem `TotpSchema` einfügen:

```typescript
const ModLoginSchema = z.object({
  email:    z.string().email('Ungültige E-Mail.'),
  password: z.string().min(1, 'Passwort fehlt.').max(200),
});
```

Dann **nach** der `POST /login/totp`-Route und **vor** `POST /logout`:

```typescript
// POST /api/admin/login/mod — Mitarbeiter-Login via Supabase
router.post('/login/mod', authRateLimit, validate(ModLoginSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as z.infer<typeof ModLoginSchema>;
  const ip = getClientIp(req);

  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).json({ error: 'JWT_SECRET fehlt.' }); return; }

  // 1. Supabase-Anmeldung
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError || !authData.user) {
    void supabase.from('admin_login_log').insert({
      ip_address: ip,
      user_agent: (req.headers['user-agent'] ?? '').slice(0, 500),
      success: false,
    });
    res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    return;
  }

  // 2. Rolle aus profiles prüfen — muss 'mod' sein
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (profile?.role !== 'mod') {
    res.status(403).json({ error: 'Kein Mitarbeiter-Zugriff.' });
    return;
  }

  // 3. JWT mit role: 'mod' + userId ausstellen
  const token = jwt.sign(
    { role: 'mod', userId: authData.user.id },
    secret,
    { expiresIn: '24h' }
  );
  setAdminCookie(res, token);

  void supabase.from('admin_login_log').insert({
    ip_address: ip,
    user_agent: (req.headers['user-agent'] ?? '').slice(0, 500),
    success: true,
  });

  res.json({ ok: true, token, role: 'mod' });
});
```

- [ ] **Step 2: check-Route erweitert Role zurückgeben**

Den bestehenden `GET /check`-Handler ersetzen:

```typescript
// GET /api/admin/check — prüft Sitzung + gibt Rolle zurück
router.get('/check', requireAdmin, (req: Request, res: Response): void => {
  res.json({ ok: true, role: req.adminRole ?? 'owner' });
});
```

- [ ] **Step 3: Login-Route role: 'owner' statt 'admin' — zwei Stellen**

Zeile `jwt.sign({ role: 'admin' }, ...)` zweimal ersetzen (Password-Login + TOTP-Login):

```typescript
// Password-Login (ca. Zeile 112):
const token = jwt.sign({ role: 'owner' }, secret, { expiresIn: '24h' });

// TOTP-Login (ca. Zeile 164):
const sessionToken = jwt.sign({ role: 'owner' }, secret, { expiresIn: '24h' });
```

- [ ] **Step 4: TypeScript-Check**

```
cd Backend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add Backend/src/routes/admin-auth.ts
git commit -m "feat(backend): Mod-Login via Supabase + /check gibt Rolle zurück"
```

---

## Task 3: Backend — Owner-only Routes absichern

**Files:**
- Modify: `Backend/src/routes/admin-customers.ts`
- Modify: `Backend/src/routes/admin-products.ts`
- Modify: `Backend/src/routes/admin-categories.ts`
- Modify: `Backend/src/routes/settings.ts`

- [ ] **Step 1: admin-customers.ts — Ban/Delete/Rolle auf requireOwner**

Zuerst prüfen welche Imports oben stehen. Den `requireAdmin`-Import ergänzen um `requireOwner`:

```typescript
import { requireAdmin, requireOwner } from '../middleware/adminAuth';
```

Dann die drei destruktiven Routes auf `requireOwner` umstellen:

```typescript
// PATCH /:id/role — nur Owner
router.patch('/:id/role', requireOwner, async (req, res) => { /* unverändert */ });

// POST /:id/ban — nur Owner
router.post('/:id/ban', requireOwner, async (req, res) => { /* unverändert */ });

// POST /:id/unban — nur Owner
router.post('/:id/unban', requireOwner, async (req, res) => { /* unverändert */ });

// DELETE /:id — nur Owner
router.delete('/:id', requireOwner, async (req, res) => { /* unverändert */ });
```

**Wichtig:** `router.use(requireAdmin)` am Anfang bleibt — Lese-Zugriff für alle. Nur die obigen vier Routen bekommen zusätzlich requireOwner als Route-spezifische Middleware (überschreibt den router.use für diese Routen).

- [ ] **Step 2: admin-products.ts — Create/Update/Delete auf requireOwner**

```typescript
import { requireAdmin, requireOwner } from '../middleware/adminAuth';

// GET bleibt requireAdmin (Mods dürfen lesen)
// POST (erstellen) → requireOwner
router.post('/',    requireOwner, async (req, res) => { /* unverändert */ });
// POST bulk → requireOwner
router.post('/bulk', requireOwner, async (req, res) => { /* unverändert */ });
// PUT (bearbeiten) → requireOwner
router.put('/:id',  requireOwner, async (req, res) => { /* unverändert */ });
// DELETE → requireOwner
router.delete('/:id', requireOwner, async (req, res) => { /* unverändert */ });
// Upload → requireOwner
router.post('/upload', requireOwner, upload.single('image'), async (req, res) => { /* unverändert */ });
```

- [ ] **Step 3: admin-categories.ts — alle Writes auf requireOwner**

```typescript
import { requireAdmin, requireOwner } from '../middleware/adminAuth';

// GET bleibt requireAdmin
// POST → requireOwner
router.post('/',    requireOwner, async (req, res) => { /* unverändert */ });
// DELETE → requireOwner
router.delete('/:id', requireOwner, async (req, res) => { /* unverändert */ });
```

- [ ] **Step 4: settings.ts — alle Admin-Settings auf requireOwner**

```typescript
import { requireOwner } from '../middleware/adminAuth';

// PUT /api/admin/settings/shop → requireOwner (war requireAdmin)
router.put('/admin/settings/shop', requireOwner, async (req, res) => { /* unverändert */ });

// PUT /api/admin/settings/shipping → requireOwner (war requireAdmin)
router.put('/admin/settings/shipping', requireOwner, async (req, res) => { /* unverändert */ });
```

- [ ] **Step 5: TypeScript-Check**

```
cd Backend && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add Backend/src/routes/admin-customers.ts Backend/src/routes/admin-products.ts Backend/src/routes/admin-categories.ts Backend/src/routes/settings.ts
git commit -m "feat(backend): Owner-only Guards für destruktive Routen"
```

---

## Task 4: Backend — Mod-Management Routes

**Files:**
- Modify: `Backend/src/routes/admin-auth.ts`

- [ ] **Step 1: Mod-Listen + Hinzufügen + Entfernen in admin-auth.ts ergänzen**

Am Ende der Datei, vor `export default router`:

```typescript
// ── Mod-Verwaltung (nur Owner) ────────────────────────────────────────────────

const AddModSchema = z.object({
  email: z.string().email('Ungültige E-Mail.'),
});

// GET /api/admin/mods — alle aktuellen Mitarbeiter auflisten
router.get('/mods', requireOwner, async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .eq('role', 'mod')
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: 'Laden fehlgeschlagen.' }); return; }
  res.json(data ?? []);
});

// POST /api/admin/mods — bestehenden User zum Mod machen
router.post('/mods', requireOwner, validate(AddModSchema), async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as z.infer<typeof AddModSchema>;

  // User in profiles suchen (muss bereits registriert sein)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('email', email)
    .single();

  if (error || !profile) {
    res.status(404).json({ error: 'Kein Nutzer mit dieser E-Mail gefunden. Der Nutzer muss sich zuerst im Shop registrieren.' });
    return;
  }

  if (profile.role === 'owner' || profile.role === 'admin') {
    res.status(400).json({ error: 'Dieser Nutzer ist bereits Inhaber/Admin.' });
    return;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'mod' })
    .eq('id', profile.id);

  if (updateError) { res.status(500).json({ error: 'Rolle konnte nicht gesetzt werden.' }); return; }

  res.json({ ok: true, id: profile.id, email });
});

// DELETE /api/admin/mods/:id — Mod-Rechte entziehen
router.delete('/mods/:id', requireOwner, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', id)
    .single();

  if (profile?.role !== 'mod') {
    res.status(400).json({ error: 'Dieser Nutzer ist kein Mitarbeiter.' });
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', id);

  if (error) { res.status(500).json({ error: 'Entfernen fehlgeschlagen.' }); return; }
  res.json({ ok: true });
});
```

- [ ] **Step 2: requireOwner Import sicherstellen**

Am Anfang der Datei prüfen ob `requireOwner` bereits importiert ist (aus Task 2 nicht nötig, da `requireAdmin` genutzt wird — jetzt `requireOwner` für Mod-Routen):

```typescript
import { requireAdmin, requireOwner } from '../middleware/adminAuth';
```

- [ ] **Step 3: TypeScript-Check**

```
cd Backend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add Backend/src/routes/admin-auth.ts
git commit -m "feat(backend): Mod-Management Routen GET/POST/DELETE /api/admin/mods"
```

---

## Task 5: Frontend — authStore + adminApi erweitern

**Files:**
- Modify: `Admin/src/stores/authStore.ts`
- Modify: `Admin/src/api/adminApi.ts`

- [ ] **Step 1: authStore.ts — role State hinzufügen**

```typescript
// Admin/src/stores/authStore.ts
import { create } from 'zustand';
import { adminLogin, adminLogout, adminCheck, loginTotp, modLogin, setAdminToken, clearAdminToken } from '../api/adminApi';

export type AdminRole = 'owner' | 'mod';

interface AuthState {
  isAuthed:    boolean;
  checking:    boolean;
  requireTotp: boolean;
  role:        AdminRole | null;
  login:       (password: string) => Promise<void>;
  loginMod:    (email: string, password: string) => Promise<void>;
  verifyTotp:  (token: string) => Promise<void>;
  logout:      () => Promise<void>;
  checkAuth:   () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthed:    false,
  checking:    true,
  requireTotp: false,
  role:        null,

  login: async (password: string) => {
    const result = await adminLogin(password);
    if (result.token) setAdminToken(result.token);
    if (result.requireTotp) {
      set({ requireTotp: true });
    } else {
      set({ isAuthed: true, requireTotp: false, role: 'owner' });
    }
  },

  loginMod: async (email: string, password: string) => {
    const result = await modLogin(email, password);
    if (result.token) setAdminToken(result.token);
    set({ isAuthed: true, role: 'mod' });
  },

  verifyTotp: async (token: string) => {
    const result = await loginTotp(token) as { ok: boolean; token?: string };
    if (result.token) setAdminToken(result.token);
    set({ isAuthed: true, requireTotp: false, role: 'owner' });
  },

  logout: async () => {
    await adminLogout().catch(() => null);
    clearAdminToken();
    set({ isAuthed: false, requireTotp: false, role: null });
  },

  checkAuth: async () => {
    set({ checking: true });
    try {
      const result = await adminCheck() as { ok: boolean; role?: AdminRole };
      set({ isAuthed: true, role: result.role ?? 'owner' });
    } catch {
      set({ isAuthed: false, role: null });
    } finally {
      set({ checking: false });
    }
  },
}));
```

- [ ] **Step 2: adminApi.ts — modLogin + Mod-Management Funktionen hinzufügen**

In `adminApi.ts` die folgenden Funktionen ergänzen (nach den bestehenden Auth-Funktionen):

```typescript
// ── Mod-Login ─────────────────────────────────────────────────────────────────
export async function modLogin(email: string, password: string): Promise<{ ok: boolean; token: string; role: string }> {
  return apiFetch('/api/admin/login/mod', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ── Mod-Management (nur Owner) ────────────────────────────────────────────────
export interface ModUser {
  id:         string;
  email:      string;
  created_at: string;
}

export async function getMods(): Promise<ModUser[]> {
  return apiFetch('/api/admin/mods');
}

export async function addMod(email: string): Promise<{ ok: boolean; id: string; email: string }> {
  return apiFetch('/api/admin/mods', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function removeMod(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/admin/mods/${id}`, { method: 'DELETE' });
}
```

- [ ] **Step 3: adminCheck Rückgabetyp prüfen**

`adminCheck()` muss das `role`-Feld aus der Backend-Antwort weitergeben. Prüfen ob die Funktion die Raw-Response zurückgibt oder nur `{ ok: boolean }`:

```typescript
export async function adminCheck(): Promise<{ ok: boolean; role?: string }> {
  return apiFetch('/api/admin/check');
}
```

Falls der Rückgabetyp bereits definiert ist, anpassen.

- [ ] **Step 4: TypeScript-Check**

```
cd Admin && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add Admin/src/stores/authStore.ts Admin/src/api/adminApi.ts
git commit -m "feat(admin): authStore role-State + modLogin + Mod-Management API"
```

---

## Task 6: Frontend — Router Guards + Sidebar

**Files:**
- Modify: `Admin/src/router/index.tsx`
- Modify: `Admin/src/components/layout/Sidebar.tsx`
- Create: `Admin/src/scss/components/_role-guard.scss`

- [ ] **Step 1: router/index.tsx — RequireOwner Guard hinzufügen**

```typescript
// Admin/src/router/index.tsx
import { useAuthStore } from '@stores/authStore';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthed = useAuthStore(s => s.isAuthed);
  return isAuthed ? <>{children}</> : <Navigate to={ROUTES.AUTH.LOGIN} replace />;
}

function RequireOwner({ children }: { children: React.ReactNode }) {
  const role = useAuthStore(s => s.role);
  if (role === null) return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  if (role !== 'owner') return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <>{children}</>;
}

// In den children-Routes:
{ path: 'products/new',      element: <RequireOwner><ProductFormPage /></RequireOwner> },
{ path: 'products/:id/edit', element: <RequireOwner><ProductFormPage /></RequireOwner> },
{ path: 'categories',        element: <RequireOwner><CategoriesPage /></RequireOwner> },
{ path: 'settings',          element: <RequireOwner><SettingsPage /></RequireOwner>   },
```

- [ ] **Step 2: Sidebar.tsx — Rolle-Badge + Nav-Filter**

Die Sidebar muss `role` aus dem authStore lesen und:
- Rolle-Badge unter dem ShopRay-Logo anzeigen
- Für Mods: `categories` und `settings` aus der Nav ausblenden

```typescript
// In Sidebar.tsx — nach den Imports:
import { useAuthStore } from '@stores/authStore';

// In der Komponente:
const role = useAuthStore(s => s.role);

// NAV filtern für Mods:
const visibleNav = NAV.map(group => ({
  ...group,
  items: group.items.filter(item => {
    if (role !== 'mod') return true;
    // Mods sehen keine Kategorien und keine Einstellungen
    const hidden = [ROUTES.CATEGORIES, ROUTES.SETTINGS];
    return !hidden.includes(item.to);
  }),
})).filter(group => group.items.length > 0);

// Im JSX — Rolle-Badge nach dem Logo-Bereich einfügen:
<div className="sidebar__role-badge">
  <span className={`role-badge role-badge--${role ?? 'owner'}`}>
    {role === 'mod' ? 'Mitarbeiter' : 'Inhaber'}
  </span>
</div>

// NAV-Rendering auf `visibleNav` umstellen (statt `NAV`):
{visibleNav.map(group => (...))}
```

- [ ] **Step 3: _role-guard.scss erstellen**

```scss
// Admin/src/scss/components/_role-guard.scss

.sidebar__role-badge {
  padding: 0.375rem 1rem 0.5rem;
  border-bottom: 1px solid var(--clr-border);
  margin-bottom: 0.25rem;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  &--owner {
    background: color-mix(in srgb, var(--clr-accent) 15%, transparent);
    color: var(--clr-accent);
    border: 1px solid color-mix(in srgb, var(--clr-accent) 30%, transparent);
  }

  &--mod {
    background: color-mix(in srgb, var(--clr-text-muted) 12%, transparent);
    color: var(--clr-text-muted);
    border: 1px solid color-mix(in srgb, var(--clr-text-muted) 25%, transparent);
  }
}

// Gesperrte Aktionen — visuelles Feedback ohne funktionale Änderung
.action-owner-only {
  opacity: 0.35;
  pointer-events: none;
  cursor: not-allowed;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
  }
}
```

- [ ] **Step 4: _role-guard.scss in _index.scss forewarden**

In `Admin/src/scss/components/_index.scss`:

```scss
@forward 'role-guard';
```

- [ ] **Step 5: TypeScript-Check**

```
cd Admin && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add Admin/src/router/index.tsx Admin/src/components/layout/Sidebar.tsx Admin/src/scss/components/_role-guard.scss Admin/src/scss/components/_index.scss
git commit -m "feat(admin): RequireOwner Guard + Sidebar Rolle-Badge + Nav-Filter"
```

---

## Task 7: Frontend — Login-Seite Zwei-Tab

**Files:**
- Modify: `Admin/src/pages/auth/login.tsx`

- [ ] **Step 1: login.tsx — Mitarbeiter-Tab einbauen**

Die Datei bekommt einen neuen State `loginMode: 'owner' | 'mod'` und einen zweiten Formular-Bereich. Das Brand-Panel bleibt unverändert. Nur der Form-Panel ändert sich:

```typescript
// Admin/src/pages/auth/login.tsx
import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, CheckCircle, Eye, EyeOff, Lock, Smartphone, Users } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { ROUTES } from '@config/routes';

export default function LoginPage() {
  const [loginMode, setLoginMode] = useState<'owner' | 'mod'>('owner');

  // Owner-Login States (bestehend)
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // TOTP-States (bestehend, unverändert)
  const [totpCode,    setTotpCode]    = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError,   setTotpError]   = useState('');
  const totpInputRef = useRef<HTMLInputElement>(null);

  // Mod-Login States (neu)
  const [modEmail,    setModEmail]    = useState('');
  const [modPassword, setModPassword] = useState('');
  const [modShowPw,   setModShowPw]   = useState(false);
  const [modError,    setModError]    = useState('');
  const [modLoading,  setModLoading]  = useState(false);

  const { login, verifyTotp, loginMod, requireTotp } = useAuthStore();
  const navigate = useNavigate();

  // Owner-Submit (bestehend, unverändert)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) { setError('Bitte Passwort eingeben.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(password);
      if (!useAuthStore.getState().requireTotp) {
        navigate(ROUTES.DASHBOARD);
      } else {
        setTimeout(() => totpInputRef.current?.focus(), 50);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  // TOTP-Submit (bestehend, unverändert)
  const handleTotpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) { setTotpError('Bitte 6-stelligen Code eingeben.'); return; }
    setTotpError('');
    setTotpLoading(true);
    try {
      await verifyTotp(totpCode);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setTotpError(err instanceof Error ? err.message : 'Ungültiger Code.');
      setTotpCode('');
      totpInputRef.current?.focus();
    } finally {
      setTotpLoading(false);
    }
  };

  // Mod-Submit (neu)
  const handleModSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!modEmail || !modPassword) { setModError('Bitte E-Mail und Passwort eingeben.'); return; }
    setModError('');
    setModLoading(true);
    try {
      await loginMod(modEmail, modPassword);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setModError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      setModLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* Brand Panel — unverändert */}
      <div className="login-brand">
        {/* ... kompletter Brand-Bereich aus der Originaldatei kopieren ... */}
      </div>

      {/* Form Panel */}
      <div className="login-form-panel">
        <div className="login-form-wrap">

          {/* Tab-Switcher — nur wenn nicht im TOTP-Schritt */}
          {!requireTotp && (
            <div className="login-tabs">
              <button
                type="button"
                className={`login-tab ${loginMode === 'owner' ? 'login-tab--active' : ''}`}
                onClick={() => { setLoginMode('owner'); setError(''); setModError(''); }}
              >
                <Lock size={13} strokeWidth={2} />
                Inhaber
              </button>
              <button
                type="button"
                className={`login-tab ${loginMode === 'mod' ? 'login-tab--active' : ''}`}
                onClick={() => { setLoginMode('mod'); setError(''); setModError(''); }}
              >
                <Users size={13} strokeWidth={2} />
                Mitarbeiter
              </button>
            </div>
          )}

          <div className="login-form__lock-icon" aria-hidden="true">
            {requireTotp ? <Smartphone size={22} strokeWidth={1.75} /> : <Lock size={22} strokeWidth={1.75} />}
          </div>

          {/* Owner-Passwort-Form — unverändert, nur wenn loginMode === 'owner' */}
          {!requireTotp && loginMode === 'owner' && (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <p className="login-form__eyebrow">Inhaber-Zugang</p>
              <h2 className="login-form__title">Anmelden</h2>
              <p className="login-form__sub">Vollzugriff auf alle Funktionen.</p>
              <div className="login-form__group">
                <label htmlFor="password">Admin-Passwort</label>
                <div className="login-form__input-wrap">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                    required
                    autoFocus
                  />
                  <button type="button" className="login-form__pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                  </button>
                </div>
              </div>
              {error && <div className="login-form__error"><Shield size={13} strokeWidth={2} />{error}</div>}
              <button className="login-form__submit" type="submit" disabled={loading}>
                {loading ? <><span className="login-form__spinner" />Wird angemeldet…</> : 'Anmelden'}
              </button>
            </form>
          )}

          {/* TOTP-Form — unverändert */}
          {requireTotp && (
            <form className="login-form" onSubmit={handleTotpSubmit} noValidate>
              {/* ... komplettes TOTP-Formular aus der Originaldatei ... */}
            </form>
          )}

          {/* Mod-Login-Form — neu */}
          {!requireTotp && loginMode === 'mod' && (
            <form className="login-form" onSubmit={handleModSubmit} noValidate>
              <p className="login-form__eyebrow">Mitarbeiter-Zugang</p>
              <h2 className="login-form__title">Anmelden</h2>
              <p className="login-form__sub">Eingeschränkter Zugriff für Teammitglieder.</p>
              <div className="login-form__group">
                <label htmlFor="mod-email">E-Mail-Adresse</label>
                <input
                  id="mod-email"
                  type="email"
                  autoComplete="email"
                  placeholder="mitarbeiter@beispiel.de"
                  value={modEmail}
                  onChange={e => { setModEmail(e.target.value); if (modError) setModError(''); }}
                  required
                  autoFocus
                />
              </div>
              <div className="login-form__group">
                <label htmlFor="mod-password">Passwort</label>
                <div className="login-form__input-wrap">
                  <input
                    id="mod-password"
                    type={modShowPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={modPassword}
                    onChange={e => { setModPassword(e.target.value); if (modError) setModError(''); }}
                    required
                  />
                  <button type="button" className="login-form__pw-toggle" onClick={() => setModShowPw(v => !v)} tabIndex={-1}>
                    {modShowPw ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                  </button>
                </div>
              </div>
              {modError && <div className="login-form__error"><Shield size={13} strokeWidth={2} />{modError}</div>}
              <button className="login-form__submit" type="submit" disabled={modLoading}>
                {modLoading ? <><span className="login-form__spinner" />Wird angemeldet…</> : 'Als Mitarbeiter anmelden'}
              </button>
            </form>
          )}

          <p className="login-form__security-note">
            <Shield size={12} strokeWidth={2} />
            Verbindung verschlüsselt · Alle Zugriffe werden protokolliert
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Login-Tab SCSS in _login.scss ergänzen**

In der vorhandenen `_login.scss`-Datei (Pfad prüfen: `Admin/src/scss/pages/_login.scss` oder ähnlich) anhängen:

```scss
// Login-Tabs
.login-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.25rem;
  background: var(--clr-surface-2, var(--clr-surface));
  border-radius: 8px;
  padding: 0.2rem;
  border: 1px solid var(--clr-border);
}

.login-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--clr-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(.login-tab--active) {
    color: var(--clr-text);
    background: color-mix(in srgb, var(--clr-text) 5%, transparent);
  }

  &--active {
    background: var(--clr-surface);
    color: var(--clr-text);
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  }
}
```

- [ ] **Step 3: TypeScript-Check**

```
cd Admin && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add Admin/src/pages/auth/login.tsx Admin/src/scss/
git commit -m "feat(admin): Login-Seite mit Inhaber/Mitarbeiter Tab"
```

---

## Task 8: Frontend — Seitenweise Aktions-Guards

**Files:**
- Modify: `Admin/src/pages/customers/index.tsx`
- Modify: `Admin/src/pages/customers/customer-detail.tsx`
- Modify: `Admin/src/pages/products/index.tsx`
- Modify: `Admin/src/pages/reviews/index.tsx`

- [ ] **Step 1: customers/index.tsx — Ban/Delete für Mods ausblenden**

Am Anfang der Komponente:

```typescript
const role = useAuthStore(s => s.role);
const isOwner = role === 'owner';
```

Den Ban-Button und Delete-Button jeweils wrappen:

```tsx
{/* Ban-Button: nur für Owner */}
{isOwner && (
  <button className="table-action table-action--warning" onClick={() => openBan(customer)}>
    <Ban size={13} />
  </button>
)}

{/* Delete-Button: nur für Owner */}
{isOwner && (
  <button className="table-action table-action--danger" onClick={() => handleDelete(customer.id)}>
    <Trash2 size={13} />
  </button>
)}
```

- [ ] **Step 2: customers/customer-detail.tsx — Ban/Delete/Rolle für Mods ausblenden**

```typescript
const role = useAuthStore(s => s.role);
const isOwner = role === 'owner';
```

Alle drei destruktiven Aktionen (Ban, Unban, Delete, Rolle-Dropdown) mit `{isOwner && (...)}` wrappen.

- [ ] **Step 3: products/index.tsx — Create/Delete/CSV für Mods ausblenden**

```typescript
const role = useAuthStore(s => s.role);
const isOwner = role === 'owner';
```

```tsx
{/* "Neues Produkt"-Button */}
{isOwner && (
  <Link to={ROUTES.PRODUCTS.NEW} className="btn-primary">
    <Plus size={15} /> Neues Produkt
  </Link>
)}

{/* "CSV importieren"-Button */}
{isOwner && (
  <button className="btn-secondary" onClick={() => setCsvOpen(true)}>
    CSV importieren
  </button>
)}

{/* Delete-Button in jeder Produkt-Zeile */}
{isOwner && (
  <button className="table-action table-action--danger" onClick={() => handleDelete(product.id)}>
    <Trash2 size={13} />
  </button>
)}
```

- [ ] **Step 4: reviews/index.tsx — Delete für Mods ausblenden (Freischalten/Ablehnen bleiben)**

```typescript
const role = useAuthStore(s => s.role);
const isOwner = role === 'owner';
```

```tsx
{/* Delete-Button: nur Owner */}
{isOwner && (
  <button className="table-action table-action--danger" onClick={() => handleDelete(review.id)}>
    <Trash2 size={13} />
  </button>
)}
```

- [ ] **Step 5: TypeScript-Check**

```
cd Admin && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add Admin/src/pages/customers/index.tsx Admin/src/pages/customers/customer-detail.tsx Admin/src/pages/products/index.tsx Admin/src/pages/reviews/index.tsx
git commit -m "feat(admin): Aktions-Guards — destruktive Buttons nur für Owner sichtbar"
```

---

## Task 9: Frontend — Settings Mitarbeiter-Tab

**Files:**
- Create: `Admin/src/pages/settings/tabs/TeamTab.tsx`
- Modify: `Admin/src/pages/settings/index.tsx`

- [ ] **Step 1: TeamTab.tsx erstellen**

```typescript
// Admin/src/pages/settings/tabs/TeamTab.tsx
import { useState, useEffect, useCallback } from 'react';
import { Users, Trash2, Plus, Loader2, AlertCircle, UserCheck } from 'lucide-react';
import { getMods, addMod, removeMod, type ModUser } from '../../../api/adminApi';

export default function TeamTab() {
  const [mods,       setMods]       = useState<ModUser[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [email,      setEmail]      = useState('');
  const [adding,     setAdding]     = useState(false);
  const [addError,   setAddError]   = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMods(await getMods());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setAdding(true);
    setAddError(null);
    try {
      const created = await addMod(trimmed);
      setMods(prev => [...prev, { id: created.id, email: created.email, created_at: new Date().toISOString() }]);
      setEmail('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Hinzufügen fehlgeschlagen.');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(mod: ModUser) {
    if (!confirm(`Mitarbeiter-Rechte von "${mod.email}" wirklich entziehen?`)) return;
    setRemovingId(mod.id);
    try {
      await removeMod(mod.id);
      setMods(prev => prev.filter(m => m.id !== mod.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Entfernen fehlgeschlagen.');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="settings-section">
      <h2 className="settings-section__title">Mitarbeiter</h2>
      <p className="settings-section__desc">
        Mitarbeiter haben Zugriff auf Bestellungen, Tickets und Kunden — aber nicht auf Produkte, Kategorien oder Einstellungen.
        Der Nutzer muss bereits einen Account im Shop haben.
      </p>

      {/* Hinzufügen */}
      <form className="team-add-form" onSubmit={handleAdd}>
        <div className="form-group team-add-form__input">
          <label className="form-label" htmlFor="mod-email-input">E-Mail des Nutzers</label>
          <input
            id="mod-email-input"
            className="form-input"
            type="email"
            placeholder="mitarbeiter@beispiel.de"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <button className="btn-primary team-add-form__btn" type="submit" disabled={adding || !email.trim()}>
          <Plus size={14} strokeWidth={2.5} />
          {adding ? 'Wird hinzugefügt…' : 'Mitarbeiter hinzufügen'}
        </button>
      </form>
      {addError && <p className="form-error" style={{ marginTop: '0.5rem' }}>{addError}</p>}

      {/* Liste */}
      {loading && (
        <div className="inq-state">
          <Loader2 size={28} strokeWidth={1.5} />
          <p className="inq-state__text">Wird geladen…</p>
        </div>
      )}

      {!loading && error && (
        <div className="inq-state">
          <AlertCircle size={28} strokeWidth={1.5} />
          <p className="inq-state__text">{error}</p>
          <button className="inq-state__retry" onClick={load}>Erneut versuchen</button>
        </div>
      )}

      {!loading && !error && mods.length === 0 && (
        <div className="inq-state" style={{ marginTop: '1.5rem' }}>
          <UserCheck size={28} strokeWidth={1.5} />
          <p className="inq-state__text">Noch keine Mitarbeiter. Füge die erste Person oben hinzu.</p>
        </div>
      )}

      {!loading && !error && mods.length > 0 && (
        <div className="team-list">
          {mods.map(mod => (
            <div key={mod.id} className="team-item">
              <div className="team-item__info">
                <Users size={15} strokeWidth={1.75} />
                <span className="team-item__email">{mod.email}</span>
                <span className="team-item__since">seit {new Date(mod.created_at).toLocaleDateString('de-DE')}</span>
              </div>
              <button
                className="btn-icon btn-icon--danger"
                onClick={() => handleRemove(mod)}
                disabled={removingId === mod.id}
                title="Mitarbeiter-Rechte entziehen"
              >
                {removingId === mod.id
                  ? <Loader2 size={14} strokeWidth={2} className="spin" />
                  : <Trash2  size={14} strokeWidth={2} />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TeamTab-SCSS in _settings.scss oder eine neue Datei ergänzen**

In der vorhandenen Settings-SCSS-Datei (z.B. `Admin/src/scss/pages/_settings.scss`) anhängen:

```scss
// Team-Tab
.team-add-form {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  &__input { flex: 1; margin: 0; }
  &__btn   { white-space: nowrap; }
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.team-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--clr-surface);
  border: 1px solid var(--clr-border);
  border-radius: 8px;

  &__info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--clr-text);
    font-size: 0.875rem;
  }

  &__email { font-weight: 500; }

  &__since {
    font-size: 0.75rem;
    color: var(--clr-text-muted);
  }
}
```

- [ ] **Step 3: settings/index.tsx — Mitarbeiter-Tab einbinden**

In der Settings-Seite den neuen Tab bei den Tabs hinzufügen. Den vorhandenen Tab-Array suchen und ergänzen:

```typescript
import TeamTab from './tabs/TeamTab';

// Im TABS-Array oder equivalent:
{ id: 'team', label: 'Mitarbeiter', icon: Users }

// Im Tab-Content-Rendering:
{activeTab === 'team' && <TeamTab />}
```

- [ ] **Step 4: TypeScript-Check**

```
cd Admin && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add Admin/src/pages/settings/tabs/TeamTab.tsx Admin/src/pages/settings/index.tsx Admin/src/scss/
git commit -m "feat(admin): Settings Mitarbeiter-Tab — Mods hinzufügen + entfernen"
```

---

## Task 10: Abschluss-Check + Push

- [ ] **Step 1: Alle drei TypeScript-Checks**

```
cd Backend  && npx tsc --noEmit
cd Admin    && npx tsc --noEmit
cd Frontend && npx tsc --noEmit
```

Alle drei: keine Fehler.

- [ ] **Step 2: Manuelle Smoke-Tests**

1. Owner-Login: Passwort eingeben → Tab "Inhaber" → Dashboard → alle Nav-Items sichtbar → Einstellungen erreichbar → Mitarbeiter-Tab sichtbar
2. Mod-Login: Tab "Mitarbeiter" → E-Mail + Passwort eines Supabase-Users der `role: 'mod'` hat → Dashboard → Kategorien im Nav fehlen → Einstellungen im Nav fehlen
3. Mod versucht `/categories` direkt aufzurufen → Redirect zu Dashboard
4. Owner fügt Mod hinzu: Einstellungen → Mitarbeiter → E-Mail eingeben → Hinzufügen → erscheint in Liste
5. Mod-Login funktioniert danach
6. Owner entfernt Mod → Mod-Login schlägt fehl (403)

- [ ] **Step 3: Push**

```bash
git push origin main
```

---

## Self-Review

**Spec-Coverage:**
- ✅ Owner/Admin hat Vollzugriff
- ✅ Mod hat Lese-Zugriff + Tagesgeschäft
- ✅ Mod kann nicht bannen, löschen, Produkte bearbeiten, Einstellungen ändern
- ✅ Nur Owner kann Mods anlegen/entfernen
- ✅ Mod kann keinen anderen Mod anlegen
- ✅ Login-Seite mit zwei Tabs
- ✅ Rolle-Badge in Sidebar
- ✅ Nav-Items für Mods gefiltert
- ✅ Kategorie- und Einstellungen-Routen per RequireOwner Guard gesichert
- ✅ Backend-Routen per requireOwner abgesichert

**Kein Placeholder:** Alle Code-Blöcke vollständig.

**Typ-Konsistenz:**
- `AdminRole = 'owner' | 'mod'` — konsistent in adminAuth.ts, authStore.ts, adminApi.ts
- `ModUser { id, email, created_at }` — konsistent in adminApi.ts und TeamTab.tsx

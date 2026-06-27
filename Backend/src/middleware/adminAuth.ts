import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';
import { setAdminCookie } from '../lib/adminCookie';

export type AdminRole = 'owner' | 'team_lead' | 'mod';

export interface AdminJwtPayload {
  role:     AdminRole;
  userId?:  string;
  rootIat:  number;   // Absoluter Session-Start — wird bei Renewal nie überschrieben
  iat:      number;
  exp:      number;
}

declare global {
  namespace Express {
    interface Request {
      adminRole?:       AdminRole;
      adminUserId?:     string;
      adminIsSetup2FA?: boolean;
    }
  }
}

// Absolute Sitzungsobergrenze: 24h ab erstem Login, egal wie oft erneuert wird.
const SESSION_HARD_LIMIT = 24 * 60 * 60;

// ── Owner Session-Invalidierungs-Cache ───────────────────────────────────────

let _ownerSessionsValidFrom: number | null = null;
let _ownerCacheExpiry = 0;

async function getOwnerSessionsValidFrom(): Promise<number | null> {
  if (Date.now() < _ownerCacheExpiry) return _ownerSessionsValidFrom;
  const { data } = await supabase.from('admin_config').select('updated_at').eq('id', 1).single();
  _ownerSessionsValidFrom = data?.updated_at
    ? Math.floor(new Date(data.updated_at as string).getTime() / 1000)
    : null;
  _ownerCacheExpiry = Date.now() + 60_000;
  return _ownerSessionsValidFrom;
}

// ── Staff-Aktivitäts-Cache ────────────────────────────────────────────────────

const _staffCache = new Map<string, { active: boolean; expiry: number }>();

export function clearModCache(userId: string): void {
  _staffCache.delete(userId);
}

async function isModActive(userId: string): Promise<boolean> {
  const cached = _staffCache.get(userId);
  if (cached && Date.now() < cached.expiry) return cached.active;

  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  const active = data?.role === 'mod' || data?.role === 'team_lead';
  const now = Date.now();
  _staffCache.set(userId, { active, expiry: now + 5 * 60_000 });

  // Abgelaufene Einträge entfernen — verhindert unbegrenztes Map-Wachstum
  for (const [uid, entry] of _staffCache) {
    if (entry.expiry <= now) _staffCache.delete(uid);
  }

  return active;
}

// ── Token-Hilfsfunktionen ─────────────────────────────────────────────────────

export function extractToken(req: Request): string | undefined {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return (req.cookies as Record<string, string | undefined>)?.adminSession;
}

function issueRenewal(payload: AdminJwtPayload, secret: string, res: Response): void {
  const now          = Math.floor(Date.now() / 1000);
  const timeLeft     = payload.exp - now;
  const sessionStart = payload.rootIat ?? payload.iat;
  const absoluteLeft = SESSION_HARD_LIMIT - (now - sessionStart);

  // Kein Renewal wenn Token noch > 3h gültig oder absolute 24h-Grenze erreicht
  if (timeLeft >= 3 * 60 * 60 || absoluteLeft <= 0) return;

  const renewed = jwt.sign(
    {
      role:    payload.role,
      ...(payload.userId ? { userId: payload.userId } : {}),
      rootIat: sessionStart,  // rootIat niemals überschreiben
    },
    secret,
    { expiresIn: '8h' },
  );
  res.setHeader('X-New-Token', renewed);  // Bearer-Pfad (sessionStorage)
  setAdminCookie(res, renewed);            // Cookie-Pfad mit erneuern
}

// ── Zentrale Token-Verifikation ───────────────────────────────────────────────

type VerifyResult =
  | { type: 'error' }
  | { type: 'setup2fa' }
  | { type: 'ok'; payload: AdminJwtPayload };

async function verifyAdminToken(req: Request, res: Response): Promise<VerifyResult> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return { type: 'error' };
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET fehlt' });
    return { type: 'error' };
  }

  let raw: Record<string, unknown>;
  try {
    raw = jwt.verify(token, secret) as Record<string, unknown>;
  } catch {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
    return { type: 'error' };
  }

  if ('mustSetup2FA' in raw) return { type: 'setup2fa' };

  const p = raw as unknown as AdminJwtPayload;
  if (p.role !== 'owner' && p.role !== 'team_lead' && p.role !== 'mod') {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
    return { type: 'error' };
  }

  // ── Absolute Sitzungsgrenze: max 24h ab erstem Login ────────────────────
  const now          = Math.floor(Date.now() / 1000);
  const sessionStart = p.rootIat ?? p.iat; // Rückwärtskompatibel: alte Tokens ohne rootIat fallen auf iat zurück
  if (now - sessionStart > SESSION_HARD_LIMIT) {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
    return { type: 'error' };
  }

  // ── Owner: Invalidierung nach Passwortänderung ───────────────────────────
  if (p.role === 'owner') {
    const validFrom = await getOwnerSessionsValidFrom();
    if (validFrom && p.iat < validFrom) {
      res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
      return { type: 'error' };
    }
  }

  // ── Staff: prüfen ob Rolle noch aktiv ────────────────────────────────────
  if ((p.role === 'mod' || p.role === 'team_lead') && p.userId) {
    const active = await isModActive(p.userId);
    if (!active) {
      res.status(401).json({ error: 'Zugriff verweigert — Konto nicht mehr aktiv' });
      return { type: 'error' };
    }
  }

  req.adminRole   = p.role;
  req.adminUserId = p.userId;
  issueRenewal(p, secret, res);
  return { type: 'ok', payload: p };
}

// ── Guard-Middleware ──────────────────────────────────────────────────────────

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const result = await verifyAdminToken(req, res);
  if (result.type === 'setup2fa') {
    res.status(401).json({ error: '2FA muss zuerst eingerichtet werden.' });
    return;
  }
  if (result.type === 'ok') next();
}

export async function requireOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
  const result = await verifyAdminToken(req, res);
  if (result.type === 'setup2fa') {
    res.status(401).json({ error: '2FA muss zuerst eingerichtet werden.' });
    return;
  }
  if (result.type !== 'ok') return;
  if (result.payload.role !== 'owner') {
    res.status(403).json({ error: 'Nur für Inhaber zugänglich.' });
    return;
  }
  next();
}

export async function requireTeamLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  const result = await verifyAdminToken(req, res);
  if (result.type === 'setup2fa') {
    res.status(401).json({ error: '2FA muss zuerst eingerichtet werden.' });
    return;
  }
  if (result.type !== 'ok') return;
  if (result.payload.role !== 'owner' && result.payload.role !== 'team_lead') {
    res.status(403).json({ error: 'Nur für Team-Leads und Inhaber zugänglich.' });
    return;
  }
  next();
}

// Erlaubt sowohl reguläre Admin-Sessions als auch den kurzzeitigen Setup-2FA-Token
export function requireAdminOrSetup2FA(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    const result = await verifyAdminToken(req, res);
    if (result.type === 'setup2fa') {
      req.adminRole       = 'owner';
      req.adminIsSetup2FA = true;
      next();
      return;
    }
    if (result.type === 'ok') next();
  })();
}

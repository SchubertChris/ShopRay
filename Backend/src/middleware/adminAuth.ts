import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';

export type AdminRole = 'owner' | 'team_lead' | 'mod';

export interface AdminJwtPayload {
  role:    AdminRole;
  userId?: string;
  iat:     number;
  exp:     number;
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

// ── Session-Invalidierungs-Cache ──────────────────────────────────────────────

// Owner: gespeicherter Zeitpunkt der letzten Passwortänderung (admin_config.updated_at)
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

// Staff (mod + team_lead): prüft ob der Nutzer noch eine aktive Staff-Rolle hat
const _staffCache = new Map<string, { active: boolean; expiry: number }>();

export function clearModCache(userId: string): void {
  _staffCache.delete(userId);
}

async function isModActive(userId: string): Promise<boolean> {
  const cached = _staffCache.get(userId);
  if (cached && Date.now() < cached.expiry) return cached.active;
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  const active = data?.role === 'mod' || data?.role === 'team_lead';
  _staffCache.set(userId, { active, expiry: Date.now() + 5 * 60_000 });
  return active;
}

// ── Token-Hilfsfunktion ───────────────────────────────────────────────────────

export function extractToken(req: Request): string | undefined {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return (req.cookies as Record<string, string | undefined>)?.adminSession;
}

function issueRenewal(payload: AdminJwtPayload, secret: string, res: Response): void {
  const now      = Math.floor(Date.now() / 1000);
  const timeLeft = payload.exp - now;
  if (timeLeft < 3 * 60 * 60) {
    const renewed = jwt.sign(
      { role: payload.role, ...(payload.userId ? { userId: payload.userId } : {}) },
      secret,
      { expiresIn: '8h' },
    );
    res.setHeader('X-New-Token', renewed);
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: 'Nicht authentifiziert' }); return; }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET fehlt');
    const payload = jwt.verify(token, secret) as Record<string, unknown>;

    if ('mustSetup2FA' in payload) {
      res.status(401).json({ error: '2FA muss zuerst eingerichtet werden.' });
      return;
    }

    const p = payload as unknown as AdminJwtPayload;
    if (p.role !== 'owner' && p.role !== 'team_lead' && p.role !== 'mod') throw new Error('Ungültige Rolle');

    // Owner: Token nach Passwortänderung invalidieren
    if (p.role === 'owner') {
      const validFrom = await getOwnerSessionsValidFrom();
      if (validFrom && p.iat < validFrom) {
        res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
        return;
      }
    }

    // Staff (mod / team_lead): prüfen ob Rolle noch aktiv ist
    if ((p.role === 'mod' || p.role === 'team_lead') && p.userId) {
      const active = await isModActive(p.userId);
      if (!active) {
        res.status(401).json({ error: 'Zugriff verweigert — Konto nicht mehr aktiv' });
        return;
      }
    }

    req.adminRole   = p.role;
    req.adminUserId = p.userId;
    issueRenewal(p, secret, res);
    next();
  } catch {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
  }
}

export async function requireOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: 'Nicht authentifiziert' }); return; }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET fehlt');
    const payload = jwt.verify(token, secret) as Record<string, unknown>;

    if ('mustSetup2FA' in payload) {
      res.status(401).json({ error: '2FA muss zuerst eingerichtet werden.' });
      return;
    }

    const p = payload as unknown as AdminJwtPayload;
    if (p.role !== 'owner') {
      res.status(403).json({ error: 'Nur für Inhaber zugänglich.' });
      return;
    }

    // Token nach Passwortänderung invalidieren
    const validFrom = await getOwnerSessionsValidFrom();
    if (validFrom && p.iat < validFrom) {
      res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
      return;
    }

    req.adminRole   = p.role;
    req.adminUserId = p.userId;
    issueRenewal(p, secret, res);
    next();
  } catch {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
  }
}

export async function requireTeamLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: 'Nicht authentifiziert' }); return; }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET fehlt');
    const payload = jwt.verify(token, secret) as Record<string, unknown>;

    if ('mustSetup2FA' in payload) {
      res.status(401).json({ error: '2FA muss zuerst eingerichtet werden.' });
      return;
    }

    const p = payload as unknown as AdminJwtPayload;
    if (p.role !== 'owner' && p.role !== 'team_lead') {
      res.status(403).json({ error: 'Nur für Team-Leads und Inhaber zugänglich.' });
      return;
    }

    // Owner: Token nach Passwortänderung invalidieren
    if (p.role === 'owner') {
      const validFrom = await getOwnerSessionsValidFrom();
      if (validFrom && p.iat < validFrom) {
        res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
        return;
      }
    }

    // Team-Lead: prüfen ob Rolle noch aktiv ist
    if (p.role === 'team_lead' && p.userId) {
      const active = await isModActive(p.userId);
      if (!active) {
        res.status(401).json({ error: 'Zugriff verweigert — Konto nicht mehr aktiv' });
        return;
      }
    }

    req.adminRole   = p.role;
    req.adminUserId = p.userId;
    issueRenewal(p, secret, res);
    next();
  } catch {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
  }
}

// Erlaubt sowohl reguläre Admin-Sessions als auch den kurzzeitigen Setup-2FA-Token
export function requireAdminOrSetup2FA(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: 'Nicht authentifiziert' }); return; }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET fehlt');
    const payload = jwt.verify(token, secret) as Record<string, unknown>;

    if ('mustSetup2FA' in payload) {
      req.adminRole       = 'owner';
      req.adminIsSetup2FA = true;
      next();
      return;
    }

    const p = payload as unknown as AdminJwtPayload;
    if (p.role !== 'owner' && p.role !== 'team_lead' && p.role !== 'mod') throw new Error('Ungültige Rolle');
    req.adminRole   = p.role;
    req.adminUserId = p.userId;
    issueRenewal(p, secret, res);
    next();
  } catch {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
  }
}

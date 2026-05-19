import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AdminRole = 'owner' | 'mod';

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

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
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
    if (p.role !== 'owner' && p.role !== 'mod') throw new Error('Ungültige Rolle');
    req.adminRole   = p.role;
    req.adminUserId = p.userId;
    issueRenewal(p, secret, res);
    next();
  } catch {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
  }
}

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
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
    if (p.role !== 'owner' && p.role !== 'mod') throw new Error('Ungültige Rolle');
    req.adminRole   = p.role;
    req.adminUserId = p.userId;
    issueRenewal(p, secret, res);
    next();
  } catch {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
  }
}

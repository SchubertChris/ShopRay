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

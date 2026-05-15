import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AdminJwtPayload {
  role: 'admin';
  iat:  number;
  exp:  number;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = (req.cookies as Record<string, string | undefined>)?.adminSession;

  if (!token) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return;
  }

  try {
    const secret  = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET nicht gesetzt');

    const payload = jwt.verify(token, secret) as AdminJwtPayload;
    if (payload.role !== 'admin') throw new Error('Ungültige Rolle');
    next();
  } catch {
    res.status(401).json({ error: 'Sitzung abgelaufen — bitte neu anmelden' });
  }
}

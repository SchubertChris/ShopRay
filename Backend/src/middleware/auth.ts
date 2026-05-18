import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export interface AuthRequest extends Request {
  userId?: string;
}

// Schützt Routen — prüft Supabase JWT im Authorization-Header
export async function requireAuth(
  req:  AuthRequest,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht autorisiert' });
    return;
  }

  const token = authHeader.slice(7);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Token ungültig oder abgelaufen' });
    return;
  }

  req.userId = data.user.id;
  next();
}

// Optionale Auth — setzt userId wenn JWT vorhanden, blockiert aber nicht
export async function optionalAuth(
  req:  AuthRequest,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data } = await supabase.auth.getUser(token);
    if (data?.user) req.userId = data.user.id;
  }
  next();
}

// Admin-Only: prüft ob User die Admin-Rolle hat
export async function requireAdmin(
  req:  AuthRequest,
  res:  Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, async () => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.userId)
      .single();

    if (data?.role !== 'admin') {
      res.status(403).json({ error: 'Keine Admin-Berechtigung' });
      return;
    }

    next();
  });
}

import { Request, Response, NextFunction } from 'express';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Paths that must stay writable even in Demo Mode (login/logout/session check)
const ALLOWED_PATHS = [
  '/api/admin/login',
  '/api/admin/login/totp',
  '/api/admin/logout',
  '/api/admin/check',
];

export function demoModeGuard(req: Request, res: Response, next: NextFunction): void {
  if (process.env.DEMO_MODE !== 'true') { next(); return; }
  if (!WRITE_METHODS.has(req.method)) { next(); return; }
  if (ALLOWED_PATHS.some(p => req.path === p || req.originalUrl.startsWith(p))) { next(); return; }

  res.status(403).json({
    error: 'Demo-Modus aktiv — Änderungen sind nicht erlaubt.',
    demo: true,
  });
}

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt    from 'jsonwebtoken';
import { authRateLimit } from '../middleware/security';
import { requireAdmin }  from '../middleware/adminAuth';

const router = Router();

const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 Stunden

function setAdminCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('adminSession', token, {
    httpOnly: true,
    secure:   isProd,
    // 'none' + secure=true erlaubt Cross-Domain Cookies (Vercel Admin → Backend)
    // In Dev reicht 'lax' (kein HTTPS)
    sameSite: isProd ? 'none' : 'lax',
    maxAge:   SESSION_MAX_AGE,
    path:     '/',
  });
}

// POST /api/admin/login
router.post('/login', authRateLimit, async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body as { password?: string };

  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Passwort fehlt.' });
    return;
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    res.status(500).json({ error: 'Admin-Passwort nicht konfiguriert.' });
    return;
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    // Bewusst generische Fehlermeldung — kein Hinweis ob User oder Passwort falsch
    res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET nicht konfiguriert.' });
    return;
  }

  const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '24h' });
  setAdminCookie(res, token);
  res.json({ ok: true });
});

// POST /api/admin/logout
router.post('/logout', (_req: Request, res: Response): void => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('adminSession', {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'none' : 'lax',
    path:     '/',
  });
  res.json({ ok: true });
});

// GET /api/admin/check — prüft ob Sitzung noch gültig ist
router.get('/check', requireAdmin, (_req: Request, res: Response): void => {
  res.json({ ok: true });
});

export default router;

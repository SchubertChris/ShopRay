import { z } from 'zod';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt    from 'jsonwebtoken';
import { verifySync } from 'otplib';
import { authRateLimit } from '../middleware/security';
import { requireAdmin }  from '../middleware/adminAuth';
import { supabase }      from '../lib/supabase';
import { sendMail, adminLoginAlertHtml } from '../lib/mailer';
import { validate } from '../lib/validate';

// ── Schema ────────────────────────────────────────────────────────────────────
const LoginSchema = z.object({
  password: z.string().min(1, 'Passwort fehlt.').max(200),
});

const TotpSchema = z.object({
  token: z.string().length(6, 'TOTP-Code muss 6 Stellen haben.').regex(/^\d{6}$/, 'Nur Ziffern.'),
});

const TOTP_PENDING_MAX_AGE = 5 * 60 * 1000; // 5 Minuten

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip ?? 'unbekannt';
}

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

const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS    = 15 * 60 * 1000; // 15 Minuten

// POST /api/admin/login
router.post('/login', authRateLimit, validate(LoginSchema), async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body as z.infer<typeof LoginSchema>;
  const ip           = getClientIp(req);

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    res.status(500).json({ error: 'Admin-Passwort nicht konfiguriert.' });
    return;
  }

  // ── IP-Lockout prüfen (vor dem bcrypt-Vergleich) ──────────────────────────
  const cutoff = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from('admin_login_log')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('success', false)
    .gte('created_at', cutoff);

  if ((count ?? 0) >= LOCKOUT_MAX_ATTEMPTS) {
    res.status(429).json({ error: 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte warte 15 Minuten.' });
    return;
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    void supabase.from('admin_login_log').insert({
      ip_address: ip,
      user_agent: (req.headers['user-agent'] ?? '').slice(0, 500),
      success: false,
    });
    // Bewusst generische Fehlermeldung — kein Hinweis ob User oder Passwort falsch
    res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET nicht konfiguriert.' });
    return;
  }

  // ── 2FA prüfen ────────────────────────────────────────────────────────────
  const { count: totpCount } = await supabase
    .from('admin_totp')
    .select('*', { count: 'exact', head: true });

  if ((totpCount ?? 0) > 0) {
    // 2FA aktiv → temporäres Pending-Cookie setzen, noch keine Session
    const pendingToken = jwt.sign({ totpPending: true }, secret, { expiresIn: '5m' });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('totpPending', pendingToken, {
      httpOnly: true,
      secure:   isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge:   TOTP_PENDING_MAX_AGE,
      path:     '/',
    });
    res.json({ ok: true, requireTotp: true });
    return;
  }

  const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '24h' });
  setAdminCookie(res, token);

  // ── Login loggen + E-Mail-Alarm (fire-and-forget) ────────────────────────
  const userAgent = (req.headers['user-agent'] ?? '').slice(0, 500);
  const date      = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

  void supabase.from('admin_login_log').insert({ ip_address: ip, user_agent: userAgent, success: true });

  const ownerEmail = process.env.SMTP_FROM_EMAIL;
  const adminUrl   = process.env.ADMIN_URL ?? 'https://shopray-admin.vercel.app';
  if (ownerEmail) {
    void sendMail({
      to:      ownerEmail,
      subject: `⚠️ Admin-Login bei ShopRay — ${date}`,
      html:    adminLoginAlertHtml({ ip, userAgent, date, adminUrl }),
    }).catch(() => null);
  }

  res.json({ ok: true });
});

// POST /api/admin/login/totp — zweiter Schritt nach 2FA
router.post('/login/totp', authRateLimit, validate(TotpSchema), async (req: Request, res: Response): Promise<void> => {
  const { token: totpCode } = req.body as z.infer<typeof TotpSchema>;
  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).json({ error: 'JWT_SECRET fehlt.' }); return; }

  // Pending-Cookie prüfen
  const pendingRaw = (req.cookies as Record<string, string>)['totpPending'];
  if (!pendingRaw) { res.status(401).json({ error: 'Kein Pending-Token. Bitte zuerst Passwort eingeben.' }); return; }

  try {
    jwt.verify(pendingRaw, secret) as { totpPending: boolean };
  } catch {
    res.status(401).json({ error: 'Pending-Token abgelaufen. Bitte neu anmelden.' });
    return;
  }

  // TOTP-Secret aus DB
  const { data: totpRow } = await supabase.from('admin_totp').select('secret').limit(1).single();
  if (!totpRow) { res.status(500).json({ error: '2FA nicht konfiguriert.' }); return; }

  const { valid: isValid } = verifySync({ token: totpCode, secret: totpRow.secret });
  if (!isValid) { res.status(401).json({ error: 'Ungültiger TOTP-Code.' }); return; }

  // Pending-Cookie löschen, Admin-Session setzen
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('totpPending', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/' });

  const sessionToken = jwt.sign({ role: 'admin' }, secret, { expiresIn: '24h' });
  setAdminCookie(res, sessionToken);

  // Login loggen
  const ip        = getClientIp(req);
  const userAgent = (req.headers['user-agent'] ?? '').slice(0, 500);
  void supabase.from('admin_login_log').insert({ ip_address: ip, user_agent: userAgent, success: true });

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

// GET /api/admin/login-log — letzte 50 Login-Einträge (Admin-Session erforderlich)
router.get('/login-log', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('admin_login_log')
      .select('id, created_at, ip_address, user_agent, success')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data ?? []);
  } catch {
    res.status(500).json({ error: 'Protokoll konnte nicht geladen werden.' });
  }
});

export default router;

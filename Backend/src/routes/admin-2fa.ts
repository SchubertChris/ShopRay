import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import jwt            from 'jsonwebtoken';
import { generateSecret, verifySync, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { supabase }                               from '../lib/supabase';
import { requireAdmin, requireAdminOrSetup2FA }   from '../middleware/adminAuth';
import { validate }                               from '../lib/validate';
import { sendMail, adminLoginAlertHtml }          from '../lib/mailer';

const router = Router();

const APP_NAME = 'ShopRay Admin';

const ConfirmSchema = z.object({
  secret: z.string().min(16, 'Secret fehlt.'),
  token:  z.string().length(6, 'TOTP-Code muss 6 Stellen haben.').regex(/^\d{6}$/, 'Nur Ziffern.'),
});

const VerifySchema = z.object({
  token: z.string().length(6, 'TOTP-Code muss 6 Stellen haben.').regex(/^\d{6}$/, 'Nur Ziffern.'),
});

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip ?? 'unbekannt';
}

// GET /api/admin/2fa/status — ist 2FA aktiv?
router.get('/status', requireAdmin, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { count } = await supabase
      .from('admin_totp')
      .select('*', { count: 'exact', head: true });

    res.json({ enabled: (count ?? 0) > 0 });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/2fa/setup — generiert neues Secret + QR Code
// Erlaubt sowohl eingeloggte Admins als auch den Setup-Token beim Erstzugang
router.get('/setup', requireAdminOrSetup2FA, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const secret     = generateSecret();
    const otpAuthUrl = generateURI({ issuer: APP_NAME, label: 'admin', secret });
    const qrCode     = await QRCode.toDataURL(otpAuthUrl);

    res.json({ secret, qrCode, otpAuthUrl });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/2fa/confirm — erstes OTP verifizieren und Secret speichern
// Bei Setup-Token (Erstkonfiguration): gibt vollständige Session zurück
router.post('/confirm', requireAdminOrSetup2FA, validate(ConfirmSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { secret: totpSecret, token } = req.body as z.infer<typeof ConfirmSchema>;

    const result = verifySync({ token, secret: totpSecret });
    if (!result.valid) {
      res.status(400).json({ error: 'Ungültiger TOTP-Code.' });
      return;
    }

    await supabase.from('admin_totp').delete().neq('id', 0);
    const { error } = await supabase.from('admin_totp').insert({ secret: totpSecret });
    if (error) throw error;

    // Erstkonfiguration via Setup-Token → vollständige Session ausstellen + Login-Alert senden
    if (req.adminIsSetup2FA) {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error('JWT_SECRET fehlt');

      const sessionToken = jwt.sign({ role: 'owner' }, jwtSecret, { expiresIn: '8h' });

      const ip        = getClientIp(req);
      const userAgent = (req.headers['user-agent'] ?? '').slice(0, 500);
      const date      = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
      void supabase.from('admin_login_log').insert({ ip_address: ip, user_agent: userAgent, success: true });

      const ownerEmail = process.env.SMTP_FROM_EMAIL;
      const adminUrl   = process.env.ADMIN_URL ?? 'https://shopray-admin.vercel.app';
      if (ownerEmail) {
        void sendMail({
          to:      ownerEmail,
          subject: `🔐 2FA eingerichtet & Admin-Login bei ShopRay — ${date}`,
          html:    adminLoginAlertHtml({ ip, userAgent, date, adminUrl }),
        }).catch(() => null);
      }

      res.json({ ok: true, token: sessionToken });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/2fa/verify — TOTP im laufenden Betrieb prüfen (z. B. für Deaktivierung)
router.post('/verify', requireAdmin, validate(VerifySchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body as z.infer<typeof VerifySchema>;

    const { data } = await supabase.from('admin_totp').select('secret').limit(1).single();
    if (!data) {
      res.status(400).json({ error: '2FA ist nicht aktiv.' });
      return;
    }

    const result = verifySync({ token, secret: data.secret });
    if (!result.valid) {
      res.status(400).json({ error: 'Ungültiger TOTP-Code.' });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/2fa — 2FA deaktivieren
router.delete('/', requireAdmin, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = await supabase.from('admin_totp').delete().neq('id', 0);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;

import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { generateSecret, verifySync, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { supabase }     from '../lib/supabase';
import { requireAdmin } from '../middleware/adminAuth';
import { validate }     from '../lib/validate';

const router = Router();
router.use(requireAdmin);

const APP_NAME = 'ShopRay Admin';

const ConfirmSchema = z.object({
  secret: z.string().min(16, 'Secret fehlt.'),
  token:  z.string().length(6, 'TOTP-Code muss 6 Stellen haben.').regex(/^\d{6}$/, 'Nur Ziffern.'),
});

const VerifySchema = z.object({
  token: z.string().length(6, 'TOTP-Code muss 6 Stellen haben.').regex(/^\d{6}$/, 'Nur Ziffern.'),
});

// GET /api/admin/2fa/status — ist 2FA aktiv?
router.get('/status', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { count } = await supabase
      .from('admin_totp')
      .select('*', { count: 'exact', head: true });

    res.json({ enabled: (count ?? 0) > 0 });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/2fa/setup — generiert ein neues Secret + QR Code
router.get('/setup', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
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
router.post('/confirm', validate(ConfirmSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { secret, token } = req.body as z.infer<typeof ConfirmSchema>;

    const result = verifySync({ token, secret });
    if (!result.valid) {
      res.status(400).json({ error: 'Ungültiger TOTP-Code.' });
      return;
    }

    // Alten Secret löschen (falls vorhanden) und neuen speichern
    await supabase.from('admin_totp').delete().neq('id', 0);
    const { error } = await supabase.from('admin_totp').insert({ secret });
    if (error) throw error;

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/2fa/verify — TOTP im laufenden Betrieb prüfen (z. B. für Deaktivierung)
router.post('/verify', validate(VerifySchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
router.delete('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = await supabase.from('admin_totp').delete().neq('id', 0);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;

import { z } from 'zod';
import { Router, Request, Response, NextFunction } from 'express';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { supabase }    from '../lib/supabase';
import { requireAdmin } from '../middleware/adminAuth';
import { validate }     from '../lib/validate';
import { encryptSecret } from '../lib/totpCrypto';

const router = Router();

const APP_NAME = 'ShopRay Admin';

const ConfirmSchema = z.object({
  secret: z.string().min(16, 'Secret fehlt.'),
  token:  z.string().length(6, 'TOTP-Code muss 6 Stellen haben.').regex(/^\d{6}$/, 'Nur Ziffern.'),
});

// GET /api/admin/mod-2fa/status — ist 2FA für diesen Mitarbeiter aktiv?
router.get('/status', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.adminUserId;
    if (!userId) { res.status(403).json({ error: 'Nur für Mitarbeiter.' }); return; }

    const { count } = await supabase
      .from('mod_totp')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.json({ enabled: (count ?? 0) > 0 });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/mod-2fa/setup — neues Secret + QR-Code generieren
router.get('/setup', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.adminUserId;
    if (!userId) { res.status(403).json({ error: 'Nur für Mitarbeiter.' }); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    const label      = profile?.email ?? userId;
    const secret     = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(label, APP_NAME, secret);
    const qrCode     = await QRCode.toDataURL(otpAuthUrl);

    res.json({ secret, qrCode, otpAuthUrl });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/mod-2fa/confirm — erstes OTP prüfen + Secret speichern
router.post('/confirm', requireAdmin, validate(ConfirmSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { secret: totpSecret, token } = req.body as z.infer<typeof ConfirmSchema>;
    const userId = req.adminUserId;
    if (!userId) { res.status(403).json({ error: 'Nur für Mitarbeiter.' }); return; }

    const isValid = authenticator.verify({ token, secret: totpSecret });
    if (!isValid) {
      res.status(400).json({ error: 'Ungültiger TOTP-Code.' });
      return;
    }

    // Vorhandenen Eintrag ersetzen (Re-Setup möglich)
    await supabase.from('mod_totp').delete().eq('user_id', userId);
    const { error } = await supabase.from('mod_totp').insert({ user_id: userId, secret: encryptSecret(totpSecret) });
    if (error) throw error;

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/mod-2fa — eigene 2FA deaktivieren
router.delete('/', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.adminUserId;
    if (!userId) { res.status(403).json({ error: 'Nur für Mitarbeiter.' }); return; }

    const { error } = await supabase.from('mod_totp').delete().eq('user_id', userId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;

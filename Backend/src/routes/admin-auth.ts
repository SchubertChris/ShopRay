import { z } from 'zod';
import { Router, Request, Response } from 'express';
import bcrypt    from 'bcrypt';
import jwt       from 'jsonwebtoken';
import { verifySync } from 'otplib';
import { authRateLimit }                from '../middleware/security';
import { requireAdmin, requireOwner }   from '../middleware/adminAuth';
import { supabase }                     from '../lib/supabase';
import { sendMail, adminLoginAlertHtml } from '../lib/mailer';
import { validate }                     from '../lib/validate';

// ── Schemas ───────────────────────────────────────────────────────────────────
const LoginSchema = z.object({
  password: z.string().min(1, 'Passwort fehlt.').max(200),
});

const TotpSchema = z.object({
  token: z.string().length(6, 'TOTP-Code muss 6 Stellen haben.').regex(/^\d{6}$/, 'Nur Ziffern.'),
});

const ModLoginSchema = z.object({
  email:    z.string().email('Ungültige E-Mail.'),
  password: z.string().min(1, 'Passwort fehlt.').max(200),
});

const AddModSchema = z.object({
  email: z.string().email('Ungültige E-Mail.'),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort fehlt.'),
  newPassword:     z.string().min(8, 'Mindestens 8 Zeichen.').max(200),
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const TOTP_PENDING_MAX_AGE = 5 * 60 * 1000; // 5 Minuten
const SESSION_MAX_AGE      = 24 * 60 * 60 * 1000; // 24 Stunden
const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS    = 15 * 60 * 1000; // 15 Minuten

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip ?? 'unbekannt';
}

function setAdminCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('adminSession', token, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge:   SESSION_MAX_AGE,
    path:     '/',
  });
}

// Liest Passwort-Hash: zuerst aus admin_config (DB), Fallback auf Env-Var
async function getPasswordHash(): Promise<string | null> {
  const { data } = await supabase
    .from('admin_config')
    .select('password_hash')
    .eq('id', 1)
    .single();
  return data?.password_hash ?? process.env.ADMIN_PASSWORD_HASH ?? null;
}

const router = Router();

// ── POST /api/admin/login ─────────────────────────────────────────────────────
router.post('/login', authRateLimit, validate(LoginSchema), async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body as z.infer<typeof LoginSchema>;
  const ip           = getClientIp(req);

  const hash = await getPasswordHash();
  if (!hash) {
    res.status(500).json({ error: 'Admin-Passwort nicht konfiguriert.' });
    return;
  }

  // IP-Lockout prüfen
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
    res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).json({ error: 'JWT_SECRET nicht konfiguriert.' }); return; }

  // 2FA prüfen
  const { count: totpCount } = await supabase
    .from('admin_totp')
    .select('*', { count: 'exact', head: true });

  if ((totpCount ?? 0) > 0) {
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

  const token = jwt.sign({ role: 'owner' }, secret, { expiresIn: '24h' });
  setAdminCookie(res, token);

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

  res.json({ ok: true, token });
});

// ── POST /api/admin/login/totp ────────────────────────────────────────────────
router.post('/login/totp', authRateLimit, validate(TotpSchema), async (req: Request, res: Response): Promise<void> => {
  const { token: totpCode } = req.body as z.infer<typeof TotpSchema>;
  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).json({ error: 'JWT_SECRET fehlt.' }); return; }

  const pendingRaw = (req.cookies as Record<string, string>)['totpPending'];
  if (!pendingRaw) { res.status(401).json({ error: 'Kein Pending-Token. Bitte zuerst Passwort eingeben.' }); return; }

  try {
    jwt.verify(pendingRaw, secret) as { totpPending: boolean };
  } catch {
    res.status(401).json({ error: 'Pending-Token abgelaufen. Bitte neu anmelden.' });
    return;
  }

  const { data: totpRow } = await supabase.from('admin_totp').select('secret').limit(1).single();
  if (!totpRow) { res.status(500).json({ error: '2FA nicht konfiguriert.' }); return; }

  const { valid: isValid } = verifySync({ token: totpCode, secret: totpRow.secret });
  if (!isValid) { res.status(401).json({ error: 'Ungültiger TOTP-Code.' }); return; }

  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('totpPending', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/' });

  const sessionToken = jwt.sign({ role: 'owner' }, secret, { expiresIn: '24h' });
  setAdminCookie(res, sessionToken);

  const ip        = getClientIp(req);
  const userAgent = (req.headers['user-agent'] ?? '').slice(0, 500);
  void supabase.from('admin_login_log').insert({ ip_address: ip, user_agent: userAgent, success: true });

  res.json({ ok: true, token: sessionToken });
});

// ── POST /api/admin/login/mod ─────────────────────────────────────────────────
router.post('/login/mod', authRateLimit, validate(ModLoginSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as z.infer<typeof ModLoginSchema>;
  const ip = getClientIp(req);

  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).json({ error: 'JWT_SECRET fehlt.' }); return; }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError || !authData.user) {
    void supabase.from('admin_login_log').insert({
      ip_address: ip,
      user_agent: (req.headers['user-agent'] ?? '').slice(0, 500),
      success: false,
    });
    res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    return;
  }

  // Ausstehende Einladung prüfen → Rolle setzen
  const { data: pendingInvite } = await supabase
    .from('pending_mod_invites')
    .select('id')
    .eq('email', authData.user.email!)
    .single();

  if (pendingInvite) {
    await supabase.from('profiles').upsert(
      { id: authData.user.id, email: authData.user.email!, role: 'mod' },
      { onConflict: 'id' },
    );
    await supabase.from('pending_mod_invites').delete().eq('id', pendingInvite.id);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (profile?.role !== 'mod') {
    res.status(403).json({ error: 'Kein Mitarbeiter-Zugriff.' });
    return;
  }

  const token = jwt.sign({ role: 'mod', userId: authData.user.id }, secret, { expiresIn: '24h' });
  setAdminCookie(res, token);

  void supabase.from('admin_login_log').insert({
    ip_address: ip,
    user_agent: (req.headers['user-agent'] ?? '').slice(0, 500),
    success: true,
  });

  res.json({ ok: true, token, role: 'mod' });
});

// ── POST /api/admin/logout ────────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response): void => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('adminSession', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/' });
  res.json({ ok: true });
});

// ── GET /api/admin/check ──────────────────────────────────────────────────────
router.get('/check', requireAdmin, (req: Request, res: Response): void => {
  res.json({ ok: true, role: req.adminRole ?? 'owner' });
});

// ── GET /api/admin/login-log ──────────────────────────────────────────────────
router.get('/login-log', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('admin_login_log')
      .select('id, created_at, ip_address, user_agent, success')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error('[login-log] Supabase-Fehler:', err);
    res.status(500).json({ error: 'Protokoll konnte nicht geladen werden.' });
  }
});

// ── PUT /api/admin/password — Owner-Passwort ändern ──────────────────────────
router.put('/password', requireOwner, validate(ChangePasswordSchema), async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body as z.infer<typeof ChangePasswordSchema>;

  const currentHash = await getPasswordHash();
  if (!currentHash) {
    res.status(500).json({ error: 'Kein Passwort konfiguriert.' });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, currentHash);
  if (!valid) {
    res.status(401).json({ error: 'Aktuelles Passwort ist falsch.' });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  const { error } = await supabase
    .from('admin_config')
    .upsert({ id: 1, password_hash: newHash, updated_at: new Date().toISOString() });

  if (error) { res.status(500).json({ error: 'Passwort konnte nicht gespeichert werden.' }); return; }
  res.json({ ok: true });
});

// ── GET /api/admin/mods — aktive Mods + ausstehende Einladungen ───────────────
router.get('/mods', requireOwner, async (_req: Request, res: Response): Promise<void> => {
  const [modsRes, pendingRes] = await Promise.all([
    supabase.from('profiles').select('id, email, created_at').eq('role', 'mod').order('created_at', { ascending: false }),
    supabase.from('pending_mod_invites').select('id, email, invited_at').order('invited_at', { ascending: false }),
  ]);

  if (modsRes.error || pendingRes.error) {
    res.status(500).json({ error: 'Laden fehlgeschlagen.' });
    return;
  }

  res.json({ active: modsRes.data ?? [], pending: pendingRes.data ?? [] });
});

// ── POST /api/admin/mods — Mitarbeiter hinzufügen oder einladen ───────────────
router.post('/mods', requireOwner, validate(AddModSchema), async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as z.infer<typeof AddModSchema>;

  // Existierenden User prüfen
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('email', email)
    .single();

  if (profile?.role === 'owner' || profile?.role === 'admin') {
    res.status(400).json({ error: 'Dieser Nutzer ist bereits Inhaber/Admin.' });
    return;
  }

  if (profile?.role === 'mod') {
    res.status(400).json({ error: 'Dieser Nutzer ist bereits Mitarbeiter.' });
    return;
  }

  // Bereits ausstehende Einladung?
  const { data: existingInvite } = await supabase
    .from('pending_mod_invites')
    .select('id')
    .eq('email', email)
    .single();

  if (existingInvite) {
    res.status(400).json({ error: 'Einladung wurde bereits gesendet.' });
    return;
  }

  if (profile) {
    // Account existiert → Rolle direkt setzen
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'mod' })
      .eq('id', profile.id);

    if (updateError) { res.status(500).json({ error: 'Rolle konnte nicht gesetzt werden.' }); return; }
    res.json({ ok: true, invited: false, id: profile.id, email });
    return;
  }

  // Kein Account → Supabase-Einladung senden
  const frontendUrl = process.env.FRONTEND_URL ?? 'https://shopray-indol.vercel.app';
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${frontendUrl}/account/settings`,
  });

  if (inviteError) {
    console.error('[mods invite]', inviteError);
    res.status(500).json({ error: 'Einladung konnte nicht gesendet werden.' });
    return;
  }

  await supabase.from('pending_mod_invites').insert({ email });
  res.json({ ok: true, invited: true, email });
});

// ── DELETE /api/admin/mods/invite/:id — Ausstehende Einladung zurückziehen ────
router.delete('/mods/invite/:id', requireOwner, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: invite } = await supabase
    .from('pending_mod_invites')
    .select('email')
    .eq('id', id)
    .single();

  if (!invite) {
    res.status(404).json({ error: 'Einladung nicht gefunden.' });
    return;
  }

  // Supabase-User auch löschen (falls schon angelegt aber noch kein Passwort)
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users?.find(u => u.email === invite.email && !u.last_sign_in_at);
  if (authUser) {
    await supabase.auth.admin.deleteUser(authUser.id);
  }

  await supabase.from('pending_mod_invites').delete().eq('id', id);
  res.json({ ok: true });
});

// ── DELETE /api/admin/mods/:id — Mitarbeiter-Rolle entziehen ─────────────────
router.delete('/mods/:id', requireOwner, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', id)
    .single();

  if (profile?.role !== 'mod') {
    res.status(400).json({ error: 'Dieser Nutzer ist kein Mitarbeiter.' });
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', id);

  if (error) { res.status(500).json({ error: 'Entfernen fehlgeschlagen.' }); return; }
  res.json({ ok: true });
});

export default router;

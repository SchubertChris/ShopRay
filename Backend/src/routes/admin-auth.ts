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

const StrongPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Mindestens 8 Zeichen.')
    .max(200)
    .regex(/[A-Z]/, 'Mindestens ein Großbuchstabe (A–Z).')
    .regex(/[a-z]/, 'Mindestens ein Kleinbuchstabe (a–z).')
    .regex(/[0-9]/, 'Mindestens eine Zahl (0–9).')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Mindestens ein Sonderzeichen.'),
  name: z.string().trim().min(2, 'Name muss mindestens 2 Zeichen haben.').max(80),
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const TOTP_PENDING_MAX_AGE = 5 * 60 * 1000; // 5 Minuten
const SESSION_MAX_AGE      = 8 * 60 * 60 * 1000;  // 8 Stunden
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

function generateTempPassword(): string {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const digits  = '0123456789';
  const special = '!@#$%&*';
  const all     = upper + lower + digits + special;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(special)];
  const rest = Array.from({ length: 8 }, () => pick(all));
  return [...required, ...rest].sort(() => Math.random() - 0.5).join('');
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
    supabase.from('admin_login_log').insert({
      ip_address: ip,
      user_agent: (req.headers['user-agent'] ?? '').slice(0, 500),
      success: false,
    }).then(({ error: e }) => { if (e) console.error('[login-log] insert failed:', e.message); });
    res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).json({ error: 'JWT_SECRET nicht konfiguriert.' }); return; }

  // 2FA prüfen
  const { count: totpCount } = await supabase
    .from('admin_totp')
    .select('*', { count: 'exact', head: true });

  if ((totpCount ?? 0) === 0) {
    // Kein 2FA eingerichtet → Setup erzwingen (kurzzeitiger Token nur für /2fa/setup + /2fa/confirm)
    const setupToken = jwt.sign({ mustSetup2FA: true }, secret, { expiresIn: '15m' });
    res.json({ ok: true, requireSetup2FA: true, setupToken });
    return;
  }

  const pendingToken = jwt.sign({ totpPending: true }, secret, { expiresIn: '5m' });
  res.json({ ok: true, requireTotp: true, pendingToken });
});

// ── POST /api/admin/login/totp ────────────────────────────────────────────────
router.post('/login/totp', authRateLimit, validate(TotpSchema), async (req: Request, res: Response): Promise<void> => {
  const { token: totpCode } = req.body as z.infer<typeof TotpSchema>;
  const secret = process.env.JWT_SECRET;
  if (!secret) { res.status(500).json({ error: 'JWT_SECRET fehlt.' }); return; }

  const authHeader  = req.headers['authorization'];
  const pendingRaw  = authHeader?.startsWith('Bearer ') ? authHeader.slice(7)
    : (req.cookies as Record<string, string | undefined>)['totpPending'];
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

  const sessionToken = jwt.sign({ role: 'owner' }, secret, { expiresIn: '8h' });

  const ip        = getClientIp(req);
  const userAgent = (req.headers['user-agent'] ?? '').slice(0, 500);
  const date      = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  supabase.from('admin_login_log').insert({ ip_address: ip, user_agent: userAgent, success: true })
    .then(({ error: e }) => { if (e) console.error('[login-log] insert failed:', e.message); });

  const ownerEmail = process.env.SMTP_FROM_EMAIL;
  const adminUrl   = process.env.ADMIN_URL ?? 'https://shopray-admin.vercel.app';
  if (ownerEmail) {
    void sendMail({
      to:      ownerEmail,
      subject: `⚠️ Admin-Login bei ShopRay — ${date}`,
      html:    adminLoginAlertHtml({ ip, userAgent, date, adminUrl }),
    }).catch(() => null);
  }

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
    supabase.from('admin_login_log').insert({
      ip_address: ip,
      user_agent: (req.headers['user-agent'] ?? '').slice(0, 500),
      success: false,
    }).then(({ error: e }) => { if (e) console.error('[login-log] insert failed:', e.message); });
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
    .select('role, must_change_password')
    .eq('id', authData.user.id)
    .single();

  if (profile?.role !== 'mod') {
    res.status(403).json({ error: 'Kein Mitarbeiter-Zugriff.' });
    return;
  }

  const token = jwt.sign({ role: 'mod', userId: authData.user.id }, secret, { expiresIn: '8h' });

  supabase.from('admin_login_log').insert({
    ip_address: ip,
    user_agent: (req.headers['user-agent'] ?? '').slice(0, 500),
    success: true,
  }).then(({ error: e }) => { if (e) console.error('[login-log] insert failed:', e.message); });

  res.json({ ok: true, token, role: 'mod', mustChangePassword: profile?.must_change_password ?? false });
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
router.get('/login-log', requireOwner, async (_req: Request, res: Response): Promise<void> => {
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
    supabase.from('profiles').select('id, email, created_at, must_change_password').eq('role', 'mod').order('created_at', { ascending: false }),
    supabase.from('pending_mod_invites').select('id, email, invited_at').order('invited_at', { ascending: false }),
  ]);

  if (modsRes.error) {
    console.error('[GET /mods] profiles-Fehler:', modsRes.error);
    res.status(500).json({ error: 'Laden fehlgeschlagen.' });
    return;
  }

  if (pendingRes.error) {
    console.error('[GET /mods] pending_mod_invites-Fehler (Migration 017 nötig?):', pendingRes.error);
  }

  const inviteMap  = new Map((pendingRes.data ?? []).map(p => [p.email, p]));
  const allMods    = modsRes.data ?? [];

  // Wahrheitsquelle: must_change_password (nicht pending_mod_invites-Präsenz)
  const activeMods  = allMods
    .filter(m => !m.must_change_password)
    .map(m => ({ id: m.id, email: m.email, created_at: m.created_at }));

  const pendingMods = allMods
    .filter(m => m.must_change_password)
    .map(m => {
      const invite = inviteMap.get(m.email ?? '');
      return { id: invite?.id ?? m.id, email: m.email ?? '', invited_at: invite?.invited_at ?? m.created_at };
    });

  // Veraltete pending_mod_invites-Einträge für bereits-aktive Mods bereinigen
  const staleEmails = activeMods.map(m => m.email).filter(e => inviteMap.has(e ?? ''));
  if (staleEmails.length > 0) {
    void supabase.from('pending_mod_invites').delete().in('email', staleEmails);
  }

  res.json({ active: activeMods, pending: pendingMods });
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
    // Account existiert → Rolle setzen + neues Startpasswort generieren
    const tempPassword = generateTempPassword();

    const { error: pwError } = await supabase.auth.admin.updateUserById(profile.id, {
      password: tempPassword,
    });
    if (pwError) { res.status(500).json({ error: 'Passwort konnte nicht zurückgesetzt werden.' }); return; }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'mod', must_change_password: true })
      .eq('id', profile.id);
    if (updateError) { res.status(500).json({ error: 'Rolle konnte nicht gesetzt werden.' }); return; }

    await supabase.from('pending_mod_invites').insert({ email });
    res.json({ ok: true, invited: true, tempPassword, id: profile.id, email });
    return;
  }

  // Kein Account → direkt anlegen mit generiertem Startpasswort
  const tempPassword = generateTempPassword();
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password:      tempPassword,
    email_confirm: true,
  });

  if (createError || !newUser.user) {
    console.error('[mods create]', createError);
    res.status(500).json({ error: 'Konto konnte nicht angelegt werden.' });
    return;
  }

  await supabase.from('profiles').upsert(
    { id: newUser.user.id, email, role: 'mod', must_change_password: true },
    { onConflict: 'id' },
  );

  await supabase.from('pending_mod_invites').insert({ email });
  res.json({ ok: true, invited: true, tempPassword, email });
});

// ── PUT /api/admin/mods/change-password — Startpasswort ändern (Pflicht beim ersten Login) ──
router.put('/mods/change-password', requireAdmin, validate(StrongPasswordSchema), async (req: Request, res: Response): Promise<void> => {
  const { newPassword, name } = req.body as z.infer<typeof StrongPasswordSchema>;
  const userId = req.adminUserId;

  if (!userId) {
    res.status(403).json({ error: 'Nur für Mitarbeiter verfügbar.' });
    return;
  }

  const { error: pwError } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
  if (pwError) {
    res.status(500).json({ error: 'Passwort konnte nicht gesetzt werden.' });
    return;
  }

  // Flag löschen, Name setzen + aus Pending-Liste entfernen
  const [profileRes, profileData] = await Promise.all([
    supabase.from('profiles').update({ must_change_password: false, name }).eq('id', userId),
    supabase.from('profiles').select('email').eq('id', userId).single(),
  ]);

  if (profileData.data?.email) {
    await supabase.from('pending_mod_invites').delete().eq('email', profileData.data.email);
  }

  if (profileRes.error) {
    res.status(500).json({ error: 'Status konnte nicht aktualisiert werden.' });
    return;
  }

  res.json({ ok: true });
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

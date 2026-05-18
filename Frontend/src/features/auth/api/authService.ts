import { supabase } from '@/lib/supabase';
import type { LoginPayload, RegisterPayload, AuthResponse } from '../types/auth';
import type { UserProfile, UserRole } from '@/types/user';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ─── MFA ERROR ──────────────────────────────────────────────────────────────
/** Wird von login() geworfen, wenn 2FA erforderlich ist */
export class MfaRequiredError extends Error {
  readonly factorId:    string;
  readonly challengeId: string;

  constructor(factorId: string, challengeId: string) {
    super('MFA_REQUIRED');
    this.name        = 'MfaRequiredError';
    this.factorId    = factorId;
    this.challengeId = challengeId;
  }
}

// ─── HELPER ─────────────────────────────────────────────────────────────────
async function buildAuthResponse(user: SupabaseUser, token: string): Promise<AuthResponse> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  const parts = (profile?.name ?? '').trim().split(/\s+/);
  return {
    user: {
      id:        user.id,
      email:     user.email!,
      firstName: parts[0] ?? '',
      lastName:  parts.slice(1).join(' '),
      role:      (profile?.role as UserRole) ?? 'customer',
      createdAt: user.created_at,
    },
    token,
  };
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email:    payload.email,
    password: payload.password,
  });
  if (error) throw error;

  // MFA prüfen: ist AAL2 erforderlich?
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
    const { data: factorsData }            = await supabase.auth.mfa.listFactors();
    const factor                           = factorsData?.totp?.[0];
    if (!factor) throw new Error('MFA-Faktor nicht gefunden');
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (cErr || !challenge) throw cErr ?? new Error('Challenge fehlgeschlagen');
    throw new MfaRequiredError(factor.id, challenge.id);
  }

  if (!data.session) throw new Error('Login fehlgeschlagen');
  return buildAuthResponse(data.user, data.session.access_token);
}

/** Zweiter Login-Schritt: 6-stelligen TOTP-Code verifizieren */
export async function completeMfaLogin(
  factorId:    string,
  challengeId: string,
  code:        string,
): Promise<AuthResponse> {
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
  if (error) throw error;

  const { data: { session }, error: sErr } = await supabase.auth.getSession();
  if (sErr || !session) throw sErr ?? new Error('Session nicht gefunden');
  return buildAuthResponse(session.user, session.access_token);
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email:    payload.email,
    password: payload.password,
    options:  { data: { name: `${payload.firstName} ${payload.lastName}`.trim() } },
  });
  if (error) throw error;
  if (!data.session) throw new Error('Bitte bestätige deine E-Mail-Adresse um fortzufahren.');

  return {
    user: {
      id:        data.user!.id,
      email:     data.user!.email!,
      firstName: payload.firstName,
      lastName:  payload.lastName,
      role:      'customer',
      createdAt: data.user!.created_at,
    },
    token: data.session.access_token,
  };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getMe(): Promise<UserProfile> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw error ?? new Error('Nicht eingeloggt');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, phone, address_street, address_zip, address_city, address_country')
    .eq('id', user.id)
    .single();

  const parts = (profile?.name ?? '').trim().split(/\s+/);
  return {
    id:        user.id,
    email:     user.email!,
    firstName: parts[0] ?? '',
    lastName:  parts.slice(1).join(' '),
    role:      (profile?.role as UserRole) ?? 'customer',
    createdAt: user.created_at,
    phone:     profile?.phone ?? null,
    avatarUrl: null,
    orderCount: 0,
    totalSpent: 0,
    address: profile?.address_street ? {
      firstName: parts[0] ?? '',
      lastName:  parts.slice(1).join(' '),
      street:    profile.address_street,
      zip:       profile.address_zip ?? '',
      city:      profile.address_city ?? '',
      country:   profile.address_country ?? 'Deutschland',
    } : null,
  };
}

// ─── MFA MANAGEMENT ─────────────────────────────────────────────────────────
/** Prüft ob der User einen aktiven (verified) TOTP-Faktor hat */
export async function getMfaStatus(): Promise<boolean> {
  const { data } = await supabase.auth.mfa.listFactors();
  return !!(data?.totp?.find(f => f.status === 'verified'));
}

/** Startet TOTP-Enrollment — gibt QR-Code (data-URL) und Secret zurück */
export async function enrollTotp(): Promise<{ factorId: string; qrCode: string; secret: string }> {
  // Halbfertige (unverifizierte) Faktoren aus abgebrochenen Setups bereinigen
  const { data: existing } = await supabase.auth.mfa.listFactors();
  const unverified = existing?.totp?.filter(f => (f.status as string) === 'unverified') ?? [];
  for (const f of unverified) {
    await supabase.auth.mfa.unenroll({ factorId: f.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
  if (error || !data) throw error ?? new Error('Enrollment fehlgeschlagen');
  return {
    factorId: data.id,
    qrCode:   data.totp.qr_code,
    secret:   data.totp.secret,
  };
}

/** Bestätigt Enrollment mit dem 6-stelligen Code aus der Authenticator-App */
export async function confirmEnrollTotp(factorId: string, code: string): Promise<void> {
  const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
  if (cErr || !challenge) throw cErr ?? new Error('Challenge fehlgeschlagen');
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (error) throw error;
}

/** Deaktiviert 2FA — verifiziert Code zuerst (AAL2 erforderlich), dann unenroll */
export async function disableTotp(code: string): Promise<void> {
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const factor = factorsData?.totp?.find(f => f.status === 'verified');
  if (!factor) throw new Error('Kein aktiver 2FA-Faktor gefunden');

  const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: factor.id });
  if (cErr || !challenge) throw cErr ?? new Error('Challenge fehlgeschlagen');

  const { error: vErr } = await supabase.auth.mfa.verify({
    factorId:    factor.id,
    challengeId: challenge.id,
    code,
  });
  if (vErr) throw vErr;

  const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
  if (error) throw error;
}

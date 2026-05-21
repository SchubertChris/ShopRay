import { create } from 'zustand';
import {
  adminLogin, adminLogout, adminCheck, loginTotp, modLogin, changeModPassword,
  setAdminToken, clearAdminToken, setSetupToken, clearSetupToken,
  get2faSetupForced, confirm2faForced,
} from '../api/adminApi';

export type AdminRole = 'owner' | 'team_lead' | 'mod';

interface AuthState {
  isAuthed:           boolean;
  checking:           boolean;
  requireTotp:        boolean;
  requireSetup2FA:    boolean;
  mustChangePassword: boolean;
  role:               AdminRole | null;
  login:                    (password: string) => Promise<void>;
  loginMod:                 (email: string, password: string) => Promise<void>;
  submitNewModPassword:     (newPassword: string, name: string) => Promise<void>;
  verifyTotp:               (token: string) => Promise<void>;
  setupForcedTwoFactor:     () => Promise<{ secret: string; qrCode: string; otpAuthUrl: string }>;
  confirmForcedTwoFactor:   (secret: string, totpCode: string) => Promise<void>;
  logout:                   () => Promise<void>;
  checkAuth:                () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthed:           false,
  checking:           true,
  requireTotp:        false,
  requireSetup2FA:    false,
  mustChangePassword: false,
  role:               null,

  login: async (password: string) => {
    const result = await adminLogin(password);
    if (result.requireSetup2FA) {
      if (result.setupToken) setSetupToken(result.setupToken);
      set({ requireSetup2FA: true });
    } else if (result.requireTotp) {
      if (result.pendingToken) setAdminToken(result.pendingToken);
      set({ requireTotp: true });
    } else {
      if (result.token) setAdminToken(result.token);
      set({ isAuthed: true, requireTotp: false, role: 'owner' });
    }
  },

  loginMod: async (email: string, password: string) => {
    const result = await modLogin(email, password);
    if (result.token) setAdminToken(result.token);
    const role = (result.role as AdminRole) ?? 'mod';
    if (result.mustChangePassword) {
      set({ isAuthed: false, mustChangePassword: true, role });
    } else {
      set({ isAuthed: true, mustChangePassword: false, role });
    }
  },

  submitNewModPassword: async (newPassword: string, name: string) => {
    await changeModPassword(newPassword, name);
    set({ isAuthed: true, mustChangePassword: false });
  },

  verifyTotp: async (token: string) => {
    const result = await loginTotp(token) as { ok: boolean; token?: string };
    if (result.token) setAdminToken(result.token);
    set({ isAuthed: true, requireTotp: false, role: 'owner' });
  },

  setupForcedTwoFactor: async () => {
    return get2faSetupForced();
  },

  confirmForcedTwoFactor: async (secret: string, totpCode: string) => {
    const result = await confirm2faForced(secret, totpCode);
    if (!result.token) throw new Error('Kein Session-Token erhalten.');
    setAdminToken(result.token);
    clearSetupToken();
    set({ isAuthed: true, requireSetup2FA: false, role: 'owner' });
  },

  logout: async () => {
    await adminLogout().catch(() => null);
    clearAdminToken();
    clearSetupToken();
    set({ isAuthed: false, requireTotp: false, requireSetup2FA: false, role: null });
  },

  checkAuth: async () => {
    set({ checking: true });
    try {
      const result = await adminCheck() as { ok: boolean; role?: AdminRole };
      set({ isAuthed: true, role: result.role ?? 'owner' });
    } catch {
      set({ isAuthed: false, role: null });
    } finally {
      set({ checking: false });
    }
  },
}));

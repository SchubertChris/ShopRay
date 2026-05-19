import { create } from 'zustand';
import { adminLogin, adminLogout, adminCheck, loginTotp, modLogin, changeModPassword, setAdminToken, clearAdminToken } from '../api/adminApi';

export type AdminRole = 'owner' | 'mod';

interface AuthState {
  isAuthed:           boolean;
  checking:           boolean;
  requireTotp:        boolean;
  mustChangePassword: boolean;
  role:               AdminRole | null;
  login:                    (password: string) => Promise<void>;
  loginMod:                 (email: string, password: string) => Promise<void>;
  submitNewModPassword:     (newPassword: string, name: string) => Promise<void>;
  verifyTotp:               (token: string) => Promise<void>;
  logout:                   () => Promise<void>;
  checkAuth:                () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthed:           false,
  checking:           true,
  requireTotp:        false,
  mustChangePassword: false,
  role:               null,

  login: async (password: string) => {
    const result = await adminLogin(password);
    if (result.requireTotp) {
      // Pending-Token temporär speichern — wird als Bearer an /login/totp gesendet
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
    if (result.mustChangePassword) {
      // Token speichern, aber noch nicht als vollständig authentifiziert markieren
      set({ isAuthed: false, mustChangePassword: true, role: 'mod' });
    } else {
      set({ isAuthed: true, mustChangePassword: false, role: 'mod' });
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

  logout: async () => {
    await adminLogout().catch(() => null);
    clearAdminToken();
    set({ isAuthed: false, requireTotp: false, role: null });
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

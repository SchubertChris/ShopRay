import { create } from 'zustand';
import { adminLogin, adminLogout, adminCheck, loginTotp, modLogin, setAdminToken, clearAdminToken } from '../api/adminApi';

export type AdminRole = 'owner' | 'mod';

interface AuthState {
  isAuthed:    boolean;
  checking:    boolean;
  requireTotp: boolean;
  role:        AdminRole | null;
  login:       (password: string) => Promise<void>;
  loginMod:    (email: string, password: string) => Promise<void>;
  verifyTotp:  (token: string) => Promise<void>;
  logout:      () => Promise<void>;
  checkAuth:   () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthed:    false,
  checking:    true,
  requireTotp: false,
  role:        null,

  login: async (password: string) => {
    const result = await adminLogin(password);
    if (result.token) setAdminToken(result.token);
    if (result.requireTotp) {
      set({ requireTotp: true });
    } else {
      set({ isAuthed: true, requireTotp: false, role: 'owner' });
    }
  },

  loginMod: async (email: string, password: string) => {
    const result = await modLogin(email, password);
    if (result.token) setAdminToken(result.token);
    set({ isAuthed: true, role: 'mod' });
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

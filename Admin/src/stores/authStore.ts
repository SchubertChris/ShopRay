import { create } from 'zustand';
import { adminLogin, adminLogout, adminCheck, loginTotp } from '../api/adminApi';

interface AuthState {
  isAuthed:    boolean;
  checking:    boolean;
  requireTotp: boolean;
  login:       (password: string) => Promise<void>;
  verifyTotp:  (token: string) => Promise<void>;
  logout:      () => Promise<void>;
  checkAuth:   () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthed:    false,
  checking:    true,
  requireTotp: false,

  login: async (password: string) => {
    const result = await adminLogin(password) as { ok: boolean; requireTotp?: boolean };
    if (result.requireTotp) {
      set({ requireTotp: true });
    } else {
      set({ isAuthed: true, requireTotp: false });
    }
  },

  verifyTotp: async (token: string) => {
    await loginTotp(token);
    set({ isAuthed: true, requireTotp: false });
  },

  logout: async () => {
    await adminLogout().catch(() => null);
    set({ isAuthed: false, requireTotp: false });
  },

  checkAuth: async () => {
    set({ checking: true });
    try {
      await adminCheck();
      set({ isAuthed: true });
    } catch {
      set({ isAuthed: false });
    } finally {
      set({ checking: false });
    }
  },
}));

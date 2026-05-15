import { create } from 'zustand';
import { adminLogin, adminLogout, adminCheck } from '../api/adminApi';

interface AuthState {
  isAuthed:  boolean;
  checking:  boolean;
  login:     (password: string) => Promise<void>;
  logout:    () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthed: false,
  checking: true,

  login: async (password: string) => {
    await adminLogin(password);
    set({ isAuthed: true });
  },

  logout: async () => {
    await adminLogout().catch(() => null);
    set({ isAuthed: false });
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

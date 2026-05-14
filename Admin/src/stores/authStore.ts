import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '../types';

interface AuthState {
  user:     AdminUser | null;
  isAuthed: boolean;
  login:    (email: string, password: string) => Promise<void>;
  logout:   () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:     null,
      isAuthed: false,

      login: async (email, password) => {
        // Platzhalter — wird durch Supabase Auth ersetzt
        if (email === 'admin@shop.de' && password === 'admin123') {
          set({
            isAuthed: true,
            user: { id: '1', email, name: 'Admin', role: 'admin' },
          });
        } else {
          throw new Error('Ungültige Zugangsdaten');
        }
      },

      logout: () => set({ user: null, isAuthed: false }),
    }),
    { name: 'admin-auth' },
  ),
);

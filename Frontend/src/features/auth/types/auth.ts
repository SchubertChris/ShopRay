import type { User } from '@/types/user';

/** Payload an POST /auth/login */
export interface LoginPayload {
  email:    string;
  password: string;
}

/** Payload an POST /auth/register */
export interface RegisterPayload {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
}

/** Backend-Antwort auf Login/Register */
export interface AuthResponse {
  user:  User;
  token: string;
}

/** Zustand-Store-Shape für Auth */
export interface AuthState {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  setAuth:         (user: User, token: string) => void;
  clearAuth:       () => void;
}

import api from '@/api/axiosinstance';
import type { ApiResponse } from '@/types/api';
import type { LoginPayload, RegisterPayload, AuthResponse } from '../types/auth';
import type { UserProfile } from '@/types/user';

// Demo-Konto für Template-Präsentation — wird entfernt sobald Backend angebunden ist
const DEMO_CREDENTIALS = { password: 'start12345' };
const DEMO_RESPONSE: AuthResponse = {
  user: {
    id:        'demo-001',
    email:     'chris@concepts.de',
    firstName: 'Chris',
    lastName:  'Concepts',
    role:      'customer',
    createdAt: '2026-01-01',
  },
  token: 'demo-token-concepts',
};

/** POST /auth/login */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  if (payload.password === DEMO_CREDENTIALS.password) return DEMO_RESPONSE;
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  return data.data;
}

/** POST /auth/register */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', payload);
  return data.data;
}

/** POST /auth/logout */
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/** GET /auth/me — aktuellen User abrufen */
export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get<ApiResponse<UserProfile>>('/auth/me');
  return data.data;
}

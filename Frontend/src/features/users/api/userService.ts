import api from '@/api/axiosinstance';
import type { ApiResponse } from '@/types/api';
import type { User, UserProfile, Address } from '@/types/user';

/** GET /users/me/profile — Erweitertes Profil laden */
export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<ApiResponse<UserProfile>>('/users/me/profile');
  return data.data;
}

/** PUT /users/me — Basisinfos aktualisieren */
export async function updateUser(payload: Partial<Pick<User, 'firstName' | 'lastName'>>): Promise<User> {
  const { data } = await api.put<ApiResponse<User>>('/users/me', payload);
  return data.data;
}

/** PUT /users/me/address — Lieferadresse speichern */
export async function updateAddress(address: Address): Promise<Address> {
  const { data } = await api.put<ApiResponse<Address>>('/users/me/address', address);
  return data.data;
}

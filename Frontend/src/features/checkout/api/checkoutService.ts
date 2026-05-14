import api from '@/api/axiosinstance';
import type { ApiResponse } from '@/types/api';
import type { CheckoutPayload, CheckoutResponse } from '@/types/checkout';

/** POST /orders — Bestellung aufgeben */
export async function createOrder(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const { data } = await api.post<ApiResponse<CheckoutResponse>>('/orders', payload);
  return data.data;
}

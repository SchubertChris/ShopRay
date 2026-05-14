import api from '@/api/axiosinstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Order } from '@/types/order';

/** GET /orders — Bestellungen des eingeloggten Users */
export async function getOrders(page = 1, limit = 20): Promise<PaginatedResponse<Order>> {
  const { data } = await api.get<PaginatedResponse<Order>>('/orders', { params: { page, limit } });
  return data;
}

/** GET /orders/:id */
export async function getOrderById(id: string): Promise<Order> {
  const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`);
  return data.data;
}

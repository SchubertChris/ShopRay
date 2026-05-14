import api from '@/api/axiosinstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Ticket, TicketPayload } from '../types/ticket.types';

/** GET /tickets — Tickets des eingeloggten Users */
export async function getTickets(page = 1, limit = 20): Promise<PaginatedResponse<Ticket>> {
  const { data } = await api.get<PaginatedResponse<Ticket>>('/tickets', { params: { page, limit } });
  return data;
}

/** GET /tickets/:id */
export async function getTicketById(id: string): Promise<Ticket> {
  const { data } = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
  return data.data;
}

/** POST /tickets — Neues Ticket erstellen */
export async function createTicket(payload: TicketPayload): Promise<Ticket> {
  const { data } = await api.post<ApiResponse<Ticket>>('/tickets', payload);
  return data.data;
}

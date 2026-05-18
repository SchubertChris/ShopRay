import { supabase } from '@/lib/supabase';
import api from '@/api/axiosinstance';
import type { PaginatedResponse } from '@/types/api';
import type { Ticket, TicketCategory, TicketStatus, TicketPriority, TicketPayload, TicketMessage } from '../types/ticket.types';

// Frontend-Kategorie → DB-Kategorie
const CATEGORY_TO_DB: Record<string, string> = {
  'Bestellung & Lieferung':  'order',
  'Rückgabe & Reklamation': 'order',
  'Zahlung & Rechnung':      'payment',
  'Produkt & Qualität':      'product',
  'Konto & Datenschutz':     'other',
  'Sonstiges':               'other',
};

// DB-Kategorie → Frontend-Kategorie
const CATEGORY_FROM_DB: Record<string, TicketCategory> = {
  order:   'Bestellung & Lieferung',
  payment: 'Zahlung & Rechnung',
  product: 'Produkt & Qualität',
  other:   'Sonstiges',
};

// DB-Status → Frontend-Status
const STATUS_FROM_DB: Record<string, TicketStatus> = {
  open:        'open',
  in_progress: 'in-progress',
  closed:      'closed',
};

function mapMessage(raw: Record<string, unknown>): TicketMessage {
  return {
    id:        String(raw.id ?? ''),
    ticketId:  String(raw.ticket_id ?? ''),
    sender:    (['customer', 'admin'] as const).includes(raw.sender as 'customer' | 'admin')
      ? (raw.sender as 'customer' | 'admin')
      : 'customer',
    text:      String(raw.text ?? ''),
    createdAt: String(raw.created_at ?? ''),
  };
}

function mapTicket(raw: Record<string, unknown>): Ticket {
  return {
    id:          String(raw.id ?? ''),
    subject:     String(raw.subject ?? ''),
    category:    CATEGORY_FROM_DB[String(raw.category)] ?? 'Sonstiges',
    priority:    (['normal', 'high', 'urgent'] as const).includes(raw.priority as TicketPriority)
      ? (raw.priority as TicketPriority)
      : 'normal',
    status:      STATUS_FROM_DB[String(raw.status)] ?? 'open',
    description: String(raw.message ?? ''),
    createdAt:   String(raw.created_at ?? ''),
    updatedAt:   String(raw.updated_at ?? ''),
  };
}

export async function getTickets(page = 1, limit = 20): Promise<PaginatedResponse<Ticket>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], meta: { total: 0, page, limit, totalPages: 0 }, message: 'ok', success: true };

  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw error;

  const total = count ?? 0;
  return {
    data:    (data as Record<string, unknown>[]).map(mapTicket),
    meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
    message: 'ok',
    success: true,
  };
}

export async function getTicketById(id: string): Promise<Ticket> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht eingeloggt');

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (error) throw error;
  return mapTicket(data as Record<string, unknown>);
}

export async function createTicket(payload: TicketPayload & { guestEmail?: string }): Promise<Ticket> {
  // Backend-Route: optionalAuth — funktioniert für Gäste UND eingeloggte Nutzer
  const { data } = await api.post('/tickets', {
    subject:     payload.subject,
    category:    payload.category,
    description: payload.description,
    priority:    payload.priority,
    ...(payload.guestEmail ? { guestEmail: payload.guestEmail } : {}),
  });
  return mapTicket(data as Record<string, unknown>);
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data, error } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapMessage);
}

export async function sendTicketMessage(ticketId: string, text: string): Promise<TicketMessage> {
  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({ ticket_id: ticketId, sender: 'customer', text: text.trim() })
    .select('*')
    .single();
  if (error) throw error;
  return mapMessage(data as Record<string, unknown>);
}

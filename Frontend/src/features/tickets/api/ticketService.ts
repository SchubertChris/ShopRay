import { supabase } from '@/lib/supabase';
import type { PaginatedResponse } from '@/types/api';
import type { Ticket, TicketCategory, TicketStatus, TicketPayload } from '../types/ticket.types';

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

function mapTicket(raw: Record<string, unknown>): Ticket {
  return {
    id:          String(raw.id ?? ''),
    subject:     String(raw.subject ?? ''),
    category:    CATEGORY_FROM_DB[String(raw.category)] ?? 'Sonstiges',
    priority:    'normal',
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

export async function createTicket(payload: TicketPayload): Promise<Ticket> {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw authErr ?? new Error('Nicht eingeloggt');

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      user_id:  user.id,
      subject:  `[${payload.priority}] ${payload.subject}`,
      message:  payload.description,
      category: CATEGORY_TO_DB[payload.category] ?? 'other',
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapTicket(data as Record<string, unknown>);
}

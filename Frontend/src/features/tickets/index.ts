// ── OPTIONALES FEATURE ────────────────────────────────────────────────────────
// Schalter: src/config/features.ts → tickets: true/false
// Vollständig entfernen: Ordner löschen + Schalter auf false.
export { getTickets, getTicketById, createTicket, getTicketMessages, sendTicketMessage } from './api/ticketService';
export type { Ticket, TicketPayload, TicketStatus, TicketPriority, TicketCategory, TicketMessage } from './types/ticket.types';

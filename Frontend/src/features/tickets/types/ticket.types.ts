export type TicketStatus   = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'normal' | 'high' | 'urgent';
export type TicketCategory =
  | 'Bestellung & Lieferung'
  | 'Rückgabe & Reklamation'
  | 'Zahlung & Rechnung'
  | 'Produkt & Qualität'
  | 'Konto & Datenschutz'
  | 'Sonstiges';

export interface Ticket {
  id:          string;
  subject:     string;
  category:    TicketCategory;
  priority:    TicketPriority;
  status:      TicketStatus;
  description: string;
  createdAt:   string;
  updatedAt:   string;
}

export interface TicketPayload {
  subject:     string;
  category:    TicketCategory;
  priority:    TicketPriority;
  description: string;
}

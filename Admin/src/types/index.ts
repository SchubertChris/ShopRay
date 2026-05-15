// ─── Produkte ────────────────────────────────────────────────────────────────
export interface Product {
  id:          string;
  name:        string;
  slug:        string;
  description: string;
  price:       string;
  oldPrice:    string | null;
  discount:    string | null;
  badge:       string | null;
  category:    ProductCategory;
  rating:      number;
  reviews:     number;
  stock:       number;
  imageUrl:    string | null;
  taxRate:     number;
  active:      boolean;
  createdAt:   string;
}

export type ProductCategory = string;

// ─── Bestellungen ────────────────────────────────────────────────────────────
/** Spiegelt DB-CHECK-Constraint exakt */
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'payment_failed'
  | 'refunded';

export interface OrderItem {
  id:          string;
  productId:   string;
  productName: string;
  quantity:    number;
  price:       string;
}

export interface Order {
  id:              string;
  orderNumber:     string;
  customerId:      string;
  customerName:    string;
  customerEmail:   string;
  items:           OrderItem[];
  total:           string;
  status:          OrderStatus;
  shippingAddress: Record<string, string> | null;
  createdAt:       string;
  paidAt:          string | null;
  shippedAt:       string | null;
}

// ─── Kunden ──────────────────────────────────────────────────────────────────
export interface Customer {
  id:         string;
  name:       string;
  email:      string;
  phone:      string | null;
  orderCount: number;
  totalSpent: string;
  createdAt:  string;
}

// ─── Tickets ─────────────────────────────────────────────────────────────────
export type TicketStatus   = 'open' | 'in_progress' | 'closed';
export type TicketCategory = 'order' | 'product' | 'payment' | 'other';

export interface Ticket {
  id:           string;
  subject:      string;
  message:      string;
  status:       TicketStatus;
  category:     TicketCategory;
  customerId:   string;
  customerName: string;
  createdAt:    string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface StatCard {
  label:  string;
  value:  string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
}

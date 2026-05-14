// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id:    string;
  email: string;
  name:  string;
  role:  'admin' | 'editor';
}

// ─── Produkte ────────────────────────────────────────────────────────────────
export interface Product {
  id:          number;
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
  createdAt:   string;
}

export type ProductCategory = 'Wohnen' | 'Deko' | 'Küche' | 'Textilien' | 'Kunst';

// ─── Bestellungen ────────────────────────────────────────────────────────────
export type OrderStatus = 'new' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId:   number;
  productName: string;
  quantity:    number;
  price:       string;
}

export interface Order {
  id:           string;
  orderNumber:  string;
  customerId:   string;
  customerName: string;
  customerEmail: string;
  items:        OrderItem[];
  total:        string;
  status:       OrderStatus;
  createdAt:    string;
  shippedAt:    string | null;
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
  id:         string;
  subject:    string;
  message:    string;
  status:     TicketStatus;
  category:   TicketCategory;
  customerId: string;
  customerName: string;
  createdAt:  string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface StatCard {
  label:  string;
  value:  string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
}

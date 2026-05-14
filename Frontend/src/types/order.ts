import type { Address } from './user';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

/** Ein Artikel innerhalb einer Bestellung */
export interface OrderItem {
  productId: number;
  slug:      string;
  name:      string;
  price:     string;
  quantity:  number;
}

/** Vollständige Bestellung */
export interface Order {
  id:           string;
  orderNumber:  string;
  status:       OrderStatus;
  items:        OrderItem[];
  shipping:     Address;
  subtotal:     number;
  shippingCost: number;
  total:        number;
  createdAt:    string;
  updatedAt:    string;
}

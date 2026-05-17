/** Lieferadresse — gespeichert als JSONB, Felder aus Checkout-Formular */
export interface ShippingAddress {
  firstName?: string;
  lastName?:  string;
  street?:    string;
  zip?:       string;
  city?:      string;
  country?:   string;
}

/** Alle möglichen Bestellstatus — spiegelt DB-CHECK-Constraint exakt */
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'payment_failed'
  | 'refunded';

/** Ein Artikel innerhalb einer Bestellung */
export interface OrderItem {
  id:          string;
  productId:   string;
  productName: string;
  price:       string;
  quantity:    number;
  imageUrl?:   string | null;
}

/** Vollständige Bestellung */
export interface Order {
  id:               string;
  orderNumber:      string;
  status:           OrderStatus;
  items:            OrderItem[];
  shippingAddress:  ShippingAddress | null;
  total:            number;
  paymentMethod?:   string | null;
  paidAt?:          string | null;
  shippedAt?:       string | null;
  trackingNumber?:  string | null;
  customerNote?:    string | null;
  stripeSessionId?: string | null;
  createdAt:        string;
  updatedAt:        string;
}

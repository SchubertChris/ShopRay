import type { Address } from './user';

export type PaymentMethod = 'card' | 'paypal' | 'klarna' | 'bank-transfer';

/** Payload an POST /checkout */
export interface CheckoutPayload {
  shipping:      Address;
  paymentMethod: PaymentMethod;
  cartItems:     Array<{ productId: number; quantity: number }>;
}

/** Backend-Antwort nach erfolgreicher Bestellung */
export interface CheckoutResponse {
  orderId:     string;
  orderNumber: string;
  total:       number;
}

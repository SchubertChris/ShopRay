import type { Address } from './user';

export type PaymentMethod = 'card' | 'paypal' | 'klarna' | 'bank-transfer';

/** Payload an POST /checkout */
export interface CheckoutPayload {
  shipping:      Address;
  paymentMethod: PaymentMethod;
  cartItems:     Array<{ productId: string; quantity: number }>;
}

/** Backend-Antwort: Stripe-Checkout-URL zur Weiterleitung */
export interface CheckoutResponse {
  checkoutUrl: string;
}

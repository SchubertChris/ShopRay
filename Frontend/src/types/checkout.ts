import type { Address } from './user';

export type PaymentMethod = 'card' | 'paypal' | 'klarna' | 'bank-transfer';

/** Payload an POST /checkout */
export interface CheckoutPayload {
  shipping:      Address;
  paymentMethod: PaymentMethod;
  cartItems:     Array<{ productId: string; quantity: number; skuId?: string }>;
  guestEmail?:   string;
  discountCode?: string;
}

export interface DiscountValidation {
  valid:          boolean;
  code:           string;
  type:           'percent' | 'fixed';
  value:          number;
  discountAmount: number;
  finalTotal:     number;
}

/** Backend-Antwort: Stripe-Checkout-URL zur Weiterleitung */
export interface CheckoutResponse {
  checkoutUrl: string;
}

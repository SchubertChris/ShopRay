import api from '@/api/axiosinstance';
import type { CheckoutPayload, CheckoutResponse } from '@/types/checkout';

/** POST /orders/checkout — Bestellung anlegen, gibt Stripe-Checkout-URL zurück */
export async function createOrder(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const { data } = await api.post<CheckoutResponse>('/orders/checkout', {
    items:           payload.cartItems,
    shippingAddress: payload.shipping,
  });
  return data;
}

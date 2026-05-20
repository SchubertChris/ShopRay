import api from '@/api/axiosinstance';
import type { CheckoutPayload, CheckoutResponse, DiscountValidation } from '@/types/checkout';

/** POST /orders/checkout — Bestellung anlegen, gibt Stripe-Checkout-URL zurück */
export async function createOrder(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const { data } = await api.post<CheckoutResponse>('/orders/checkout', {
    items:           payload.cartItems,
    shippingAddress: payload.shipping,
    paymentMethod:   payload.paymentMethod,
    ...(payload.guestEmail   ? { guestEmail:   payload.guestEmail   } : {}),
    ...(payload.discountCode ? { discountCode: payload.discountCode } : {}),
  });
  return data;
}

/** POST /discounts/validate — Gutscheincode prüfen */
export async function validateDiscountCode(code: string, orderTotal: number): Promise<DiscountValidation> {
  const { data } = await api.post<DiscountValidation>('/discounts/validate', { code, orderTotal });
  return data;
}

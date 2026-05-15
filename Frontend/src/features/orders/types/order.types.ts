// Alle Order-Typen leben in @types/order — hier nur Feature-Re-Export
export type { Order, OrderItem, OrderStatus } from '@/types/order';

/** Hilfsfunktion: Status-Code → deutsche Bezeichnung */
export function orderStatusLabel(status: import('@/types/order').OrderStatus): string {
  const MAP: Record<import('@/types/order').OrderStatus, string> = {
    pending:        'Ausstehend',
    paid:           'Bezahlt',
    shipped:        'Versandt',
    delivered:      'Geliefert',
    cancelled:      'Storniert',
    payment_failed: 'Zahlung fehlgeschlagen',
    refunded:       'Erstattet',
  };
  return MAP[status] ?? status;
}

import { useQuery } from '@hooks/useQuery';
import { getOrders, getOrderById } from '../api/orderService';

/** Alle Bestellungen des Users laden */
export function useOrders() {
  return useQuery(() => getOrders(), []);
}

/** Einzelne Bestellung laden */
export function useOrderById(id: string) {
  return useQuery(() => getOrderById(id), [id]);
}

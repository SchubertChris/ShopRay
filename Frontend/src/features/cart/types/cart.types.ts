import type { Product } from '@features/products';

/** Produkt im Warenkorb mit Menge */
export interface CartItem extends Product {
  quantity: number;
}

export interface AddItemResult {
  ok:      boolean;
  reason?: string;
}

export interface CartStore {
  items:          CartItem[];
  addItem:        (product: Product) => AddItemResult;
  removeItem:     (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => AddItemResult;
  clearCart:      () => void;
  total:          () => number;
  count:          () => number;
}

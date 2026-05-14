import type { Product } from '@features/products';

/** Produkt im Warenkorb mit Menge */
export interface CartItem extends Product {
  quantity: number;
}

export interface CartStore {
  items:          CartItem[];
  addItem:        (product: Product) => void;
  removeItem:     (productId: number) => void;
  updateQuantity: (productId: number, delta: number) => void;
  clearCart:      () => void;
  total:          () => number;
  count:          () => number;
}

import type { Product } from '@features/products';

export interface CartItemSku {
  id:           string;
  label:        string;   // z.B. "M / Rot"
  stock:        number;
  priceOffset:  number;
}

/** Produkt im Warenkorb mit Menge — cartKey ist der eindeutige Schlüssel */
export interface CartItem extends Product {
  quantity:    number;
  cartKey:     string;         // `${product.id}__${skuId ?? ''}`
  sku?:        CartItemSku;
}

export interface AddItemResult {
  ok:      boolean;
  reason?: string;
}

export interface CartStore {
  items:          CartItem[];
  addItem:        (product: Product, sku?: CartItemSku) => AddItemResult;
  removeItem:     (cartKey: string) => void;
  updateQuantity: (cartKey: string, delta: number) => AddItemResult;
  clearCart:      () => void;
  total:          () => number;
  count:          () => number;
}

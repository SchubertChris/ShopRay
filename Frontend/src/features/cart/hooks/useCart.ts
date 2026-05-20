import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartStore, CartItem, CartItemSku, AddItemResult } from '../types/cart.types';
import type { Product } from '@features/products';

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, sku?: CartItemSku): AddItemResult => {
        const cartKey  = `${product.id}__${sku?.id ?? ''}`;
        const state    = get();
        const existing = state.items.find(i => i.cartKey === cartKey);
        const cartQty  = existing?.quantity ?? 0;
        const stock    = sku ? sku.stock : (product.stock ?? Infinity);

        if (cartQty + 1 > stock) {
          return { ok: false, reason: stock === 0 ? 'Ausverkauft' : `Nur noch ${stock} auf Lager` };
        }

        const effectivePrice = String(
          (parseFloat(product.price) + (sku?.priceOffset ?? 0)).toFixed(2)
        );

        const newItem: CartItem = {
          ...product,
          price:    effectivePrice,
          cartKey,
          quantity: 1,
          ...(sku ? { sku } : {}),
        };

        set(s => ({
          items: existing
            ? s.items.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i)
            : [...s.items, newItem],
        }));
        return { ok: true };
      },

      removeItem: (cartKey: string) =>
        set(state => ({ items: state.items.filter(i => i.cartKey !== cartKey) })),

      updateQuantity: (cartKey: string, delta: number): AddItemResult => {
        const state   = get();
        const item    = state.items.find(i => i.cartKey === cartKey);
        if (!item) return { ok: false };

        const newQty = item.quantity + delta;
        if (newQty <= 0) {
          set(s => ({ items: s.items.filter(i => i.cartKey !== cartKey) }));
          return { ok: true };
        }

        const stock = item.sku ? item.sku.stock : (item.stock ?? Infinity);
        if (newQty > stock) {
          return { ok: false, reason: `Nur noch ${stock} auf Lager` };
        }

        set(s => ({
          items: s.items.map(i => i.cartKey === cartKey ? { ...i, quantity: newQty } : i),
        }));
        return { ok: true };
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0),

      count: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'sr-cart' }
  )
);

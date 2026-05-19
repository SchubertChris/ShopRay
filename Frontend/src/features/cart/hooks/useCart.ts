import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartStore, AddItemResult } from '../types/cart.types';
import type { Product } from '@features/products';

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product): AddItemResult => {
        const state    = get();
        const existing = state.items.find(i => i.id === product.id);
        const cartQty  = existing?.quantity ?? 0;
        const stock    = product.stock ?? Infinity;

        if (cartQty + 1 > stock) {
          return { ok: false, reason: stock === 0 ? 'Ausverkauft' : `Nur noch ${stock} auf Lager` };
        }

        set(s => ({
          items: existing
            ? s.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
            : [...s.items, { ...product, quantity: 1 }],
        }));
        return { ok: true };
      },

      removeItem: (id: string) =>
        set(state => ({ items: state.items.filter(i => i.id !== id) })),

      updateQuantity: (id: string, delta: number): AddItemResult => {
        const state   = get();
        const item    = state.items.find(i => i.id === id);
        if (!item) return { ok: false };

        const newQty = item.quantity + delta;
        if (newQty <= 0) {
          set(s => ({ items: s.items.filter(i => i.id !== id) }));
          return { ok: true };
        }

        const stock = item.stock ?? Infinity;
        if (newQty > stock) {
          return { ok: false, reason: `Nur noch ${stock} auf Lager` };
        }

        set(s => ({
          items: s.items.map(i => i.id === id ? { ...i, quantity: newQty } : i),
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

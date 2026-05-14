import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartStore } from '../types/cart.types';
import type { Product } from '@features/products';

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product) => set(state => {
        const existing = state.items.find(i => i.id === product.id);
        if (existing) {
          return {
            items: state.items.map(i =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return { items: [...state.items, { ...product, quantity: 1 }] };
      }),

      removeItem: (id: number) =>
        set(state => ({ items: state.items.filter(i => i.id !== id) })),

      updateQuantity: (id: number, delta: number) =>
        set(state => ({
          items: state.items
            .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
            .filter(i => i.quantity > 0),
        })),

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0),

      count: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'sr-cart' }
  )
);

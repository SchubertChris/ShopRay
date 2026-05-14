import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WishlistStore } from '../types/wishlist.types';

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id: number) =>
        set(state => ({
          ids: state.ids.includes(id)
            ? state.ids.filter(i => i !== id)
            : [...state.ids, id],
        })),
      has: (id: number) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    { name: 'sr-wishlist' }
  )
);

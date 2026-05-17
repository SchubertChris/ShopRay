import { create } from 'zustand';

interface BadgeState {
  pendingOrders: number;
  openTickets:   number;
  newInquiries:  number;
}

interface BadgeStore extends BadgeState {
  setAll: (counts: BadgeState) => void;
  clear:  (key: keyof BadgeState) => void;
}

export const useBadgeStore = create<BadgeStore>()((set) => ({
  pendingOrders: 0,
  openTickets:   0,
  newInquiries:  0,
  setAll: (counts) => set(counts),
  clear:  (key)    => set({ [key]: 0 } as Pick<BadgeState, typeof key>),
}));

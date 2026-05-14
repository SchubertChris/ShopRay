import { create } from 'zustand';
import type { NotificationStore, NotifyOptions } from '../types/notification.types';

const DEFAULT_DURATION: Record<string, number> = {
  success:  3200,
  error:    5000,
  warning:  4000,
  info:     3200,
  wishlist: 2400,
};

export const useNotifications = create<NotificationStore>()((set) => ({
  items: [],

  notify: (opts: NotifyOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = opts.duration ?? DEFAULT_DURATION[opts.type] ?? 3200;
    set(s => ({ items: [...s.items.slice(-2), { ...opts, id, duration }] }));
  },

  dismiss: (id: string) =>
    set(s => ({ items: s.items.filter(i => i.id !== id) })),
}));

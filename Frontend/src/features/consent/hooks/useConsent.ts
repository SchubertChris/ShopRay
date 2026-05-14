import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConsentStore } from '../types/consent.types';

const now = () => new Date().toISOString();

export const useConsent = create<ConsentStore>()(
  persist(
    (set) => ({
      necessary:   true,
      analytics:   false,
      marketing:   false,
      preferences: false,
      decidedAt:   null,
      isOpen:      false,

      setAll: (consent) =>
        set({ ...consent, necessary: true, decidedAt: now(), isOpen: false }),

      acceptAll: () =>
        set({
          necessary:   true,
          analytics:   true,
          marketing:   true,
          preferences: true,
          decidedAt:   now(),
          isOpen:      false,
        }),

      rejectAll: () =>
        set({
          necessary:   true,
          analytics:   false,
          marketing:   false,
          preferences: false,
          decidedAt:   now(),
          isOpen:      false,
        }),

      reset: () =>
        set({
          necessary:   true,
          analytics:   false,
          marketing:   false,
          preferences: false,
          decidedAt:   null,
          isOpen:      false,
        }),

      open:  () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    { name: 'sr-consent' },
  ),
);

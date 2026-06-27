import { useState } from 'react';
import type { Product } from '@features/products';

// ── Hero Card Carousel ───────────────────────────────────────────────────
export function useHeroCarousel(products: Product[]) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [pulsing,   setPulsing]   = useState(false);

  const n     = products.length;
  const slots = n > 0 ? [0, 1, 2].map(i => products[(activeIdx + i) % n]) : [];
  const bgUrl = slots[0]?.imageUrl ?? null;

  function cycleNext() {
    if (pulsing || n < 2) return;
    setPulsing(true);
    setTimeout(() => {
      setActiveIdx(i => (i + 1) % n);
      setPulsing(false);
    }, 320);
  }

  return { slots, bgUrl, pulsing, n, cycleNext };
}

// ── KERN-FEATURE — nicht entfernen ───────────────────────────────────────────
// Der Warenkorb ist Bestandteil des Kaufprozesses. Ohne ihn funktioniert
// kein Checkout. Dieses Feature hat keinen Schalter in features.ts.
export type { CartItem, CartStore } from './types/cart.types';
export { useCart } from './hooks/useCart';

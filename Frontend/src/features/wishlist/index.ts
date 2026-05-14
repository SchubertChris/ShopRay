// ── OPTIONALES FEATURE ────────────────────────────────────────────────────────
// Schalter: src/config/features.ts → wishlist: true/false
// Vollständig entfernen: Ordner löschen + Schalter auf false.
export type { WishlistStore } from './types/wishlist.types';
export { useWishlist } from './hooks/useWishlist';

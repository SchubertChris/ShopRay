// ── OPTIONALES FEATURE ────────────────────────────────────────────────────────
// Schalter: src/config/features.ts → reviews: true/false
// Vollständig entfernen: Ordner löschen + Schalter auf false.
export type { Review, CreateReviewPayload } from './types/review.types';
export { useReviews } from './hooks/useReviews';
export { getReviews, createReview } from './api/reviewService';

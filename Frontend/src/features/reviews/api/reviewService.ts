import api from '@/api/axiosinstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Review, CreateReviewPayload } from '../types/review.types';

/** GET /products/:productId/reviews */
export async function getReviews(productId: number): Promise<Review[]> {
  const { data } = await api.get<PaginatedResponse<Review>>(`/products/${productId}/reviews`);
  return data.data;
}

/** POST /products/:productId/reviews */
export async function createReview(productId: number, payload: CreateReviewPayload): Promise<Review> {
  const { data } = await api.post<ApiResponse<Review>>(`/products/${productId}/reviews`, payload);
  return data.data;
}

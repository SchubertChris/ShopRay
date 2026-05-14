import api from '@/api/axiosinstance';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { SearchParams } from '@/types/search';
import type { Product } from '../types/product.types';

/** GET /products */
export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get<ApiResponse<Product[]>>('/products');
  return data.data;
}

/** GET /products/:slug */
export async function getProductBySlug(slug: string): Promise<Product> {
  const { data } = await api.get<ApiResponse<Product>>(`/products/${slug}`);
  return data.data;
}

/** GET /products/search */
export async function searchProducts(params: SearchParams): Promise<PaginatedResponse<Product>> {
  const { data } = await api.get<PaginatedResponse<Product>>('/products/search', { params });
  return data;
}

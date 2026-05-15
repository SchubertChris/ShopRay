import api from '@/api/axiosinstance';
import type { Product } from '../types/product.types';
import type { SearchParams } from '@/types/search';
import type { PaginatedResponse } from '@/types/api';

function mapProduct(raw: Record<string, unknown>): Product {
  return {
    id:          String(raw.id),
    slug:        String(raw.slug),
    name:        String(raw.name),
    description: String(raw.description ?? ''),
    price:       String(raw.price),
    oldPrice:    raw.old_price     != null ? String(raw.old_price)     : null,
    badge:       raw.badge         != null ? String(raw.badge)         : null,
    discount:    raw.discount      != null ? String(raw.discount)      : null,
    rating:      Number(raw.rating  ?? 0),
    reviews:     Number(raw.reviews ?? 0),
    category:    String(raw.category),
    stock:       Number(raw.stock   ?? 0),
    imageUrl:    raw.image_url     != null ? String(raw.image_url)     : null,
    taxRate:     Number(raw.tax_rate ?? 19),

    // Detail-Felder (nur auf Produktdetailseite)
    richDescription: raw.rich_description != null ? String(raw.rich_description) : undefined,
    highlights:      Array.isArray(raw.highlights)     ? (raw.highlights as string[])                      : undefined,
    certifications:  Array.isArray(raw.certifications) ? (raw.certifications as string[])                  : undefined,
    lmiv:            raw.lmiv        != null ? (raw.lmiv as Product['lmiv'])                               : undefined,
    dealerLinks:     Array.isArray(raw.dealer_links)   ? (raw.dealer_links as Product['dealerLinks'])      : undefined,
    documents:       Array.isArray(raw.documents)      ? (raw.documents as Product['documents'])            : undefined,
  };
}

/** GET /products */
export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get<Record<string, unknown>[]>('/products');
  return data.map(mapProduct);
}

/** GET /products/:slug */
export async function getProductBySlug(slug: string): Promise<Product> {
  const { data } = await api.get<Record<string, unknown>>(`/products/${slug}`);
  return mapProduct(data);
}

/** GET /products/search */
export async function searchProducts(params: SearchParams): Promise<PaginatedResponse<Product>> {
  const { data } = await api.get<PaginatedResponse<Record<string, unknown>>>('/products/search', { params });
  return { ...data, data: data.data.map(mapProduct) };
}

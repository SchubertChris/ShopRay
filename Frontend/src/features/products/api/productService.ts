import { supabase } from '@/lib/supabase';
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
    images:      Array.isArray(raw.images)       ? (raw.images as string[])                         : undefined,
    taxRate:     Number(raw.tax_rate ?? 19),
    richDescription: raw.rich_description != null ? String(raw.rich_description) : undefined,
    highlights:      Array.isArray(raw.highlights)     ? (raw.highlights as string[])                  : undefined,
    certifications:  Array.isArray(raw.certifications) ? (raw.certifications as string[])              : undefined,
    lmiv:            raw.lmiv        != null ? (raw.lmiv as Product['lmiv'])                           : undefined,
    dealerLinks:     Array.isArray(raw.dealer_links)   ? (raw.dealer_links as Product['dealerLinks'])  : undefined,
    documents:       Array.isArray(raw.documents)      ? (raw.documents as Product['documents'])        : undefined,
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();
  if (error) throw error;
  return mapProduct(data as Record<string, unknown>);
}

export async function searchProducts(params: SearchParams): Promise<PaginatedResponse<Product>> {
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('active', true);

  if (params.query) {
    // ILIKE-Sonderzeichen escapen um Pattern-Injection zu verhindern
    const safe = params.query.replace(/[%_\\]/g, '\\$&');
    query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.minPrice !== undefined) {
    query = query.gte('price', params.minPrice);
  }
  if (params.maxPrice !== undefined) {
    query = query.lte('price', params.maxPrice);
  }
  if (params.minRating) {
    query = query.gte('rating', params.minRating);
  }
  if (params.inStock) {
    query = query.gt('stock', 0);
  }

  switch (params.sortBy) {
    case 'price-asc':  query = query.order('price', { ascending: true });           break;
    case 'price-desc': query = query.order('price', { ascending: false });          break;
    case 'newest':     query = query.order('created_at', { ascending: false });     break;
    default:           query = query.order('reviews', { ascending: false });        break;
  }

  const from = (params.page - 1) * params.limit;
  query = query.range(from, from + params.limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const total      = count ?? 0;
  const totalPages = Math.ceil(total / params.limit);

  return {
    data:    (data as Record<string, unknown>[]).map(mapProduct),
    meta:    { total, page: params.page, limit: params.limit, totalPages },
    message: 'ok',
    success: true,
  };
}

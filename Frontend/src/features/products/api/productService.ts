import { supabase } from '@/lib/supabase';
import type { Product, VariantOption, ProductSku } from '../types/product.types';
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
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapProduct);
}

export interface CategoryInfo {
  name:      string;
  order:     number;
  image_url: string | null;
}

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('name, "order"')
    .order('"order"', { ascending: true })
    .order('name',    { ascending: true });
  if (error) throw error;
  return (data as { name: string }[]).map(c => c.name);
}

export async function getCategoriesWithImages(): Promise<CategoryInfo[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('name, "order", image_url')
    .order('"order"', { ascending: true })
    .order('name',    { ascending: true });
  if (error) throw error;
  return (data as CategoryInfo[]);
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      variant_options (
        id, name, position,
        variant_option_values ( id, value, position )
      ),
      product_skus ( id, combination, stock, price_offset, sku_code, active )
    `)
    .eq('slug', slug)
    .eq('active', true)
    .single();
  if (error) throw error;

  const raw = data as Record<string, unknown>;

  const variantOptions: VariantOption[] = Array.isArray(raw.variant_options)
    ? (raw.variant_options as Array<Record<string, unknown>>)
        .sort((a, b) => (a.position as number) - (b.position as number))
        .map(o => ({
          id:       String(o.id),
          name:     String(o.name),
          position: Number(o.position),
          values:   Array.isArray(o.variant_option_values)
            ? (o.variant_option_values as Array<Record<string, unknown>>)
                .sort((a, b) => (a.position as number) - (b.position as number))
                .map(v => ({ id: String(v.id), value: String(v.value), position: Number(v.position) }))
            : [],
        }))
    : [];

  const skus: ProductSku[] = Array.isArray(raw.product_skus)
    ? (raw.product_skus as Array<Record<string, unknown>>)
        .filter(s => s.active)
        .map(s => ({
          id:          String(s.id),
          combination: (s.combination as Record<string, string>) ?? {},
          stock:       Number(s.stock ?? 0),
          priceOffset: Number(s.price_offset ?? 0),
          skuCode:     s.sku_code != null ? String(s.sku_code) : null,
          active:      Boolean(s.active),
        }))
    : [];

  return {
    ...mapProduct(raw),
    variantOptions: variantOptions.length > 0 ? variantOptions : undefined,
    skus:           skus.length > 0 ? skus : undefined,
  };
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

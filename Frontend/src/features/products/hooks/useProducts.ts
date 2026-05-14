import { useMemo } from 'react';
import { PRODUCTS } from '../data/products.data';
import type { Product, SortBy } from '../types/product.types';

export function useProducts() {
  return PRODUCTS;
}

export function useProductBySlug(slug: string): Product | undefined {
  return useMemo(() => PRODUCTS.find(p => p.slug === slug), [slug]);
}

export function useProductsByCategory(category: string | null): Product[] {
  return useMemo(
    () => category ? PRODUCTS.filter(p => p.category === category) : PRODUCTS,
    [category]
  );
}

export function useProductSearch(
  query: string,
  category: string | null,
  sortBy: SortBy = 'popularity',
): Product[] {
  return useMemo(() => {
    let results = PRODUCTS;
    if (category) results = results.filter(p => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    const sorted = [...results];
    switch (sortBy) {
      case 'price-asc':  sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); break;
      case 'price-desc': sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); break;
      case 'newest':     sorted.sort((a, b) => b.id - a.id); break;
      default:           sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    }
    return sorted;
  }, [query, category, sortBy]);
}

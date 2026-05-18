import { useState, useEffect, useMemo } from 'react';
import { getProducts, getProductBySlug, getCategories } from '../api/productService';
import type { Product, SortBy } from '../types/product.types';

export function useProducts() {
  const [data, setData]       = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getProducts()
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Fehler'))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useProductBySlug(slug: string) {
  const [data, setData]       = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    setLoading(true);
    getProductBySlug(slug)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  return { data, loading };
}

export function useCategories() {
  const [data, setData]       = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useProductsByCategory(category: string | null) {
  const { data: all, loading } = useProducts();
  const data = useMemo(
    () => category ? all.filter(p => p.category === category) : all,
    [all, category]
  );
  return { data, loading };
}

export function useRelatedProducts(currentProductId: string, category: string, limit = 4) {
  const { data: all, loading } = useProducts();
  const data = useMemo(
    () => all
      .filter(p => p.category === category && p.id !== currentProductId)
      .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
      .slice(0, limit),
    [all, currentProductId, category, limit]
  );
  return { data, loading };
}

export function useProductSearch(
  query: string,
  category: string | null,
  sortBy: SortBy = 'popularity',
) {
  const { data: all, loading } = useProducts();
  const data = useMemo(() => {
    let results = all;
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
      case 'newest':     sorted.sort((a, b) => b.id.localeCompare(a.id)); break;
      default:           sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    }
    return sorted;
  }, [all, query, category, sortBy]);
  return { data, loading };
}

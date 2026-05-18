// ── KERN-FEATURE — nicht entfernen ───────────────────────────────────────────
// Produkte sind die Basis des gesamten Shops. Warenkorb, Checkout und alle
// anderen Features hängen direkt oder indirekt davon ab.
export type { Product, ProductCategory, SortBy, LmivInfo, NutrientRow, DealerLink, ProductDocument } from './types/product.types';
export { useProducts, useProductBySlug, useProductsByCategory, useProductSearch, useRelatedProducts, useCategories } from './hooks/useProducts';
export { getProducts, getProductBySlug, searchProducts, getCategories, getCategoriesWithImages } from './api/productService';
export type { CategoryInfo } from './api/productService';
export { ImageGallery } from './components/ImageGallery';

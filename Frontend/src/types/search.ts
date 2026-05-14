import type { ProductCategory, SortBy } from '@features/products';

/** Filter-Optionen für die Produktsuche */
export interface SearchFilters {
  category?:  ProductCategory | null;
  minPrice?:  number;
  maxPrice?:  number;
  minRating?: number;
  inStock?:   boolean;
}

/** Vollständige Query-Parameter an GET /products/search */
export interface SearchParams extends SearchFilters {
  query:  string;
  sortBy: SortBy;
  page:   number;
  limit:  number;
}

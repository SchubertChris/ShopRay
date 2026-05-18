import { API_BASE } from '@config/api';

export interface Category {
  id:        string;
  name:      string;
  order:     number;
  image_url: string | null;
  count:     number;
  num:       string;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Kategorien konnten nicht geladen werden');
  return res.json() as Promise<Category[]>;
}

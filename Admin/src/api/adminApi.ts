const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:5000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

async function apiFetch<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: unknown,
  contentType?: string,
): Promise<T> {
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = contentType ?? 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include', // HttpOnly adminSession-Cookie automatisch mitsenden
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const adminLogin  = (password: string) =>
  apiFetch<{ ok: boolean }>('/api/admin/login', 'POST', { password });

export const adminLogout = () =>
  apiFetch<{ ok: boolean }>('/api/admin/logout', 'POST');

export const adminCheck  = () =>
  apiFetch<{ ok: boolean }>('/api/admin/check');

// ── Produkte ──────────────────────────────────────────────────────────────────

export interface AdminProduct {
  id:               string;
  name:             string;
  slug:             string;
  description:      string;
  price:            number;
  old_price:        number | null;
  badge:            string | null;
  discount:         string | null;
  category:         string;
  stock:            number;
  active:           boolean;
  image_url:        string | null;
  tax_rate:         number;
  rating:           number;
  reviews:          number;
  created_at:       string;
  rich_description: string | null;
  highlights:       string[];
  certifications:   string[];
}

export const getAdminProduct   = (id: string) =>
  apiFetch<AdminProduct>(`/api/admin/products/${id}`);

export const createProduct     = (data: Omit<AdminProduct, 'id' | 'rating' | 'reviews' | 'created_at'>) =>
  apiFetch<AdminProduct>('/api/admin/products', 'POST', data);

export const updateProduct     = (id: string, data: Partial<Omit<AdminProduct, 'id' | 'created_at'>>) =>
  apiFetch<AdminProduct>(`/api/admin/products/${id}`, 'PUT', data);

export const deleteProduct     = (id: string) =>
  apiFetch<{ success: boolean }>(`/api/admin/products/${id}`, 'DELETE');

export const uploadProductImage = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append('image', file);
  const { url } = await apiFetch<{ url: string }>('/api/admin/upload', 'POST', fd);
  return url;
};

// ── Kontaktanfragen ───────────────────────────────────────────────────────────

export interface ContactInquiry {
  id:         string;
  name:       string;
  email:      string;
  subject:    string;
  message:    string;
  status:     'new' | 'read' | 'replied';
  consent:    boolean;
  created_at: string;
}

export const getInquiries    = () =>
  apiFetch<ContactInquiry[]>('/api/contact');

export const updateInquiryStatus = (id: string, status: ContactInquiry['status']) =>
  apiFetch<{ success: boolean }>(`/api/contact/${id}`, 'PATCH', { status });

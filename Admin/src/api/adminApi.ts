// Produktion: leerer String → relative /api/* Calls → Vercel Rewrite → Backend
// Lokal: VITE_API_URL=http://localhost:5000
export const API_URL = (import.meta.env.VITE_API_URL as string) ?? '';

// ── Session-Token (localStorage) ──────────────────────────────────────────────
// Primäre Auth-Methode: Authorization: Bearer <token>
// Cookie bleibt als Fallback für Desktop-Browser gesetzt
const TOKEN_KEY = 'adminToken';
export const getAdminToken  = ()              => localStorage.getItem(TOKEN_KEY);
export const setAdminToken  = (t: string)     => localStorage.setItem(TOKEN_KEY, t);
export const clearAdminToken = ()             => localStorage.removeItem(TOKEN_KEY);

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

  // Bearer-Token hat Vorrang vor Cookie (funktioniert cross-domain auf Mobile)
  const token = getAdminToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include', // Cookie als Fallback für Desktop
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
  apiFetch<{ ok: boolean; requireTotp?: boolean; token?: string }>('/api/admin/login', 'POST', { password });

export const adminLogout = () =>
  apiFetch<{ ok: boolean }>('/api/admin/logout', 'POST');

export const adminCheck  = () =>
  apiFetch<{ ok: boolean }>('/api/admin/check');

// ── Produkte ──────────────────────────────────────────────────────────────────

export interface NutrientRow {
  name:        string;
  per100g:     string;
  perServing?: string;
  nrv?:        string;
}

export interface LmivInfo {
  ingredients?:  string;
  allergens?:    string[];
  servingSize?:  string;
  netContent?:   string;
  nutrients?:    NutrientRow[];
  storageHint?:  string;
  usage?:        string;
  warnings?:     string[];
  manufacturer?: string;
}

export interface DealerLink {
  label: string;
  href:  string;
}

export interface ProductDocument {
  label: string;
  href:  string;
  type:  'pdf' | 'external';
}

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
  images:           string[];
  tax_rate:         number;
  rating:           number;
  reviews:          number;
  created_at:       string;
  rich_description: string | null;
  highlights:       string[];
  certifications:   string[];
  lmiv:             LmivInfo | null;
  dealer_links:     DealerLink[];
  documents:        ProductDocument[];
}

export const getAdminProduct   = (id: string) =>
  apiFetch<AdminProduct>(`/api/admin/products/${id}`);

export const createProduct     = (data: Omit<AdminProduct, 'id' | 'rating' | 'reviews' | 'created_at'>) =>
  apiFetch<AdminProduct>('/api/admin/products', 'POST', data);

export const updateProduct     = (id: string, data: Partial<Omit<AdminProduct, 'id' | 'created_at'>>) =>
  apiFetch<AdminProduct>(`/api/admin/products/${id}`, 'PUT', data);

export const deleteProduct     = (id: string) =>
  apiFetch<{ success: boolean }>(`/api/admin/products/${id}`, 'DELETE');

export const toggleProductActive = (id: string, active: boolean) =>
  apiFetch<AdminProduct>(`/api/admin/products/${id}`, 'PUT', { active });

export const uploadProductImage = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append('image', file);
  const { url } = await apiFetch<{ url: string }>('/api/admin/products/upload', 'POST', fd);
  return url;
};

// ── Versandeinstellungen ──────────────────────────────────────────────────────

export interface ShippingSettings {
  standard:   number;
  express:    number;
  free_above: number;
  delivery:   string;
  updated_at: string;
}

export const getShippingSettings = () =>
  apiFetch<ShippingSettings>('/api/settings/shipping');

export const updateShippingSettings = (data: Omit<ShippingSettings, 'updated_at'>) =>
  apiFetch<ShippingSettings>('/api/admin/settings/shipping', 'PUT', data);

// ── Sicherheit / Login-Protokoll ─────────────────────────────────────────────

export interface LoginLogEntry {
  id:         string;
  created_at: string;
  ip_address: string;
  user_agent: string | null;
  success:    boolean;
}

export const getLoginLog = () =>
  apiFetch<LoginLogEntry[]>('/api/admin/login-log');

// ── Kunden (Admin) ────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'mod' | 'customer';

export interface AdminCustomer {
  id:         string;
  name:       string | null;
  email:      string | null;
  role:       UserRole;
  created_at: string;
  updated_at: string | null;
}

export interface AdminCustomerOrderItem {
  product_name: string;
  quantity:     number;
  price:        number;
}

export interface AdminCustomerOrder {
  id:               string;
  order_number:     string;
  status:           string;
  total:            string;
  shipping_address: Record<string, string> | null;
  customer_note:    string | null;
  paid_at:          string | null;
  shipped_at:       string | null;
  created_at:       string;
  order_items:      AdminCustomerOrderItem[];
}

export interface AdminCustomerTicket {
  id:          string;
  subject:     string;
  category:    string;
  status:      string;
  message:     string;
  reply:       string | null;
  replied_at:  string | null;
  created_at:  string;
  updated_at:  string | null;
}

export interface AdminCustomerReview {
  id:         string;
  product_id: string;
  rating:     number;
  title:      string | null;
  body:       string | null;
  verified:   boolean;
  created_at: string;
}

export interface AdminCustomerDetail extends AdminCustomer {
  orders:      AdminCustomerOrder[];
  tickets:     AdminCustomerTicket[];
  reviews:     AdminCustomerReview[];
  exportedAt:  string;
  gdprVersion: string;
}

export const getAdminCustomers = (page = 1, limit = 50) =>
  apiFetch<{ data: AdminCustomer[]; total: number; page: number; limit: number }>(
    `/api/admin/customers?page=${page}&limit=${limit}`,
  );

export const getAdminCustomer = (id: string) =>
  apiFetch<AdminCustomerDetail>(`/api/admin/customers/${id}`);

export const updateCustomerRole = (id: string, role: UserRole) =>
  apiFetch<{ id: string; name: string; email: string; role: UserRole }>(
    `/api/admin/customers/${id}/role`, 'PATCH', { role },
  );

export const deleteAdminCustomer = (id: string) =>
  apiFetch<{ deleted: boolean }>(`/api/admin/customers/${id}`, 'DELETE');

// ── Bestellungen (Admin) ──────────────────────────────────────────────────────

export interface AdminOrderItem {
  id:           string;
  product_name: string;
  quantity:     number;
  price:        number;
}

export interface AdminOrderProfile {
  name:  string | null;
  phone: string | null;
  email: string | null;
}

export interface AdminOrder {
  id:               string;
  order_number:     string;
  status:           string;
  total:            number;
  shipping_address: {
    firstName?: string;
    lastName?:  string;
    street?:    string;
    zip?:       string;
    city?:      string;
    country?:   string;
  } | null;
  customer_note: string | null;
  created_at:    string;
  paid_at:       string | null;
  shipped_at:    string | null;
  order_items:   AdminOrderItem[];
  profile:       AdminOrderProfile | null;
}

export interface AdminOrderListItem {
  id:           string;
  order_number: string;
  status:       string;
  total:        number;
  created_at:   string;
  user_id:      string | null;
}

export const getAdminOrders = (page = 1, limit = 50) =>
  apiFetch<{ data: AdminOrderListItem[]; total: number; page: number; limit: number }>(
    `/api/admin/orders?page=${page}&limit=${limit}`,
  );

export const getAdminOrder = (id: string) =>
  apiFetch<AdminOrder>(`/api/admin/orders/${id}`);

export const updateOrderStatus = (id: string, status: string) =>
  apiFetch<{ id: string; order_number: string; status: string }>(
    `/api/admin/orders/${id}/status`, 'PATCH', { status },
  );

// ── 2FA (Admin) ───────────────────────────────────────────────────────────────

export const get2faStatus = () =>
  apiFetch<{ enabled: boolean }>('/api/admin/2fa/status');

export const get2faSetup = () =>
  apiFetch<{ secret: string; qrCode: string; otpAuthUrl: string }>('/api/admin/2fa/setup');

export const confirm2fa = (secret: string, token: string) =>
  apiFetch<{ ok: boolean }>('/api/admin/2fa/confirm', 'POST', { secret, token });

export const verify2fa = (token: string) =>
  apiFetch<{ ok: boolean }>('/api/admin/2fa/verify', 'POST', { token });

export const disable2fa = () =>
  apiFetch<{ ok: boolean }>('/api/admin/2fa', 'DELETE');

export const loginTotp = (token: string) =>
  apiFetch<{ ok: boolean }>('/api/admin/login/totp', 'POST', { token });

// ── Kategorien ────────────────────────────────────────────────────────────────

export interface Category {
  id:         string;
  name:       string;
  order:      number;
  created_at: string;
}

export const getCategories    = () =>
  apiFetch<Category[]>('/api/admin/categories');

export const createCategory   = (name: string, order?: number) =>
  apiFetch<Category>('/api/admin/categories', 'POST', { name, order: order ?? 0 });

export const deleteCategory   = (id: string) =>
  apiFetch<{ success: boolean }>(`/api/admin/categories/${id}`, 'DELETE');

// ── Bewertungen (Admin) ───────────────────────────────────────────────────────

export interface AdminReview {
  id:         string;
  product_id: string;
  user_id:    string | null;
  rating:     number;
  title:      string | null;
  body:       string | null;
  verified:   boolean;
  created_at: string;
  products:   { name: string } | null;
  profiles:   { name: string | null; email: string | null } | null;
}

export const getAdminReviews = (page = 1, limit = 50, verified?: boolean) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (verified !== undefined) params.set('verified', String(verified));
  return apiFetch<{ data: AdminReview[]; total: number; page: number; limit: number }>(
    `/api/admin/reviews?${params}`,
  );
};

export const verifyReview   = (id: string) =>
  apiFetch<{ id: string; verified: boolean }>(`/api/admin/reviews/${id}/verify`, 'PATCH');

export const rejectReview   = (id: string) =>
  apiFetch<{ id: string; verified: boolean }>(`/api/admin/reviews/${id}/reject`, 'PATCH');

export const deleteAdminReview = (id: string) =>
  apiFetch<{ deleted: boolean }>(`/api/admin/reviews/${id}`, 'DELETE');

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

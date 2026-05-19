// Produktion: leerer String → relative /api/* Calls → Vercel Rewrite → Backend
// Lokal: VITE_API_URL=http://localhost:5000
export const API_URL = (import.meta.env.VITE_API_URL as string) ?? '';

// ── Session-Token (sessionStorage) ──────────────────────────────────────────────
// Primäre Auth-Methode: Authorization: Bearer <token>
// Cookie bleibt als Fallback für Desktop-Browser gesetzt
const TOKEN_KEY = 'adminToken';
export const getAdminToken  = ()              => sessionStorage.getItem(TOKEN_KEY);
export const setAdminToken  = (t: string)     => sessionStorage.setItem(TOKEN_KEY, t);
export const clearAdminToken = ()             => sessionStorage.removeItem(TOKEN_KEY);

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
  apiFetch<{ ok: boolean; requireTotp?: boolean; token?: string; pendingToken?: string }>('/api/admin/login', 'POST', { password });

export const adminLogout = () =>
  apiFetch<{ ok: boolean }>('/api/admin/logout', 'POST');

export const adminCheck  = () =>
  apiFetch<{ ok: boolean; role?: string }>('/api/admin/check');

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

export interface BulkImportRow {
  name:        string;
  slug:        string;
  description: string;
  price:       number;
  category:    string;
  stock?:      number;
  old_price?:  number | null;
  badge?:      string;
  tax_rate?:   number;
  image_url?:  string;
  highlights?: string;
}

export const bulkImportProducts = (rows: BulkImportRow[]) =>
  apiFetch<{ ok: number; results: Array<{ row: number; status: 'ok' | 'error'; name?: string; error?: string }> }>(
    '/api/admin/products/bulk', 'POST', rows,
  );

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

// ── Shop-Einstellungen ────────────────────────────────────────────────────────

export interface ShopSettingsData {
  name:        string;
  description: string;
  url:         string;
  email:       string;
  phone:       string;
  street:      string;
  zip:         string;
  city:        string;
  country:     string;
  vat_id:      string;
  tax_number:  string;
  updated_at:  string;
}

export const getShopSettings = () =>
  apiFetch<ShopSettingsData>('/api/settings/shop');

export const updateShopSettings = (data: Omit<ShopSettingsData, 'updated_at'>) =>
  apiFetch<ShopSettingsData>('/api/admin/settings/shop', 'PUT', data);

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
  id:           string;
  name:         string | null;
  email:        string | null;
  role:         UserRole;
  created_at:   string;
  updated_at:   string | null;
  banned_at?:   string | null;
  banned_until?: string | null;
  ban_reason?:  string | null;
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

export const banCustomer = (id: string, reason: string, until?: string) =>
  apiFetch<{ banned: boolean; banned_at: string; banned_until: string | null; ban_reason: string }>(
    `/api/admin/customers/${id}/ban`, 'POST', { reason, ...(until ? { until } : {}) },
  );

export const unbanCustomer = (id: string) =>
  apiFetch<{ unbanned: boolean }>(`/api/admin/customers/${id}/unban`, 'POST');

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
  customer_note:   string | null;
  created_at:      string;
  paid_at:         string | null;
  shipped_at:      string | null;
  order_items:     AdminOrderItem[];
  profile:         AdminOrderProfile | null;
  invoice_number:  string | null;
  tracking_number: string | null;
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

export async function downloadOrderInvoice(id: string): Promise<void> {
  const token = getAdminToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/admin/orders/${id}/invoice`, {
    headers,
  });

  if (!res.ok) throw new Error('Rechnung konnte nicht generiert werden.');

  const blob        = await res.blob();
  const url         = URL.createObjectURL(blob);
  const contentDisp = res.headers.get('Content-Disposition') ?? '';
  const match       = contentDisp.match(/filename="?([^"]+)"?/);
  const filename    = match?.[1] ?? 'Rechnung.pdf';

  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface DhlLabelResult {
  tracking_number: string;
  label_b64:       string;
}

export const createShippingLabel = (id: string, weight_g: number) =>
  apiFetch<DhlLabelResult>(`/api/admin/orders/${id}/label`, 'POST', { weight_g });

export interface ShippingAddress {
  firstName: string;
  lastName:  string;
  street:    string;
  zip:       string;
  city:      string;
  country:   string;
}

export const updateOrderAddress = (id: string, address: ShippingAddress) =>
  apiFetch<{ id: string; shipping_address: ShippingAddress }>(
    `/api/admin/orders/${id}/address`, 'PATCH', address,
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

export const modLogin = (email: string, password: string) =>
  apiFetch<{ ok: boolean; token: string; role: string; mustChangePassword: boolean }>('/api/admin/login/mod', 'POST', { email, password });

// ── Mod-Management ────────────────────────────────────────────────────────────

export interface ModUser {
  id:         string;
  email:      string;
  created_at: string;
}

export interface PendingInvite {
  id:         string;
  email:      string;
  invited_at: string;
}

export interface ModsResponse {
  active:  ModUser[];
  pending: PendingInvite[];
}

export const getMods = () =>
  apiFetch<ModsResponse>('/api/admin/mods');

export const addMod = (email: string) =>
  apiFetch<{ ok: boolean; invited: boolean; id?: string; email: string; tempPassword?: string }>('/api/admin/mods', 'POST', { email });

export const removeMod = (id: string) =>
  apiFetch<{ ok: boolean }>(`/api/admin/mods/${id}`, 'DELETE');

export const cancelInvite = (id: string) =>
  apiFetch<{ ok: boolean }>(`/api/admin/mods/invite/${id}`, 'DELETE');

export const changeOwnerPassword = (currentPassword: string, newPassword: string) =>
  apiFetch<{ ok: boolean }>('/api/admin/password', 'PUT', { currentPassword, newPassword });

export const changeModPassword = (newPassword: string, name: string) =>
  apiFetch<{ ok: boolean }>('/api/admin/mods/change-password', 'PUT', { newPassword, name });

// ── Kategorien ────────────────────────────────────────────────────────────────

export interface Category {
  id:         string;
  name:       string;
  order:      number;
  image_url:  string | null;
  created_at: string;
}

export const getCategories    = () =>
  apiFetch<Category[]>('/api/admin/categories');

export const createCategory   = (name: string, order?: number, image_url?: string | null) =>
  apiFetch<Category>('/api/admin/categories', 'POST', { name, order: order ?? 0, image_url: image_url ?? null });

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

// ── Tickets (Admin) ───────────────────────────────────────────────────────────

export interface AdminTicket {
  id:          string;
  subject:     string;
  category:    string;
  status:      'open' | 'in_progress' | 'closed';
  message:     string;
  reply:       string | null;
  replied_at:  string | null;
  created_at:  string;
  updated_at:  string | null;
  user_id:     string | null;
  guest_email: string | null;
  profiles:    { name: string | null; email: string | null } | null;
}

export const getAdminTickets = () =>
  apiFetch<{ data: AdminTicket[]; total: number }>('/api/admin/tickets');

export const replyToTicket = (id: string, reply: string, status: AdminTicket['status']) =>
  apiFetch<{ id: string; status: string; replied_at: string }>(
    `/api/admin/tickets/${id}/reply`, 'PATCH', { reply, status },
  );

export interface TicketMessage {
  id:         string;
  ticket_id:  string;
  sender:     'customer' | 'admin';
  text:       string;
  created_at: string;
}

export async function getAdminTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  return apiFetch<TicketMessage[]>(`/api/admin/tickets/${ticketId}/messages`);
}

export async function sendAdminMessage(ticketId: string, text: string): Promise<TicketMessage> {
  return apiFetch<TicketMessage>(`/api/admin/tickets/${ticketId}/messages`, 'POST', { text });
}

// ── Stats (Admin) ─────────────────────────────────────────────────────────────

export interface AdminStats {
  orders:         number;
  revenue30d:     number;
  customers:      number;
  activeProducts: number;
  pendingOrders:  number;
  openTickets:    number;
  newInquiries:   number;
  recentOrders:   {
    id:           string;
    order_number: string;
    status:       string;
    total:        number;
    created_at:   string;
    profiles:     { name: string | null; email: string | null } | null;
  }[];
}

export const getAdminStats = () =>
  apiFetch<AdminStats>('/api/admin/stats');

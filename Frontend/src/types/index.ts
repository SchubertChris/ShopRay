/**
 * ShopRay -- Zentraler Typ-Index
 *
 * Zweck: Einziger Import-Pfad fuer externe Entwickler.
 * Regel: Typen werden HIER NICHT definiert -- sie leben nah am Feature.
 *
 * Datei-Struktur:
 *   src/types/            -- Globale / feature-uebergreifende Typen
 *   src/features/*\/types/ -- Feature-spezifische Typen (Source of Truth)
 *
 * Fuer Backend-Entwickler: Alle noetigen Typen ueber diesen Index beziehen.
 * Fuer Feature-Entwickler: Direkt aus @features/<name> importieren.
 */

// ── GLOBAL: HTTP / API ────────────────────────────────────────────────────────
// Generische Wrapper für alle Backend-Antworten
export type { ApiResponse, PaginatedResponse, ApiError } from './api';

// ── GLOBAL: Benutzer & Identität ──────────────────────────────────────────────
// User, Address, UserProfile — kommen vom /auth & /account Endpunkt
export type { UserRole, Address, User, UserProfile } from './user';

// ── FEATURE: Produkte ─────────────────────────────────────────────────────────
// Source of Truth: src/features/products/types/product.types.ts
export type { Product, ProductCategory, SortBy } from '@features/products';

// ── FEATURE: Warenkorb ────────────────────────────────────────────────────────
// Source of Truth: src/features/cart/types/cart.types.ts
export type { CartItem } from '@features/cart';

// ── FEATURE: Bestellungen ─────────────────────────────────────────────────────
// Source of Truth: src/features/orders/types/order.types.ts
export type { OrderStatus, OrderItem, Order } from '@features/orders';

// ── FEATURE: Authentifizierung ────────────────────────────────────────────────
// Source of Truth: src/features/auth/types/auth.ts
export type { LoginPayload, RegisterPayload, AuthResponse } from '@features/auth';

// ── DOMAIN: Checkout ──────────────────────────────────────────────────────────
// Bridge-Typen: verbinden Cart, Shipping und Orders
// Noch kein eigenes Feature → bleibt temporär in src/types/
export type { PaymentMethod, CheckoutPayload, CheckoutResponse } from './checkout';

// ── DOMAIN: Lieferung & Versand ───────────────────────────────────────────────
// Wird beim Checkout und in der Bestellverfolgung genutzt
export type { DeliveryStatus, DeliveryOption, DeliveryTracking } from './delivery';

// ── DOMAIN: Suche ─────────────────────────────────────────────────────────────
// SearchFilters + SearchParams — erweitern das Produkt-Feature
export type { SearchFilters, SearchParams } from './search';

// ── DOMAIN: Kontaktformular ───────────────────────────────────────────────────
export type { ContactFormPayload, ContactFormResponse } from './contact';

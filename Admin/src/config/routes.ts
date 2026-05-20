export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
  },
  DASHBOARD: '/',
  PRODUCTS: {
    LIST:   '/products',
    NEW:    '/products/new',
    edit:   (id: string | number) => `/products/${id}/edit`,
  },
  ORDERS: {
    LIST:   '/orders',
    detail: (id: string | number) => `/orders/${id}`,
  },
  CUSTOMERS: {
    LIST:   '/customers',
    detail: (id: string | number) => `/customers/${id}`,
  },
  RETURNS:  '/returns',
  SUPPORT: {
    TICKETS: '/support',
  },
  INQUIRIES:  '/inquiries',
  REVIEWS:    '/reviews',
  CATEGORIES: '/categories',
  DISCOUNTS:  '/discounts',
  ANALYTICS:  '/analytics',
  SETTINGS:   '/settings',
  TASKS:      '/tasks',
} as const;

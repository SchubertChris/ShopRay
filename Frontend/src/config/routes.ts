export const ROUTES = {
  HOME: '/',

  SHOP: {
    PRODUCT:       '/produkt/:slug',
    product:       (slug: string) => `/produkt/${slug}`,
    CART:          '/cart',
    CHECKOUT:      '/checkout',
    ORDER_SUCCESS: '/order-success',
    SEARCH:        '/suche',
    CATEGORIES:    '/kategorien',
  },

  AUTH: {
    LOGIN:           '/login',
    REGISTER:        '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD:  '/auth/reset-password',
    CALLBACK:        '/auth/callback',
  },

  ACCOUNT: {
    ROOT:          '/account',
    DASHBOARD:     '/account/dashboard',
    ORDERS:        '/account/orders',
    ORDER_DETAIL:  '/account/orders/:id',
    orderDetail:   (id: string) => `/account/orders/${id}`,
    WISHLIST:      '/account/wishlist',
    TICKETS:       '/account/tickets',
    TICKET_NEW:    '/account/tickets/new',
    TICKET_DETAIL: '/account/tickets/:id',
    ticketDetail:  (id: string) => `/account/tickets/${id}`,
    SETTINGS:      '/account/settings',
    ADDRESSES:     '/account/addresses',
    MY_DATA:       '/account/my-data',
  },

  INFO: {
    ABOUT:     '/about',
    CONTACT:   '/contact',
    FAQ:       '/faq',
    SHIPPING:  '/versand',
    IMPRESSUM: '/impressum',
    PRIVACY:   '/datenschutz',
    TERMS:     '/agb',
    WIDERRUF:  '/widerruf',
  },

  SUPPORT: {
    CHAT:   '/chat',
    PORTAL: '/support',
  },
} as const;

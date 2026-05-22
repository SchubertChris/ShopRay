import 'dotenv/config';
import express         from 'express';
import cookieParser    from 'cookie-parser';
import { corsMiddleware }                          from './middleware/cors';
import { errorHandler }                           from './middleware/errorHandler';
import { helmetMiddleware, globalRateLimit }       from './middleware/security';
import { demoModeGuard }                           from './middleware/demoMode';
import healthRouter       from './routes/health';
import stripeRouter       from './routes/stripe';
import ordersRouter       from './routes/orders';
import productsRouter     from './routes/products';
import customersRouter    from './routes/customers';
import contactRouter      from './routes/contact';
import ticketsRouter      from './routes/tickets';
import categoriesRouter   from './routes/categories';
import adminAuthRouter       from './routes/admin-auth';
import adminProductsRouter   from './routes/admin-products';
import adminCategoriesRouter from './routes/admin-categories';
import adminCustomersRouter  from './routes/admin-customers';
import adminOrdersRouter     from './routes/admin-orders';
import admin2faRouter        from './routes/admin-2fa';
import adminReviewsRouter    from './routes/admin-reviews';
import adminTicketsRouter    from './routes/admin-tickets';
import adminStatsRouter      from './routes/admin-stats';
import adminPushRouter       from './routes/admin-push';
import adminTicketMessagesRouter from './routes/admin-ticket-messages';
import adminShippingRouter   from './routes/admin-shipping';
import discountsRouter       from './routes/discounts';
import adminDiscountsRouter  from './routes/admin-discounts';
import adminAnalyticsRouter  from './routes/admin-analytics';
import adminVariantsRouter   from './routes/admin-variants';
import settingsRouter        from './routes/settings';
import sitemapRouter         from './routes/sitemap';
import adminNotificationsRouter  from './routes/admin-notifications';
import adminTasksRouter          from './routes/admin-tasks';
import adminRefundRequestsRouter from './routes/admin-refund-requests';
import newsletterRouter          from './routes/newsletter';
import adminMod2faRouter         from './routes/mod-2fa';

const app  = express();
const PORT = process.env.PORT ?? 5000;

// Vercel / Proxy: X-Forwarded-For korrekt auflösen (Pflicht für express-rate-limit v7)
app.set('trust proxy', 1);

// ── Stripe Webhook braucht raw body — MUSS vor express.json() ────────────────
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

// ── Sicherheits-Middleware ────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(globalRateLimit);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ── Öffentliche Routes ────────────────────────────────────────────────────────
app.use('/api/health',    healthRouter);
app.use('/api/webhook',   stripeRouter);
app.use('/api/orders',    ordersRouter);
app.use('/api/products',  productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/contact',   contactRouter);
app.use('/api/tickets',    ticketsRouter);
app.use('/api/categories', categoriesRouter);

// ── Öffentliche Settings-Route ────────────────────────────────────────────────
app.use('/api/discounts',   discountsRouter);
app.use('/api/settings',    settingsRouter);
app.use('/api/newsletter',  newsletterRouter);
app.use('/sitemap.xml',     sitemapRouter);

// ── Admin Routes (JWT HttpOnly Cookie erforderlich) ───────────────────────────
app.use('/api/admin', demoModeGuard);
app.use('/api/admin',             adminAuthRouter);
app.use('/api/admin/products',    adminProductsRouter);
app.use('/api/admin/categories',  adminCategoriesRouter);
app.use('/api/admin/customers',   adminCustomersRouter);
app.use('/api/admin/orders',      adminOrdersRouter);
app.use('/api/admin/orders',      adminShippingRouter);
app.use('/api/admin/2fa',         admin2faRouter);
app.use('/api/admin/reviews',     adminReviewsRouter);
app.use('/api/admin/tickets',     adminTicketsRouter);
app.use('/api/admin/tickets',     adminTicketMessagesRouter);
app.use('/api/admin/stats',       adminStatsRouter);
app.use('/api/admin/push',        adminPushRouter);
app.use('/api/admin/discounts',   adminDiscountsRouter);
app.use('/api/admin/analytics',  adminAnalyticsRouter);
app.use('/api/admin/products',   adminVariantsRouter);
app.use('/api/admin/settings',    settingsRouter);
app.use('/api/admin/notifications',    adminNotificationsRouter);
app.use('/api/admin/tasks',            adminTasksRouter);
app.use('/api/admin/refund-requests',  adminRefundRequestsRouter);
app.use('/api/admin/mod-2fa',          adminMod2faRouter);

// ── Favicon ───────────────────────────────────────────────────────────────────
app.get('/favicon.svg', (_req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#1a1a1a"/><text x="7" y="23" font-family="Georgia, serif" font-size="18" font-weight="700" fill="white" letter-spacing="-1">C</text><circle cx="25" cy="22" r="2.5" fill="#6366f1"/></svg>');
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route nicht gefunden' });
});

// ── Error Handler (muss als letztes registriert werden) ──────────────────────
app.use(errorHandler);

// ── Startup-Validierung ───────────────────────────────────────────────────────
if (!process.env.SHOP_VAT_ID && !process.env.SHOP_TAX_NUMBER) {
  console.warn('[config] WARNUNG: Weder SHOP_VAT_ID noch SHOP_TAX_NUMBER gesetzt — Pflichtangaben nach § 14 Abs. 4 UStG fehlen in Rechnungen!');
}
if (!process.env.JWT_SECRET) {
  throw new Error('[config] FEHLER: JWT_SECRET muss in den Umgebungsvariablen gesetzt sein!');
}

app.listen(PORT, () => {
  console.log(`ShopRay Backend läuft auf http://localhost:${PORT}`);
});

export default app;

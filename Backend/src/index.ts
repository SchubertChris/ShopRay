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
import adminAuthRouter       from './routes/admin-auth';
import adminProductsRouter   from './routes/admin-products';
import adminCategoriesRouter from './routes/admin-categories';
import adminCustomersRouter  from './routes/admin-customers';
import adminOrdersRouter     from './routes/admin-orders';
import admin2faRouter        from './routes/admin-2fa';
import adminReviewsRouter    from './routes/admin-reviews';
import adminTicketsRouter    from './routes/admin-tickets';
import adminStatsRouter      from './routes/admin-stats';
import settingsRouter        from './routes/settings';

const app  = express();
const PORT = process.env.PORT ?? 5000;

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

// ── Öffentliche Settings-Route ────────────────────────────────────────────────
app.use('/api/settings', settingsRouter);

// ── Admin Routes (JWT HttpOnly Cookie erforderlich) ───────────────────────────
app.use('/api/admin', demoModeGuard);
app.use('/api/admin',             adminAuthRouter);
app.use('/api/admin/products',    adminProductsRouter);
app.use('/api/admin/categories',  adminCategoriesRouter);
app.use('/api/admin/customers',   adminCustomersRouter);
app.use('/api/admin/orders',      adminOrdersRouter);
app.use('/api/admin/2fa',         admin2faRouter);
app.use('/api/admin/reviews',     adminReviewsRouter);
app.use('/api/admin/tickets',     adminTicketsRouter);
app.use('/api/admin/stats',       adminStatsRouter);
app.use('/api/admin/settings',    settingsRouter);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route nicht gefunden' });
});

// ── Error Handler (muss als letztes registriert werden) ──────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ShopRay Backend läuft auf http://localhost:${PORT}`);
});

export default app;

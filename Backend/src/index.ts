import 'dotenv/config';
import express         from 'express';
import { corsMiddleware }                          from './middleware/cors';
import { errorHandler }                           from './middleware/errorHandler';
import { helmetMiddleware, globalRateLimit }       from './middleware/security';
import healthRouter    from './routes/health';
import stripeRouter    from './routes/stripe';
import ordersRouter    from './routes/orders';
import productsRouter  from './routes/products';
import customersRouter from './routes/customers';

const app  = express();
const PORT = process.env.PORT ?? 5000;

// ── Stripe Webhook braucht raw body — MUSS vor express.json() ────────────────
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

// ── Sicherheits-Middleware ────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(globalRateLimit);
app.use(express.json({ limit: '10kb' })); // Request-Body auf 10KB limitieren

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health',    healthRouter);
app.use('/api/webhook',   stripeRouter);
app.use('/api/orders',    ordersRouter);
app.use('/api/products',  productsRouter);
app.use('/api/customers', customersRouter);

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

import cors from 'cors';

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean) as string[];

// Vercel Preview-URLs für eigene Projekte erlauben
const VERCEL_PREVIEW_PATTERN = /^https:\/\/shopray(-[a-z0-9-]+)?\.vercel\.app$/;

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // curl / server-to-server haben kein origin
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (VERCEL_PREVIEW_PATTERN.test(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} nicht erlaubt`));
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:  ['Content-Type', 'Authorization'],
  exposedHeaders:  ['X-New-Token'],
});

// VITE_API_URL: Basis-URL ohne /api-Suffix (z.B. http://localhost:5000)
// In Vercel-Production nicht setzen → relative /api/* Calls → Vercel Rewrite → Backend
const ORIGIN = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export const API_BASE    = `${ORIGIN}/api`;
export const API_TIMEOUT = 10_000;

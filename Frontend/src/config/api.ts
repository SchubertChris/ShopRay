/** Basis-URL für alle API-Anfragen — via .env konfigurierbar */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/** Request-Timeout in Millisekunden */
export const API_TIMEOUT = 10_000;

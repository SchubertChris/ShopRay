import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10_000,
});

// Hängt den JWT-Token aus dem Auth-Store an jeden Request
api.interceptors.request.use((config) => {
  try {
    const raw   = localStorage.getItem('sr-auth');
    const token = raw ? (JSON.parse(raw)?.state?.token as string | null) : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // localStorage nicht verfügbar (SSR/Private-Mode) — ignorieren
  }
  return config;
});

// Response-Interceptor: 401 → Auth löschen und zur Login-Seite
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('sr-auth');
      window.location.href = '/login';
    }
    // Alle anderen Fehler werden an den Aufrufer weitergereicht
    return Promise.reject(error);
  },
);

export default api;

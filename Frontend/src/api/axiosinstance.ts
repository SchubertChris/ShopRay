import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { API_BASE, API_TIMEOUT } from '@config/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: API_TIMEOUT,
});

// Hängt den frischen Supabase-JWT an jeden Request (auto-refresh durch Supabase-Client)
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Supabase nicht verfügbar — ignorieren
  }
  return config;
});

// Response-Interceptor: 401 → Supabase-Session löschen und zur Login-Seite
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 401) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

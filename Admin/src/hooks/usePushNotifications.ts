import { useState, useEffect, useCallback } from 'react';
import { API_URL, getAdminToken } from '../api/adminApi';

export type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading';

async function getVapidKey(): Promise<string> {
  const token = getAdminToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(`${API_URL}/api/admin/push/vapid-public-key`, { credentials: 'include', headers });
  const data = await res.json() as { publicKey: string };
  return data.publicKey;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  const buf     = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf;
}

async function registerSW(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

export function usePushNotifications() {
  const [state,   setState]   = useState<PushState>('loading');
  const [error,   setError]   = useState<string | null>(null);

  // Initialen Status ermitteln
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription(),
    ).then(sub => {
      setState(sub ? 'subscribed' : 'unsubscribed');
    }).catch(() => setState('unsubscribed'));
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    setState('loading');
    try {
      const reg    = await registerSW();
      const vapid  = await getVapidKey();
      const sub    = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const json = sub.toJSON();
      const token = getAdminToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/admin/push/subscribe`, {
        method:      'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys:     { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
        }),
      });
      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      setState('subscribed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktivieren');
      setState(Notification.permission === 'denied' ? 'denied' : 'unsubscribed');
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setState('loading');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        const token = getAdminToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        await fetch(`${API_URL}/api/admin/push/subscribe`, {
          method:      'DELETE',
          credentials: 'include',
          headers,
          body: JSON.stringify({ endpoint }),
        });
      }
      setState('unsubscribed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Deaktivieren');
      setState('subscribed');
    }
  }, []);

  return { state, error, subscribe, unsubscribe };
}

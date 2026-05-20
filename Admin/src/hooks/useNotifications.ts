import { useState, useEffect, useCallback } from 'react';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  type AdminNotification,
} from '../api/adminApi';

export function useNotifications() {
  const [items,  setItems]  = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await getNotifications();
      setItems(data.items);
      setUnread(data.unread);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => { void load(); }, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  }, []);

  return { items, unread, markRead, markAllRead, reload: load };
}

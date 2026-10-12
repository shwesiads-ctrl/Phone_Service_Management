import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { AppNotification } from '../types';

export function useNotifications() {
  const { currentUser, getAuthHeaders } = useApp();
  const userId = currentUser?.id;
  const [inbox, setInbox] = useState<{ userId?: string; notifications: AppNotification[]; unread: number; loaded: boolean }>({ notifications: [], unread: 0, loaded: false });
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const actionBusy = useRef(false);
  const activeUserId = useRef(userId);
  activeUserId.current = userId;
  const requestVersion = useRef(0);
  const requestController = useRef<AbortController | null>(null);

  const refresh = useCallback(async (force = false) => {
    if (!userId || (actionBusy.current && !force)) return;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    const version = ++requestVersion.current;
    try {
      const response = await fetch('/api/notifications', { headers: getAuthHeaders(), signal: controller.signal });
      if (!response.ok) throw new Error('Notifications unavailable');
      const data = await response.json();
      if (version !== requestVersion.current) return;
      setInbox({ userId, notifications: data.notifications, unread: data.unread_count, loaded: true });
      setError(false);
    } catch (err: any) {
      if (err.name !== 'AbortError' && version === requestVersion.current) setError(true);
    }
  }, [userId, getAuthHeaders]);

  useEffect(() => {
    setInbox({ userId, notifications: [], unread: 0, loaded: false });
    setError(false);
    actionBusy.current = false;
    setBusy(false);
    if (!userId) return;
    void refresh();
    const poll = () => { if (document.visibilityState === 'visible') void refresh(); };
    const interval = window.setInterval(poll, 15000);
    window.addEventListener('focus', poll);
    document.addEventListener('visibilitychange', poll);
    window.addEventListener('fixflow:notifications-changed', poll);
    return () => {
      requestVersion.current++;
      requestController.current?.abort();
      clearInterval(interval);
      window.removeEventListener('focus', poll);
      document.removeEventListener('visibilitychange', poll);
      window.removeEventListener('fixflow:notifications-changed', poll);
    };
  }, [userId, refresh]);

  const mutate = async (path: string, method: string) => {
    if (!userId || actionBusy.current) return false;
    actionBusy.current = true;
    // Ignore earlier poll responses while committing a read/dismiss action.
    const version = ++requestVersion.current;
    requestController.current?.abort();
    setBusy(true);
    try {
      const response = await fetch(path, { method, headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Notification action failed');
      if (activeUserId.current !== userId) return false;
      await refresh(true);
      return true;
    } catch {
      if (version === requestVersion.current) setError(true);
      return false;
    } finally {
      if (activeUserId.current === userId) { actionBusy.current = false; setBusy(false); }
    }
  };

  return {
    notifications: inbox.userId === userId ? inbox.notifications : [],
    unreadCount: inbox.userId === userId ? inbox.unread : 0,
    loading: !inbox.loaded && !error,
    error, busy, refresh,
    markRead: (id: string) => mutate(`/api/notifications/${encodeURIComponent(id)}/read`, 'PUT'),
    markAllRead: () => mutate('/api/notifications/read-all', 'PUT'),
    dismiss: (id: string) => mutate(`/api/notifications/${encodeURIComponent(id)}`, 'DELETE'),
    clearRead: () => mutate('/api/notifications/read', 'DELETE'),
  };
}

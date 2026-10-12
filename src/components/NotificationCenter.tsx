import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Check, X, RefreshCw, Wrench, Receipt, ArrowRightLeft, Inbox } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification, ServiceJob } from '../types';
import type { TranslationKey } from '../i18n/translations';

interface Props { onOpenJob: (job: ServiceJob) => void }

export function NotificationCenter({ onOpenJob }: Props) {
  const { t, language, formatCurrency, getAuthHeaders, currentUser } = useApp();
  const { notifications, unreadCount, loading, error, busy, refresh, markRead, markAllRead, dismiss, clearRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const [jobError, setJobError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const userId = useRef(currentUser?.id);
  userId.current = currentUser?.id;

  useEffect(() => {
    setOpen(false); setJobError(false); setOpening(null);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', keyboard); };
  }, [open]);

  const title = (notification: AppNotification): string => {
    const keys: Record<AppNotification['type'], TranslationKey> = {
      new_job: 'notificationNewJob', assigned_job: 'notificationAssignedJob',
      reassigned_job: 'notificationReassignedJob', status_change: 'notificationStatusChange', payment_received: 'notificationPaymentReceived',
    };
    return t(keys[notification.type]);
  };
  const description = (notification: AppNotification): string => {
    if (notification.type === 'status_change') {
      const status = (id?: string) => id ? t(`status_${id}` as TranslationKey) : '';
      return `${notification.service_number} · ${status(notification.previous_status)} → ${status(notification.status_id)}`;
    }
    if (notification.type === 'payment_received') return `${notification.service_number} · ${formatCurrency(notification.amount || 0, notification.currency_code)}`;
    return notification.service_number;
  };
  const timestamp = (value: string) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString(language === 'my' ? 'my-MM' : language === 'th' ? 'th-TH' : language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  };
  const openJob = async (notification: AppNotification) => {
    if (opening || busy) return;
    const recipient = currentUser?.id;
    setOpening(notification.id); setJobError(false);
    try {
      if (!notification.read_at && !await markRead(notification.id)) return;
      const response = await fetch(`/api/jobs/${encodeURIComponent(notification.service_job_id)}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Repair unavailable');
      const job = await response.json();
      if (userId.current !== recipient) return;
      setOpen(false);
      onOpenJob(job);
    } catch {
      if (userId.current === recipient) setJobError(true);
    } finally {
      if (userId.current === recipient) setOpening(null);
    }
  };
  const visible = unreadOnly ? notifications.filter(notification => !notification.read_at) : notifications;

  return (
    <div ref={root} className="relative">
      <button ref={trigger} type="button" aria-label={`${t('notifications')} (${unreadCount} ${t('notificationUnread')})`}
        aria-expanded={open} aria-controls="notification-panel"
        onClick={() => { setOpen(!open); setJobError(false); if (!open) void refresh(); }}
        className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-bold ring-2 ring-[var(--surface)]" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && (
        <section id="notification-panel" aria-label={t('notifications')}
          className="fixed top-[4.5rem] left-3 right-3 sm:left-auto sm:right-6 sm:w-96 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl z-50 overflow-hidden text-[var(--text)]">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
            <div><h2 className="text-sm font-bold">{t('notifications')}</h2><p className="text-[11px] text-[var(--text-muted)]" aria-live="polite">{unreadCount} {t('notificationUnread')}</p></div>
            <div className="flex gap-1">
              <button type="button" onClick={() => void refresh()} disabled={busy} aria-label={t('notificationRefresh')} title={t('notificationRefresh')} className="p-2 rounded-lg hover:bg-[var(--surface-2)] disabled:opacity-40"><RefreshCw className="w-4 h-4" /></button>
              <button type="button" onClick={() => { setOpen(false); trigger.current?.focus(); }} aria-label={t('notificationClose')} className="p-2 rounded-lg hover:bg-[var(--surface-2)]"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-[var(--border)]">
            <div className="flex gap-1">
              <button type="button" aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${!unreadOnly ? 'bg-blue-500/10 text-blue-600' : 'text-[var(--text-muted)]'}`}>{t('notificationAll')}</button>
              <button type="button" aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${unreadOnly ? 'bg-blue-500/10 text-blue-600' : 'text-[var(--text-muted)]'}`}>{t('notificationUnread')}</button>
            </div>
            <button type="button" disabled={busy || !unreadCount} onClick={() => void markAllRead()} className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold disabled:opacity-40"><CheckCheck className="w-3.5 h-3.5" />{t('notificationMarkAllRead')}</button>
          </div>
          {(error || jobError) && <p role="alert" className="px-4 py-2 text-xs text-rose-600 bg-rose-500/10">{t(jobError ? 'notificationJobUnavailable' : 'notificationLoadError')}</p>}
          <div className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain">
            {loading ? <p className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">{t('notificationLoading')}</p> : visible.length === 0 ? (
              <div className="px-4 py-9 text-center text-[var(--text-muted)]"><Inbox className="w-8 h-8 mx-auto mb-3 opacity-50" /><p className="text-sm font-semibold">{t(unreadOnly ? 'notificationCaughtUp' : 'notificationEmpty')}</p><p className="text-xs mt-1">{t('notificationEmptyHint')}</p></div>
            ) : <ul className="divide-y divide-[var(--border)]">{visible.map(notification => {
              const Icon = notification.type === 'payment_received' ? Receipt : notification.type === 'status_change' || notification.type === 'reassigned_job' ? ArrowRightLeft : Wrench;
              return (
                <li key={notification.id} className={`flex gap-2 px-3 py-3 ${!notification.read_at ? 'bg-blue-500/5' : ''}`}>
                  <button type="button" onClick={() => void openJob(notification)} disabled={busy || Boolean(opening)} className="flex flex-1 min-w-0 gap-3 text-left rounded-lg hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-60">
                    <span className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-xl ${notification.type === 'payment_received' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}><Icon className="w-4 h-4" /></span>
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-xs font-semibold">{title(notification)}{!notification.read_at && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}</span><span className="block text-xs text-[var(--text-muted)] mt-1 break-words">{description(notification)}</span><time dateTime={notification.created_at} className="block text-[10px] text-[var(--text-muted)] mt-1.5">{timestamp(notification.created_at)}</time></span>
                  </button>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!notification.read_at && <button type="button" disabled={busy || Boolean(opening)} onClick={() => void markRead(notification.id)} aria-label={t('notificationMarkRead')} title={t('notificationMarkRead')} className="p-1 rounded-md text-[var(--text-muted)] hover:text-blue-600 hover:bg-[var(--surface-2)] disabled:opacity-40"><Check className="w-3.5 h-3.5" /></button>}
                    <button type="button" disabled={busy || Boolean(opening)} onClick={() => void dismiss(notification.id)} aria-label={t('notificationDismiss')} title={t('notificationDismiss')} className="p-1 rounded-md text-[var(--text-muted)] hover:text-rose-600 hover:bg-[var(--surface-2)] disabled:opacity-40"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </li>
              );
            })}</ul>}
          </div>
          <div className="flex justify-between items-center gap-2 px-4 py-2.5 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
            <span>{t('notificationUpdateHint')}</span><button type="button" disabled={busy || !notifications.some(notification => notification.read_at)} onClick={() => void clearRead()} className="font-semibold hover:text-[var(--text)] disabled:opacity-40">{t('notificationClearRead')}</button>
          </div>
        </section>
      )}
    </div>
  );
}

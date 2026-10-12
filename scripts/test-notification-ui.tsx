/** Component interaction tests with an isolated app context and fake API. */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { NotificationCenter } from '../src/components/NotificationCenter';
import { en } from '../src/i18n/locales/en';
import { my } from '../src/i18n/locales/my';

(async () => {
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
let data = [
 { id: 'NTF-1', user_id: 'admin', type: 'new_job', service_job_id: 'JOB-1', service_number: 'SRV-202610-0001', created_at: '2026-10-10T10:00:00Z' },
 { id: 'NTF-2', user_id: 'admin', type: 'payment_received', service_job_id: 'JOB-1', service_number: 'SRV-202610-0001', amount: 100, currency_code: 'THB', created_at: '2026-10-10T09:59:00Z' },
 { id: 'NTF-3', user_id: 'admin', type: 'status_change', service_job_id: 'JOB-1', service_number: 'SRV-202610-0001', status_id: 'repairing', previous_status: 'diagnosing', created_at: '2026-10-10T09:58:00Z', read_at: '2026-10-10T10:00:00Z' },
] as any[];
let loadFailure = false, jobDenied = false;
const app: any = { currentUser: { id: 'admin' }, language: 'en', t: (key: string) => (en as Record<string, string>)[key] || key, formatCurrency: (amount: number, currency: string) => `${currency} ${amount}`, getAuthHeaders: () => ({ Authorization: 'Bearer opaque-session' }) };
(globalThis as any).__testApp = app;
const calls: any[] = [];
(globalThis as any).fetch = async (path: string, options: any = {}) => {
 calls.push({ path, options });
 assert.equal(options.headers.Authorization, 'Bearer opaque-session');
 if (path.startsWith('/api/jobs/')) return new Response(JSON.stringify(jobDenied ? { error: 'Forbidden' } : { id: 'JOB-1', service_number: 'SRV-202610-0001' }), { status: jobDenied ? 403 : 200 });
 if (path === '/api/notifications' && loadFailure) return new Response('{}', { status: 503 });
 if (options.method === 'PUT' && path.endsWith('/read-all')) data.forEach(item => item.read_at ??= '2026-10-10T10:01:00Z');
 else if (options.method === 'PUT') { const id = path.split('/')[3]; const item = data.find(item => item.id === id); if (item) item.read_at ??= '2026-10-10T10:01:00Z'; }
 if (options.method === 'DELETE' && path.endsWith('/read')) data = data.filter(item => !item.read_at);
 else if (options.method === 'DELETE') data = data.filter(item => item.id !== path.split('/')[3]);
 return new Response(JSON.stringify(path === '/api/notifications' ? { notifications: data, unread_count: data.filter(item => !item.read_at).length } : { success: true }), { status: 200 });
};
const host = document.getElementById('root')!;
const root = createRoot(host);
let selected: any;
const render = async () => { await act(async () => root.render(<NotificationCenter onOpenJob={job => { selected = job; }} />)); };
let passed = 0;
const check = (name: string, condition: any) => { assert.ok(condition, name); passed++; console.log('PASS:', name); };
const click = async (element: Element) => { assert.ok(element); await act(async () => element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))); };
const button = (label: string) => Array.from(document.querySelectorAll('button')).find(item => item.getAttribute('aria-label') === label || item.textContent === label)!;
const bell = () => document.querySelector('button[aria-controls="notification-panel"]')!;
await render();
check('Bell shows unread count before opening', bell().getAttribute('aria-label')?.includes('(2 Unread)'));
check('Notification panel starts closed', !document.getElementById('notification-panel'));
await click(bell());
check('Opening the bell shows all inbox events', document.querySelectorAll('li').length === 3);
check('Payment event displays actual currency and amount', document.getElementById('notification-panel')?.textContent?.includes('THB 100'));
await click(button('Unread'));
check('Unread filter hides already-read notifications', document.querySelectorAll('li').length === 2);
await click(button('Mark as read'));
check('Single read immediately updates badge and filtered list', document.querySelectorAll('li').length === 1 && bell().getAttribute('aria-label')?.includes('(1 Unread)'));
await click(button('Mark all read'));
check('Mark all read displays caught-up empty state', document.getElementById('notification-panel')?.textContent?.includes('You’re all caught up'));
await click(button('All'));
check('Read events remain in the All view', document.querySelectorAll('li').length === 3);
await click(button('Clear read'));
check('Clear read removes read notifications', document.querySelectorAll('li').length === 0 && document.getElementById('notification-panel')?.textContent?.includes('No notifications yet'));
loadFailure = true;
await click(button('Refresh notifications'));
check('Fetch errors display an actionable message', document.querySelector('[role=alert]')?.textContent?.includes('Could not update notifications'));
loadFailure = false;
data = [{ id: 'NTF-4', user_id: 'admin', type: 'assigned_job', service_job_id: 'JOB-1', service_number: 'SRV-202610-0001', created_at: '2026-10-10T10:00:00Z' }];
await click(button('Refresh notifications'));
check('Refreshing recovers from an inbox error', !document.querySelector('[role=alert]') && document.querySelectorAll('li').length === 1);
await click(document.querySelector('li button')!);
check('Clicking notification marks it read and opens the correct ticket', selected?.id === 'JOB-1' && data[0].read_at && !document.getElementById('notification-panel'));
await click(bell());
await act(async () => document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
check('Escape closes panel and restores bell focus', !document.getElementById('notification-panel') && document.activeElement === bell());
await click(bell());
await act(async () => document.body.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true })));
check('Clicking outside closes panel', !document.getElementById('notification-panel'));
await click(bell());
jobDenied = true; selected = null;
await click(document.querySelector('li button')!);
check('A reassigned or deleted ticket shows a friendly access error', selected === null && document.querySelector('[role=alert]')?.textContent?.includes('no longer available'));
await click(button('Dismiss notification'));
check('Dismiss action removes its notification', document.querySelectorAll('li').length === 0);
app.language = 'my'; app.t = (key: string) => (my as Record<string, string>)[key] || (en as Record<string, string>)[key] || key;
await render();
check('Myanmar notification labels render', document.getElementById('notification-panel')?.textContent?.includes('အသိပေးချက်များ'));
app.currentUser = { id: 'technician' }; data = [];
await render();
check('Account change closes old inbox and removes old badge', !document.getElementById('notification-panel') && bell().getAttribute('aria-label')?.includes('(0 '));
check('Inbox calls use server-issued authentication headers', calls.filter(item => item.path.startsWith('/api/notifications')).length > 10);
await act(async () => root.unmount());
console.log(`\nNOTIFICATION UI SUMMARY: ${passed} PASSED`);
dom.window.close();
})().catch(error => { console.error(error); process.exit(1); });

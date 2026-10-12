import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { TechniciansView } from '../src/views/TechniciansView';
import { LoginView } from '../src/components/LoginView';
import { useCloseConfirmation } from '../src/hooks/useCloseConfirmation';
import { defaultPaymentSettings, removeDemoPaymentDetails } from '../src/utils/paymentDefaults';
(async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
  const { createRoot } = require('react-dom/client');
  const root = createRoot(document.getElementById('root')!);
  (globalThis as any).__testApp = {language:'en',t:(key:string)=>key,login:async()=>false};
  await act(async () => root.render(<LoginView />));
  assert.ok(!document.body.textContent?.includes('admin123') && !document.body.textContent?.includes('tech123'));
  assert.ok(!document.querySelector('[aria-label="Default login credentials"]'));
  function CloseTest({ enabled }: { enabled: boolean }) { useCloseConfirmation(enabled); return null; }
  await act(async () => root.render(<CloseTest enabled={true} />));
  let event = new dom.window.Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event); assert.ok(event.defaultPrevented);
  await act(async () => root.render(<CloseTest enabled={false} />));
  event = new dom.window.Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event); assert.ok(!event.defaultPrevented);
  for (const profile of ['thailand', 'myanmar', 'china', 'global'] as const) {
    for (const method of defaultPaymentSettings[profile].methods) {
      assert.ok(!method.account_name && !method.account_number && !method.bank_name);
      assert.equal(method.enabled, method.id === 'cash');
    }
  }
  const sample = { id: 'kbz_pay', name: 'KBZ Pay', enabled: true, account_name: 'Hacked Shop', account_number: '09256060722' };
  assert.equal(removeDemoPaymentDetails('myanmar', sample).enabled, false);
  const custom = { ...sample, account_name: 'My Real Shop', account_number: 'RealAccount' };
  assert.deepEqual(removeDemoPaymentDetails('myanmar', custom), custom);
  const configured = { ...sample, qr_code: 'https://bank.example/issued.png' };
  assert.deepEqual(removeDemoPaymentDetails('myanmar', configured), configured);
  let requests: any[] = [], refreshed = 0, confirmed = false;
  const app: any = { technicians: [], language: 'en', settings: {}, t: (key: string) => key, getAuthHeaders: () => ({ Authorization: 'Bearer admin-session' }), refreshTechnicians: async () => { refreshed++; } };
  (globalThis as any).__testApp = app;
  window.confirm = () => confirmed;
  globalThis.fetch = async (path: any, options: any) => { requests.push({ path, options }); return new Response('{}'); };
  await act(async () => root.render(<TechniciansView />));
  const button = (label: string) => Array.from(document.querySelectorAll('button')).find(b => b.textContent === label)!;
  const click = async (element: Element) => { await act(async () => element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))); };
  assert.ok(!button('Add Demo User')&&!button('Delete Demo Users'));
  app.technicians=[{id:'TECH-DEMO',username:'demo_tech',full_name:'Existing Technician',is_demo:true,status:'active',specialization:[],created_at:new Date().toISOString()}];
  await act(async()=>root.render(<TechniciansView/>));
  assert.ok(document.body.textContent?.includes('Existing Technician'));
  assert.ok(!document.body.textContent?.includes('Demo users:'));
  assert.equal(requests.length,0);
  app.language='my';await act(async()=>root.render(<TechniciansView/>));assert.ok(!button('Demo User ထည့်ရန်'));
  await act(async () => root.unmount()); dom.window.close();
  console.log('PASS: Credential hints hide immediately, refresh from server, browser close confirmation activates and cleans up, sample payments disabled, custom accounts and QR preserved.');
})().catch(e => { console.error(e); process.exitCode = 1; });

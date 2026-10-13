import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { CustomersView } from '../src/views/CustomersView';
(async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = require('react-dom/client');
  const root = createRoot(document.getElementById('root')!);
  let deleted: any[] = [], fail = false, previewed: any[] = [];
  const app: any = { role: 'admin', customers: [{ id: 'CUST-TEST', name: 'Functional Test Customer', phone: '09', created_at: '' }], jobs: [], technicians: [], language: 'en', t: (key: string) => key, formatDate: () => '', formatCurrency: () => '',
    previewCustomerDeletion: async (ids: string[]) => { previewed.push(ids); if (fail) throw new Error('Preview failed'); return { names: ['Functional Test Customer'], customers: 1, devices: 1, jobs: 20, parts: 20, payments: 0, income: 0, notifications: 0, revision: 'preview-token' }; },
    deleteCustomersWithRecords: async (ids: string[], revision: string) => { deleted.push({ ids, revision }); }
  };
  (globalThis as any).__testApp = app;
  const render = () => act(async () => root.render(<CustomersView onOpenJob={() => {}} />));
  const click = async (element: Element | null) => { assert.ok(element); await act(async () => element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))); };
  const button = (label: string) => Array.from(document.querySelectorAll('button')).find(b => b.textContent === label)!;
  await render();
  await click(document.querySelector('button[title="Delete Customer"]'));
  assert.deepEqual(previewed[0], ['CUST-TEST']);
  assert.ok(document.querySelector('[role=dialog]')?.textContent?.includes('Repair jobs'));
  assert.ok(document.querySelector('[role=dialog]')?.textContent?.includes('20'));
  assert.ok((button('Delete All Listed Records') as HTMLButtonElement).disabled);
  await click(button('Cancel')); assert.equal(deleted.length, 0); assert.ok(!document.querySelector('[role=dialog]'));
  await click(document.querySelector('button[title="Delete Customer"]'));
  await click(document.querySelector('[role=dialog] input[type=checkbox]'));
  await click(button('Delete All Listed Records'));
  assert.deepEqual(deleted[0], { ids: ['CUST-TEST'], revision: 'preview-token' }); assert.ok(!document.querySelector('[role=dialog]'));
  fail = true;
  await click(document.querySelector('button[title="Delete Customer"]'));
  assert.equal(document.querySelector('[role=alert]')?.textContent, 'Preview failed');
  assert.ok((button('Delete All Listed Records') as HTMLButtonElement).disabled);
  await click(button('Cancel'));
  fail = false; app.language = 'my'; await render();
  await click(document.querySelector('button[title="Delete Customer"]'));
  assert.ok(document.getElementById('customer-delete-title')?.textContent?.includes('ဖျက်ရန်'));
  await click(button('မဖျက်ပါ'));
  await click(document.querySelector('input[type=checkbox]'));
  await click(button('Delete Selected (1)'));
  assert.deepEqual(previewed.at(-1), ['CUST-TEST']);
  await act(async () => root.unmount()); dom.window.close();
  console.log('PASS: Customer deletion previews linked counts, requires acknowledgement, Cancel does not delete, confirmation sends selected IDs and revision, failed preview blocks deletion, Myanmar labels and bulk selection work.');
})().catch(error => { console.error(error); process.exitCode = 1; });

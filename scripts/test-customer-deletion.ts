import { existsSync } from 'node:fs';
/** Isolated HTTP regression tests. Never start these against the live shop database. */
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';

const root = process.cwd();
const sourcePath = resolve('data/db.json');
const sourceBytes=()=>existsSync(sourcePath)?readFileSync(sourcePath):Buffer.from('');
const original=sourceBytes();
const fixture = JSON.parse(readFileSync('scripts/fixtures/legacy-demo-db.json','utf8'));
fixture.users.find((user:any)=>user.role==='admin').password='admin123';
fixture.settings.telegramBot = { ...fixture.settings.telegramBot, enabled: false, bot_token: '' };
const directory = mkdtempSync(join(tmpdir(), 'fixflow-test-'));
const dbPath = join(directory, 'db.json');
writeFileSync(dbPath, JSON.stringify(fixture));
const socket = createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = (socket.address() as any).port;
await new Promise<void>(resolve => socket.close(() => resolve()));
const baseUrl = `http://127.0.0.1:${port}`;
let child: ChildProcess | undefined;
let output = '';
let passed = 0;
const headers = (token?: string) => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });
async function api(path: string, method = 'GET', body?: any, token?: string) {
  const response = await fetch(baseUrl + path, { method, headers: headers(token), ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  return { status: response.status, data };
}
function check(name: string, condition: any) {
  assert.ok(condition, name);
  console.log(`PASS: ${name}`);
  passed++;
}
async function start() {
  output = '';
  child = spawn(process.execPath, ['--import', 'tsx', '--import', './scripts/mock-telegram.ts', 'server.ts'], {
    cwd: root, env: { ...process.env, PORT: String(port), NODE_ENV: 'production', FIXFLOW_DATA_DIR: directory }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout?.on('data', data => { output += data; });
  child.stderr?.on('data', data => { output += data; });
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try { if ((await api('/api/health')).status === 200) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not start: ${output}`);
}
async function stop() {
  if (child && child.exitCode === null) { const done = once(child, 'exit'); child.kill(); await done; }
  child = undefined;
}
// Add a linked customer fixture without touching the source database.
const stamp = new Date().toISOString();
const customer = { ...fixture.customers[0], id: 'CUST-CASCADE', name: 'Cascade test customer' };
const device = { ...fixture.devices[0], id: 'DEV-CASCADE', customer_id: customer.id };
const job = { ...fixture.service_jobs[0], id: 'JOB-CASCADE', service_number: 'SRV-CASCADE-001', customer_id: customer.id, device_id: device.id };
const part = { ...fixture.service_job_parts[0], id: 'PART-CASCADE', service_job_id: job.id };
const payment = { ...fixture.service_payments[0], id: 'PAY-CASCADE', service_job_id: job.id, amount: 10 };
const income = { id: 'INC-CASCADE', date: stamp, reference: payment.id, service_job_id: job.id, service_number: job.service_number, description: 'Cascade payment', amount: 10, currency: 'MMK', payment_method: 'cash', created_by: 'admin', created_at: stamp };
const notice = { id: 'NOT-CASCADE', user_id: 'USR-001', type: 'new_job', service_job_id: job.id, service_number: job.service_number, customer_name: customer.name, created_at: stamp };
fixture.customers.push(customer); fixture.devices.push(device); fixture.service_jobs.push(job); fixture.service_job_parts.push(part); fixture.service_payments.push(payment); fixture.income_records.push(income); fixture.notifications = [...(fixture.notifications || []), notice];
writeFileSync(dbPath, JSON.stringify(fixture));

try {
  await start();
  const admin = (await api('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' })).data.token;
  const tech = (await api('/api/auth/login', 'POST', { username: 'kyawzin', password: 'tech123' })).data.token;
  const selection = { customer_ids: [customer.id] };
  check('Preview rejects unauthenticated clients', (await api('/api/customers/delete-preview', 'POST', selection)).status === 401);
  check('Preview rejects technicians', (await api('/api/customers/delete-preview', 'POST', selection, tech)).status === 403);
  check('Confirmed deletion rejects technicians', (await api('/api/customers/delete-confirmed', 'POST', selection, tech)).status === 403);
  check('Empty selection rejected', (await api('/api/customers/delete-preview', 'POST', { customer_ids: [] }, admin)).status === 400);
  check('Duplicate selection rejected', (await api('/api/customers/delete-preview', 'POST', { customer_ids: [customer.id, customer.id] }, admin)).status === 400);
  check('Unknown selection rejected', (await api('/api/customers/delete-preview', 'POST', { customer_ids: ['missing'] }, admin)).status === 404);
  check('Legacy delete still requires explicit linked-record confirmation', (await api(`/api/customers/${customer.id}`, 'DELETE', undefined, admin)).status === 409);
  let preview = (await api('/api/customers/delete-preview', 'POST', selection, admin)).data;
  check('Preview counts every linked record type', ['customers','devices','jobs','parts','payments','income','notifications'].every(key => preview[key] === 1));
  check('Preview includes selected customer name', preview.names[0] === customer.name);
  check('Missing confirmation revision rejected', (await api('/api/customers/delete-confirmed', 'POST', selection, admin)).status === 400);
  check('Stale or fabricated revision rejected', (await api('/api/customers/delete-confirmed', 'POST', { ...selection, revision: '0'.repeat(64) }, admin)).status === 409);
  const before = JSON.parse(readFileSync(dbPath, 'utf8'));
  const changedDevice = await api(`/api/devices/${device.id}`, 'PUT', { model: 'Changed after preview' }, admin);
  check('Related record updates succeed', changedDevice.status === 200);
  check('Related changes invalidate prior confirmation', (await api('/api/customers/delete-confirmed', 'POST', { ...selection, revision: preview.revision }, admin)).status === 409);
  preview = (await api('/api/customers/delete-preview', 'POST', selection, admin)).data;
  const beforeFailure = readFileSync(dbPath);
  writeFileSync(join(directory, 'backups'), 'not a directory');
  check('Backup failure blocks deletion', (await api('/api/customers/delete-confirmed', 'POST', { ...selection, revision: preview.revision }, admin)).status === 500);
  check('Backup failure leaves database unchanged', readFileSync(dbPath).equals(beforeFailure));
  rmSync(join(directory, 'backups'));
  mkdirSync(join(directory, 'db.json.tmp'));
  check('Database save failure reports failure', (await api('/api/customers/delete-confirmed', 'POST', { ...selection, revision: preview.revision }, admin)).status === 500);
  check('Database save failure leaves file unchanged', readFileSync(dbPath).equals(beforeFailure));
  check('Database save failure restores in-memory records', (await api('/api/customers/delete-preview', 'POST', selection, admin)).data.revision === preview.revision);
  rmSync(join(directory, 'db.json.tmp'), { recursive: true });
  const result = await api('/api/customers/delete-confirmed', 'POST', { ...selection, revision: preview.revision }, admin);
  check('Confirmed linked deletion succeeds', result.status === 200 && result.data.success);
  const after = JSON.parse(readFileSync(dbPath, 'utf8'));
  for (const [key, id] of [['customers',customer.id],['devices',device.id],['service_jobs',job.id],['service_job_parts',part.id],['service_payments',payment.id],['income_records',income.id],['notifications',notice.id]]) {
    check(`Only selected ${key} removed`, JSON.stringify(after[key]) === JSON.stringify(before[key].filter((row: any) => row.id !== id)));
  }
  check('Users, technicians, expenses and settlements unchanged', ['users','technicians','expense_records','settlements'].every(key => JSON.stringify(after[key]) === JSON.stringify(before[key])));
  check('Deletion audit recorded', after.security_audit.some((audit: any) => audit.action === 'CUSTOMERS_AND_LINKED_RECORDS_DELETED'));
  const backup = JSON.parse(readFileSync(join(directory, 'backups', result.data.backup), 'utf8'));
  check('Safety backup retains the full deleted graph', backup.customers.some((row: any) => row.id === customer.id) && backup.service_jobs.some((row: any) => row.id === job.id) && backup.service_payments.some((row: any) => row.id === payment.id));
  await stop(); await start();
  check('Deletion persists across restart', !JSON.parse(readFileSync(dbPath, 'utf8')).customers.some((row: any) => row.id === customer.id));
  const renewed = (await api('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' })).data.token;
  const c1 = (await api('/api/customers', 'POST', { name: 'Bulk A', phone: '090' }, renewed)).data;
  const c2 = (await api('/api/customers', 'POST', { name: 'Bulk B', phone: '091' }, renewed)).data;
  const bulk = { customer_ids: [c1.id,c2.id] };
  const batchPreview = (await api('/api/customers/delete-preview', 'POST', bulk, renewed)).data;
  check('Bulk preview counts both customers', batchPreview.customers === 2);
  check('Bulk confirmed delete succeeds atomically', (await api('/api/customers/delete-confirmed', 'POST', { ...bulk, revision: batchPreview.revision }, renewed)).status === 200);
  check('Original source database unchanged', sourceBytes().equals(original));
  console.log(`CUSTOMER DELETION HTTP SUMMARY: ${passed} PASSED`);
} finally { await stop(); rmSync(directory, { recursive: true, force: true }); }

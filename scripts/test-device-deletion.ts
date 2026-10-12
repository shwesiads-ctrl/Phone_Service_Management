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
  const selection = { device_ids: [device.id] };
  check('Preview rejects unauthenticated clients', (await api('/api/devices/delete-preview', 'POST', selection)).status === 401);
  check('Preview rejects technicians', (await api('/api/devices/delete-preview', 'POST', selection, tech)).status === 403);
  check('Confirmed deletion rejects technicians', (await api('/api/devices/delete-confirmed', 'POST', selection, tech)).status === 403);
  check('Empty selection rejected', (await api('/api/devices/delete-preview', 'POST', { device_ids: [] }, admin)).status === 400);
  check('Duplicate selection rejected', (await api('/api/devices/delete-preview', 'POST', { device_ids: [device.id, device.id] }, admin)).status === 400);
  check('Unknown selection rejected', (await api('/api/devices/delete-preview', 'POST', { device_ids: ['missing'] }, admin)).status === 404);
  check('Legacy delete still requires explicit linked-record confirmation', (await api(`/api/devices/${device.id}`, 'DELETE', undefined, admin)).status === 409);
  let preview = (await api('/api/devices/delete-preview', 'POST', selection, admin)).data;
  check('Preview counts every linked record type', ['devices','jobs','parts','payments','income','notifications'].every(key => preview[key] === 1));
  check('Preview includes selected device name', preview.names[0].includes(device.brand));
  check('Missing confirmation revision rejected', (await api('/api/devices/delete-confirmed', 'POST', selection, admin)).status === 400);
  check('Stale or fabricated revision rejected', (await api('/api/devices/delete-confirmed', 'POST', { ...selection, revision: '0'.repeat(64) }, admin)).status === 409);
  const before = JSON.parse(readFileSync(dbPath, 'utf8'));
  const changedDevice = await api(`/api/devices/${device.id}`, 'PUT', { model: 'Changed after preview' }, admin);
  check('Related record updates succeed', changedDevice.status === 200);
  check('Related changes invalidate prior confirmation', (await api('/api/devices/delete-confirmed', 'POST', { ...selection, revision: preview.revision }, admin)).status === 409);
  preview = (await api('/api/devices/delete-preview', 'POST', selection, admin)).data;
  const beforeFailure = readFileSync(dbPath);
  writeFileSync(join(directory, 'backups'), 'not a directory');
  check('Backup failure blocks deletion', (await api('/api/devices/delete-confirmed', 'POST', { ...selection, revision: preview.revision }, admin)).status === 500);
  check('Backup failure leaves database unchanged', readFileSync(dbPath).equals(beforeFailure));
  rmSync(join(directory, 'backups'));
  mkdirSync(join(directory, 'db.json.tmp'));
  check('Database save failure reports failure', (await api('/api/devices/delete-confirmed', 'POST', { ...selection, revision: preview.revision }, admin)).status === 500);
  check('Database save failure leaves file unchanged', readFileSync(dbPath).equals(beforeFailure));
  check('Database save failure restores in-memory records', (await api('/api/devices/delete-preview', 'POST', selection, admin)).data.revision === preview.revision);
  rmSync(join(directory, 'db.json.tmp'), { recursive: true });
  const result = await api('/api/devices/delete-confirmed', 'POST', { ...selection, revision: preview.revision }, admin);
  check('Confirmed linked deletion succeeds', result.status === 200 && result.data.success);
  const after = JSON.parse(readFileSync(dbPath, 'utf8'));
  for (const [key, id] of [['devices',device.id],['service_jobs',job.id],['service_job_parts',part.id],['service_payments',payment.id],['income_records',income.id],['notifications',notice.id]]) {
    check(`Only selected ${key} removed`, JSON.stringify(after[key]) === JSON.stringify(before[key].filter((row: any) => row.id !== id)));
  }
  check('Users, technicians, expenses and settlements unchanged', ['customers','users','technicians','expense_records','settlements'].every(key => JSON.stringify(after[key]) === JSON.stringify(before[key])));
  check('Deletion audit recorded', after.security_audit.some((audit: any) => audit.action === 'DEVICES_AND_LINKED_RECORDS_DELETED'));
  const backup = JSON.parse(readFileSync(join(directory, 'backups', result.data.backup), 'utf8'));
  check('Safety backup retains the full deleted graph', backup.customers.some((row: any) => row.id === customer.id) && backup.service_jobs.some((row: any) => row.id === job.id) && backup.service_payments.some((row: any) => row.id === payment.id));
  await stop(); await start();
  check('Deletion persists across restart', !JSON.parse(readFileSync(dbPath, 'utf8')).devices.some((row: any) => row.id === device.id));
  const renewed = (await api('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' })).data.token;
  const d1=(await api('/api/devices','POST',{brand:'Bulk',model:'A',customer_id:customer.id,category:'smartphone'},renewed)).data;
  const d2=(await api('/api/devices','POST',{brand:'Bulk',model:'B',customer_id:customer.id,category:'smartphone'},renewed)).data;
  const bulk={device_ids:[d1.id,d2.id]};
  const batchPreview=(await api('/api/devices/delete-preview','POST',bulk,renewed)).data;
  check('Bulk preview counts both devices',batchPreview.devices===2&&batchPreview.customers===0);
  check('Bulk delete is atomic',(await api('/api/devices/delete-confirmed','POST',{...bulk,revision:batchPreview.revision},renewed)).status===200);
  await stop();rmSync(dbPath);await start();
  check('Missing database starts first-admin registration',(await api('/api/auth/setup-status')).data.registration_open);
  const created=await api('/api/auth/setup-admin','POST',{full_name:'Fresh Owner',username:'fresh_owner',password:'FreshOwnerSecret123!'});
  assert.equal(created.status,201);
  const fresh=(await api('/api/auth/login','POST',{username:'fresh_owner',password:'FreshOwnerSecret123!'})).data.token;
  const clean=JSON.parse(readFileSync(dbPath,'utf8'));
  check('Fresh installation contains no demo records',['technicians','customers','devices','service_jobs','service_job_parts','service_payments','income_records','expense_records','settlements'].every(key=>clean[key].length===0));
  check('Fresh install has exactly the owner account',clean.users.length===1&&clean.users[0].username==='fresh_owner');
  const newTech=(await api('/api/users/register','POST',{full_name:'Bench',username:'fresh_bench',role:'technician',password:'FreshBenchSecret123!'},fresh)).data;
  const customerNew=(await api('/api/customers','POST',{name:'Customer',phone:'090'},fresh)).data;
  const deviceNew=(await api('/api/devices','POST',{brand:'Phone',model:'New',customer_id:customerNew.id},fresh)).data;
  const techniciansNew=(await api('/api/technicians','GET',undefined,fresh)).data;
  const newJob=await api('/api/jobs','POST',{customer_id:customerNew.id,device_id:deviceNew.id,technician_id:techniciansNew[0].id,problem_description:'Repair',service_charge:0},fresh);
  check('New job inherits shop warranty',newJob.status===201&&newJob.data.warranty_days===90);
  check('Warranty setting rejects negative values',(await api('/api/settings','PUT',{defaultWarrantyDays:-1},fresh)).status===400);
  await api('/api/settings','PUT',{defaultWarrantyDays:0},fresh);
  const zero=await api('/api/jobs','POST',{customer_id:customerNew.id,device_id:deviceNew.id,technician_id:techniciansNew[0].id,problem_description:'Repair',service_charge:0},fresh);
  check('Zero-day default stays zero',zero.data.warranty_days===0);
  check('Original source database unchanged', sourceBytes().equals(original));
  console.log(`DEVICE DELETION & CLEAN INSTALL SUMMARY: ${passed} PASSED`);
} finally { await stop(); rmSync(directory, { recursive: true, force: true }); }

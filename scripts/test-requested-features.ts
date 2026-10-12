import { existsSync } from 'node:fs';
/** Isolated HTTP regression tests. Never start these against the live shop database. */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
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
try {
  await start();
  check('Public API never exposes default passwords', (await api('/api/auth/default-credentials')).data.credentials.length === 0);
  const admin = (await api('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' })).data.token;
  const tech = (await api('/api/auth/login', 'POST', { username: 'kyawzin', password: 'tech123' })).data.token;
  check('Unauthenticated demo creation blocked', (await api('/api/demo-users', 'POST')).status === 401);
  check('Technician demo creation blocked', (await api('/api/demo-users', 'POST', {}, tech)).status === 403);
  check('Technician demo deletion blocked', (await api('/api/demo-users', 'DELETE', undefined, tech)).status === 403);
  const usersBefore = JSON.parse(readFileSync(dbPath, 'utf8')).users;
  const demo = await api('/api/demo-users', 'POST', {}, admin);
  check('Admin can add marked demo user', demo.status === 201 && demo.data.is_demo && demo.data.username === 'demo_tech');
  check('Repeated add returns same demo account', (await api('/api/demo-users', 'POST', {}, admin)).data.id === demo.data.id);
  const demoLogin = await api('/api/auth/login', 'POST', { username: 'demo_tech', password: 'tech123' });
  check('Demo account authentication still works', demoLogin.status === 200);
  const file = JSON.parse(readFileSync(dbPath, 'utf8'));
  file.service_jobs[0].technician_id = demo.data.id;
  writeFileSync(dbPath, JSON.stringify(file));
  await stop(); await start();
  let adminSession = (await api('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' })).data.token;
  check('Demo deletion refuses assigned repair jobs', (await api('/api/demo-users', 'DELETE', undefined, adminSession)).status === 409);
  check('Demo marker survives restart', (await api('/api/technicians', 'GET', undefined, adminSession)).data.some((t: any) => t.id === demo.data.id && t.is_demo));
  await stop();
  file.service_jobs[0].technician_id = fixture.service_jobs[0].technician_id;
  writeFileSync(dbPath, JSON.stringify(file));
  await start();
  adminSession = (await api('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' })).data.token;
  const demoToken = (await api('/api/auth/login', 'POST', { username: 'demo_tech', password: 'tech123' })).data.token;
  check('Demo deletion succeeds once jobs are reassigned', (await api('/api/demo-users', 'DELETE', undefined, adminSession)).data.deleted === 1);
  check('Repeated demo deletion is safe', (await api('/api/demo-users', 'DELETE', undefined, adminSession)).data.deleted === 0);
  check('Regular accounts remain intact', JSON.stringify(JSON.parse(readFileSync(dbPath, 'utf8')).users) === JSON.stringify(usersBefore));
  check('Deleted demo session cannot authenticate', (await api('/api/auth/me', 'GET', undefined, demoToken)).status === 401);
  check('Changing admin password succeeds', (await api('/api/auth/change-password', 'POST', { current_password: 'admin123', new_password: 'NewSecret123!' }, adminSession)).status === 200);
  check('Admin hint disappears immediately', !(await api('/api/auth/default-credentials')).data.credentials.some((c: any) => c.username === 'admin'));
  check('Unchanged accounts do not expose credential hints', (await api('/api/auth/default-credentials')).data.credentials.length === 0);
  const technician = fixture.users.find((u: any) => u.username === 'kyawzin');
  check('Admin password reset succeeds', (await api(`/api/technicians/${technician.technician_id}/password`, 'PUT', { new_password: 'NewTechSecret123!' }, adminSession)).status === 200);
  check('Technician hint disappears after reset', !(await api('/api/auth/default-credentials')).data.credentials.some((c: any) => c.username === 'kyawzin'));
  await stop(); await start();
  check('Hidden hints persist across restart', (await api('/api/auth/default-credentials')).data.credentials.length === 0);
  check('Changed admin password works after restart', (await api('/api/auth/login', 'POST', { username: 'admin', password: 'NewSecret123!' })).status === 200);
  check('Old default password no longer works', (await api('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' })).status === 401);
  check('Original uploaded database unchanged', sourceBytes().equals(original));
  console.log(`REQUESTED FEATURES HTTP SUMMARY: ${passed} PASSED`);
} finally { await stop(); rmSync(directory, { recursive: true, force: true }); }

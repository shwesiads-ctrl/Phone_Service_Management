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
const original = readFileSync(sourcePath);
const fixture = JSON.parse(original.toString());
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
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAFElEQVR4nGM0qfrGAANMDEgANwcAUkoBrCJhFKAAAAAASUVORK5CYII=';
try {
  await start();
  const admin=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
  const tech=(await api('/api/auth/login','POST',{username:'kyawzin',password:'tech123'})).data.token;
  const registration={full_name:'New Administrator',username:'new_admin',password:'AdminAccount123!',phone:'099111',email:'admin@example.test',role:'admin'};
  check('Public cannot register administrator',(await api('/api/users/register','POST',registration)).status===401);
  check('Technician cannot register administrator',(await api('/api/users/register','POST',registration,tech)).status===403);
  check('Weak administrator password rejected',(await api('/api/users/register','POST',{...registration,password:'short'},admin)).status===400);
  check('Unsupported role rejected',(await api('/api/users/register','POST',{...registration,role:'superadmin'},admin)).status===400);
  const before=JSON.parse(readFileSync(dbPath,'utf8'));
  const result=await api('/api/users/register','POST',registration,admin);
  check('Administrator creates new admin account',result.status===201&&result.data.user.role==='admin'&&result.data.user.active===true);
  check('Admin registration does not create technician records',!result.data.technician&&JSON.parse(readFileSync(dbPath,'utf8')).technicians.length===before.technicians.length);
  check('Registration response excludes password',!result.data.user.password&&!JSON.stringify(result.data).includes(registration.password));
  check('Admin account stores hashed password',JSON.parse(readFileSync(dbPath,'utf8')).users.find((user:any)=>user.username==='new_admin').password.startsWith('scrypt$'));
  check('Duplicate username rejected regardless of case',(await api('/api/users/register','POST',{...registration,username:'NEW_ADMIN'},admin)).status===409);
  const newToken=(await api('/api/auth/login','POST',{username:registration.username,password:registration.password})).data.token;
  check('New administrator can sign in',Boolean(newToken));
  check('New administrator has admin settings permissions',(await api('/api/settings','PUT',{receiptFooterNote:'Registered administrator update'},newToken)).status===200);
  const cashier=await api('/api/users/register','POST',{...registration,username:'new_cashier',role:'cashier'},admin);
  check('New form can register cashier with short code',cashier.status===201&&cashier.data.user.role==='cashier'&&/^CASH-\d{4,}$/.test(cashier.data.user.staff_code));
  const cashierToken=(await api('/api/auth/login','POST',{username:'new_cashier',password:registration.password})).data.token;
  check('Cashier cannot create admin accounts',(await api('/api/users/register','POST',{...registration,username:'forbidden_admin'},cashierToken)).status===403);
  const technician=await api('/api/users/register','POST',{...registration,username:'new_technician',role:'technician'},admin);
  check('New form can register linked technician account',technician.status===201&&technician.data.user.technician_id===technician.data.technician.id);
  check('New registration appears in administrator audit',(await api('/api/audit','GET',undefined,admin)).data.some((entry:any)=>entry.action==='USER_REGISTERED'&&entry.target_id===result.data.user.id));
  await stop();await start();
  const resumed=(await api('/api/auth/login','POST',{username:registration.username,password:registration.password})).data;
  check('New admin persists after server restart',resumed.user.id===result.data.user.id&&resumed.user.role==='admin'&&Boolean(resumed.token));
  const authorizing=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
  const loginCreated=await api('/api/users/register','POST',{...registration,username:'login_created_admin'},authorizing);
  check('Login-side authorization can create administrator',loginCreated.status===201&&loginCreated.data.user.role==='admin');
  await api('/api/auth/logout','POST',{},authorizing);
  check('Temporary authorizing session can be revoked',(await api('/api/auth/me','GET',undefined,authorizing)).status===401);
  check('Created login-side administrator can sign in',(await api('/api/auth/login','POST',{username:'login_created_admin',password:registration.password})).status===200);
  check('Original source data stays unchanged',readFileSync(sourcePath).equals(original));
  console.log(`ADMIN REGISTRATION HTTP SUMMARY: ${passed} PASSED`);
} finally {await stop();rmSync(directory,{recursive:true,force:true});}

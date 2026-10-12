import { LoginLimiter } from '../src/server/loginLimiter';
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
let clock=0;const limiter=new LoginLimiter(()=>clock);for(let i=0;i<5;i++)limiter.fail('ip','test');check('Limiter closes after five failed attempts',limiter.retryAfter('ip','test')===900);clock=900001;check('Cooldown expires without restarting server',limiter.retryAfter('ip','test')===0);limiter.fail('ip','test');limiter.success('ip','test');check('Successful login clears account failures',limiter.retryAfter('ip','test')===0);
try {
 await start();const admin=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
 const tech=(await api('/api/auth/login','POST',{username:'kyawzin',password:'tech123'})).data.token;
 check('Account list is admin-only',(await api('/api/users','GET',undefined,tech)).status===403);
 check('Anonymous cannot read user roles',(await api('/api/users')).status===401);
 const users=(await api('/api/users','GET',undefined,admin)).data;
 check('User list excludes passwords',users.length>0&&users.every((user:any)=>!user.password&&!user.password_hash));
 const account=await api('/api/users/register','POST',{full_name:'Access Test',username:'access_test',password:'AccessPassword123!',role:'cashier',email:'access@example.test'},admin);
 const id=account.data.user.id;
 const initial=(await api('/api/auth/login','POST',{username:'access_test',password:'AccessPassword123!'})).data.token;
 check('Technician cannot grant admin role',(await api(`/api/users/${id}/access`,'PUT',{role:'admin',active:true},tech)).status===403);
 check('Admin can change account role',(await api(`/api/users/${id}/access`,'PUT',{role:'admin',active:true},admin)).status===200);
 check('Role change revokes old session',(await api('/api/auth/me','GET',undefined,initial)).status===401);
 const promoted=(await api('/api/auth/login','POST',{username:'access@example.test',password:'AccessPassword123!'})).data;
 check('Unique email login works with new role',promoted.user.role==='admin'&&Boolean(promoted.token));
 check('Self-demotion is rejected',(await api(`/api/users/${id}/access`,'PUT',{role:'cashier',active:true},promoted.token)).status===409);
 check('Admin cannot disable itself',(await api(`/api/users/${users.find((u:any)=>u.username==='admin').id}/access`,'PUT',{active:false},admin)).status===409);
 check('Unlinked technician role rejected',(await api(`/api/users/${id}/access`,'PUT',{role:'technician',active:true},admin)).status===400);
 check('Admin can disable another account',(await api(`/api/users/${id}/access`,'PUT',{active:false},admin)).status===200);
 check('Disabled account session revoked',(await api('/api/auth/me','GET',undefined,promoted.token)).status===401);
 check('Disabled account cannot log in',(await api('/api/auth/login','POST',{username:'access_test',password:'AccessPassword123!'})).status===403);
 await api(`/api/users/${id}/access`,'PUT',{active:true,password:'ReplacementPassword123!'},admin);
 check('Reset password replaces old password',(await api('/api/auth/login','POST',{username:'access_test',password:'AccessPassword123!'})).status===401&&(await api('/api/auth/login','POST',{username:'access_test',password:'ReplacementPassword123!'})).status===200);
 for(let i=0;i<5;i++)check('Invalid password counted',(await api('/api/auth/login','POST',{username:'access_test',password:'wrong'})).status===401);
 check('Login cooldown blocks further attempts',(await api('/api/auth/login','POST',{username:'access_test',password:'ReplacementPassword123!'})).status===429);
 check('Email cannot bypass account cooldown',(await api('/api/auth/login','POST',{username:'access@example.test',password:'ReplacementPassword123!'})).status===429);
 check('Other administrator remains usable',(await api('/api/auth/me','GET',undefined,admin)).status===200);
 check('Source data remains unchanged',readFileSync(sourcePath).equals(original));
 console.log(`LOGIN SECURITY & ROLES HTTP SUMMARY: ${passed} PASSED`);
}finally{await stop();rmSync(directory,{recursive:true,force:true});}

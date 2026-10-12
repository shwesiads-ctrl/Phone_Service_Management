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
fixture.users=fixture.users.filter((user:any)=>user.role!=='admin');fixture.admin_setup_complete=false;
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
  check('Fresh installation opens registration',(await api('/api/auth/setup-status')).data.registration_open===true);
  check('Fixed default administrator cannot sign in',(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).status===409);
  check('Invalid first-admin password rejected',(await api('/api/auth/setup-admin','POST',{full_name:'Shop Admin',username:'shop_admin',password:'short'})).status===400);
  mkdirSync(dbPath+'.tmp');
  check('Failed database save does not create account',(await api('/api/auth/setup-admin','POST',{full_name:'Shop Admin',username:'failed_admin',password:'MyAdminPassword123!'})).status===500);
  check('Failed save keeps registration open',(await api('/api/auth/setup-status')).data.registration_open===true);
  rmSync(dbPath+'.tmp',{recursive:true});
  const created=await api('/api/auth/setup-admin','POST',{full_name:'Shop Admin',username:'shop_admin',password:'MyAdminPassword123!',role:'cashier'});
  check('First-admin creation needs no previous account',created.status===201&&created.data.user.role==='admin');
  check('Setup does not disclose stored password',!created.data.user.password);
  check('Registration closes immediately',(await api('/api/auth/setup-status')).data.registration_open===false);
  check('Further unauthenticated admin creation blocked',(await api('/api/auth/setup-admin','POST',{full_name:'Another',username:'another',password:'AnotherPassword123!'})).status===409);
  const login=await api('/api/auth/login','POST',{username:'shop_admin',password:'MyAdminPassword123!'});
  check('Created administrator can sign in',login.status===200&&Boolean(login.data.token));
  check('Created administrator can access settings',(await api('/api/settings','GET',undefined,login.data.token)).status===200);
  await stop();await start();
  check('Registration remains closed across restart',(await api('/api/auth/setup-status')).data.registration_open===false);
  check('New account persists across restart',(await api('/api/auth/login','POST',{username:'shop_admin',password:'MyAdminPassword123!'})).status===200);
  const stored=JSON.parse(readFileSync(dbPath,'utf8'));check('Only chosen administrator exists',stored.users.filter((user:any)=>user.role==='admin').length===1&&stored.admin_setup_complete===true);
  await stop();
  const legacy=JSON.parse(readFileSync('scripts/fixtures/legacy-demo-db.json','utf8'));legacy.admin_setup_complete=false;legacy.users.filter((user:any)=>user.role==='admin').forEach((user:any)=>{delete user.password;});writeFileSync(dbPath,JSON.stringify(legacy));await start();
  check('Unconfigured legacy default admin allows own-account setup',(await api('/api/auth/setup-status')).data.registration_open===true);
  const attempts=await Promise.all([api('/api/auth/setup-admin','POST',{full_name:'Own Admin',username:'admin',password:'OwnAdminPassword123!'}),api('/api/auth/setup-admin','POST',{full_name:'Other Admin',username:'other_admin',password:'OtherAdminPassword123!'})]);
  check('Concurrent first registration creates exactly one admin',attempts.filter(result=>result.status===201).length===1&&attempts.filter(result=>result.status===409).length===1);
  check('Unconfigured default admin is replaced without changing jobs',JSON.parse(readFileSync(dbPath,'utf8')).users.filter((user:any)=>user.role==='admin').length===1&&JSON.parse(readFileSync(dbPath,'utf8')).service_jobs.length===legacy.service_jobs.length);
  const winner=attempts.findIndex(result=>result.status===201);const chosen=winner===0?{username:'admin',password:'OwnAdminPassword123!'}:{username:'other_admin',password:'OtherAdminPassword123!'};
  const ownerToken=(await api('/api/auth/login','POST',chosen)).data.token;
  check('Legacy backup restores without reopening setup',(await api('/api/restore','POST',{data:legacy},ownerToken)).status===200&&(await api('/api/auth/setup-status')).data.registration_open===false);
  check('Legacy restore retains configured owner login',(await api('/api/auth/login','POST',chosen)).status===200);
  check('Original source data unchanged',sourceBytes().equals(original));
  console.log(`FIRST ADMIN HTTP SUMMARY: ${passed} PASSED`);
} finally {await stop();rmSync(directory,{recursive:true,force:true});}

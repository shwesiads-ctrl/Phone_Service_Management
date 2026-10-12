import { existsSync } from 'node:fs';
/** Isolated HTTP regression tests. Never start these against the live shop database. */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';

const root = process.cwd();
execFileSync('php',['-v'],{stdio:'ignore'}); // This optional suite requires a real PHP CLI in PATH.
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
async function freePort(){const listener=createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');const value=(listener.address() as any).port;await new Promise<void>(resolve=>listener.close(()=>resolve()));return value;}
let phpPort=0;
try {
 await start();const admin=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
 const info=(await api('/api/system/network-info')).data;
 check('PHP CLI is detected',info.php_cli.installed);
 check('Network details use configured backend port',info.node_port===port&&info.firewall_command.includes(String(port)));
 check('PHP rejects Node port collision',(await api('/api/system/php-cli/start','POST',{port},admin)).status===400);
 const occupied=createServer();occupied.listen(0,'0.0.0.0');await once(occupied,'listening');
 try{const result=await api('/api/system/php-cli/start','POST',{port:(occupied.address() as any).port},admin);check('Occupied port returns failure rather than false success',result.status===500&&result.data.success===false&&!result.data.is_running);}finally{await new Promise<void>(resolve=>occupied.close(()=>resolve()));}
 phpPort=await freePort();const result=await api('/api/system/php-cli/start','POST',{port:phpPort},admin);
 assert.equal(result.status,200,JSON.stringify(result.data));
 check('PHP reports ready only after actual backend health check',result.status===200&&result.data.success&&result.data.is_running);
 const proxy=`http://127.0.0.1:${phpPort}`;
 const health=await fetch(proxy+'/api/health');check('PHP proxies custom-port backend',health.ok&&(await health.json()).server==='FixFlow-Node');
 const spa=await fetch(proxy+'/cashier/dashboard');check('PHP serves deep-link SPA',spa.ok&&(await spa.text()).includes('<div id="root">'));
 const index=await (await fetch(proxy)).text();const asset=index.match(/src="([^" ]+\.js)"/)!;
 const js=await fetch(proxy+asset[1]);check('PHP serves production JS asset',js.ok&&(js.headers.get('content-type') || '').includes('javascript'));
 const login=await fetch(proxy+'/api/auth/login',{method:'POST',headers:headers(),body:JSON.stringify({username:'admin',password:'admin123'})});const loginText=await login.text();assert.equal(login.status,200,'PHP login HTTP status; response: '+loginText);const token=JSON.parse(loginText).token;check('PHP forwards POST body for login',login.ok&&Boolean(token));
 const users=await fetch(proxy+'/api/users',{headers:headers(token)});check('PHP forwards bearer Authorization',users.ok&&Array.isArray(await users.json()));
 const denied=await fetch(proxy+'/api/users');check('PHP preserves backend rejection status',denied.status===401);
 const selection=await fetch(proxy+'/api/settings',{method:'PUT',headers:headers(token),body:JSON.stringify({paymentSettings:{mode:'auto',active_profile:'china'}})});const saved=await selection.json();check('Payment profile is persisted as manual through PHP',selection.ok&&saved.paymentSettings.mode==='manual'&&saved.paymentSettings.active_profile==='china');
 check('PHP stop succeeds',(await api('/api/system/php-cli/stop','POST',{},admin)).data.success);
 check('Network status becomes stopped',!(await api('/api/system/network-info')).data.php_cli.is_running);
 check('PHP can restart',(await api('/api/system/php-cli/start','POST',{port:phpPort},admin)).data.success);
 await stop();
 await new Promise(resolve=>setTimeout(resolve,150));let stopped=false;try{await fetch(proxy+'/api/health',{signal:AbortSignal.timeout(500)});}catch{stopped=true;}check('Stopping Node also stops its PHP child',stopped);
 await start();const next=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
 check('Manual profile survives server restart',(await api('/api/settings','GET',undefined,next)).data.paymentSettings.active_profile==='china');
 check('Source database is unchanged',sourceBytes().equals(original));
 console.log(`PHP CLI & MANUAL PAYMENTS SUMMARY: ${passed} PASSED`);
} finally {if(child&&child.exitCode===null){try{const token=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;await api('/api/system/php-cli/stop','POST',{},token);}catch{}}await stop();rmSync(directory,{recursive:true,force:true});}

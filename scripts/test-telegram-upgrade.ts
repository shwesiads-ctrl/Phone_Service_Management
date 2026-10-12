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
 await start();const admin=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
 const tech=(await api('/api/auth/login','POST',{username:'kyawzin',password:'tech123'})).data.token;
 check('Preview is admin-only',(await api('/api/telegram/summary-preview','GET',undefined,tech)).status===403);
 check('Delivery history is admin-only',(await api('/api/telegram/delivery-history','GET',undefined,tech)).status===403);
 check('Invalid calendar dates rejected',(await api('/api/telegram/summary-preview?date=2026-02-31','GET',undefined,admin)).status===400);
 check('Invalid summary time rejected',(await api('/api/telegram','PUT',{daily_summary_time:'24:60'},admin)).status===400);
 check('Invalid time zone rejected',(await api('/api/telegram','PUT',{summary_time_zone:'Not/AZone'},admin)).status===400);
 check('Unsupported summary language rejected',(await api('/api/telegram','PUT',{summary_language:'fr'},admin)).status===400);
 await api('/api/telegram','PUT',{bot_token:'123:test',chat_id:'123',channel_username:'@failed_channel',summary_language:'my',summary_time_zone:'Asia/Yangon',daily_summary_time:'18:00',daily_summary_schedule_enabled:false},admin);
 const preview=await api('/api/telegram/summary-preview?date=2026-10-13','GET',undefined,admin);
 check('Preview uses selected language and time zone',preview.status===200&&preview.data.html.includes('နေ့စဉ်')&&preview.data.summary.time_zone==='Asia/Yangon');
 check('Preview excludes credentials',!JSON.stringify(preview.data).includes('123:test'));
 check('Preview creates no delivery history',(await api('/api/telegram/delivery-history','GET',undefined,admin)).data.length===0);
 const failed=await api('/api/telegram/daily-summary','POST',{date:'2026-10-13'},admin);
 check('Partial recipient failure is reported',failed.status===400&&failed.data.deliveries.length===2);
 const history=(await api('/api/telegram/delivery-history','GET',undefined,admin)).data;
 check('History records successful and failed recipients',history.length===2&&history.some((row:any)=>row.ok)&&history.some((row:any)=>!row.ok));
 check('History contains no bot token',!JSON.stringify(history).includes('123:test'));
 await api('/api/telegram','PUT',{channel_username:''},admin);
 check('Manual summary delivery succeeds',(await api('/api/telegram/daily-summary','POST',{date:'2026-10-13'},admin)).status===200);
 check('Successful delivery updates bot connection status',(await api('/api/telegram','GET',undefined,admin)).data.is_connected===true);
 await stop();await start();const token=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
 check('History survives restart',(await api('/api/telegram/delivery-history','GET',undefined,token)).data.length===3);
 check('Schedule remains explicitly off',!(await api('/api/telegram','GET',undefined,token)).data.daily_summary_schedule_enabled);
 check('Source database remains unchanged',sourceBytes().equals(original));
 console.log(`TELEGRAM UPGRADE HTTP SUMMARY: ${passed} PASSED`);
}finally{await stop();rmSync(directory,{recursive:true,force:true});}

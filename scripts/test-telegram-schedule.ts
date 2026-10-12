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
fixture.settings.telegramBot={...fixture.settings.telegramBot,enabled:true,bot_token:'123:test',chat_id:'123',channel_username:'',notify_on_daily_summary:true,daily_summary_schedule_enabled:true,daily_summary_time:'00:00',summary_time_zone:'UTC',last_daily_summary_attempt:'',delivery_history:[]};
writeFileSync(dbPath,JSON.stringify(fixture));
try {
 await start();let admin=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
 let deliveries:any[]=[];
 for(let i=0;i<75;i++){deliveries=(await api('/api/telegram/delivery-history','GET',undefined,admin)).data;if(deliveries.length)break;await new Promise(resolve=>setTimeout(resolve,500));}
 check('Actual schedule worker delivers one mocked summary',deliveries.length===1&&deliveries[0].ok);
 const config=(await api('/api/telegram','GET',undefined,admin)).data;
 check('Scheduled attempt day is persisted',config.last_daily_summary_attempt===new Date().toISOString().slice(0,10));
 await stop();await start();admin=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
 await new Promise(resolve=>setTimeout(resolve,31000));
 check('Restart does not send the daily summary twice',(await api('/api/telegram/delivery-history','GET',undefined,admin)).data.length===1);
 check('Real shop database is unchanged',sourceBytes().equals(original));
 console.log(`TELEGRAM SCHEDULE WORKER SUMMARY: ${passed} PASSED`);
}finally{await stop();rmSync(directory,{recursive:true,force:true});}

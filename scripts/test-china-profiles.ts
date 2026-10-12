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
fixture.users.push({id:'USR-CASH-legacy-4921fa32',username:'legacy_cashier',full_name:'Legacy Counter',role:'cashier',active:true,created_at:'2026-10-01'});
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
  let admin=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
  const settings=(await api('/api/settings','GET',undefined,admin)).data;
  check('Legacy data gets China payment profile',Array.isArray(settings.paymentSettings.china.methods));
  check('China supports Alipay, WeChat Pay, UnionPay and bank transfer',['alipay','wechat_pay','unionpay','bank_transfer'].every(id=>settings.paymentSettings.china.methods.some((m:any)=>m.id===id)));
  check('China channels have no invented beneficiaries',settings.paymentSettings.china.methods.every((m:any)=>!m.account_name&&!m.account_number));
  check('China non-cash channels are disabled by default',settings.paymentSettings.china.methods.every((m:any)=>m.enabled===(m.id==='cash')));
  const configured=await api('/api/settings','PUT',{paymentSettings:{mode:'manual',active_profile:'china',china:{methods:[{id:'alipay',enabled:true,account_name:'Test merchant',qr_code:image}]}}},admin);
  check('China merchant QR can be saved',configured.status===200&&configured.data.paymentSettings.china.methods.find((m:any)=>m.id==='alipay').qr_code===image);
  check('Partial China update retains other profiles',configured.data.paymentSettings.thailand.methods.length===settings.paymentSettings.thailand.methods.length&&configured.data.paymentSettings.myanmar.methods.length===settings.paymentSettings.myanmar.methods.length);
  check('Partial China update retains other China channels',configured.data.paymentSettings.china.methods.length===settings.paymentSettings.china.methods.length);
  for(const qr of ['data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=','data:image/png;base64,aGVsbG8=','javascript:alert(1)'])check('Invalid QR format rejected',(await api('/api/settings','PUT',{paymentSettings:{china:{methods:[{id:'alipay',qr_code:qr}]}}},admin)).status===400);
  const big='data:image/png;base64,'+'A'.repeat(3*1024*1024);
  check('Oversized QR rejected',(await api('/api/settings','PUT',{paymentSettings:{china:{methods:[{id:'alipay',qr_code:big}]}}},admin)).status===400);
  const legacy=(await api('/api/cashiers','GET',undefined,admin)).data.find((u:any)=>u.username==='legacy_cashier');
  check('Existing long cashier ID migrates to a short display code',legacy.id==='USR-CASH-legacy-4921fa32' && /^CASH-\d{4,}$/.test(legacy.staff_code));
  const cashier=(await api('/api/cashiers','POST',{username:'profile_cashier',full_name:'Cashier Original',password:'CashierPassword123!'},admin)).data;
  let token=(await api('/api/auth/login','POST',{username:cashier.username,password:'CashierPassword123!'})).data.token;
  const profile=await api(`/api/cashiers/${cashier.id}`,'PUT',{full_name:'Cashier Portrait',phone:'090001',email:'cashier@example.test',address:'Front desk',profile_photo:image,role:'admin',id:'FORGED',staff_code:'CASH-9999'},admin);
  check('Admin can update cashier contact and photo',profile.status===200&&profile.data.profile_photo===image&&profile.data.email==='cashier@example.test');
  check('Cashier profile cannot change role or identity',profile.data.role==='cashier'&&profile.data.id===cashier.id);
  check('Profile update cannot replace short staff code',profile.data.staff_code===cashier.staff_code);
  check('Profile update preserves cashier session',(await api('/api/auth/me','GET',undefined,token)).status===200);
  check('Updated profile visible to cashier',(await api('/api/auth/me','GET',undefined,token)).data.user.full_name==='Cashier Portrait');
  check('Non-image profile photo rejected',(await api(`/api/cashiers/${cashier.id}`,'PUT',{profile_photo:'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='},admin)).status===400);
  check('Cashier cannot edit staff profiles',(await api(`/api/cashiers/${cashier.id}`,'PUT',{full_name:'Forbidden'},token)).status===403);
  check('Cashier cannot edit merchant QR',(await api('/api/settings','PUT',{paymentSettings:{china:{methods:[{id:'alipay',qr_code:image}]}}},token)).status===403);
  const owned=await api('/api/auth/profile','PUT',{full_name:'Cashier Own Profile',username:cashier.username,phone:'090002',email:'own@example.test',profile_photo:image,role:'admin'},token);
  check('Cashier can edit own profile and photo',owned.status===200&&owned.data.user.profile_photo===image);
  check('Own profile cannot escalate permissions',owned.data.user.role==='cashier');
  const sourceJob=fixture.service_jobs[0];
  const job=(await api('/api/jobs','POST',{customer_id:sourceJob.customer_id,device_id:sourceJob.device_id,technician_id:sourceJob.technician_id,currency_code:'CNY',service_charge:100},token)).data;
  const payment=await api('/api/payments','POST',{service_job_id:job.id,payment_method:'alipay',currency_code:'CNY',amount:20,cashier_id:'FORGED'},token);
  check('China channel accepts manually confirmed CNY payment',payment.status===201&&payment.data.payment_method==='alipay');
  check('Payment stores stable trusted cashier identity',payment.data.cashier_id===cashier.id);
  await stop();await start();
  admin=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
  token=(await api('/api/auth/login','POST',{username:cashier.username,password:'CashierPassword123!'})).data.token;
  check('Merchant QR persists across restart',(await api('/api/settings','GET',undefined,admin)).data.paymentSettings.china.methods.find((m:any)=>m.id==='alipay').qr_code===image);
  check('Profile photo persists across restart',(await api('/api/auth/me','GET',undefined,token)).data.user.profile_photo===image);
  check('Stable cashier identity persists on payment',(await api('/api/payments','GET',undefined,token)).data.some((p:any)=>p.id===payment.data.id&&p.cashier_id===cashier.id));
  check('Short staff code persists after restart',(await api('/api/auth/me','GET',undefined,token)).data.user.staff_code===cashier.staff_code);
  check('Migrated legacy display code remains stable',(await api('/api/cashiers','GET',undefined,admin)).data.find((u:any)=>u.id===legacy.id).staff_code===legacy.staff_code);
  check('Original source database remains unchanged',sourceBytes().equals(original));
  console.log(`CHINA & CASHIER PROFILE HTTP SUMMARY: ${passed} PASSED`);
} finally {await stop();rmSync(directory,{recursive:true,force:true});}

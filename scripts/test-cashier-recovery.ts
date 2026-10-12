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
fixture.settings.currency_mode = 'automatic';
fixture.settings.language = 'fr';
writeFileSync(dbPath, JSON.stringify(fixture));
try {
  await start();
  let admin = (await api('/api/auth/login', 'POST', { username:'admin', password:'admin123' })).data.token;
  const tech = (await api('/api/auth/login', 'POST', { username:'kyawzin', password:'tech123' })).data.token;
  check('Legacy automatic settings migrate to manual', (await api('/api/settings','GET',undefined,admin)).data.currency_mode === 'manual');
  check('Removed stored language falls back to English', (await api('/api/settings','GET',undefined,admin)).data.language === 'en');
  const chosen = await api('/api/settings','PUT',{currency:'CNY',language:'zh',currency_mode:'automatic'},admin);
  check('Yuan can be selected and automatic mode is disabled', chosen.status === 200 && chosen.data.currency === 'CNY' && chosen.data.currency_mode === 'manual');
  check('Changing language retains selected currency', (await api('/api/settings','PUT',{language:'th'},admin)).data.currency === 'CNY');
  check('Removed language rejected', (await api('/api/settings','PUT',{language:'fr'},admin)).status === 400);
  check('Unsupported currency rejected', (await api('/api/settings','PUT',{currency:'EUR'},admin)).status === 400);
  const account = { full_name:'Front Counter', username:'cashier_test', password:'CashierSecret123!', role:'admin' };
  check('Cashier creation requires authentication', (await api('/api/cashiers','POST',account)).status === 401);
  check('Technician cannot create cashier', (await api('/api/cashiers','POST',account,tech)).status === 403);
  check('Short cashier password rejected', (await api('/api/cashiers','POST',{...account,password:'short'},admin)).status === 400);
  const created = await api('/api/cashiers','POST',account,admin);
  check('Admin creates cashier with fixed role and no exposed password', created.status === 201 && created.data.role === 'cashier' && !created.data.password && !created.data.technician_id);
  check('Cashier has short sequential staff code and stable internal ID', /^CASH-\d{4,}$/.test(created.data.staff_code) && created.data.id.startsWith('USR-CASH-'));
  check('Duplicate cashier username rejected', (await api('/api/cashiers','POST',account,admin)).status === 409);
  let cashier = (await api('/api/auth/login','POST',{username:account.username,password:account.password})).data.token;
  check('Cashier login succeeds', Boolean(cashier));
  for(const path of ['/api/jobs','/api/customers','/api/devices','/api/technicians','/api/payments']) check(`Cashier can read ${path}`, (await api(path,'GET',undefined,cashier)).status===200);
  const customer = await api('/api/customers','POST',{name:'Cashier Intake',phone:'090'},cashier);
  check('Cashier creates intake customer', customer.status===201);
  const device = await api('/api/devices','POST',{customer_id:customer.data.id,brand:'Test',model:'Phone',category:'smartphone',serial_or_imei:'cashier-test',condition_notes:''},cashier);
  check('Cashier creates intake device',device.status===201);
  const job = await api('/api/jobs','POST',{customer_id:customer.data.id,device_id:device.data.id,technician_id:fixture.technicians[0].id,service_charge:100,currency_code:'CNY'},cashier);
  check('Cashier creates an assigned CNY service job',job.status===201 && job.data.currency_code==='CNY');
  const secondAccount = await api('/api/cashiers','POST',{username:'cashier_two',full_name:'Second Counter',password:'SecondCashier123!'},admin);
  const secondToken = (await api('/api/auth/login','POST',{username:'cashier_two',password:'SecondCashier123!'})).data.token;
  check('Cashier display codes are unique', secondAccount.status === 201 && secondAccount.data.staff_code !== created.data.staff_code);
  const inactiveAccount = await api('/api/cashiers','POST',{username:'cashier_off',full_name:'Offline Counter',password:'ThirdCashier123!'},admin);
  await api(`/api/cashiers/${inactiveAccount.data.id}`,'PUT',{active:false},admin);
  const depositJob = await api('/api/jobs','POST',{customer_id:customer.data.id,device_id:device.data.id,technician_id:fixture.technicians[0].id,service_charge:100,amount_paid:10,currency_code:'CNY',intake_received_by:'Forged',intake_cashier_id:'forged-id'},cashier);
  check('Intake cashier identity is server-derived',depositJob.status===201 && depositJob.data.intake_cashier_id===created.data.id && depositJob.data.intake_received_by===account.full_name);
  check('Initial deposit records actual cashier and stable ID',depositJob.data.payments.some((p:any)=>p.amount===10&&p.received_by===account.full_name&&p.cashier_id===created.data.id&&p.created_by===account.username));
  const inbox=(await api('/api/notifications','GET',undefined,cashier)).data;
  check('Cashier gets new-job and own deposit notifications',inbox.notifications.some((n:any)=>n.type==='new_job'&&n.service_job_id===depositJob.data.id)&&inbox.notifications.some((n:any)=>n.type==='payment_received'&&n.service_job_id===depositJob.data.id));
  const secondInbox=(await api('/api/notifications','GET',undefined,secondToken)).data;
  check('Other active cashier gets intake but not another cashier payment notification',secondInbox.notifications.some((n:any)=>n.type==='new_job'&&n.service_job_id===depositJob.data.id)&&!secondInbox.notifications.some((n:any)=>n.type==='payment_received'&&n.service_job_id===depositJob.data.id));
  check('Inactive cashier receives no new notifications',!JSON.parse(readFileSync(dbPath,'utf8')).notifications.some((n:any)=>n.user_id===inactiveAccount.data.id&&n.service_job_id===depositJob.data.id));
  await api(`/api/jobs/${depositJob.data.id}`,'PUT',{status_id:'ready'},admin);
  check('Cashier gets repair-ready status notification',(await api('/api/notifications','GET',undefined,cashier)).data.notifications.some((n:any)=>n.type==='status_change'&&n.service_job_id===depositJob.data.id&&n.status_id==='ready'));
  const ownNotice=inbox.notifications.find((n:any)=>n.service_job_id===depositJob.data.id);
  check('Another cashier cannot mark another inbox event read',(await api(`/api/notifications/${ownNotice.id}/read`,'PUT',{},secondToken)).status===404);
  check('Cashier can mark own notice read',(await api(`/api/notifications/${ownNotice.id}/read`,'PUT',{},cashier)).status===200);
  const shopChange=await api('/api/settings','PUT',{shopName:'New Workshop',phone:'099123',email:'shop@example.test',address:'Workshop Road',taxPercentage:0,taxId:''},admin);
  check('Shop updates preserve zero tax and blank tax ID',shopChange.status===200&&shopChange.data.taxPercentage===0&&shopChange.data.taxId==='');
  check('Cashier reads latest workshop details',(await api('/api/settings','GET',undefined,cashier)).data.address==='Workshop Road');
  for(const body of [{shopName:' '},{taxPercentage:-1},{taxPercentage:101},{taxEnabled:'yes'},{shopLogo:'data:image/svg+xml;base64,PHN2Zz4='}])check('Invalid workshop setting rejected', (await api('/api/settings','PUT',body,admin)).status===400);
  const payment=await api('/api/payments','POST',{service_job_id:job.data.id,amount:20,currency_code:'CNY',received_by:'Forged Receiver'},cashier);
  check('Cashier payment stores actual cashier identity',payment.status===201 && payment.data.created_by===account.username && payment.data.received_by===account.full_name);
  check('Cashier prints receipt audit', (await api(`/api/payments/${payment.data.id}/receipt-printed`,'POST',{},cashier)).status===200);
  for(const [path,method,body] of [['/api/settings','PUT',{shopName:'Forbidden'}],['/api/cashiers','GET',undefined],['/api/backup','POST',{}],['/api/finance/income','POST',{amount:1,description:'Forbidden'}],[`/api/jobs/${job.data.id}`,'PUT',{service_charge:0}],[`/api/jobs/${job.data.id}`,'DELETE',undefined],[`/api/payments/${payment.data.id}`,'DELETE',{}],['/api/auth/recovery/status','GET',undefined],['/api/auth/recovery/backup','POST',{current_password:account.password}] ] as const) check(`Cashier cannot ${method} ${path}`, (await api(path,method,body,cashier)).status===403);
  check('Cashier may change own password', (await api('/api/auth/change-password','POST',{current_password:account.password,new_password:'NewCashier123!'},cashier)).status===200);
  check('Admin disables cashier', (await api(`/api/cashiers/${created.data.id}`,'PUT',{active:false},admin)).status===200);
  check('Disabled cashier session rejected', (await api('/api/auth/me','GET',undefined,cashier)).status===401);
  check('Disabled cashier cannot log in', (await api('/api/auth/login','POST',{username:account.username,password:'NewCashier123!'})).status===403);
  await api(`/api/cashiers/${created.data.id}`,'PUT',{active:true},admin);
  cashier=(await api('/api/auth/login','POST',{username:account.username,password:'NewCashier123!'})).data.token;
  check('Reactivated cashier signs in',Boolean(cashier));
  const snapshot=(await api('/api/backup','POST',{},admin)).data.data;
  check('Cashier survives backup restoration', (await api('/api/restore','POST',{data:snapshot},admin)).status===200);
  check('Recovery metadata requires authentication', (await api('/api/auth/recovery/status')).status===401);
  const status=(await api('/api/auth/recovery/status','GET',undefined,admin)).data;
  check('PC gets one generated key without metadata exposing it',status.generation===1 && status.installation_id && !status.key);
  check('Recovery backup requires current admin password', (await api('/api/auth/recovery/backup','POST',{current_password:'wrong'},admin)).status===403);
  const backup=(await api('/api/auth/recovery/backup','POST',{current_password:'admin123'},admin)).data;
  check('Admin downloads valid PC backup key',/^FFRK-[A-Za-z0-9_-]{43}$/.test(backup.key));
  await stop();await start();
  admin=(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).data.token;
  const restarted=(await api('/api/auth/recovery/backup','POST',{current_password:'admin123'},admin)).data;
  check('Key persists unchanged across restart',restarted.key===backup.key && restarted.installation_id===backup.installation_id && restarted.generation===1);
  check('Invalid recovery key cannot reset password', (await api('/api/auth/recover-password','POST',{username:'admin',recovery_key:'invalid',new_password:'RecoveredAdmin123!'})).status===400);
  check('Short new password rejected without consuming key',(await api('/api/auth/recover-password','POST',{username:'admin',recovery_key:backup.key,new_password:'short'})).status===400);
  const securityFile=join(directory,'.security','password-recovery.json');
  const securityBytes=readFileSync(securityFile);rmSync(securityFile);mkdirSync(securityFile);
  check('Recovery key commit failure returns failure',(await api('/api/auth/recover-password','POST',{username:'admin',recovery_key:backup.key,new_password:'MustNotPersist123!'})).status===500);
  check('Failed key commit restores old password',(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).status===200);
  check('Failed key commit does not rotate active key',(await api('/api/auth/recovery/backup','POST',{current_password:'admin123'},admin)).data.key===backup.key);
  rmSync(securityFile,{recursive:true});writeFileSync(securityFile,securityBytes,{mode:0o600});
  const recovered=await api('/api/auth/recover-password','POST',{username:'admin',recovery_key:backup.key,new_password:'RecoveredAdmin123!'});
  check('Forgot Password recovers admin and rotates backup key',recovered.status===200 && recovered.data.recovery.key!==backup.key && recovered.data.recovery.generation===2);
  check('Recovered account sessions revoked',(await api('/api/auth/me','GET',undefined,admin)).status===401);
  check('Old recovery key cannot be reused',(await api('/api/auth/recover-password','POST',{username:'admin',recovery_key:backup.key,new_password:'InvalidReuse123!'})).status===400);
  check('Old password no longer works',(await api('/api/auth/login','POST',{username:'admin',password:'admin123'})).status===401);
  admin=(await api('/api/auth/login','POST',{username:'admin',password:'RecoveredAdmin123!'})).data.token;
  check('Recovered password signs in',Boolean(admin));
  check('New backup key stored on server',(await api('/api/auth/recovery/backup','POST',{current_password:'RecoveredAdmin123!'},admin)).data.key===recovered.data.recovery.key);
  check('Recovered password hides default hint',!(await api('/api/auth/default-credentials')).data.credentials.some((c:any)=>c.username==='admin'));
  const second=await api('/api/auth/recover-password','POST',{username:account.username,recovery_key:recovered.data.recovery.key,new_password:'RecoveredCashier123!'});
  check('PC key recovers cashier account and rotates again',second.status===200 && second.data.recovery.generation===3);
  check('Recovered cashier signs in',(await api('/api/auth/login','POST',{username:account.username,password:'RecoveredCashier123!'})).status===200);
  const rotated=await api('/api/auth/recovery/rotate','POST',{current_password:'RecoveredAdmin123!'},admin);
  check('Administrator can generate replacement backup',rotated.status===200 && rotated.data.generation===4 && rotated.data.key!==second.data.recovery.key);
  const beforeKey=(await api('/api/auth/recovery/backup','POST',{current_password:'RecoveredAdmin123!'},admin)).data.key;
  for(let i=0;i<5;i++) await api('/api/auth/recover-password','POST',{username:'admin',recovery_key:'invalid',new_password:'NoChange123!'});
  check('Invalid recovery attempts are rate limited',(await api('/api/auth/recover-password','POST',{username:'admin',recovery_key:'invalid',new_password:'NoChange123!'})).status===429);
  check('Failed recovery never rotates key',(await api('/api/auth/recovery/backup','POST',{current_password:'RecoveredAdmin123!'},admin)).data.key===beforeKey);
  check('Admin can delete cashier account',(await api(`/api/cashiers/${created.data.id}`,'DELETE',undefined,admin)).status===200);
  check('Deleting cashier retains payment history',(await api('/api/payments','GET',undefined,admin)).data.some((p:any)=>p.id===payment.data.id));
  check('Original source database remains unchanged',sourceBytes().equals(original));
  console.log(`CASHIER & RECOVERY HTTP SUMMARY: ${passed} PASSED`);
} finally {await stop();rmSync(directory,{recursive:true,force:true});}

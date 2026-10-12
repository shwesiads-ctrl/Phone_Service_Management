import { buildTelegramSummary, localDay, summaryDue } from './src/server/telegramSummary';
import { createServer as createPortProbe } from 'node:net';
import { LoginLimiter } from './src/server/loginLimiter.ts';
import { imageValidationError } from './src/utils/imageUpload.ts';
import { RecoveryKeyStore } from './src/server/recovery.ts';
import { hashPassword, verifyPassword } from './src/server/passwords.ts';
import { telegramRequest, sendRawTelegramMessage, escapeTelegramHtml as tgHtml } from './src/server/telegram.ts';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomBytes, createHash } from 'node:crypto';
import { execSync, spawn, ChildProcess } from 'child_process';
import { db } from './src/server/db.ts';
import { User, ServiceStatus } from './src/types/index.ts';

// Extend Express Request interface to include authenticated user
interface AuthRequest extends Request {
  user?: User;
}

const recoveryKeys = new RecoveryKeyStore(path.resolve(process.env.FIXFLOW_DATA_DIR || 'data', '.security'));
const app = express();
const loginLimiter=new LoginLimiter();
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint (Real HTTP server online check for LAN & Localhost clients)
app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({
    ok: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    server: 'FixFlow-Node',
  });
});

// Opaque sessions: identity headers and predictable user IDs are not credentials.
const sessions = new Map<string, { userId: string; expiresAt: number; credential: string }>();
const credentialFor = (user: User) => {
  const tech = user.technician_id ? db.getTechnicianById(user.technician_id) : undefined;
  return createHash('sha256').update(String((user as any).password || tech?.password || '') + ':' + user.role).digest('hex');
};
const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
  const session = sessions.get(token);
  if (session) {
    const user = db.getUsers().find(u => u.id === session.userId);
    const tech = user?.technician_id ? db.getTechnicianById(user.technician_id) : undefined;
    if (user && user.active !== false && session.expiresAt > Date.now() && session.credential === credentialFor(user) &&
        (user.role !== 'technician' || tech?.status === 'active')) {
      req.user = user;
    } else {
      sessions.delete(token);
    }
  }
  next();
};

// Keep credentials out of UI responses, including nested technician records.
// Administrator backups deliberately retain credentials so restoration stays complete.
function withoutCredentials(value: any): any {
  if (Array.isArray(value)) return value.map(withoutCredentials);
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== 'password' && key !== 'password_hash')
      .map(([key, item]) => [key, withoutCredentials(item)])
  );
  return value;
}
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => originalJson(req.path === '/api/backup' ? body : withoutCredentials(body));
  next();
});

// Accept only the four supported currencies and languages on mutation requests.
app.use((req, res, next) => {
  for (const field of ['currency', 'currency_code']) {
    if (req.body?.[field] !== undefined && !['MMK','USD','THB','CNY'].includes(req.body[field])) return res.status(400).json({ error: 'Choose MMK, USD, THB or CNY.' });
  }
  if (req.path === '/api/settings' && req.method === 'PUT') {
    if (req.body.language !== undefined && !['my','en','th','zh'].includes(req.body.language)) return res.status(400).json({ error: 'Choose Myanmar, English, Thai or Chinese.' });
    req.body.currency_mode = 'manual';
  }
  next();
});

app.use((req: AuthRequest, res: Response, next: NextFunction) => {
  authenticate(req, res, () => {
    const publicPaths = ['/api/auth/setup-status', '/api/auth/setup-admin', '/api/health', '/api/auth/login', '/api/auth/recover-password', '/api/auth/default-credentials', '/api/system/network-info'];
    if (publicPaths.includes(req.path) || (req.method === 'GET' && req.path === '/api/license')) {
      return next();
    }
    if (!req.user && req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    if (req.user?.role === 'cashier' && req.path.startsWith('/api/')) {
      const readPaths = ['/api/auth/me', '/api/jobs', '/api/technicians', '/api/customers', '/api/devices', '/api/payments', '/api/settings', '/api/notifications'];
      const readAllowed = req.method === 'GET' && (readPaths.includes(req.path) || /^\/api\/jobs\/[^/]+$/.test(req.path));
      const writeAllowed = (req.method === 'POST' && ['/api/jobs', '/api/payments', '/api/customers', '/api/devices', '/api/auth/logout', '/api/auth/change-password'].includes(req.path)) ||
        (req.method === 'PUT' && req.path === '/api/auth/profile') ||
        (['PUT','DELETE'].includes(req.method) && /^\/api\/notifications(?:\/.*)?$/.test(req.path)) ||
        (req.method === 'POST' && /^\/api\/payments\/[^/]+\/receipt-printed$/.test(req.path));
      if (!readAllowed && !writeAllowed) return res.status(403).json({ error: 'Cashier access is limited to intake, payment collection and receipts.' });
    }
    next();
  });
});

// Plan licensing helper
const isPaidPlanActive = (): boolean => {
  const license = db.getLicense();
  return Boolean(license && license.plan === 'PAID' && license.status === 'ACTIVE');
};

// Telegram Notification Services
function logTelegramDelivery(event:string,destination:string,result:{ok:boolean;description?:string}) {
  const current=db.getTelegramBot();
  db.updateTelegramBot({delivery_history:[{id:randomBytes(8).toString('hex'),event,destination,ok:result.ok,created_at:new Date().toISOString(),...(result.description?{error:result.description.slice(0,500)}:{})},...(current.delivery_history || [])].slice(0,50)});
}
async function dispatchTelegramAlert(
  eventType: 'new_job' | 'status_change' | 'payment' | 'daily_summary',
  htmlContent: string
) {
  try {
    const config = db.getTelegramBot();
    if (!config || !config.enabled || !config.bot_token || !config.chat_id) return;

    if (eventType === 'new_job' && !config.notify_on_new_job) return;
    if (eventType === 'status_change' && !config.notify_on_status_change) return;
    if (eventType === 'payment' && !config.notify_on_payment) return;
    if (eventType === 'daily_summary' && !config.notify_on_daily_summary) return;

    const results = [await sendRawTelegramMessage(config.bot_token, config.chat_id, htmlContent)];

    if (
      config.channel_username &&
      config.channel_username.trim() &&
      config.channel_username.trim() !== config.chat_id.trim()
    ) {
      results.push(await sendRawTelegramMessage(config.bot_token, config.channel_username.trim(), htmlContent));
    }
    const destinations=[config.chat_id,...(config.channel_username&&config.channel_username.trim()!==config.chat_id.trim()?[config.channel_username.trim()]:[])];
    results.forEach((result,index)=>logTelegramDelivery(eventType,destinations[index],result));
    if (results.some(r => !r.ok)) {
      db.updateTelegramBot({ is_connected: false });
      console.warn('[Telegram Dispatch Warning]', results.filter(r => !r.ok).map(r => r.description).join('; '));
    }
  } catch {
    console.warn('[Telegram Dispatch Warning] Dispatch failed.');
  }
}

// ==========================================
// 1. AUTHENTICATION API
// ==========================================

const recoveryAttempts = new Map<string, { count: number; until: number }>();
app.post('/api/auth/recover-password', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const ip = req.ip || 'unknown';
  let attempts = recoveryAttempts.get(ip);
  if (!attempts || attempts.until < Date.now()) {
    attempts = { count: 0, until: Date.now() + 15 * 60 * 1000 }; recoveryAttempts.set(ip, attempts);
  }
  if (attempts.count >= 5) return res.status(429).json({ error: 'Too many recovery attempts. Try again in 15 minutes.' });
  const { username, recovery_key, new_password } = req.body;
  const requested = typeof username === 'string' && username.trim().length <= 32 ? username.trim() : '';
  const user = requested ? db.getUserByUsername(requested === 'tech1' ? 'kyawzin' : requested) : undefined;
  const technician = user?.technician_id ? db.getTechnicianById(user.technician_id) : undefined;
  if (!user || user.active === false || (user.role === 'technician' && technician?.status !== 'active') || !recoveryKeys.verify(recovery_key)) {
    attempts.count++; return res.status(400).json({ error: 'Account or recovery key is invalid for this PC.' });
  }
  if (typeof new_password !== 'string' || new_password.length < 8 || new_password.length > 128) return res.status(400).json({ error: 'New password must contain 8–128 characters.' });
  try {
    const recovery = recoveryKeys.rotate(() => db.resetPasswordTransaction(user.id, hashPassword(new_password), ip));
    for (const [token, session] of sessions) if (session.userId === user.id) sessions.delete(token);
    loginLimiter.reset(user.username);
    recoveryAttempts.delete(ip);
    return res.json({ success: true, recovery });
  } catch { return res.status(500).json({ error: 'Recovery could not be saved. Check database and local recovery-key storage access.' }); }
});
const checkRecoveryAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
  const stored = req.user.password;
  const valid = stored ? verifyPassword(req.body.current_password, stored) : false;
  if (!valid) return res.status(403).json({ error: 'Enter the current administrator password.' });
  next();
};
app.get('/api/auth/recovery/status', (req: AuthRequest, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
  return res.json(recoveryKeys.status());
});
app.post('/api/auth/recovery/backup', checkRecoveryAdmin, (_req, res) => res.json(recoveryKeys.backup()));
app.post('/api/auth/recovery/rotate', checkRecoveryAdmin, (req: AuthRequest, res) => {
  try {
    const backup = recoveryKeys.rotate(() => db.auditTransaction({ user_id: req.user!.id, username: req.user!.username, action: 'RECOVERY_KEY_ROTATED', target_type: 'auth', target_id: req.user!.id, details: 'Administrator generated a replacement recovery backup key.', ip_address: req.ip || '127.0.0.1' }));
    return res.json(backup);
  } catch { return res.status(500).json({ error: 'Recovery key could not be saved.' }); }
});

app.get('/api/auth/default-credentials', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  // Kept as an empty compatibility endpoint; never publish login passwords.
  res.json({ credentials: [] });
});

app.get('/api/auth/setup-status', (_req,res)=>{res.setHeader('Cache-Control','no-store');res.json({registration_open:!db.isAdminSetupComplete()});});
app.post('/api/auth/setup-admin', (req,res)=>{
  if(db.isAdminSetupComplete())return res.status(409).json({error:'Admin registration is already completed.'});
  const {full_name,username,password}=req.body;
  if(typeof full_name!=='string'||!full_name.trim()||full_name.length>100||typeof username!=='string'||!/^[A-Za-z0-9_.-]{3,32}$/.test(username)||username.toLowerCase()==='tech1'||typeof password!=='string'||password.length<8||password.length>128)return res.status(400).json({error:'Enter a name, unique username and a password of at least 8 characters.'});
  if(db.getUsers().some(user=>user.username.toLowerCase()===username.toLowerCase()&&!(user.role==='admin'&&user.username==='admin'&&!user.password)))return res.status(409).json({error:'Username is already in use.'});
  try {const user=db.setupFirstAdmin({full_name:full_name.trim(),username,password:hashPassword(password)});return res.status(201).json({user});}
  catch{return res.status(500).json({error:'Administrator account could not be saved. Try again.'});}
});

app.post('/api/auth/login', (req: AuthRequest, res: Response) => {
  if(!db.isAdminSetupComplete())return res.status(409).json({error:'Create your administrator account first.'});
  const { username, password } = req.body;
  const ip = req.ip || '127.0.0.1';

  if (typeof username !== 'string' || !username.trim() || username.length>200 || typeof password !== 'string' || !password || password.length>128) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const identifier=username.trim();
  const resolvedUsername=identifier==='tech1'?'kyawzin':identifier;
  const emailMatches=identifier.includes('@')?db.getUsers().filter(account=>(account.email || db.getTechnicianById(account.technician_id || '')?.email || '').toLowerCase()===identifier.toLowerCase()):[];
  const user=db.getUserByUsername(resolvedUsername) || (emailMatches.length===1?emailMatches[0]:undefined);
  const limitIdentity=user?.username || resolvedUsername;
  const retryAfter=loginLimiter.retryAfter(ip,limitIdentity);
  if(retryAfter){res.setHeader('Retry-After',String(retryAfter));return res.status(429).json({error:'Too many failed login attempts. Try again in 15 minutes.',retry_after:retryAfter});}
  if (!user) {
    loginLimiter.fail(ip,limitIdentity);
    db.recordLoginAttempt(username, false, ip);
    return res.status(401).json({ error: 'Invalid username or credentials' });
  }

  if(['admin','cashier'].includes(user.role)&&!user.password)return res.status(401).json({error:'Account password is not configured. Use password recovery.'});
  if (user.active === false) return res.status(403).json({ error: 'Account is inactive.' });
  if (user.role === 'technician' && db.getTechnicianById(user.technician_id || '')?.status !== 'active') {
    return res.status(403).json({ error: 'Technician account is inactive.' });
  }

  // Password verification
  if (password !== undefined) {
    let validPassword = false;
    const tech = user.technician_id ? db.getTechnicians().find((t) => t.id === user.technician_id) : null;
    const storedPass = (user as any).password || (tech as any)?.password;

    if (storedPass) {
      validPassword = verifyPassword(password, storedPass);
    } else {
      // System default credentials before user updates their password
      const defaultPass = 'tech123';
      validPassword = password === defaultPass;
    }

    if (!validPassword) {
      loginLimiter.fail(ip,limitIdentity);
    db.recordLoginAttempt(username, false, ip);
      return res.status(401).json({ error: 'Invalid password credentials' });
    }
  }

  loginLimiter.success(ip,limitIdentity);
  // Record successful login
  db.recordLoginAttempt(username, true, ip);
  db.recordAudit({
    user_id: user.id,
    username: user.username,
    technician_id: user.technician_id,
    action: 'USER_LOGIN',
    target_type: 'auth',
    target_id: user.id,
    details: `User ${user.username} (${user.role}) logged in successfully.`,
    ip_address: ip,
  });

  for (const [token, session] of sessions) {
    if (session.expiresAt <= Date.now()) sessions.delete(token);
  }
  const token = randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + 12 * 60 * 60 * 1000, credential: credentialFor(user) });
  return res.json({ token, user });
});

app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user: req.user });
});

app.post('/api/auth/logout', (req: AuthRequest, res: Response) => {
  sessions.delete(req.headers.authorization?.slice(7) || '');
  if (req.user) {
    db.recordAudit({
      user_id: req.user.id,
      username: req.user.username,
      technician_id: req.user.technician_id,
      action: 'USER_LOGOUT',
      target_type: 'auth',
      target_id: req.user.id,
      details: `User ${req.user.username} logged out.`,
      ip_address: req.ip || '127.0.0.1',
    });
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

app.post('/api/auth/change-password', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  const tech = req.user.technician_id ? db.getTechnicians().find((t) => t.id === req.user?.technician_id) : null;
  const storedPass = (req.user as any).password || (tech as any)?.password;

  let validCurrent = false;
  if (storedPass) {
    validCurrent = verifyPassword(current_password, storedPass);
  } else {
    const defaultPass = req.user.role === 'admin' ? 'admin123' : 'tech123';
    validCurrent = current_password === defaultPass;
  }

  if (!validCurrent) {
    return res.status(400).json({ error: 'Incorrect current password.' });
  }

  if (typeof new_password !== 'string' || new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  db.updatePassword(req.user.id, hashPassword(new_password));
  loginLimiter.reset(req.user.username);
  for (const [token, session] of sessions) {
    if (session.userId === req.user.id && token !== req.headers.authorization?.slice(7)) sessions.delete(token);
  }
  const currentSession = sessions.get(req.headers.authorization?.slice(7) || '');
  if (currentSession) currentSession.credential = credentialFor(req.user);
  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    technician_id: req.user.technician_id,
    action: 'PASSWORD_CHANGED',
    target_type: 'auth',
    target_id: req.user.id,
    details: `User ${req.user.username} changed their password successfully.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({ success: true, message: 'Password changed successfully.' });
});

app.put('/api/auth/profile', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { full_name, username, email, phone, address, profile_photo } = req.body;
  const invalidPhoto = imageValidationError(profile_photo);
  if (invalidPhoto) return res.status(400).json({ error: invalidPhoto });
  if (typeof username !== 'string' || !username.trim() || typeof full_name !== 'string' || !full_name.trim()) {
    return res.status(400).json({ error: 'Full name and username are required.' });
  }
  for (const field of ['phone','email','address'] as const) if (req.body[field] !== undefined && (typeof req.body[field] !== 'string' || req.body[field].length > (field === 'address' ? 1000 : 100))) return res.status(400).json({ error: 'Enter valid profile contact details.' });
  const duplicate = db.getUserByUsername(username.trim());
  if (duplicate && duplicate.id !== req.user.id) return res.status(409).json({ error: 'Username is already in use.' });
  const updated = db.updateProfile(req.user.id, {
    full_name: full_name.trim(),
    username: username.trim(),
    ...(email !== undefined ? { email } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(address !== undefined ? { address } : {}),
    ...(profile_photo !== undefined ? { profile_photo } : {}),
  });
  if (!updated) {
    return res.status(404).json({ error: 'User not found.' });
  }
  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    technician_id: req.user.technician_id,
    action: 'PROFILE_UPDATED',
    target_type: 'auth',
    target_id: req.user.id,
    details: `User ${req.user.username} updated their profile information.`,
    ip_address: req.ip || '127.0.0.1',
  });
  return res.json({ success: true, user: updated });
});

// Persistent in-app notification inbox, isolated to the authenticated account.
app.get('/api/notifications', (req: AuthRequest, res: Response) => {
  const notifications = db.getNotifications(req.user!.id);
  return res.json({ notifications, unread_count: notifications.filter(notification => !notification.read_at).length });
});
app.put('/api/notifications/read-all', (req: AuthRequest, res: Response) => {
  return res.json({ success: true, updated_count: db.markAllNotificationsRead(req.user!.id) });
});
app.put('/api/notifications/:id/read', (req: AuthRequest, res: Response) => {
  const notification = db.markNotificationRead(req.params.id, req.user!.id);
  if (!notification) return res.status(404).json({ error: 'Notification not found.' });
  return res.json(notification);
});
app.delete('/api/notifications/read', (req: AuthRequest, res: Response) => {
  return res.json({ success: true, dismissed_count: db.clearReadNotifications(req.user!.id) });
});
app.delete('/api/notifications/:id', (req: AuthRequest, res: Response) => {
  if (!db.dismissNotification(req.params.id, req.user!.id)) return res.status(404).json({ error: 'Notification not found.' });
  return res.json({ success: true });
});

// ==========================================
// 2. TECHNICIANS API (ADMIN ONLY MANAGEMENT)
// ==========================================

app.post('/api/demo-users', (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  const existing = db.getTechnicians().find(t => t.is_demo);
  if (existing) return res.json(existing);
  if (db.getUserByUsername('demo_tech')) return res.status(409).json({ error: 'demo_tech is already in use by a regular account.' });
  const tech = db.createTechnician({ full_name: 'Demo Technician', username: 'demo_tech', phone: '', email: '', address: '', status: 'active', specialization: [], is_demo: true });
  db.recordAudit({ user_id: req.user.id, username: req.user.username, action: 'DEMO_USER_ADDED', target_type: 'technician', target_id: tech.id, details: 'Added demo technician account.', ip_address: req.ip || '127.0.0.1' });
  return res.status(201).json(tech);
});
app.delete('/api/demo-users', (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  const demo = db.getTechnicians().filter(t => t.is_demo);
  if (demo.some(t => db.getJobs().some(j => j.technician_id === t.id))) return res.status(409).json({ error: 'Reassign demo users’ repair jobs before deleting them.' });
  if(demo.some(tech=>db.getUsers().some(user=>user.technician_id===tech.id&&user.role==='admin')))return res.status(409).json({error:'Change demo administrator roles before removing demo accounts.'});
  for (const tech of demo) db.deleteTechnician(tech.id);
  db.recordAudit({ user_id: req.user.id, username: req.user.username, action: 'DEMO_USERS_DELETED', target_type: 'system', target_id: 'demo-users', details: `Deleted ${demo.length} demo accounts.`, ip_address: req.ip || '127.0.0.1' });
  res.json({ success: true, deleted: demo.length });
});

app.get('/api/technicians', (_req: AuthRequest, res: Response) => {
  const technicians = db.getTechnicians();
  const jobs = db.getJobs();

  // Attach dynamic workload counts
  const techsWithWorkload = technicians.map((tech) => {
    const techJobs = jobs.filter((j) => j.technician_id === tech.id);
    const activeJobs = techJobs.filter(
      (j) => !['completed', 'delivered', 'cancelled'].includes(j.status_id)
    ).length;
    const completedJobs = techJobs.filter(
      (j) => j.status_id === 'completed' || j.status_id === 'delivered'
    ).length;

    return {
      ...tech,
      activeJobs,
      completedJobs,
    };
  });

  return res.json(techsWithWorkload);
});

// Fast staff registration is deliberately administrator-only.
app.post('/api/users/register', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Only administrators can register accounts.' });
  const {full_name,username,password,phone='',email='',role='admin'}=req.body;
  if (typeof full_name!=='string' || !full_name.trim() || full_name.length>100 ||
      typeof username!=='string' || !/^[A-Za-z0-9_.-]{3,32}$/.test(username) ||
      typeof password!=='string' || password.length<8 || password.length>128 ||
      typeof phone!=='string' || phone.length>50 || typeof email!=='string' || email.length>100 ||
      !['admin','technician','cashier'].includes(role)) return res.status(400).json({ error:'Enter valid account details and an Admin, Technician or Cashier role.' });
  if (username.toLowerCase()==='tech1' || db.getUsers().some(user=>user.username.toLowerCase()===username.toLowerCase())) return res.status(409).json({error:'Username is already in use.'});
  const input={username,full_name:full_name.trim(),password:hashPassword(password),phone:phone.trim(),email:email.trim()};
  const technician=role==='technician'?db.createTechnician({...input,address:'',status:'active',specialization:[]}):undefined;
  const user=role==='admin'?db.createAdmin(input):role==='cashier'?db.createCashier(input):db.getUserByUsername(username)!;
  db.recordAudit({user_id:req.user.id,username:req.user.username,action:'USER_REGISTERED',target_type:'auth',target_id:user.id,details:`Administrator registered ${role} account ${username}.`,ip_address:req.ip || ''});
  return res.status(201).json({user,...(technician?{technician}:{})});
});

// Compatibility API for older clients; the old registration entry is hidden in the UI.
app.post('/api/users/quick-register', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Only administrators can register users.' });
  const { full_name, username, password, phone = '' } = req.body;
  if (typeof full_name !== 'string' || !full_name.trim() || full_name.length > 100 ||
      typeof username !== 'string' || !/^[a-zA-Z0-9_.-]{3,32}$/.test(username) ||
      typeof password !== 'string' || password.length < 8 || password.length > 128 ||
      typeof phone !== 'string' || phone.length > 50) return res.status(400).json({ error: 'Enter a name, username (3–32 letters/numbers/._-), password (8–128 characters), and optional phone.' });
  if (username === 'tech1' || db.getUsers().some(u => u.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ error: 'Username is already in use.' });
  const technician = db.createTechnician({ full_name: full_name.trim(), username, password: hashPassword(password), phone: phone.trim(), email: '', address: '', status: 'active', specialization: [] });
  db.recordAudit({ user_id: req.user.id, username: req.user.username, action: 'USER_REGISTERED', target_type: 'technician', target_id: technician.id, details: `Registered technician account ${username}.`, ip_address: req.ip || '' });
  return res.status(201).json({ user: db.getUserByUsername(username), technician });
});

app.post('/api/technicians', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only administrators can register technicians.' });
  }

  let { full_name, username, phone, email, address, specialization, profile_photo, status } = req.body;
  if (!full_name) {
    return res.status(400).json({ error: 'Full name is required.' });
  }

  if (!username) {
    username = full_name.toLowerCase().replace(/[^a-z0-9]/g, '') || `tech_${Date.now()}`;
  }

  // Check unique username
  let finalUsername = username;
  let counter = 1;
  while (db.getUserByUsername(finalUsername)) {
    finalUsername = `${username}_${counter++}`;
  }

  const newTech = db.createTechnician({
    full_name,
    username: finalUsername,
    phone: phone || '',
    email: email || '',
    address: address || '',
    profile_photo: profile_photo || '',
    status: status || 'active',
    specialization: Array.isArray(specialization) ? specialization : [],
  });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    technician_id: newTech.id,
    action: 'TECHNICIAN_REGISTERED',
    target_type: 'technician',
    target_id: newTech.id,
    details: `Admin ${req.user.username} registered technician ${newTech.full_name} (${newTech.id}).`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.status(201).json(newTech);
});

app.put('/api/technicians/:id', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only administrators can edit technicians.' });
  }

  const { id } = req.params;
  if (req.body.username !== undefined) {
    if (typeof req.body.username !== 'string' || !req.body.username.trim()) return res.status(400).json({ error: 'Username is required.' });
    const duplicate = db.getUserByUsername(req.body.username.trim());
    if (duplicate && duplicate.technician_id !== id) return res.status(409).json({ error: 'Username is already in use.' });
  }
  if (req.body.status !== undefined && !['active', 'inactive'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid technician status.' });
  const allowed = ['full_name', 'username', 'phone', 'email', 'address', 'specialization', 'profile_photo', 'status', 'level'];
  const payload = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const updated = db.updateTechnician(id, payload);
  if (!updated) {
    return res.status(404).json({ error: 'Technician not found.' });
  }

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    technician_id: id,
    action: 'TECHNICIAN_UPDATED',
    target_type: 'technician',
    target_id: id,
    details: `Admin ${req.user.username} updated technician ${updated.full_name}.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json(updated);
});

app.put('/api/technicians/:id/password', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only administrators can reset technician passwords.' });
  }

  const { id } = req.params;
  const { new_password } = req.body;
  if (!new_password) {
    return res.status(400).json({ error: 'New password is required.' });
  }

  const tech = db.getTechnicianById(id);
  if (!tech) {
    return res.status(404).json({ error: 'Technician not found.' });
  }

  if (typeof new_password !== 'string' || new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const linkedUser = db.getUsers().find((user) => user.technician_id === id);
  if (!linkedUser || !db.updatePassword(linkedUser.id, hashPassword(new_password))) {
    return res.status(500).json({ error: 'Could not update the technician password.' });
  }

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    technician_id: id,
    action: 'PASSWORD_RESET',
    target_type: 'technician',
    target_id: id,
    details: `Admin ${req.user.username} reset password for technician ${tgHtml(tech.full_name)}.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({ success: true, message: `Password reset successfully for ${tgHtml(tech.full_name)}.` });
});

app.delete('/api/technicians/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tech = db.getTechnicianById(id);
  if (!tech) {
    return res.status(404).json({ error: 'Technician not found.' });
  }

  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only administrators can delete technicians.' });
  }

  if(db.getUsers().some(user=>user.technician_id===id&&user.role==='admin'))return res.status(409).json({error:'Change the linked administrator role before deleting this technician.'});
  if (db.getJobs().some(j => j.technician_id === id)) {
    return res.status(409).json({ error: "Reassign this technician's repair jobs before deleting the account." });
  }
  db.deleteTechnician(id);

  db.recordAudit({
    user_id: req.user?.id || 'USR-001',
    username: req.user?.username || 'admin',
    technician_id: id,
    action: 'DELETE_TECHNICIAN',
    target_type: 'technician',
    target_id: id,
    details: `Technician ${tgHtml(tech.full_name)} (${id}) was deleted.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({ success: true, message: 'Technician deleted successfully.' });
});

// ==========================================
// 3. SERVICE JOBS API (WITH STRICT SERVER-SIDE AUTHORIZATION)
// ==========================================

app.get('/api/jobs', (req: AuthRequest, res: Response) => {
  const { technician_id, status_id, search, date_from, date_to } = req.query;
  let jobs = db.getJobs();

  // SERVER-SIDE SECURITY ENFORCEMENT:
  // If user is a Technician, strictly restrict to ONLY jobs assigned to their technician_id!
  if (req.user?.role === 'technician') {
    const techId = req.user.technician_id;
    if (!techId) {
      return res.status(403).json({ error: 'Forbidden: Technician profile not linked.' });
    }
    // Prevent ID manipulation or viewing other technicians' jobs
    jobs = jobs.filter((j) => j.technician_id === techId);
  } else if (technician_id && typeof technician_id === 'string' && technician_id !== 'all') {
    // Admin filtering by technician
    jobs = jobs.filter((j) => j.technician_id === technician_id);
  }

  // Filter by status
  if (status_id && typeof status_id === 'string' && status_id !== 'all') {
    jobs = jobs.filter((j) => j.status_id === status_id);
  }

  // Filter by search query (service number, customer name, phone, device)
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase();
    jobs = jobs.filter((j) => {
      const matchSrv = j.service_number.toLowerCase().includes(q);
      const matchCust = j.customer?.name.toLowerCase().includes(q) || false;
      const matchPhone = j.customer?.phone.toLowerCase().includes(q) || false;
      const matchDev = `${j.device?.brand || ''} ${j.device?.model || ''}`.toLowerCase().includes(q);
      const matchSerial = (j.device?.serial_or_imei || '').toLowerCase().includes(q);
      return matchSrv || matchCust || matchPhone || matchDev || matchSerial;
    });
  }

  // Filter by date
  if (date_from && typeof date_from === 'string') {
    jobs = jobs.filter((j) => new Date(j.created_at) >= new Date(date_from));
  }
  if (date_to && typeof date_to === 'string') {
    jobs = jobs.filter((j) => new Date(j.created_at) <= new Date(date_to));
  }

  return res.json(jobs);
});

app.get('/api/jobs/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const job = db.getJobById(id);

  if (!job) {
    return res.status(404).json({ error: 'Service job not found.' });
  }

  // SERVER-SIDE SECURITY ENFORCEMENT:
  // Technician MUST NOT view another Technician's assigned job!
  if (req.user?.role === 'technician') {
    if (job.technician_id !== req.user.technician_id) {
      db.recordAudit({
        user_id: req.user.id,
        username: req.user.username,
        technician_id: req.user.technician_id,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        target_type: 'job',
        target_id: id,
        details: `Technician ${req.user.username} attempted to access job ${job.service_number} assigned to technician ${job.technician_id}.`,
        ip_address: req.ip || '127.0.0.1',
      });
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to view this service job.',
      });
    }
  }

  return res.json(job);
});

app.post('/api/jobs', (req: AuthRequest, res: Response) => {
  // Only Admin can create and assign service jobs
  if (!req.user || !['admin','cashier'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Forbidden: Only administrators can create and assign service jobs.',
    });
  }

  const {
    customer_id,
    device_id,
    technician_id,
    problem_description,
    priority,
    service_charge,
    amount_paid,
    payment_method,
    warranty_days,
    passlock_pin,
  } = req.body;

  // MANDATORY: Admin MUST assign the job to a technician
  if (!technician_id) {
    return res.status(400).json({
      error: 'Technician assignment is mandatory. Please select an assigned technician.',
    });
  }

  const tech = db.getTechnicianById(technician_id);
  if (!tech) {
    return res.status(400).json({ error: 'Assigned technician does not exist.' });
  }

  const customer = db.getCustomerById(customer_id);
  const device = db.getDeviceById(device_id);
  if (!customer || !device || device.customer_id !== customer_id) {
    return res.status(400).json({ error: 'Select an existing customer and a device owned by that customer.' });
  }
  if ([service_charge ?? 0, amount_paid ?? 0].some(value => !Number.isFinite(Number(value)) || Number(value) < 0)) {
    return res.status(400).json({ error: 'Charges and deposits must be finite non-negative numbers.' });
  }
  if (warranty_days !== undefined && (!Number.isInteger(Number(warranty_days)) || Number(warranty_days) < 0)) return res.status(400).json({ error: 'Warranty days must be a non-negative integer.' });
  const chargeNum = Number(service_charge) || 0;
  const paidNum = Number(amount_paid) || 0;
  const payment_status =
    paidNum >= chargeNum && chargeNum > 0
      ? 'paid'
      : paidNum > 0
      ? 'partial'
      : 'unpaid';

  const newJob = db.createJob({
    intake_received_by: req.user.full_name || req.user.username,
    intake_username: req.user.username,
    ...(req.user.role === 'cashier' ? { intake_cashier_id: req.user.id } : {}),
    customer_id,
    device_id,
    technician_id, // Linked using foreign key
    status_id: 'received',
    priority: priority || 'normal',
    problem_description: problem_description || 'Intake service request',
    service_charge: chargeNum,
    parts_cost: 0,
    total_cost: chargeNum,
    amount_paid: paidNum,
    currency_code: req.body.currency_code || db.getSettings().currency || 'MMK',
    payment_status,
    payment_method: payment_method || 'cash',
    warranty_days: warranty_days === undefined ? db.getSettings().defaultWarrantyDays : Number(warranty_days),
    passlock_pin: passlock_pin || '',
    received_at: new Date().toISOString(),
  });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    technician_id,
    action: 'JOB_CREATED_AND_ASSIGNED',
    target_type: 'job',
    target_id: newJob.id,
    details: `Admin ${req.user.username} created job ${newJob.service_number} and assigned to technician ${tgHtml(tech.full_name)} (${tech.id}).`,
    ip_address: req.ip || '127.0.0.1',
  });

  // Automated Telegram alert for new job intake
  const cust = db.getCustomerById(newJob.customer_id);
  const dev = db.getDeviceById(newJob.device_id);
  const cur = newJob.currency_code || 'MMK';
  dispatchTelegramAlert(
    'new_job',
    `🔔 <b>New Service Job Received</b>\n` +
      `<b>Ticket:</b> <code>${newJob.service_number}</code>\n` +
      `<b>Customer:</b> ${tgHtml(cust?.name || 'Walk-in')} (${tgHtml(cust?.phone || 'N/A')})\n` +
      `<b>Device:</b> ${tgHtml(dev ? `${dev.brand} ${dev.model}` : 'Device')}\n` +
      `<b>Problem:</b> ${tgHtml(newJob.problem_description)}\n` +
      `<b>Labor Charge:</b> ${tgHtml(cur)} ${(newJob.service_charge || 0).toLocaleString()}\n` +
      `<b>Technician:</b> ${tgHtml(tech.full_name)}\n` +
      `<b>Priority:</b> ${(newJob.priority || 'normal').toUpperCase()}`
  );

  return res.status(201).json(newJob);
});

const validStatuses = new Set(['received', 'diagnosing', 'waiting_parts', 'repairing', 'ready', 'completed', 'delivered', 'cancelled']);
const jobEditFields = new Set(['status_id', 'priority', 'diagnosis', 'repair_notes', 'completion_notes', 'warranty_days',
  'parts_used', 'service_charge', 'parts_cost', 'total_cost', 'amount_paid', 'technician_id', 'problem_description',
  'passlock_pin', 'category_id', 'payment_method']);
app.use('/api/jobs', (req: AuthRequest, res, next) => {
  if (req.method === 'PUT') {
    if (req.body.status_id !== undefined && !validStatuses.has(req.body.status_id)) {
      return res.status(400).json({ error: 'Invalid repair status.' });
    }
    if (Object.keys(req.body).some(key => !jobEditFields.has(key))) {
      return res.status(400).json({ error: 'Unsupported or immutable job field.' });
    }
    if (req.body.technician_id !== undefined && !db.getTechnicianById(req.body.technician_id)) {
      return res.status(400).json({ error: 'Assigned technician does not exist.' });
    }
  }
  if (req.body.warranty_days !== undefined && (!Number.isInteger(Number(req.body.warranty_days)) || Number(req.body.warranty_days) < 0)) {
    return res.status(400).json({ error: 'Warranty days must be a non-negative integer.' });
  }
  if (req.body.service_charge !== undefined && (!Number.isFinite(Number(req.body.service_charge)) || Number(req.body.service_charge) < 0)) {
    return res.status(400).json({ error: 'Service charge must be a finite non-negative number.' });
  }
  if (req.body.parts_used !== undefined) {
    if (!Array.isArray(req.body.parts_used) || req.body.parts_used.some((p: any) => !p || !p.part_name ||
        !Number.isInteger(Number(p.quantity)) || Number(p.quantity) <= 0 || !Number.isFinite(Number(p.unit_cost)) || Number(p.unit_cost) < 0)) {
      return res.status(400).json({ error: 'Parts require a name, positive integer quantity and finite non-negative unit cost.' });
    }
    req.body.parts_used = req.body.parts_used.map((p: any) => ({ ...p, quantity: Number(p.quantity), unit_cost: Number(p.unit_cost), total_cost: Number(p.quantity) * Number(p.unit_cost) }));
  }
  next();
});

app.put('/api/jobs/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existingJob = db.getJobById(id);

  if (!existingJob) {
    return res.status(404).json({ error: 'Service job not found.' });
  }

  // SERVER-SIDE SECURITY ENFORCEMENT:
  if (req.user?.role === 'technician') {
    // 1. Technician can ONLY edit jobs assigned to them
    if (existingJob.technician_id !== req.user.technician_id) {
      db.recordAudit({
        user_id: req.user.id,
        username: req.user.username,
        technician_id: req.user.technician_id,
        action: 'UNAUTHORIZED_EDIT_ATTEMPT',
        target_type: 'job',
        target_id: id,
        details: `Technician ${req.user.username} attempted to edit job ${existingJob.service_number} assigned to technician ${existingJob.technician_id}.`,
        ip_address: req.ip || '127.0.0.1',
      });
      return res.status(403).json({
        error: 'Forbidden: You can only edit jobs assigned to you.',
      });
    }

    // 2. Technician MUST NOT change the assigned technician
    if (req.body.technician_id && req.body.technician_id !== existingJob.technician_id) {
      return res.status(403).json({
        error: 'Forbidden: Technicians are not allowed to reassign service jobs to other technicians.',
      });
    }

    // 3. Technician MUST NOT alter service charges or payments (Financial Lock)
    if (req.body.service_charge !== undefined && Number(req.body.service_charge) !== existingJob.service_charge) {
      db.recordAudit({
        user_id: req.user.id,
        username: req.user.username,
        technician_id: req.user.technician_id,
        action: 'UNAUTHORIZED_FINANCIAL_ATTEMPT',
        target_type: 'job',
        target_id: id,
        details: `Technician @${req.user.username} attempted to alter service charge for job ${existingJob.service_number} from ${existingJob.service_charge} to ${req.body.service_charge}. Action blocked.`,
        ip_address: req.ip || '127.0.0.1',
      });
      return res.status(403).json({
        error: 'Forbidden: Technicians are not allowed to alter service charges. Financial alterations are restricted to Administrators.',
      });
    }

    if (req.body.amount_paid !== undefined && Number(req.body.amount_paid) !== existingJob.amount_paid) {
      db.recordAudit({
        user_id: req.user.id,
        username: req.user.username,
        technician_id: req.user.technician_id,
        action: 'UNAUTHORIZED_FINANCIAL_ATTEMPT',
        target_type: 'job',
        target_id: id,
        details: `Technician @${req.user.username} attempted to alter payment amount for job ${existingJob.service_number}. Action blocked.`,
        ip_address: req.ip || '127.0.0.1',
      });
      return res.status(403).json({
        error: 'Forbidden: Technicians are not allowed to record or modify payments. Financial management is restricted to Administrators.',
      });
    }
  }

  // Calculate updated financials if parts/charge changed
  const parts_used = req.body.parts_used || existingJob.parts_used || [];
  const parts_cost = parts_used.reduce((sum: number, p: any) => sum + (Number(p.total_cost) || 0), 0);
  const service_charge = req.body.service_charge !== undefined ? Number(req.body.service_charge) : existingJob.service_charge;
  const total_cost = service_charge + parts_cost;
  // Payments are the source of truth; a stale modal must never overwrite a newer receipt.
  const amount_paid = existingJob.amount_paid;
  const payment_status =
    amount_paid >= total_cost && total_cost > 0
      ? 'paid'
      : amount_paid > 0
      ? 'partial'
      : 'unpaid';

  // Workflow completion timestamps
  let completed_at = existingJob.completed_at;
  let delivered_at = existingJob.delivered_at;
  if (req.body.status_id === 'completed' && !completed_at) {
    completed_at = new Date().toISOString();
  }
  if (req.body.status_id === 'delivered' && !delivered_at) {
    delivered_at = new Date().toISOString();
  }

  // Safe updates payload
  const updates: any = {
    ...req.body,
    parts_cost,
    service_charge,
    total_cost,
    amount_paid,
    payment_status,
    completed_at,
    delivered_at,
  };

  // If user is technician, strictly enforce technician_id cannot be altered
  if (req.user?.role === 'technician') {
    updates.technician_id = existingJob.technician_id;
  }

  const updatedJob = db.updateJob(id, updates);

  // Record audit log
  db.recordAudit({
    user_id: req.user ? req.user.id : 'USR-001',
    username: req.user ? req.user.username : 'admin',
    technician_id: updatedJob?.technician_id,
    action: req.body.status_id && req.body.status_id !== existingJob.status_id ? 'STATUS_UPDATE' : 'JOB_UPDATE',
    target_type: 'job',
    target_id: id,
    details: `${req.user?.role === 'admin' ? 'Admin' : 'Technician'} ${req.user?.username} updated job ${existingJob.service_number} (Status: ${updatedJob?.status_id}).`,
    ip_address: req.ip || '127.0.0.1',
  });

  // Automated Telegram alert for status change
  if (req.body.status_id && req.body.status_id !== existingJob.status_id && updatedJob) {
    const cust = db.getCustomerById(updatedJob.customer_id);
    const dev = db.getDeviceById(updatedJob.device_id);
    const tech = db.getTechnicianById(updatedJob.technician_id);
    const statusEmoji: Record<string, string> = {
      received: '📥',
      diagnosing: '🔍',
      waiting_parts: '⏳',
      repairing: '🛠️',
      ready: '✅',
      completed: '🎉',
      delivered: '📦',
      cancelled: '❌',
    };
    const emoji = statusEmoji[updatedJob.status_id] || '🔄';
    dispatchTelegramAlert(
      'status_change',
      `${emoji} <b>Repair Status Updated</b>\n` +
        `<b>Ticket:</b> <code>${updatedJob.service_number}</code>\n` +
        `<b>New Status:</b> <b>${updatedJob.status_id.toUpperCase().replace('_', ' ')}</b> (was: ${existingJob.status_id})\n` +
        `<b>Customer:</b> ${tgHtml(cust?.name || 'Customer')}\n` +
        `<b>Device:</b> ${tgHtml(dev ? `${dev.brand} ${dev.model}` : 'Device')}\n` +
        `<b>Technician:</b> ${tgHtml(tech?.full_name || 'N/A')}\n` +
        (updatedJob.diagnosis ? `<b>Diagnosis:</b> ${tgHtml(updatedJob.diagnosis)}\n` : '') +
        (updatedJob.repair_notes ? `<b>Repair Notes:</b> ${tgHtml(updatedJob.repair_notes)}\n` : '')
    );
  }

  return res.json(updatedJob);
});

// Add parts to job (Admin or Assigned Technician)
app.post('/api/jobs/:id/parts', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existingJob = db.getJobById(id);
  if (!existingJob) {
    return res.status(404).json({ error: 'Service job not found.' });
  }

  if (req.user?.role === 'technician' && existingJob.technician_id !== req.user.technician_id) {
    return res.status(403).json({ error: 'Forbidden: You can only add parts to your assigned jobs.' });
  }

  const { part_name, part_number, quantity, unit_cost, warranty } = req.body;
  if (!part_name) {
    return res.status(400).json({ error: 'Part name is required.' });
  }

  const qty = Number(quantity ?? 1);
  const cost = Number(unit_cost ?? 0);
  if (!Number.isInteger(qty) || qty <= 0 || !Number.isFinite(cost) || cost < 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer and cost must be finite and non-negative.' });
  }
  const newPart = {
    id: `PART-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    service_job_id: id,
    part_name,
    part_number: part_number || '',
    quantity: qty,
    unit_cost: cost,
    total_cost: qty * cost,
    warranty: warranty || '30 Days',
    created_at: new Date().toISOString(),
  };

  const updatedParts = [...(existingJob.parts_used || []), newPart];
  const parts_cost = updatedParts.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  const total_cost = (existingJob.service_charge || 0) + parts_cost;

  const updatedJob = db.updateJob(id, {
    parts_used: updatedParts,
    parts_cost,
    total_cost,
  });

  db.recordAudit({
    user_id: req.user ? req.user.id : 'USR-001',
    username: req.user ? req.user.username : 'admin',
    technician_id: updatedJob?.technician_id,
    action: 'JOB_PART_ADDED',
    target_type: 'job',
    target_id: id,
    details: `${req.user?.username} added part "${part_name}" (Qty: ${qty}) to job ${existingJob.service_number}.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.status(201).json(updatedJob);
});

// Update Job Status directly
app.put('/api/jobs/:id/status', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existingJob = db.getJobById(id);
  if (!existingJob) {
    return res.status(404).json({ error: 'Service job not found.' });
  }

  if (req.user?.role === 'technician' && existingJob.technician_id !== req.user.technician_id) {
    return res.status(403).json({ error: 'Forbidden: You can only update your assigned jobs.' });
  }

  const { status_id } = req.body;
  if (!status_id) {
    return res.status(400).json({ error: 'status_id is required.' });
  }

  let completed_at = existingJob.completed_at;
  let delivered_at = existingJob.delivered_at;
  if (status_id === 'completed' && !completed_at) {
    completed_at = new Date().toISOString();
  }
  if (status_id === 'delivered' && !delivered_at) {
    delivered_at = new Date().toISOString();
  }

  const updatedJob = db.updateJob(id, { status_id, completed_at, delivered_at });
  if (updatedJob && status_id !== existingJob.status_id) void dispatchTelegramAlert('status_change',
    `🔄 <b>Repair Status Updated</b>\n<b>Ticket:</b> ${tgHtml(updatedJob.service_number)}\n<b>New Status:</b> ${tgHtml(status_id)} (was: ${tgHtml(existingJob.status_id)})`);
  return res.json(updatedJob);
});

app.delete('/api/jobs/:id', (req: AuthRequest, res: Response) => {
  // Only Admin can delete jobs. Technicians cannot delete any job!
  if (req.user?.role !== 'admin') {
    db.recordAudit({
      user_id: req.user ? req.user.id : 'UNKNOWN',
      username: req.user ? req.user.username : 'unknown',
      action: 'UNAUTHORIZED_DELETE_ATTEMPT',
      target_type: 'job',
      target_id: req.params.id,
      details: `Technician attempted to delete service job ${req.params.id}. Action blocked.`,
      ip_address: req.ip || '127.0.0.1',
    });
    return res.status(403).json({
      error: 'Forbidden: Only administrators can delete service jobs.',
    });
  }

  const { id } = req.params;
  const deleted = db.deleteJob(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Service job not found.' });
  }

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'JOB_DELETED',
    target_type: 'job',
    target_id: id,
    details: `Admin ${req.user.username} deleted job ${id}.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({ success: true, message: 'Job deleted successfully.' });
});

// ==========================================
// 4. REPORTS & AUDIT TRAIL API
// ==========================================

app.get('/api/reports/technicians', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Reports are restricted to administrators.' });
  }

  const technicians = db.getTechnicians();
  const jobs = db.getJobs();

  const report = technicians.map((tech) => {
    const techJobs = jobs.filter((j) => j.technician_id === tech.id);
    const received = techJobs.filter((j) => j.status_id === 'received').length;
    const diagnosing = techJobs.filter((j) => j.status_id === 'diagnosing').length;
    const waiting_parts = techJobs.filter((j) => j.status_id === 'waiting_parts').length;
    const repairing = techJobs.filter((j) => j.status_id === 'repairing').length;
    const ready = techJobs.filter((j) => j.status_id === 'ready').length;
    const completed = techJobs.filter((j) => j.status_id === 'completed').length;
    const delivered = techJobs.filter((j) => j.status_id === 'delivered').length;
    const cancelled = techJobs.filter((j) => j.status_id === 'cancelled').length;

    const total_charges = techJobs.reduce((sum, j) => sum + j.service_charge, 0);

    return {
      technician_id: tech.id,
      technician_name: tech.full_name,
      username: tech.username,
      total_jobs: techJobs.length,
      received,
      diagnosing,
      waiting_parts,
      repairing,
      ready,
      completed,
      delivered,
      cancelled,
      total_service_charges: total_charges,
    };
  });

  return res.json(report);
});

app.get('/api/audit', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Security audit is restricted to administrators.' });
  }
  return res.json(db.getAuditTrail());
});

// ==========================================
// 4b. SERVICE PAYMENTS API
// ==========================================

app.get('/api/payments', (req: AuthRequest, res: Response) => {
  const { service_job_id, payment_method, date_from, date_to } = req.query;
  let payments = db.getPayments();

  // If user is technician, strictly only show payments for jobs assigned to them
  if (req.user?.role === 'technician') {
    const techId = req.user.technician_id;
    const jobs = db.getJobs().filter((j) => j.technician_id === techId);
    const jobIds = new Set(jobs.map((j) => j.id));
    payments = payments.filter((p) => jobIds.has(p.service_job_id));
  }

  if (service_job_id && typeof service_job_id === 'string') {
    payments = payments.filter((p) => p.service_job_id === service_job_id);
  }

  if (payment_method && typeof payment_method === 'string' && payment_method !== 'all') {
    payments = payments.filter((p) => p.payment_method.toLowerCase() === payment_method.toLowerCase());
  }

  if (date_from && typeof date_from === 'string') {
    payments = payments.filter((p) => p.paid_at.slice(0, 10) >= date_from);
  }

  if (date_to && typeof date_to === 'string') {
    payments = payments.filter((p) => p.paid_at.slice(0, 10) <= date_to);
  }

  return res.json(payments);
});

app.post('/api/payments', (req: AuthRequest, res: Response) => {
  // CRITICAL SECURITY RULE: Technicians CANNOT create payments
  if (!req.user || !['admin','cashier'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: Payment management is restricted to Admin.' });
  }

  const {
    service_job_id,
    payment_method,
    amount,
    currency_code,
    notes,
    payment_note,
    reference_number,
    received_by,
    paid_at,
  } = req.body;

  if (!service_job_id) {
    return res.status(400).json({ error: 'Service job ID is required.' });
  }

  const job = db.getJobById(service_job_id);
  if (!job) {
    return res.status(404).json({ error: 'Service job not found.' });
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required.' });
  }

  const receiver = (req.user?.role === 'cashier' ? req.user.full_name : received_by) || req.user?.full_name || req.user?.username || 'Admin';
  const currency = currency_code || db.getSettings().currency || 'MMK';
  const finalNote = payment_note || notes || '';

  const newPayment = db.createPayment({
    ...(req.user.role === 'cashier' ? { cashier_id: req.user.id } : {}),
    service_job_id,
    payment_method: payment_method || 'Cash',
    amount: amountNum,
    currency_code: currency,
    reference_number: reference_number || '',
    payment_note: finalNote,
    notes: finalNote,
    paid_at: paid_at || new Date().toISOString(),
    received_by: receiver,
    created_by: req.user.username,
  });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    technician_id: job.technician_id,
    action: 'PAYMENT_CREATED',
    target_type: 'payment',
    target_id: newPayment.id,
    details: `${tgHtml(receiver)} created payment ${newPayment.id} (${tgHtml(currency)} ${amountNum}) via ${payment_method || 'Cash'}${reference_number ? ` (Ref: ${tgHtml(reference_number)})` : ''} for job ${job.service_number}.`,
    ip_address: req.ip || '127.0.0.1',
  });

  // Automated Telegram alert for payment receipt
  const payCust = db.getCustomerById(job.customer_id);
  dispatchTelegramAlert(
    'payment',
    `💰 <b>Customer Payment Recorded</b>\n` +
      `<b>Receipt:</b> <code>${newPayment.id}</code>\n` +
      `<b>Ticket:</b> <code>${job.service_number}</code>\n` +
      `<b>Customer:</b> ${tgHtml(payCust?.name || 'Customer')}\n` +
      `<b>Amount:</b> <b>${tgHtml(currency)} ${amountNum.toLocaleString()}</b>\n` +
      `<b>Method:</b> ${tgHtml(newPayment.payment_method)}\n` +
      (reference_number ? `<b>Reference:</b> ${tgHtml(reference_number)}\n` : '') +
      `<b>Cashier:</b> ${tgHtml(receiver)}`
  );

  return res.status(201).json(newPayment);
});

// Edit Payment (Admin only, 403 for technician)
app.put('/api/payments/:id', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Payment management is restricted to Admin.' });
  }

  const paymentId = req.params.id;
  const oldPayment = db.getPaymentById(paymentId);
  if (!oldPayment) {
    return res.status(404).json({ error: 'Payment not found.' });
  }

  if (oldPayment.is_deleted) return res.status(409).json({ error: 'Deleted payments cannot be edited.' });
  const { amount, payment_method, reference_number, payment_note, paid_at, reason, service_job_id } = req.body;
  if (service_job_id !== undefined && !db.getJobById(service_job_id)) {
    return res.status(400).json({ error: 'Target service job does not exist.' });
  }
  const editReason = reason || 'Admin updated payment details';

  if (amount !== undefined && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) {
    return res.status(400).json({ error: 'Payment amount must be a positive finite number.' });
  }

  const updates: any = {};
  if (amount !== undefined) updates.amount = Number(amount);
  if (payment_method !== undefined) updates.payment_method = payment_method;
  if (reference_number !== undefined) updates.reference_number = reference_number;
  if (payment_note !== undefined) {
    updates.payment_note = payment_note;
    updates.notes = payment_note;
  }
  if (paid_at !== undefined) updates.paid_at = paid_at;
  if (service_job_id !== undefined && service_job_id !== oldPayment.service_job_id) {
    updates.service_job_id = service_job_id;
  }

  const updated = db.updatePayment(paymentId, updates, req.user.username, editReason);
  if (!updated) {
    return res.status(500).json({ error: 'Failed to update payment' });
  }

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    technician_id: updated.technician_id,
    action: 'PAYMENT_EDITED',
    target_type: 'payment',
    target_id: paymentId,
    details: `Admin @${req.user.username} edited payment ${paymentId}. Old amount: ${oldPayment.currency_code} ${oldPayment.amount}, New amount: ${updated.currency_code} ${updated.amount}. Reason: ${editReason}.`,
    old_value: { amount: oldPayment.amount, method: oldPayment.payment_method, ref: oldPayment.reference_number },
    new_value: { amount: updated.amount, method: updated.payment_method, ref: updated.reference_number },
    reason: editReason,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json(updated);
});

// Delete Payment (Soft delete, Admin only, 403 for technician)
app.delete('/api/payments/:id', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Payment management is restricted to Admin.' });
  }

  const paymentId = req.params.id;
  const oldPayment = db.getPaymentById(paymentId);
  if (!oldPayment) {
    return res.status(404).json({ error: 'Payment not found.' });
  }

  const deleteReason = req.body?.reason || req.query?.reason as string || 'Admin deleted payment record';

  const deleted = db.deletePayment(paymentId, req.user.username, deleteReason);
  if (!deleted) {
    return res.status(500).json({ error: 'Failed to delete payment' });
  }

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    technician_id: oldPayment.technician_id,
    action: 'PAYMENT_DELETED',
    target_type: 'payment',
    target_id: paymentId,
    details: `Admin @${req.user.username} soft-deleted payment ${paymentId} (${oldPayment.currency_code} ${oldPayment.amount}). Reason: ${deleteReason}.`,
    old_value: { id: oldPayment.id, amount: oldPayment.amount, job: oldPayment.service_job_id },
    reason: deleteReason,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({ success: true, payment: deleted });
});

// Print Payment Receipt audit (Admin only, 403 for technician)
app.post('/api/payments/:id/receipt-printed', (req: AuthRequest, res: Response) => {
  if (!req.user || !['admin','cashier'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: Only Admin can print official payment receipts.' });
  }

  const paymentId = req.params.id;
  const payment = db.getPaymentById(paymentId);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found.' });
  }

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    technician_id: payment.technician_id,
    action: 'PAYMENT_RECEIPT_PRINTED',
    target_type: 'payment',
    target_id: paymentId,
    details: `Admin @${req.user.username} printed official payment receipt for payment ${payment.id} (${payment.currency_code} ${payment.amount}).`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({ success: true });
});

// ==========================================
// 4.5. INCOME & EXPENSE API (ADMIN)
// ==========================================

app.get('/api/finance/income', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Financial records are restricted to Admin.' });
  }
  if (!isPaidPlanActive()) {
    return res.status(403).json({ error: 'Forbidden: Income reports require an active PAID license.' });
  }
  return res.json(db.getIncome(req.query.include_deleted === 'true'));
});

app.post('/api/finance/income', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Financial records are restricted to Admin.' });
  }

  const { date, reference, service_number, service_job_id, customer_name, technician_id, description, amount, currency, payment_method } = req.body;
  if (!description || !String(description).trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'A description and positive finite amount are required.' });
  }

  const newIncome = db.createIncome({
    date: date || new Date().toISOString(),
    reference: reference || `INC-${Date.now().toString().slice(-4)}`,
    service_number,
    service_job_id,
    customer_name,
    technician_id,
    description,
    amount: Number(amount) || 0,
    currency: currency || db.getSettings().currency || 'MMK',
    payment_method: payment_method || 'cash',
    created_by: req.user.username,
  });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'INCOME_CREATED',
    target_type: 'finance',
    target_id: newIncome.id,
    details: `Admin @${req.user.username} recorded income ${newIncome.id} (${newIncome.currency} ${newIncome.amount}) for "${description}".`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.status(201).json(newIncome);
});

app.put('/api/finance/income/:id', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Financial records are restricted to Admin.' });
  }

  if (req.body.amount !== undefined && (!Number.isFinite(Number(req.body.amount)) || Number(req.body.amount) <= 0)) return res.status(400).json({ error: 'Amount must be a positive finite number.' });
  if (req.body.description !== undefined && (typeof req.body.description !== 'string' || !req.body.description.trim())) return res.status(400).json({ error: 'Description is required.' });
  const allowed = ['date', 'reference', 'description', 'amount', 'currency', 'payment_method', 'category', 'service_number', 'service_job_id', 'customer_name', 'technician_id', 'technician_name'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (updates.amount !== undefined) updates.amount = Number(updates.amount);
  const updated = db.updateIncome(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Income record not found.' });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'INCOME_EDITED',
    target_type: 'finance',
    target_id: req.params.id,
    details: `Admin @${req.user.username} edited income record ${req.params.id}.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json(updated);
});

app.delete('/api/finance/income/:id', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Financial records are restricted to Admin.' });
  }

  const success = db.deleteIncome(req.params.id, req.user.username);
  if (!success) return res.status(404).json({ error: 'Income record not found.' });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'INCOME_DELETED',
    target_type: 'finance',
    target_id: req.params.id,
    details: `Admin @${req.user.username} soft-deleted income record ${req.params.id}.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({ success: true });
});

app.get('/api/finance/expense', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Financial records are restricted to Admin.' });
  }
  return res.json(db.getExpenses(req.query.include_deleted === 'true'));
});

app.post('/api/finance/expense', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Financial records are restricted to Admin.' });
  }

  const { date, reference, category, description, amount, currency, payment_method } = req.body;
  if (!description || !String(description).trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'A description and positive finite amount are required.' });
  }

  const newExpense = db.createExpense({
    date: date || new Date().toISOString(),
    reference: reference || `EXP-${Date.now().toString().slice(-4)}`,
    category: category || 'Parts',
    description,
    amount: Number(amount) || 0,
    currency: currency || db.getSettings().currency || 'MMK',
    payment_method: payment_method || 'cash',
    created_by: req.user.username,
  });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'EXPENSE_CREATED',
    target_type: 'finance',
    target_id: newExpense.id,
    details: `Admin @${req.user.username} recorded expense ${newExpense.id} (${newExpense.currency} ${newExpense.amount}) [${newExpense.category}] for "${description}".`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.status(201).json(newExpense);
});

app.put('/api/finance/expense/:id', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Financial records are restricted to Admin.' });
  }

  if (req.body.amount !== undefined && (!Number.isFinite(Number(req.body.amount)) || Number(req.body.amount) <= 0)) return res.status(400).json({ error: 'Amount must be a positive finite number.' });
  if (req.body.description !== undefined && (typeof req.body.description !== 'string' || !req.body.description.trim())) return res.status(400).json({ error: 'Description is required.' });
  const allowed = ['date', 'reference', 'description', 'amount', 'currency', 'payment_method', 'category', 'service_number', 'service_job_id', 'customer_name', 'technician_id', 'technician_name'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (updates.amount !== undefined) updates.amount = Number(updates.amount);
  const updated = db.updateExpense(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Expense record not found.' });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'EXPENSE_EDITED',
    target_type: 'finance',
    target_id: req.params.id,
    details: `Admin @${req.user.username} edited expense record ${req.params.id}.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json(updated);
});

app.delete('/api/finance/expense/:id', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Financial records are restricted to Admin.' });
  }

  const success = db.deleteExpense(req.params.id, req.user.username);
  if (!success) return res.status(404).json({ error: 'Expense record not found.' });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'EXPENSE_DELETED',
    target_type: 'finance',
    target_id: req.params.id,
    details: `Admin @${req.user.username} soft-deleted expense record ${req.params.id}.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({ success: true });
});

// Settlement APIs (Admin only, 403 for technician)
app.get('/api/settlements', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Payment settlement is restricted to Admin.' });
  }
  return res.json(db.getSettlements());
});

app.post('/api/settlements', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Payment settlement is restricted to Admin.' });
  }

  const newSettlement = db.createSettlement({
    ...req.body,
    currency: req.body.currency || db.getSettings().currency || 'MMK',
  });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'SETTLEMENT_CREATED',
    target_type: 'finance',
    target_id: newSettlement.id,
    details: `Admin @${req.user.username} initiated ${newSettlement.settlement_type} settlement ${newSettlement.id} (Net: ${newSettlement.currency} ${newSettlement.net_balance}).`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.status(201).json(newSettlement);
});

app.post('/api/settlements/:id/close', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only Admin can close financial settlements.' });
  }

  const closed = db.closeSettlement(req.params.id, req.user.username);
  if (!closed) return res.status(404).json({ error: 'Settlement not found.' });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'SETTLEMENT_CLOSED',
    target_type: 'finance',
    target_id: closed.id,
    details: `Admin @${req.user.username} finalized and closed settlement ${closed.id}.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json(closed);
});

// Backup & Restore APIs (Admin only, 403 for technician)
app.get('/api/backup', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Database backup is restricted to Admin.' });
  }
  const backup = db.createBackupSnapshot();
  return res.json(backup.metadata);
});

app.post('/api/backup', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Database backup is restricted to Admin.' });
  }

  const backup = db.createBackupSnapshot();

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'BACKUP_CREATED',
    target_type: 'backup',
    target_id: backup.metadata.id,
    details: `Admin @${req.user.username} generated system database backup (${backup.metadata.size_bytes} bytes, ${backup.metadata.item_counts.service_jobs} jobs).`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json(backup);
});

app.post('/api/restore', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Database restore is restricted to Admin.' });
  }

  const backupData = req.body?.data || req.body;
  const result = db.restoreBackupSnapshot(backupData, req.user.username);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'BACKUP_RESTORED',
    target_type: 'backup',
    target_id: `RESTORE-${Date.now()}`,
    details: `Admin @${req.user.username} restored system database snapshot. Integrity verified.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({ success: true, message: 'Database successfully restored and verified.' });
});

app.post('/api/database/clear-demo', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }
  db.clearDemoData();
  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'CLEAR_DEMO_DATA',
    target_type: 'system',
    target_id: 'DB-CLEAR',
    details: `Admin ${req.user.username} cleared all demo records and started with a fresh store database.`,
    ip_address: req.ip || '127.0.0.1',
  });
  return res.json({ success: true, message: 'Demo data cleared successfully. Store database is now fresh.' });
});

// ==========================================
// 5. CUSTOMERS & DEVICES API
// ==========================================

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
};
const validateCustomerDeletion = (req: Request, res: Response, next: NextFunction) => {
  const ids = req.body.customer_ids;
  if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some(id => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length) {
    return res.status(400).json({ error: 'Select 1–100 distinct customers.' });
  }
  if (ids.some(id => !db.getCustomerById(id))) return res.status(404).json({ error: 'A selected customer no longer exists. Refresh the list.' });
  next();
};
app.post('/api/customers/delete-preview', requireAdmin, validateCustomerDeletion, (req, res) => {
  try { return res.json(db.previewCustomerDeletion(req.body.customer_ids)); }
  catch (error: any) { return res.status(409).json({ error: error.message }); }
});
app.post('/api/customers/delete-confirmed', requireAdmin, validateCustomerDeletion, (req: AuthRequest, res) => {
  if (typeof req.body.revision !== 'string' || !/^[a-f0-9]{64}$/.test(req.body.revision)) return res.status(400).json({ error: 'Review and confirm the deletion first.' });
  try {
    const result = db.deleteCustomersWithRecords(req.body.customer_ids, req.body.revision, req.user!, req.ip || '127.0.0.1');
    return res.json({ success: true, ...result });
  } catch (error: any) {
    if (/Records changed|another customer/.test(error.message)) return res.status(409).json({ error: error.message });
    return res.status(500).json({ error: 'Deletion could not be saved. No records were deleted; check database and backup directory access.' });
  }
});

const requireIntakeUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !['admin','cashier'].includes(req.user.role)) return res.status(403).json({ error: 'Admin or cashier access required.' });
  next();
};
app.get('/api/users',requireAdmin,(_req,res)=>res.json(db.getUsers().map(user=>({...user,password_configured:Boolean(user.password || db.getTechnicianById(user.technician_id || '')?.password),active:user.active!==false && (user.role!=='admin'||Boolean(user.password)) && (user.role!=='technician' || db.getTechnicianById(user.technician_id || '')?.status==='active')}))));
app.put('/api/users/:id/access',requireAdmin,(req:AuthRequest,res)=>{
  const user=db.getUsers().find(user=>user.id===req.params.id);if(!user)return res.status(404).json({error:'Account not found.'});
  const {role=user.role,active=user.active!==false,password}=req.body;
  if(!['admin','technician','cashier'].includes(role)||typeof active!=='boolean'||(password!==undefined&&(typeof password!=='string'||password.length<8||password.length>128)))return res.status(400).json({error:'Choose a valid role, account status and password of 8–128 characters.'});
  if(role==='technician'&&(!user.technician_id||!db.getTechnicianById(user.technician_id)))return res.status(400).json({error:'Register a linked technician account first. This account has no technician profile.'});
  if(user.id===req.user!.id&&(role!=='admin'||!active))return res.status(409).json({error:'You cannot disable or remove your own administrator access.'});
  if(user.role==='admin'&&user.active!==false&&Boolean(user.password)&&(role!=='admin'||!active)&&db.getUsers().filter(account=>account.role==='admin'&&account.active!==false&&Boolean(account.password)).length<=1)return res.status(409).json({error:'Keep at least one active administrator.'});
  const effectivePassword=user.password || db.getTechnicianById(user.technician_id || '')?.password;
  if(active&&['admin','cashier'].includes(role)&&!effectivePassword&&!password)return res.status(400).json({error:'Set a new password before granting this role.'});
  const copiedPassword=['admin','cashier'].includes(role)&&!user.password&&effectivePassword?(effectivePassword.startsWith('scrypt$')?effectivePassword:hashPassword(effectivePassword)):undefined;
  const changed=role!==user.role || active!==(user.active!==false) || Boolean(password || copiedPassword);
  if(!changed)return res.json({user,changed:false});
  db.updateUserAccess(user.id,{role,active,...(password?{password:hashPassword(password)}:copiedPassword?{password:copiedPassword}:{})});
  if(password)loginLimiter.reset(user.username);
  for(const [token,session] of sessions)if(session.userId===user.id)sessions.delete(token);
  db.recordAudit({user_id:req.user!.id,username:req.user!.username,action:'USER_ACCESS_UPDATED',target_type:'auth',target_id:user.id,details:`Updated role to ${role}; active: ${active}.`,ip_address:req.ip || ''});
  return res.json({user,changed:true});
});

app.get('/api/cashiers', requireAdmin, (_req, res) => res.json(db.getUsers().filter(u => u.role === 'cashier')));
app.post('/api/cashiers', requireAdmin, (req: AuthRequest, res) => {
  const { username, full_name, password } = req.body;
  if (typeof username !== 'string' || !/^[A-Za-z0-9_.-]{3,32}$/.test(username) || typeof full_name !== 'string' || !full_name.trim() || full_name.length > 100 || typeof password !== 'string' || password.length < 8 || password.length > 128) return res.status(400).json({ error: 'Enter a name, unique username (3–32 characters), and password (8–128 characters).' });
  if (username === 'tech1' || db.getUserByUsername(username)) return res.status(409).json({ error: 'Username is already in use.' });
  const cashier = db.createCashier({ username, full_name: full_name.trim(), password: hashPassword(password) });
  db.recordAudit({ user_id: req.user!.id, username: req.user!.username, action: 'CASHIER_CREATED', target_type: 'auth', target_id: cashier.id, details: 'Administrator created a cashier account.', ip_address: req.ip || '127.0.0.1' });
  return res.status(201).json(cashier);
});
app.put('/api/cashiers/:id', requireAdmin, (req: AuthRequest, res) => {
  const updates: Partial<User> = {};
  for (const field of ['full_name','phone','email','address'] as const) {
    if (req.body[field] !== undefined) {
      if (typeof req.body[field] !== 'string' || req.body[field].length > (field === 'address' ? 1000 : 100) || (field === 'full_name' && !req.body[field].trim())) return res.status(400).json({ error: 'Enter valid cashier profile details.' });
      updates[field] = req.body[field].trim();
    }
  }
  if (req.body.profile_photo !== undefined) {
    const invalidPhoto = imageValidationError(req.body.profile_photo);
    if (invalidPhoto) return res.status(400).json({ error: invalidPhoto });
    updates.profile_photo = req.body.profile_photo;
  }

  if (req.body.active !== undefined) {
    if (typeof req.body.active !== 'boolean') return res.status(400).json({ error: 'Active must be true or false.' });
    updates.active = req.body.active;
  }
  if (req.body.password !== undefined) {
    if (typeof req.body.password !== 'string' || req.body.password.length < 8 || req.body.password.length > 128) return res.status(400).json({ error: 'Password must contain 8–128 characters.' });
    updates.password = hashPassword(req.body.password);
  }
  const user = db.updateCashier(req.params.id, updates);
  if (!user) return res.status(404).json({ error: 'Cashier not found.' });
  if (updates.active !== undefined || updates.password !== undefined) for (const [token, session] of sessions) if (session.userId === user.id) sessions.delete(token);
  db.recordAudit({ user_id: req.user!.id, username: req.user!.username, action: 'CASHIER_UPDATED', target_type: 'auth', target_id: user.id, details: 'Administrator updated cashier access/password.', ip_address: req.ip || '127.0.0.1' });
  return res.json(user);
});
app.delete('/api/cashiers/:id', requireAdmin, (req: AuthRequest, res) => {
  if (!db.deleteCashier(req.params.id)) return res.status(404).json({ error: 'Cashier not found.' });
  db.recordAudit({ user_id: req.user!.id, username: req.user!.username, action: 'CASHIER_DELETED', target_type: 'auth', target_id: req.params.id, details: 'Administrator removed a cashier account; payment history retained.', ip_address: req.ip || '127.0.0.1' });
  return res.json({ success: true });
});

app.get('/api/customers', (_req, res) => res.json(db.getCustomers()));
app.post('/api/customers', requireIntakeUser, (req, res) => {
  if (typeof req.body.name !== 'string' || !req.body.name.trim() || typeof req.body.phone !== 'string' || !req.body.phone.trim()) {
    return res.status(400).json({ error: 'Customer name and phone are required.' });
  }
  return res.status(201).json(db.createCustomer(req.body));
});
app.put('/api/customers/:id', requireAdmin, (req, res) => {
  if (req.body.name !== undefined && (typeof req.body.name !== 'string' || !req.body.name.trim())) return res.status(400).json({ error: 'Customer name is required.' });
  if (req.body.phone !== undefined && (typeof req.body.phone !== 'string' || !req.body.phone.trim())) return res.status(400).json({ error: 'Customer phone is required.' });
  const updated = db.updateCustomer(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Customer not found.' });
  return res.json(updated);
});
app.delete('/api/customers/:id', requireAdmin, (req, res) => {
  if (db.getDevices().some(d => d.customer_id === req.params.id) || db.getJobs().some(j => j.customer_id === req.params.id)) {
    return res.status(409).json({ error: 'Customer is linked to devices or repair jobs. Remove those records first.' });
  }
  if (!db.deleteCustomer(req.params.id)) return res.status(404).json({ error: 'Customer not found.' });
  return res.json({ success: true });
});

app.get('/api/devices', (_req, res) => res.json(db.getDevices()));
const validateDevice = (req: Request, res: Response, next: NextFunction) => {
  if ((req.method === 'POST' || req.body.customer_id !== undefined) && !db.getCustomerById(req.body.customer_id)) {
    return res.status(400).json({ error: 'Device customer does not exist.' });
  }
  if (req.method === 'PUT' && req.body.customer_id !== undefined && db.getJobs().some(j => j.device_id === req.params.id && j.customer_id !== req.body.customer_id)) {
    return res.status(409).json({ error: 'Cannot transfer a device linked to a repair job.' });
  }
  for (const key of ['brand', 'model']) {
    if ((req.method === 'POST' || req.body[key] !== undefined) && (typeof req.body[key] !== 'string' || !req.body[key].trim())) {
      return res.status(400).json({ error: 'Device brand and model are required.' });
    }
  }
  next();
};
app.post('/api/devices', requireIntakeUser, validateDevice, (req, res) => res.status(201).json(db.createDevice(req.body)));
app.put('/api/devices/:id', requireAdmin, validateDevice, (req, res) => {
  const updated = db.updateDevice(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Device not found.' });
  return res.json(updated);
});
app.delete('/api/devices/:id', requireAdmin, (req, res) => {
  if (db.getJobs().some(j => j.device_id === req.params.id)) return res.status(409).json({ error: 'Device is linked to a repair job.' });
  if (!db.deleteDevice(req.params.id)) return res.status(404).json({ error: 'Device not found.' });
  return res.json({ success: true });
});

// ==========================================
// 6. SETTINGS API
const validateDeviceDeletion=(req:Request,res:Response,next:NextFunction)=>{
  const ids=req.body.device_ids;
  if(!Array.isArray(ids)||!ids.length||ids.length>5000||ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)return res.status(400).json({error:'Select 1–5000 distinct devices.'});
  if(ids.some(id=>!db.getDevices().some(device=>device.id===id)))return res.status(404).json({error:'A selected device no longer exists. Refresh the list.'});
  next();
};
app.post('/api/devices/delete-preview',requireAdmin,validateDeviceDeletion,(req,res)=>res.json(db.previewDeviceDeletion(req.body.device_ids)));
app.post('/api/devices/delete-confirmed',requireAdmin,validateDeviceDeletion,(req:AuthRequest,res)=>{
  if(typeof req.body.revision!=='string'||!/^[a-f0-9]{64}$/.test(req.body.revision))return res.status(400).json({error:'Review and confirm the deletion first.'});
  try{return res.json({success:true,...db.deleteDevicesWithRecords(req.body.device_ids,req.body.revision,req.user!,req.ip || '')});}
  catch(error:any){return res.status(/Records changed/.test(error.message)?409:500).json({error:/Records changed/.test(error.message)?error.message:'Deletion could not be saved. No records were deleted; check database and backup directory access.'});}
});

// ==========================================

app.get('/api/settings', (req: AuthRequest, res) => {
  const settings = db.getSettings();
  return res.json(req.user?.role === 'admin' ? settings : { ...settings, telegramBot: { ...settings.telegramBot, bot_token: '' } });
});
app.put('/api/settings', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only administrators can update system settings.' });
  }
  for (const field of ['shopName','phone','email','address','taxId','receiptFooterNote'] as const) {
    if (req.body[field] !== undefined && (typeof req.body[field] !== 'string' || req.body[field].length > (['address','receiptFooterNote'].includes(field) ? 2000 : 200) || (field === 'shopName' && !req.body[field].trim()))) return res.status(400).json({ error: 'Enter valid workshop contact details.' });
  }
  if (req.body.taxPercentage !== undefined && (typeof req.body.taxPercentage !== 'number' || !Number.isFinite(req.body.taxPercentage) || req.body.taxPercentage < 0 || req.body.taxPercentage > 100)) return res.status(400).json({ error: 'Tax percentage must be between 0 and 100.' });
  if (req.body.taxEnabled !== undefined && typeof req.body.taxEnabled !== 'boolean') return res.status(400).json({ error: 'Invalid tax setting.' });
  if(req.body.defaultWarrantyDays!==undefined&&(!Number.isInteger(req.body.defaultWarrantyDays)||req.body.defaultWarrantyDays<0||req.body.defaultWarrantyDays>3650))return res.status(400).json({error:'Warranty days must be a whole number from 0 to 3650.'});
  const invalidLogo = imageValidationError(req.body.shopLogo);
  if (invalidLogo) return res.status(400).json({ error: invalidLogo });
  if (req.body.paymentSettings) {
    for (const profile of ['thailand','myanmar','china','global']) {
      const methods = req.body.paymentSettings[profile]?.methods;
      if (methods !== undefined && !Array.isArray(methods)) return res.status(400).json({ error: 'Invalid payment channel list.' });
      for (const method of methods || []) {
        if (!method || typeof method.id !== 'string') return res.status(400).json({ error: 'Invalid payment channel.' });
        const invalid = imageValidationError(method.qr_code);
        if (invalid) return res.status(400).json({ error: invalid });
      }
    }
  }
  const updated = db.updateSettings(req.body);
  return res.json(updated);
});

// ==========================================
// 6.5. LICENSE API (CLIENT APPLICATION ONLY)
// ==========================================

// Get current client license state
app.get('/api/license', (_req, res) => {
  return res.json(db.getLicense());
});

// Admin: Get all generated license keys
app.get('/api/admin/licenses', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }
  return res.json({ success: true, licenses: db.getLicensesRegistry() });
});

// Admin: Generate new license key
app.post('/api/admin/licenses/generate', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }
  const { plan, days, license_name } = req.body;
  const licenseDays = Number(days ?? 365);
  if (!Number.isInteger(licenseDays) || licenseDays <= 0) return res.status(400).json({ error: 'License duration must be a positive integer.' });
  const newLic = db.generateLicenseKey(plan === 'PAID' ? 'PAID' : 'FREE', licenseDays, license_name || '', req.user.username);
  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'LICENSE_GENERATED',
    target_type: 'system',
    target_id: newLic.license_key,
    details: `Admin generated license key ${newLic.license_key} (${newLic.plan}, ${newLic.days} days).`,
    ip_address: req.ip || '127.0.0.1',
  });
  return res.json({ success: true, license: newLic, message: 'License key generated successfully.' });
});

// Admin: Revoke license key
app.post('/api/admin/licenses/revoke', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }
  const { license_id } = req.body;
  db.revokeLicenseKey(license_id);
  return res.json({ success: true, message: 'License key revoked successfully.' });
});

// Verify License
app.post('/api/license/verify', async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: License verification is restricted to Admin.' });
  }

  const currentLicense = db.getLicense();
  
  // This application verifies its local registry; no owner-server request is made.
  const updated = db.updateLicense({
    last_verified_at: new Date().toISOString(),
    owner_verified: false,
  });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'LICENSE_VERIFIED',
    target_type: 'system',
    target_id: currentLicense.installation_id,
    details: `License checked against local installation state.`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({ success: true, license: updated, message: 'License checked locally; owner server has not been contacted.' });
});

// Activate License
app.post('/api/license/activate', async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: License activation is restricted to Admin.' });
  }

  const { license_key } = req.body;
  if (!license_key || typeof license_key !== 'string' || !license_key.trim()) {
    return res.status(400).json({ error: 'License key is required.' });
  }

  const cleanKey = license_key.trim();
  const registry = db.getLicensesRegistry();
  const foundReg = registry.find(r => r.license_key.toUpperCase() === cleanKey.toUpperCase());
  if (!foundReg || foundReg.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'License key is unknown or revoked. Use a key from the license registry.' });
  }
  const { plan, days, status } = foundReg;
  const licenseName = foundReg.license_name;

  // Reusing a key retains its first expiry date, including after a client reset.
  const installed = db.getLicense();
  const expires_at = (foundReg as any).expires_at ||
    (installed.license_key.toUpperCase() === cleanKey.toUpperCase() ? installed.expires_at : undefined) ||
    new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  if (!Number.isFinite(Date.parse(expires_at)) || Date.parse(expires_at) <= Date.now()) {
    return res.status(400).json({ error: 'License key has expired.' });
  }
  (foundReg as any).expires_at = expires_at;

  const updated = db.updateLicense({
    license_key: cleanKey,
    plan,
    status,
    license_name: licenseName,
    license_days: days,
    expires_at,
    last_verified_at: new Date().toISOString(),
    owner_verified: false,
  });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'LICENSE_ACTIVATED',
    target_type: 'system',
    target_id: cleanKey,
    details: `Admin ${req.user.username} activated license ${cleanKey} (Plan: ${plan}, Status: ${status}, Days: ${days}).`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({ success: true, license: updated, message: `License activated as ${plan} (${days} days) successfully.` });
});

// Remove License (CLIENT-ONLY: MUST NOT modify Owner Server)
app.post('/api/license/remove', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: License management is restricted to Admin.' });
  }

  // IMPORTANT: Remove License is CLIENT-ONLY.
  // It must NOT:
  // - Deactivate Owner License
  // - Revoke Owner License
  // - Delete Owner License
  // - Modify Owner Server
  const current = db.getLicense();
  const resetLicense = db.updateLicense({
    license_name: 'Free Phone Service Management System',
    plan: 'FREE',
    status: 'NOT_ACTIVATED',
    license_key: '',
    license_days: 0,
    expires_at: null,
    last_verified_at: new Date().toISOString(),
    owner_verified: false,
  });

  db.recordAudit({
    user_id: req.user.id,
    username: req.user.username,
    action: 'LICENSE_REMOVED_CLIENT_ONLY',
    target_type: 'system',
    target_id: current.installation_id,
    details: `Admin ${req.user.username} removed local license (client-only reset, Owner server was NOT modified).`,
    ip_address: req.ip || '127.0.0.1',
  });

  return res.json({
    success: true,
    license: resetLicense,
    message: 'Client license removed successfully. Local state reset to Free / Not Activated.',
  });
});

// ==========================================
// 6.6. TELEGRAM BOT SERVICE API
// ==========================================

app.get('/api/telegram', (_req: AuthRequest, res: Response) => {
  if (_req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  return res.json(db.getTelegramBot());
});

app.put('/api/telegram', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only administrators can configure Telegram Bot.' });
  }
  const allowed = ['enabled', 'bot_token', 'chat_id', 'channel_username', 'notify_on_new_job', 'notify_on_status_change', 'notify_on_payment', 'notify_on_daily_summary','daily_summary_schedule_enabled','daily_summary_time','summary_time_zone','summary_language'];
  const updates: any = {};
  for (const key of allowed) {
    if (req.body[key] === undefined) continue;
    if (['bot_token', 'chat_id', 'channel_username','daily_summary_time','summary_time_zone','summary_language'].includes(key)) {
      if (typeof req.body[key] !== 'string' || req.body[key].length > 512) return res.status(400).json({ error: `Invalid ${key}.` });
      updates[key] = req.body[key].trim();
    } else {
      if (typeof req.body[key] !== 'boolean') return res.status(400).json({ error: `Invalid ${key}.` });
      updates[key] = req.body[key];
    }
  }
  if (updates.bot_token && !/^\d+:[A-Za-z0-9_-]+$/.test(updates.bot_token)) return res.status(400).json({ error: 'Invalid Telegram Bot Token format.' });
  if(updates.daily_summary_time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(updates.daily_summary_time))return res.status(400).json({error:'Choose a valid summary time.'});
  if(updates.summary_language&&!['my','en','th','zh'].includes(updates.summary_language))return res.status(400).json({error:'Choose a supported summary language.'});
  if(updates.summary_time_zone!==undefined){try{new Intl.DateTimeFormat('en',{timeZone:updates.summary_time_zone});}catch{return res.status(400).json({error:'Choose a valid time zone.'});}}
  const previous = db.getTelegramBot();
  if ((updates.enabled ?? previous.enabled) && (!(updates.bot_token ?? previous.bot_token) || !(updates.chat_id ?? previous.chat_id))) return res.status(400).json({ error: 'Token and Chat ID are required to enable alerts.' });
  if (['bot_token', 'chat_id', 'channel_username'].some(key => updates[key] !== undefined && updates[key] !== (previous as any)[key])) {
    updates.is_connected = false; updates.bot_name = ''; updates.bot_username = ''; updates.last_tested_at = '';
  }
  const updated = db.updateTelegramBot(updates);
  return res.json(updated);
});

app.post('/api/telegram/test', async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only administrators can test Telegram Bot.' });
  }

  const { bot_token, chat_id } = req.body;
  if (typeof bot_token !== 'string' || !/^\d+:[A-Za-z0-9_-]+$/.test(bot_token) || bot_token.length > 512) {
    return res.status(400).json({ error: 'Telegram Bot Token is required.' });
  }

  try {
    if (chat_id !== undefined && (typeof chat_id !== 'string' || chat_id.length > 512)) return res.status(400).json({ error: 'Invalid Chat ID.' });
    const meData = await telegramRequest(bot_token, 'getMe');
    if (!meData.ok) {
      if (db.getTelegramBot().bot_token === bot_token) db.updateTelegramBot({ is_connected: false });
      return res.status(400).json({
        success: false,
        error: `Telegram Error: ${meData.description || 'Invalid token'}`,
        message: `Telegram Error: ${meData.description || 'Invalid token'}`,
      });
    }

    let msgSent = false;
    let msgError = '';
    if (chat_id && chat_id.trim()) {
      const testMsg =
        `🔔 <b>FixFlow Phone Service Lab</b>\n` +
        `✅ Telegram Bot connected and verified successfully!\n` +
        `🤖 <b>Bot:</b> ${tgHtml(meData.result.first_name)} (@${tgHtml(meData.result.username || 'bot')})\n` +
        `⏰ <b>Timestamp:</b> ${new Date().toLocaleString()}`;
      const sendResult = await sendRawTelegramMessage(bot_token, chat_id.trim(), testMsg);
      msgSent = sendResult.ok;
      const saved = db.getTelegramBot();
      if (msgSent && saved.bot_token === bot_token && saved.chat_id.trim() === chat_id.trim() && saved.channel_username?.trim() && saved.channel_username.trim() !== chat_id.trim()) {
        const channelResult = await sendRawTelegramMessage(bot_token, saved.channel_username.trim(), testMsg);
        if (!channelResult.ok) { msgSent = false; msgError = `Channel delivery failed: ${channelResult.description || 'Unknown error'}`; }
      }
      if (!msgSent && !msgError) {
        msgError = sendResult.description || 'Could not send message to specified Chat ID.';
      }
    }

    const matchesSaved = db.getTelegramBot().bot_token === bot_token && db.getTelegramBot().chat_id.trim() === (chat_id || '').trim();
    const updated = matchesSaved ? db.updateTelegramBot({
      is_connected: Boolean(msgSent),
      bot_name: meData.result.first_name,
      bot_username: meData.result.username,
      last_tested_at: new Date().toISOString(),
    }) : db.getTelegramBot();

    if (chat_id && chat_id.trim() && !msgSent) {
      return res.status(400).json({
        success: false,
        error: `Bot verified (@${meData.result.username}), but failed sending alert to Chat ID ${chat_id}: ${msgError}`,
        message: `Bot verified (@${meData.result.username}), but failed sending alert to Chat ID ${chat_id}: ${msgError}`,
        config: updated,
      });
    }

    return res.json({
      success: true,
      bot: meData.result,
      message_sent: msgSent,
      message: msgSent
        ? `Bot connected and test alert sent successfully to Chat ID: ${chat_id}!`
        : `Bot token verified (@${meData.result.username}). Please enter or detect a Chat ID to receive workshop alerts.`,
      config: updated,
    });
  } catch (err: any) {
    if (db.getTelegramBot().bot_token === bot_token) db.updateTelegramBot({ is_connected: false });
    return res.status(500).json({
      success: false,
      error: 'Could not connect to Telegram. Check internet access.',
      message: 'Could not connect to Telegram. Check internet access.',
    });
  }
});

// Daily Workshop Summary Telegram Dispatch
function validSummaryDate(date:unknown):date is string {return typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(new Date(date).getTime())&&new Date(date).toISOString().slice(0,10)===date;}
function previewSummary(date?:string) {
  const config=db.getTelegramBot(),zone=config.summary_time_zone || 'Asia/Yangon';
  return buildTelegramSummary(db.getJobs(),db.getPayments(),db.getSettings(),date || localDay(new Date(),zone),zone,config.summary_language || db.getSettings().language);
}
let summarySending=false;
async function deliverDailySummary(date?:string) {
  if(summarySending)throw new Error('A summary is already being sent.');
  const config=db.getTelegramBot();if(!config.bot_token || !config.chat_id)throw new Error('Telegram Bot Token and Chat ID must be configured first.');
  summarySending=true;
  try{
    const preview=previewSummary(date),destinations=[config.chat_id,...(config.channel_username&&config.channel_username.trim()!==config.chat_id.trim()?[config.channel_username.trim()]:[])];
    const deliveries=[];
    for(const destination of destinations){const result=await sendRawTelegramMessage(config.bot_token,destination,preview.html);logTelegramDelivery('daily_summary',destination,result);deliveries.push({chat_id:destination,...result});}
    const success=deliveries.every(delivery=>delivery.ok);db.updateTelegramBot({is_connected:success});
    return {success,deliveries,summary:preview.summary,message:success?'Daily summary delivered.':deliveries.filter(delivery=>!delivery.ok).map(delivery=>delivery.description).join('; ')};
  }finally{summarySending=false;}
}
app.get('/api/telegram/summary-preview',requireAdmin,(req,res)=>{
  if(req.query.date!==undefined&&!validSummaryDate(req.query.date))return res.status(400).json({error:'Choose a valid summary date.'});
  return res.json(previewSummary(req.query.date as string|undefined));
});
app.get('/api/telegram/delivery-history',requireAdmin,(_req,res)=>res.json(db.getTelegramBot().delivery_history || []));
app.post('/api/telegram/daily-summary',requireAdmin,async(req,res)=>{
  if(req.body.date!==undefined&&!validSummaryDate(req.body.date))return res.status(400).json({error:'Choose a valid summary date.'});
  try{const result=await deliverDailySummary(req.body.date);return res.status(result.success?200:400).json({...result,...(!result.success?{error:result.message}:{})});}
  catch(error:any){return res.status(summarySending?409:400).json({error:error.message});}
});
const summaryTimer=setInterval(async()=>{
  try{const config=db.getTelegramBot();if(!summaryDue(config)||summarySending)return;const date=localDay(new Date(),config.summary_time_zone || 'Asia/Yangon');db.updateTelegramBot({last_daily_summary_attempt:date});await deliverDailySummary(date);}catch{console.warn('[Telegram Summary] Scheduled attempt failed; inspect delivery history and configuration.');}
},30000);summaryTimer.unref();

// Chat ID Maker API: Fetch recent chats and updates from Telegram Bot
app.post('/api/telegram/get-chat-ids', async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only administrators can access Telegram tools.' });
  }

  const { bot_token } = req.body;
  if (typeof bot_token !== 'string' || !/^\d+:[A-Za-z0-9_-]+$/.test(bot_token) || bot_token.length > 512) {
    return res.status(400).json({ error: 'Telegram Bot Token is required.' });
  }

  try {
    const updatesData = await telegramRequest(bot_token, 'getUpdates', { limit: 100, timeout: 0 });
    if (!updatesData.ok) {
      return res.status(400).json({ success: false, error: updatesData.description || 'Failed to fetch updates from Telegram' });
    }

    const chatsMap = new Map<string, any>();
    if (Array.isArray(updatesData.result)) {
      for (const update of updatesData.result) {
        const msg = update.message || update.edited_message || update.channel_post || update.edited_channel_post || update.my_chat_member || update.chat_member || update.callback_query?.message;
        if (msg && msg.chat) {
          const chat = msg.chat;
          const chatId = String(chat.id);
          const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || 'Direct Chat';
          chatsMap.set(chatId, {
            chat_id: chatId,
            title,
            username: chat.username ? `@${chat.username}` : '',
            type: chat.type,
            last_message: msg.text || (msg.caption ? `[Media] ${msg.caption}` : ''),
            date: msg.date ? new Date(msg.date * 1000).toISOString() : new Date().toISOString(),
          });
        }
      }
    }

    const chats = Array.from(chatsMap.values()).reverse();
    return res.json({
      success: true,
      chats,
      count: chats.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Could not fetch Telegram updates. Check internet access.' });
  }
});

// Download Project ZIP Endpoint
app.get('/api/download-project', (_req: AuthRequest, res: Response) => {
  if (_req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  const filePath = path.resolve('fixflow-project.zip');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'fixflow-project.zip');
  } else {
    res.status(404).json({ error: 'Project ZIP not found.' });
  }
});

// ==========================================
// 6.5. LOCAL NETWORK & PHP CLI MULTI-DEVICE APIS
// ==========================================

let phpCliProcess: ChildProcess | null = null;
let phpCliActivePort = 8080;
let phpCliStarting = false;
let phpCliStopping = false;
process.once('exit',()=>phpCliProcess?.kill());
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{phpCliProcess?.kill();process.exit(0);});

function getSystemNetworkInterfaces() {
  const ifaces = os.networkInterfaces();
  const list: { name: string; ip: string; is_primary?: boolean }[] = [];

  for (const name in ifaces) {
    for (const info of ifaces[name] || []) {
      if (info.family === 'IPv4' && !info.internal) {
        list.push({ name, ip: info.address });
      }
    }
  }

  // Determine primary LAN IP (prefer physical 192.168.x.x router subnet, then 172.x.x.x, avoiding VPN tunnels)
  let primaryIp = '127.0.0.1';
  const lanCandidate =
    list.find((item) => item.ip.startsWith('192.168.')) ||
    list.find((item) => !item.name.toLowerCase().includes('vpn') && !item.name.toLowerCase().includes('tap') && (item.ip.startsWith('10.') || item.ip.startsWith('172.'))) ||
    list.find((item) => item.ip.startsWith('172.')) ||
    list.find((item) => item.ip.startsWith('10.'));
  if (lanCandidate) {
    primaryIp = lanCandidate.ip;
    lanCandidate.is_primary = true;
  } else if (list.length > 0) {
    primaryIp = list[0].ip;
    list[0].is_primary = true;
  }

  return { list, primaryIp };
}

function checkPhpCli() {
  let installed = false;
  let version = '';
  try {
    const raw = execSync('php -v', { encoding: 'utf-8', timeout: 3000 });
    installed = true;
    version = raw.split('\n')[0].trim();
  } catch (e) {
    installed = false;
  }
  return { installed, version };
}

app.get('/api/system/network-info', async (_req: Request, res: Response) => {
  const { list, primaryIp } = getSystemNetworkInterfaces();
  const php = checkPhpCli();

  let isPhpRunning=false;
  if(phpCliProcess&&phpCliProcess.exitCode===null&&phpCliProcess.signalCode===null&&!phpCliStarting&&!phpCliStopping){try{const response=await fetch(`http://127.0.0.1:${phpCliActivePort}/api/health`,{signal:AbortSignal.timeout(1000)});isPhpRunning=response.ok&&(await response.json()).server==='FixFlow-Node';}catch{}}


  return res.json({
    hostname: os.hostname(),
    platform: process.platform,
    interfaces: list,
    primary_ip: primaryIp,
    node_port: port,
    node_lan_url: `http://${primaryIp}:${port}`,
    php_cli: {
      installed: php.installed,
      process_alive: Boolean(phpCliProcess&&phpCliProcess.exitCode===null&&phpCliProcess.signalCode===null),
      is_starting: phpCliStarting,
      is_stopping: phpCliStopping,
      version: php.version,
      is_running: isPhpRunning,
      port: phpCliActivePort,
      lan_url: `http://${primaryIp}:${phpCliActivePort}`,
      command: `php -S 0.0.0.0:${phpCliActivePort} router.php`,
      batch_script: 'start-pos-php-cli.bat',
    },
    firewall_command: `netsh advfirewall firewall add rule name="FixFlow POS Multi-Device" dir=in action=allow protocol=TCP localport=${port},${phpCliActivePort}`,
  });
});

app.post('/api/system/php-cli/start', async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  const requestedPort = Number(req.body?.port ?? 8080);
  if (!Number.isInteger(requestedPort) || requestedPort < 1 || requestedPort > 65535 || requestedPort === port) return res.status(400).json({ error: 'Choose a valid PHP port different from the Node server port.' });
  if (phpCliStarting || phpCliStopping) return res.status(409).json({success:false,error:'PHP startup is already in progress.'});
  if (!fs.existsSync(path.resolve(process.env.FIXFLOW_DIST_DIR || 'dist','index.html'))) return res.status(409).json({success:false,error:'Build the frontend with npm run build before starting PHP CLI.'});
  const php = checkPhpCli();
  if (!php.installed) return res.status(400).json({success:false,error:'PHP CLI is not installed or not in PATH. Install PHP CLI and restart FixFlow.'});
  const { primaryIp } = getSystemNetworkInterfaces();
  if (phpCliProcess && phpCliProcess.exitCode===null && phpCliProcess.signalCode===null) {
    try{const response=await fetch(`http://127.0.0.1:${phpCliActivePort}/api/health`,{signal:AbortSignal.timeout(1000)});if(response.ok&&(await response.json()).server==='FixFlow-Node')return res.json({success:true,message:`PHP CLI server is already running on port ${phpCliActivePort}`,port:phpCliActivePort,lan_url:`http://${primaryIp}:${phpCliActivePort}`,is_running:true});}catch{}
    return res.status(503).json({success:false,is_running:false,error:'PHP process is not responding. Stop it and turn it on again.'});
  }
  phpCliStarting = true;
  let child:ChildProcess|undefined;
  try {
    await new Promise<void>((resolve,reject)=>{const probe=createPortProbe();probe.once('error',reject);probe.listen(requestedPort,'0.0.0.0',()=>probe.close(error=>error?reject(error):resolve()));});
    child = spawn('php', ['-S', `0.0.0.0:${requestedPort}`, path.resolve('router.php')], {
      cwd: process.cwd(), stdio: ['ignore','ignore','pipe'], detached: false,
      env:{...process.env,PORT:String(port),FIXFLOW_DIST_DIR:path.resolve(process.env.FIXFLOW_DIST_DIR || 'dist')},
    });
    const launched=child;
    phpCliProcess=launched;
    let startupError='';
    launched.stderr?.on('data',data=>{startupError=(startupError+data.toString()).slice(-2000);});
    launched.on('error',error=>{startupError=error.message;if(phpCliProcess===launched)phpCliProcess=null;});
    launched.on('exit',()=>{if(phpCliProcess===launched)phpCliProcess=null;});
    let ready=false;
    for(let attempt=0;attempt<30;attempt++){
      await new Promise(resolve=>setTimeout(resolve,100));
      if(launched.exitCode!==null || !phpCliProcess)break;
      try{const response=await fetch(`http://127.0.0.1:${requestedPort}/api/health`,{signal:AbortSignal.timeout(500)});const data=await response.json();if(response.ok&&data.server==='FixFlow-Node'){ready=true;break;}}catch{}
    }
    if(!ready)throw new Error(startupError.includes('Address already in use')?'Port is already in use.':'PHP did not become ready or could not reach the Node backend.');
    phpCliActivePort=requestedPort;
    return res.json({success:true,message:`PHP CLI multi-device server is ready on port ${requestedPort}`,port:requestedPort,lan_url:`http://${primaryIp}:${requestedPort}`,is_running:true});
  } catch(error:any){
    child?.kill();if(phpCliProcess===child)phpCliProcess=null;
    return res.status(500).json({success:false,error:error.code==='EADDRINUSE'?'Port is already in use. Choose another port.':`Failed to start PHP CLI server: ${error.message}`,is_running:false});
  } finally {phpCliStarting=false;}
});

app.post('/api/system/php-cli/stop', async (req: AuthRequest, res: Response) => {
  if(req.user?.role!=='admin')return res.status(403).json({error:'Admin access required.'});
  if(phpCliStarting || phpCliStopping)return res.status(409).json({success:false,error:'Wait for the current PHP server action to finish.'});
  const child=phpCliProcess;
  if(!child)return res.json({success:true,message:'PHP CLI server is off.',is_running:false});
  phpCliStopping=true;
  try{
    const stopped=await new Promise<boolean>(resolve=>{if(child.exitCode!==null || child.signalCode!==null){resolve(true);return;}const timer=setTimeout(()=>resolve(false),3000);child.once('exit',()=>{clearTimeout(timer);resolve(true);});if(!child.kill()){clearTimeout(timer);resolve(false);}});
    if(!stopped)return res.status(500).json({success:false,error:'PHP server did not stop. Check the server terminal.',is_running:true});
    if(phpCliProcess===child)phpCliProcess=null;
    return res.json({success:true,message:'PHP CLI multi-device server is off.',is_running:false});
  }finally{phpCliStopping=false;}
});

// ==========================================
// 7. VITE DEV SERVER INTEGRATION
// ==========================================

app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Request error]', err.message);
  const status = err.status === 400 ? 400 : err.status === 413 ? 413 : 500;
  return res.status(status).json({ error: status === 400 ? 'Invalid JSON request body.' : status === 413 ? 'Request body is too large.' : 'Could not complete the request.' });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const dist = path.resolve(process.env.FIXFLOW_DIST_DIR || 'dist');
    if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Run npm run build before production start.');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  const host = process.env.FIXFLOW_HOST || '0.0.0.0';
  app.listen(port, host, () => {
    console.log(`FixFlow Phone Service Management Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => { console.error(err); process.exit(1); });

import { accountLabels } from '../i18n/accountLabels';
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { User } from '../types';
export function CashierAccountsView() {
  const { getAuthHeaders, language, role } = useApp();
  const [cashiers, setCashiers] = useState<User[]>([]);
  const [form, setForm] = useState({ full_name: '', username: '', password: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [resetId, setResetId] = useState(''); const [resetPassword, setResetPassword] = useState('');
  const refresh = async () => { const response = await fetch('/api/cashiers', { headers: getAuthHeaders() }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setCashiers(data); };
  useEffect(() => { if (role === 'admin') void refresh().catch(e => setError(e.message)); }, [role]);
  const mutate = async (path: string, method: string, body?: object) => {
    setBusy(true); setError('');
    try { const response = await fetch(path, { method, headers: getAuthHeaders(), ...(body ? { body: JSON.stringify(body) } : {}) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); await refresh(); return true; }
    catch (e: any) { setError(e.message); return false; } finally { setBusy(false); }
  };
  if (role !== 'admin') return null;
  return <div className="max-w-4xl mx-auto space-y-5">
    <h1 className="text-2xl font-bold">{accountLabels(language).cashier}</h1>
    <p className="text-sm text-[var(--text-muted)]">{language === 'my' ? 'Service လက်ခံခြင်း၊ payment လက်ခံခြင်းနှင့် receipt ထုတ်ခြင်းအတွက် အကောင့်။' : 'Accounts for repair intake, collecting payments and printing receipts.'}</p>
    {error && <p role="alert" className="text-rose-500">{error}</p>}
    <form onSubmit={async e => { e.preventDefault(); if (await mutate('/api/cashiers','POST',form)) setForm({ full_name:'',username:'',password:'' }); }} className="p-5 rounded-xl border border-[var(--border)] space-y-3 bg-[var(--surface)]">
      <label className="block">Name<input required maxLength={100} value={form.full_name} onChange={e => setForm({...form,full_name:e.target.value})} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
      <label className="block">Username<input required minLength={3} maxLength={32} value={form.username} onChange={e => setForm({...form,username:e.target.value})} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
      <label className="block">Password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
      <button disabled={busy} className="px-4 py-2 rounded bg-blue-600 text-white">{language === 'my' ? 'Cashier အကောင့်ထည့်ရန်' : 'Add Cashier Account'}</button>
    </form>
    {cashiers.map(user => <div key={user.id} className="flex flex-wrap gap-3 items-center p-4 rounded-xl border border-[var(--border)]">
      <span className="flex-1">{user.full_name} (@{user.username}) · {user.active !== false ? 'Active' : 'Inactive'}</span>
      <button disabled={busy} onClick={() => mutate(`/api/cashiers/${user.id}`,'PUT',{active:user.active===false})}>{user.active === false ? 'Activate' : 'Deactivate'}</button>
      <button disabled={busy} onClick={() => { setResetId(user.id); setResetPassword(''); }}>Reset Password</button>
      <button disabled={busy} className="text-rose-500" onClick={() => { if(window.confirm(`Delete cashier ${user.username}? Payment records will be kept.`)) void mutate(`/api/cashiers/${user.id}`,'DELETE'); }}>Delete</button>
    </div>)}
    {resetId && <form className="p-4 rounded-xl border border-[var(--border)] space-y-3" onSubmit={async e => { e.preventDefault(); if(await mutate(`/api/cashiers/${resetId}`,'PUT',{password:resetPassword})) {setResetId('');setResetPassword('');} }}><label>New password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={resetPassword} onChange={e=>setResetPassword(e.target.value)} className="block w-full p-2 bg-[var(--surface-2)]" /></label><button disabled={busy}>Save Password</button><button type="button" onClick={()=>{setResetId('');setResetPassword('');}}>Cancel</button></form>}
  </div>;
}

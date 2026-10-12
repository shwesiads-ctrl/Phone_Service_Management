import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/Pagination';
import { staffCode } from '../utils/staffCode';
import { readUploadedImage } from '../utils/imageUpload';
import { CashierCardModal } from '../components/CashierCardModal';
import { accountLabels } from '../i18n/accountLabels';
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { User } from '../types';
export function CashierAccountsView() {
  const { getAuthHeaders, language, role } = useApp();
  const [search,setSearch]=useState(''),[status,setStatus]=useState('all'),[createOpen,setCreateOpen]=useState(false);
  const [cashiers, setCashiers] = useState<User[]>([]);
  const [form, setForm] = useState({ full_name: '', username: '', password: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [cardUser, setCardUser] = useState<User | null>(null);
  const [resetId, setResetId] = useState(''); const [resetPassword, setResetPassword] = useState('');
  const refresh = async () => { const response = await fetch('/api/cashiers', { headers: getAuthHeaders() }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setCashiers(data); };
  useEffect(() => { if (role === 'admin') void refresh().catch(e => setError(e.message)); }, [role]);
  const mutate = async (path: string, method: string, body?: object) => {
    setBusy(true); setError('');
    try { const response = await fetch(path, { method, headers: getAuthHeaders(), ...(body ? { body: JSON.stringify(body) } : {}) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); await refresh(); return true; }
    catch (e: any) { setError(e.message); return false; } finally { setBusy(false); }
  };
  const filtered=cashiers.filter(user=>[user.full_name,user.username,staffCode(user),user.phone,user.email].join(' ').toLowerCase().includes(search.trim().toLowerCase())&&(status==='all'||(status==='active')===(user.active!==false)));
  const page=usePagination(filtered,search+'|'+status);
  if (role !== 'admin') return null;
  return <div className="max-w-6xl mx-auto space-y-5">
    <div className="flex flex-wrap justify-between items-center gap-3"><h1 className="text-2xl font-bold">{accountLabels(language).cashier}</h1><button onClick={()=>setCreateOpen(!createOpen)} className="px-4 py-2 rounded-lg bg-blue-600 text-white">{language==='my'?'Cashier အကောင့်ထည့်ရန်':'Add Cashier Account'}</button></div>
    <p className="text-sm text-[var(--text-muted)]">{language === 'my' ? 'Service လက်ခံခြင်း၊ payment လက်ခံခြင်းနှင့် receipt ထုတ်ခြင်းအတွက် အကောင့်။' : 'Accounts for repair intake, collecting payments and printing receipts.'}</p>
    {error && <p role="alert" className="text-rose-500">{error}</p>}
    {createOpen && <form aria-label="Create cashier account" onSubmit={async e => { e.preventDefault(); if (await mutate('/api/cashiers','POST',form)) {setForm({ full_name:'',username:'',password:'' });setCreateOpen(false);} }} className="p-5 rounded-xl border border-[var(--border)] space-y-3 bg-[var(--surface)]">
      <label className="block">Name<input required maxLength={100} value={form.full_name} onChange={e => setForm({...form,full_name:e.target.value})} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
      <label className="block">Username<input required minLength={3} maxLength={32} value={form.username} onChange={e => setForm({...form,username:e.target.value})} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
      <label className="block">Password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
      <button disabled={busy} className="px-4 py-2 rounded bg-blue-600 text-white">{language === 'my' ? 'Cashier အကောင့်ထည့်ရန်' : 'Add Cashier Account'}</button>
    </form>}
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden" aria-label="Cashier accounts list">
      <div className="flex flex-wrap gap-3 items-center p-4 border-b border-[var(--border)]"><h2 className="font-bold">{language==='my'?'Cashier အကောင့်စာရင်း':'Cashier Accounts List'}</h2><input aria-label="Search cashier accounts" placeholder="Search name, username, phone or ID…" value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 min-w-48 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]"/><select aria-label="Cashier status" value={status} onChange={e=>setStatus(e.target.value)} className="p-2 rounded-lg bg-[var(--surface-2)]"><option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-[var(--surface-2)]"><tr>{['#','Cashier','Contact','Status','Actions'].map(label=><th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{page.items.map((user,index)=><tr key={user.id} className="border-t border-[var(--border)]"><td className="p-3">{page.offset+index+1}</td><td className="p-3"><div className="flex gap-3 items-center">{user.profile_photo?<img src={user.profile_photo} alt={user.full_name} className="w-9 h-9 rounded-full object-cover"/>:<span className="w-9 h-9 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-bold">{user.full_name.slice(0,2).toUpperCase()}</span>}<div><b>{user.full_name}</b><p className="text-xs text-[var(--text-muted)]">{staffCode(user)} · @{user.username}</p></div></div></td><td className="p-3 text-xs"><p>{user.phone||'—'}</p><p>{user.email||'—'}</p></td><td className="p-3"><span className={`rounded px-2 py-1 text-xs ${user.active!==false?'bg-emerald-500/10 text-emerald-600':'bg-rose-500/10 text-rose-500'}`}>{user.active!==false?'Active':'Inactive'}</span></td><td className="p-3"><div className="flex flex-wrap gap-2 text-xs">
        <button disabled={busy} onClick={()=>setProfile({...user})} className="text-blue-500">Edit Profile</button>
        <button disabled={busy} onClick={()=>setCardUser(user)} className="text-blue-500">Generate ID Card</button>
        <button disabled={busy} onClick={()=>mutate(`/api/cashiers/${user.id}`,'PUT',{active:user.active===false})}>{user.active===false?'Activate':'Deactivate'}</button>
        <button disabled={busy} onClick={()=>{setResetId(user.id);setResetPassword('');}}>Reset Password</button>
        <button disabled={busy} className="text-rose-500" onClick={()=>{if(window.confirm(`Delete cashier ${user.username}? Payment records will be kept.`))void mutate(`/api/cashiers/${user.id}`,'DELETE');}}>Delete</button>
      </div></td></tr>)}{!page.total&&<tr><td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">No cashier accounts match these filters.</td></tr>}</tbody></table></div><Pagination {...page}/>
    </section>
    {profile && <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center"><form role="dialog" aria-modal="true" aria-label="Edit cashier profile" className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3" onSubmit={async e=>{e.preventDefault();const {full_name,phone,email,address,profile_photo}=profile;if(await mutate(`/api/cashiers/${profile.id}`,'PUT',{full_name,phone:phone||'',email:email||'',address:address||'',profile_photo:profile_photo||''}))setProfile(null);}}>
      <h2 className="font-bold">Cashier Profile · @{profile.username}</h2>
      {(['full_name','phone','email','address'] as const).map(field=><label key={field} className="block text-sm">{field.replace('_',' ')}<input required={field==='full_name'} type={field==='email'?'email':'text'} value={profile[field]||''} onChange={e=>setProfile({...profile,[field]:e.target.value})} className="block w-full p-2 rounded bg-[var(--surface-2)]"/></label>)}
      <label className="block text-sm">Upload Profile Photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setError('');try{const image=await readUploadedImage(file);setProfile(previous=>previous?{...previous,profile_photo:image}:previous);}catch(error:any){setError(error.message);}e.target.value='';}} className="block mt-2"/></label>
      <p className="text-xs text-[var(--text-muted)]">PNG/JPEG/WebP · maximum 2 MB</p>
      {profile.profile_photo && <div className="flex gap-3 items-center"><img src={profile.profile_photo} alt="Cashier profile preview" className="w-24 h-24 rounded-xl object-cover"/><button type="button" onClick={()=>setProfile({...profile,profile_photo:''})}>Remove Photo</button></div>}
      <div className="flex gap-4"><button disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save Profile</button><button type="button" disabled={busy} onClick={()=>setProfile(null)}>Cancel</button></div>
    </form></div>}
    {cardUser && <CashierCardModal user={cardUser} onClose={()=>setCardUser(null)}/>}
    {resetId && <form className="p-4 rounded-xl border border-[var(--border)] space-y-3" onSubmit={async e => { e.preventDefault(); if(await mutate(`/api/cashiers/${resetId}`,'PUT',{password:resetPassword})) {setResetId('');setResetPassword('');} }}><label>New password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={resetPassword} onChange={e=>setResetPassword(e.target.value)} className="block w-full p-2 bg-[var(--surface-2)]" /></label><button disabled={busy}>Save Password</button><button type="button" onClick={()=>{setResetId('');setResetPassword('');}}>Cancel</button></form>}
  </div>;
}

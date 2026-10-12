import React, { useState } from 'react';
import { accountLabels } from '../i18n/accountLabels';
import { downloadRecoveryBackup, type RecoveryBackup } from '../utils/recoveryBackup';
import type { Language } from '../types';
export function ForgotPasswordForm({ language, onClose }: { language: Language; onClose: () => void }) {
  const labels = accountLabels(language);
  const [form, setForm] = useState({ username: '', recovery_key: '', new_password: '', confirm: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [backup, setBackup] = useState<RecoveryBackup | null>(null);
  return <section className="space-y-4" aria-labelledby="recover-title"><h2 id="recover-title" className="text-xl font-bold">{labels.title}</h2>
    {error && <p role="alert" className="text-rose-500 text-sm">{error}</p>}
    {backup ? <div className="space-y-4"><p role="status" className="text-sm text-emerald-500">{labels.saved}</p><button type="button" onClick={()=>downloadRecoveryBackup(backup)} className="w-full p-3 rounded bg-blue-600 text-white">{labels.download}</button></div> :
    <form className="space-y-3" onSubmit={async e=>{e.preventDefault();setError('');if(form.new_password!==form.confirm){setError(labels.mismatch);return;}setBusy(true);try {const response=await fetch('/api/auth/recover-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.username.trim(),recovery_key:form.recovery_key.trim(),new_password:form.new_password})});const data=await response.json();if(!response.ok)throw new Error(data.error || 'Recovery failed');setBackup(data.recovery);setForm({username:'',recovery_key:'',new_password:'',confirm:''});try{downloadRecoveryBackup(data.recovery);}catch{/* Keep the manual download button available. */}}catch(e:any){setError(e.message);}finally{setBusy(false);}}}>
      <label className="block text-sm">{labels.username}<input autoFocus required autoComplete="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
      <label className="block text-sm">{labels.key}<input type="password" required autoComplete="off" value={form.recovery_key} onChange={e=>setForm({...form,recovery_key:e.target.value})} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
      <label className="block text-sm">{labels.password}<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.new_password} onChange={e=>setForm({...form,new_password:e.target.value})} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
      <label className="block text-sm">{labels.confirm}<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
      <button disabled={busy} className="w-full p-3 bg-blue-600 text-white rounded disabled:opacity-50">{labels.submit}</button>
    </form>}
    <button disabled={busy} onClick={onClose} className="w-full p-2 rounded border border-[var(--border)]">{labels.cancel}</button>
  </section>;
}

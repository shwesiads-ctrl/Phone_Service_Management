import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { accountLabels } from '../i18n/accountLabels';
import { downloadRecoveryBackup, type RecoveryBackup } from '../utils/recoveryBackup';
export function RecoveryKeySettings() {
  const { getAuthHeaders, language, role } = useApp(); const labels = accountLabels(language);
  const [status, setStatus] = useState<{installation_id:string;generation:number} | null>(null);
  const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [backup, setBackup] = useState<RecoveryBackup | null>(null);
  useEffect(()=>{if(role !== 'admin')return;let active=true;fetch('/api/auth/recovery/status',{headers:getAuthHeaders(),cache:'no-store'}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);if(active)setStatus(data);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[role,getAuthHeaders]);
  const retrieve = async (rotate:boolean) => {
    if(rotate && !window.confirm(language === 'my' ? 'Key အဟောင်းကို ပယ်ဖျက်ပြီး key အသစ်ထုတ်မလား?' : 'Replace this PC’s recovery key? The previous key will no longer work.')) return;
    setBusy(true);setError('');try{const response=await fetch(`/api/auth/recovery/${rotate?'rotate':'backup'}`,{method:'POST',headers:getAuthHeaders(),body:JSON.stringify({current_password:password})});const data=await response.json();if(!response.ok)throw new Error(data.error || 'Could not retrieve recovery backup');setBackup(data);setStatus(data);setPassword('');try{downloadRecoveryBackup(data);}catch{/* The manual download remains available. */}}catch(e:any){setError(e.message);}finally{setBusy(false);}
  };
  if(role!=='admin')return null;
  return <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3" aria-labelledby="recovery-settings-title"><h3 id="recovery-settings-title" className="font-bold">{labels.security}</h3><p className="text-sm text-[var(--text-muted)]">{labels.note}</p>{status && <p className="text-xs font-mono">PC: {status.installation_id} · Key v{status.generation}</p>}{error && <p role="alert" className="text-rose-500 text-sm">{error}</p>}
    <label className="block text-sm">{labels.current}<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
    <div className="flex flex-wrap gap-3"><button disabled={busy || !password} onClick={()=>retrieve(false)} className="p-2 rounded bg-blue-600 text-white disabled:opacity-50">{labels.download}</button><button disabled={busy || !password} onClick={()=>retrieve(true)} className="p-2 rounded border border-[var(--border)] disabled:opacity-50">{labels.rotate}</button></div>
    {backup && <button onClick={()=>downloadRecoveryBackup(backup)} className="text-blue-500 underline">{labels.download} (v{backup.generation})</button>}
  </section>;
}

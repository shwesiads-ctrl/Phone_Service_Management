import React, { useRef, useState } from 'react';
import type { Language } from '../types';

export function RegisterAdminForm({language,onClose,onCreated}:{language:Language;onClose:()=>void;onCreated:(username:string)=>void}) {
  const my=language==='my';
  const [form,setForm]=useState({full_name:'',username:'',password:'',confirmation:''});
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const submitting=useRef(false);
  const inputStyle='mt-1 w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]';
  return <section aria-labelledby="register-admin-title" className="space-y-4">
    <h2 id="register-admin-title" className="text-xl font-bold">{my ? 'Admin အကောင့်အသစ် ဖွင့်ရန်' : 'Create New Admin Account'}</h2>
    <p className="text-xs text-[var(--text-muted)]">{my ? 'မိမိဆိုင်အတွက် ပထမဆုံး Admin အကောင့်ဖွင့်ပါ။ ဖွင့်ပြီးလျှင် Register နေရာကို ဖျောက်ထားမည်။' : 'Create the first administrator for your workshop. Registration closes after this account is created.'}</p>
    {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
    <form className="space-y-4" onSubmit={async e=>{
      e.preventDefault();if(submitting.current)return;setError('');
      if(form.password!==form.confirmation){setError(my?'Password နှစ်ခု တူညီရန်လိုပါသည်။':'New passwords must match.');return;}
      submitting.current=true;setBusy(true);let created='';
      try {
        const response=await fetch('/api/auth/setup-admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:form.full_name.trim(),username:form.username.trim(),password:form.password})});
        const result=await response.json();
        if(!response.ok)throw new Error(result.error || 'Account creation failed.');
        created=result.user.username;
      }catch(e:any){setError(e.message || 'Could not create the administrator account.');}
      finally {submitting.current=false;setBusy(false);setForm(previous=>({...previous,password:'',confirmation:''}));}
      if(created)onCreated(created);
    }}>
      <fieldset disabled={busy} className="space-y-3"><legend className="text-xs font-semibold mb-2">{my?'Admin အကောင့်အသစ် အချက်အလက်':'New administrator details'}</legend>
        {([['full_name',my?'အမည်':'Full name','text'],['username','New username','text'],['password','New password','password'],['confirmation','Confirm new password','password']] as const).map(([key,label,type])=><label key={key} className="block text-xs">{label}<input aria-label={label} required type={type} maxLength={key==='full_name'?100:key==='username'?32:128} minLength={type==='password'?8:key==='username'?3:undefined} pattern={key==='username'?'[A-Za-z0-9_.\\-]{3,32}':undefined} autoComplete={type==='password'?'new-password':'off'} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className={inputStyle}/></label>)}
      </fieldset>
      <button disabled={busy} className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50">{busy?'Creating…':my?'Admin အကောင့်ဖွင့်မည်':'Create Admin Account'}</button>
      <button type="button" disabled={busy} onClick={onClose} className="w-full text-sm text-blue-500">{my?'Login သို့ပြန်ရန်':'Back to Sign In'}</button>
    </form>
  </section>;
}

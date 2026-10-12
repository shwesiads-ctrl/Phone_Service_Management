import React, { useEffect, useRef, useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function NewUserRegisterModal({ onClose, initialRole = 'admin' }: { onClose: () => void; initialRole?: 'admin' | 'technician' | 'cashier' }) {
  const { getAuthHeaders, refreshTechnicians, language, currentUser } = useApp();
  const my = language === 'my';
  const [form, setForm] = useState({ full_name: '', username: '', password: '', phone: '', email: '', role: initialRole });
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    const previous = document.activeElement as HTMLElement;
    nameRef.current?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) onClose();
      if (e.key === 'Tab') {
        const elements = Array.from(nameRef.current?.closest('section')?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)') || []);
        const first = elements[0], last = elements.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('keydown', escape); previous?.focus(); };
  }, [onClose]);
  if (currentUser?.role !== 'admin') return null;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    setRegistered('');
    if (form.password !== confirmation) { setError(my ? 'Password နှစ်ခု တူညီရန်လိုပါသည်။' : 'Passwords must match.'); return; }
    busyRef.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/api/users/register', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed.');
      setRegistered(data.user.username); setForm({ full_name: '', username: '', password: '', phone: '', email: '', role: initialRole }); setConfirmation('');
      if (form.role === 'technician') await refreshTechnicians();
    } catch (err) { setError(err instanceof Error ? err.message : 'Registration failed.'); }
    finally { busyRef.current = false; setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="new-user-register-title" className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--surface)] text-[var(--text)] p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4"><h2 id="new-user-register-title" className="font-bold flex gap-2"><UserPlus size={20} />{my ? 'User အသစ် Register' : 'New User Register'}</h2><button type="button" disabled={busy} aria-label="Close registration" onClick={onClose}><X size={20} /></button></div>
      <p className="text-sm text-[var(--text-muted)] mb-4">{my ? 'Admin အကောင့်အသစ် ဖွင့်နိုင်ပါသည်။ အကောင့်အမျိုးအစားကိုလည်း ရွေးချယ်နိုင်ပါသည်။' : 'Create a new administrator account, or choose a staff role.'}</p>
      {registered && <p role="status" className="mb-4 text-sm text-emerald-600">{my ? 'Account ဖွင့်ပြီးပါပြီ။ Username: ' : 'Account created. Username: '}{registered}</p>}
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">{my ? 'အကောင့်အမျိုးအစား' : 'Account role'}<select aria-label="Account role" value={form.role} onChange={e => {setForm({...form,role:e.target.value as typeof form.role});setRegistered('');}} disabled={busy} className="mt-1 w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]"><option value="admin">Admin</option><option value="technician">Technician</option><option value="cashier">Cashier</option></select></label>
        {form.role==='admin' && <p className="text-xs text-[var(--text-muted)]">{my ? 'Admin အကောင့်သည် ဆိုင်၊ ငွေစာရင်း၊ ဝန်ထမ်းနှင့် Settings များကို စီမံနိုင်မည်။' : 'Administrators can manage workshop data, finances, staff and settings.'}</p>}
        <label className="block text-sm">{my ? 'အမည်' : 'Full name'}<input ref={nameRef} required maxLength={100} autoComplete="name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} disabled={busy} className="mt-1 w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]" /></label>
        <label className="block text-sm">Username<input required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_.\-]{3,32}" autoComplete="off" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={busy} className="mt-1 w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]" /><span className="text-xs text-[var(--text-muted)]">3–32 letters, numbers, . _ -</span></label>
        <label className="block text-sm">Password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} disabled={busy} className="mt-1 w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]" /><span className="text-xs text-[var(--text-muted)]">{my ? 'အနည်းဆုံး ၈ လုံး' : 'At least 8 characters'}</span></label>
        <label className="block text-sm">{my ? 'Password ပြန်ဖြည့်ရန်' : 'Confirm password'}<input aria-label="Confirm password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy} className="mt-1 w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]"/></label>
        <label className="block text-sm">{my ? 'ဖုန်း (မထည့်လည်းရ)' : 'Phone (optional)'}<input type="tel" maxLength={50} autoComplete="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} disabled={busy} className="mt-1 w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]" /></label>
        <label className="block text-sm">Email<input aria-label="Registration email" type="email" maxLength={100} autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} disabled={busy} className="mt-1 w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]"/></label>
        <button disabled={busy} type="submit" className="w-full p-2.5 rounded-lg bg-[var(--primary)] text-white font-bold disabled:opacity-50">{busy ? (my ? 'ဖွင့်နေပါသည်…' : 'Registering…') : (my ? 'Account ဖွင့်မည်' : 'Register user')}</button>
      </form>
    </section>
  </div>;
}

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { readUploadedImage } from '../utils/imageUpload';
import type { SettingsState } from '../types';

function shopFields(settings: SettingsState) {
  return { shopName: settings.shopName || '', phone: settings.phone || '', email: settings.email || '', address: settings.address || '', shopLogo: settings.shopLogo || '', taxEnabled: settings.taxEnabled ?? false, taxPercentage: settings.taxPercentage ?? 0, taxId: settings.taxId || '' };
}
export function ShopSettings() {
  const { settings, updateSettings, language } = useApp();
  const [draft, setDraft] = useState(() => shopFields(settings));
  const dirty = useRef(false);
  const [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false);
  const [error, setError] = useState(''), [saved, setSaved] = useState(false);
  const my = language === 'my';
  // Accept asynchronous initial settings and LAN updates without replacing unsaved edits.
  useEffect(() => { if (!dirty.current) setDraft(shopFields(settings)); }, [settings]);
  const change = (key: keyof typeof draft, value: string | boolean | number) => {
    dirty.current = true; setSaved(false); setError(''); setDraft(previous => ({ ...previous, [key]: value }));
  };
  const inputStyle = 'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm';
  return <form aria-label="Shop settings" className="space-y-5" onSubmit={async e => {
    e.preventDefault(); if (busy || uploading) return; setError(''); setSaved(false);
    if (!draft.shopName.trim() || !draft.phone.trim()) { setError(my ? 'ဆိုင်အမည်နှင့် ဖုန်းနံပါတ် ဖြည့်ပါ။' : 'Enter the workshop name and phone number.'); return; }
    if (!Number.isFinite(draft.taxPercentage) || draft.taxPercentage < 0 || draft.taxPercentage > 100) { setError('Tax must be between 0 and 100%.'); return; }
    setBusy(true);
    try {
      await updateSettings({ ...draft, shopName: draft.shopName.trim(), phone: draft.phone.trim(), email: draft.email.trim(), address: draft.address.trim(), taxId: draft.taxId.trim() });
      dirty.current = false; setSaved(true);
    } catch (e: any) { setError(e.message || 'Could not save workshop details.'); }
    finally { setBusy(false); }
  }}>
    <div><h2 className="text-xl font-bold">{my ? 'ဆိုင်အချက်အလက်' : 'Shop Settings'}</h2><p className="text-xs text-[var(--text-muted)] mt-1">{my ? 'Receipt၊ Cashier ID Card နှင့် ဆိုင်အချက်အလက်များတွင် အသုံးပြုမည်။' : 'These details appear on receipts, cashier ID cards and the workshop profile.'}</p></div>
    <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
      <div className="grid sm:grid-cols-2 gap-4">{[['shopName',my ? 'ဆိုင်အမည်' : 'Shop name','text'],['phone',my ? 'ဖုန်းနံပါတ်' : 'Shop phone','tel'],['email','Shop email','email']].map(([key,label,type]) => <label key={key} className="block text-xs font-semibold space-y-1"><span>{label}{key !== 'email' ? ' *' : ''}</span><input aria-label={label} type={type} maxLength={200} required={key !== 'email'} value={String(draft[key as keyof typeof draft])} onChange={e => change(key as keyof typeof draft,e.target.value)} className={inputStyle}/></label>)}</div>
      <label className="block text-xs font-semibold space-y-1"><span>{my ? 'ဆိုင်လိပ်စာ' : 'Shop address'}</span><textarea aria-label="Shop address" rows={3} maxLength={2000} value={draft.address} onChange={e => change('address',e.target.value)} className={inputStyle}/></label>
      <div className="flex items-center flex-wrap gap-4">{draft.shopLogo ? <img src={draft.shopLogo} alt="Shop logo preview" className="w-20 h-20 object-contain rounded-lg border border-[var(--border)]"/> : <span className="w-20 h-20 border border-dashed border-[var(--border)] rounded-lg flex items-center justify-center text-xs">Logo</span>}<div className="space-y-2"><label className="block text-xs">Upload shop logo · PNG / JPEG / WebP · 2 MB<input aria-label="Upload shop logo" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} className="block mt-2 text-xs" onChange={async e => {const file=e.target.files?.[0]; e.target.value='';if(!file)return;setUploading(true);setError('');try {change('shopLogo',await readUploadedImage(file));}catch(e:any){setError(e.message);}finally{setUploading(false);}}}/></label>{draft.shopLogo && <button type="button" disabled={uploading} onClick={() => change('shopLogo','')} className="text-xs text-rose-500">Remove logo</button>}</div></div>
      <div className="p-4 rounded-lg border border-[var(--border)] space-y-3"><label className="flex items-center gap-2 text-sm"><input aria-label="Enable tax" type="checkbox" checked={draft.taxEnabled} onChange={e => change('taxEnabled',e.target.checked)}/>Enable Tax / VAT</label><div className="grid sm:grid-cols-2 gap-4"><label className="text-xs space-y-1 block">Tax rate (%)<input aria-label="Tax rate" type="number" min={0} max={100} step="0.01" value={draft.taxPercentage} onChange={e => change('taxPercentage',Number(e.target.value))} className={inputStyle}/></label><label className="text-xs space-y-1 block">Tax ID<input aria-label="Tax ID" maxLength={200} value={draft.taxId} onChange={e => change('taxId',e.target.value)} className={inputStyle}/></label></div></div>
    </fieldset>
    <section aria-label="Shop information preview" className="rounded-xl border border-[var(--border)] p-4 bg-[var(--surface-2)]"><h3 className="text-xs text-[var(--text-muted)] mb-2">Receipt & ID Card Preview</h3><p className="font-bold">{draft.shopName || 'Shop name'}</p><p className="text-sm whitespace-pre-wrap break-words">{draft.address}</p><p className="text-xs mt-1 break-words">{draft.phone} {draft.email ? ` · ${draft.email}` : ''}</p></section>
    {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}{saved && <p role="status" className="text-sm text-emerald-500">{my ? 'ဆိုင်အချက်အလက် သိမ်းပြီးပါပြီ။' : 'Shop settings saved.'}</p>}
    <div className="flex flex-wrap gap-3"><button disabled={busy || uploading} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white disabled:opacity-50">{busy ? 'Saving…' : uploading ? 'Uploading…' : my ? 'သိမ်းရန်' : 'Save Shop Settings'}</button><button type="button" disabled={busy || uploading} className="px-4 py-2 rounded-lg border border-[var(--border)]" onClick={() => {dirty.current=false;setDraft(shopFields(settings));setError('');setSaved(false);}}>Reset changes</button></div>
  </form>;
}

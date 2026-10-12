import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { User } from '../types';
import { generateCashierCard, downloadCashierCard, printCashierCard } from '../utils/cashierCard';
export function CashierCardModal({user,onClose}:{user:User;onClose:()=>void}) {
  const {settings,language}=useApp();const [theme,setTheme]=useState<'blue'|'teal'|'dark'>('blue');const [svg,setSvg]=useState('');const [error,setError]=useState('');
  useEffect(()=>{let active=true;void generateCashierCard(user,settings,theme).then(value=>{if(active)setSvg(value);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[user,settings,theme]);
  return <div className="fixed inset-0 z-[80] bg-black/60 p-4 flex items-center justify-center"><div role="dialog" aria-modal="true" aria-labelledby="cashier-card-title" className="w-full max-w-2xl p-6 rounded-2xl bg-[var(--surface)] space-y-4">
    <h2 id="cashier-card-title" className="text-xl font-bold">{language==='my'?'Professional Cashier ID Card ထုတ်ရန်':'Professional Cashier ID Card System'}</h2>
    <div className="flex gap-2" aria-label="ID card theme">{(['blue','teal','dark'] as const).map(value=><button key={value} onClick={()=>setTheme(value)} aria-pressed={theme===value} className={`px-3 py-2 rounded-lg border text-xs capitalize ${theme===value?'border-blue-500 bg-blue-500/10':'border-[var(--border)]'}`}>{value}</button>)}</div>
    {error && <p role="alert" className="text-rose-500">{error}</p>}
    {svg?<img src={'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)} alt="Cashier ID card preview" className="w-full rounded-xl"/>:<p role="status">Generating card…</p>}
    <div className="rounded-lg p-3 bg-[var(--surface-2)] text-xs space-y-1 break-words"><p className="font-bold">{settings.shopName}</p><p>{settings.address || (language==='my'?'Shop Settings တွင် ဆိုင်လိပ်စာဖြည့်ပါ။':'Add the workshop address in Shop Settings.')}</p><p>{settings.phone} {settings.email ? ` · ${settings.email}` : ''}</p></div>
    <p className="text-xs text-[var(--text-muted)]">85.6 × 54 mm · {user.full_name}</p>
    <div className="flex flex-wrap gap-3"><button disabled={!svg} onClick={()=>downloadCashierCard(svg,user.username)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Download ID Card</button><button disabled={!svg} onClick={()=>{try{printCashierCard(svg);}catch(e:any){setError(e.message);}}} className="px-4 py-2 border border-[var(--border)] rounded-lg">Print ID Card</button><button onClick={onClose} className="px-4 py-2 border border-[var(--border)] rounded-lg">Close</button></div>
  </div></div>;
}

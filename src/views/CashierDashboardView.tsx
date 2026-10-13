import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ServiceJob } from '../types';
import { ProfileModal } from '../modals/ProfileModal';
import { CashierCardModal } from '../components/CashierCardModal';
export function localDay(value: string | Date) { const date=new Date(value);return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
export function CashierDashboardView({onNewJob,onOpenJob,onPrintReceipt}:{onNewJob:()=>void;onOpenJob:(job:ServiceJob)=>void;onPrintReceipt:(job:ServiceJob)=>void}) {
  const {jobs,payments,currentUser,formatCurrency,navigate,language}=useApp();
  const [passwordOpen,setPasswordOpen]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false),[cardOpen,setCardOpen]=useState(false);
  const today=localDay(new Date());
  const received=jobs.filter(job=>localDay(job.received_at)===today);
  const collections=payments.filter(payment=>!payment.is_deleted && localDay(payment.paid_at)===today && (payment.cashier_id===currentUser.id || (!payment.cashier_id && payment.created_by===currentUser.username))).sort((a,b)=>b.paid_at.localeCompare(a.paid_at));
  const totals=collections.reduce<Record<string,number>>((sum,p)=>{sum[p.currency_code]=(sum[p.currency_code]||0)+p.amount;return sum;},{});
  const queue=jobs.filter(job=>job.status_id!=='cancelled' && job.total_cost>job.amount_paid).sort((a,b)=>b.received_at.localeCompare(a.received_at));
  const ready=jobs.filter(job=>['ready','completed'].includes(job.status_id));
  return <div className="space-y-6 max-w-6xl mx-auto" data-testid="cashier-dashboard">
    <section className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-wrap gap-4 items-center justify-between">
      <div className="flex gap-4 items-center">{currentUser.profile_photo && <img src={currentUser.profile_photo} alt="Cashier profile" className="w-16 h-16 rounded-xl object-cover"/>}<div><p className="text-sm text-blue-500">Cashier Counter</p><h1 className="text-2xl font-bold">{language==='my'?'မင်္ဂလာပါ':'Welcome'}, {currentUser.full_name}</h1><p className="text-sm text-[var(--text-muted)]">Today's intake, your collections and payment queue</p></div></div>
      <div className="flex gap-2"><button onClick={()=>setProfileOpen(true)} className="px-3 py-2 border border-[var(--border)] rounded-lg">My Profile</button><button onClick={()=>setCardOpen(true)} className="px-3 py-2 border border-[var(--border)] rounded-lg">My ID Card</button></div>
    </section>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[['Today’s Shop Intake',received.length],['My Payments Today',collections.length],['Awaiting Payment',queue.length],['Ready for Pickup',ready.length]].map(([label,value])=><div key={label} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]"><p className="text-xs text-[var(--text-muted)]">{label}</p><p className="text-3xl font-bold mt-2">{value}</p></div>)}</div>
    <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3"><h2 className="font-bold">My Collections Today</h2><div className="flex flex-wrap gap-4">{Object.entries(totals).length?Object.entries(totals).map(([code,amount])=><span key={code} className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold">{formatCurrency(amount,code as any)}</span>):<p className="text-sm text-[var(--text-muted)]">No payments collected today.</p>}</div><div className="flex flex-wrap gap-3"><button onClick={onNewJob} className="px-4 py-2 rounded-lg bg-blue-600 text-white">New Service Intake</button><button onClick={()=>navigate('/service')} className="px-4 py-2 rounded-lg border border-[var(--border)]">View Service Jobs</button><button onClick={()=>navigate('/records')} className="px-4 py-2 rounded-lg border border-[var(--border)]">My Repair Records</button><button onClick={()=>navigate('/customers')} className="px-4 py-2 rounded-lg border border-[var(--border)]">Customers</button></div></section>
    <div className="grid lg:grid-cols-2 gap-5"><section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3"><h2 className="font-bold">Payment Queue</h2>{queue.slice(0,6).map(job=><button key={job.id} onClick={()=>onOpenJob(job)} className="w-full flex items-center justify-between gap-3 text-left p-3 rounded-lg bg-[var(--surface-2)]"><span><b>{job.service_number}</b><span className="block text-xs">{job.customer?.name}</span></span><span className="text-amber-500">{formatCurrency(job.total_cost-job.amount_paid,job.currency_code)}</span></button>)}{!queue.length && <p className="text-sm text-[var(--text-muted)]">No outstanding payments.</p>}</section>
      <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3"><h2 className="font-bold">My Recent Collections</h2>{collections.slice(0,6).map(payment=>{const job=jobs.find(j=>j.id===payment.service_job_id);return <div key={payment.id} className="p-3 rounded-lg bg-[var(--surface-2)] flex gap-3 items-center justify-between"><span>{payment.service_number || payment.id}<span className="block text-xs text-emerald-500">{formatCurrency(payment.amount,payment.currency_code)}</span></span><button disabled={!job} onClick={()=>job && onPrintReceipt(job)} className="text-xs text-blue-500">Print Receipt</button></div>;})}{!collections.length && <p className="text-sm text-[var(--text-muted)]">Your collected payments will appear here.</p>}</section></div>
    {profileOpen && <ProfileModal onClose={()=>setProfileOpen(false)} onChangePasswordClick={()=>{setProfileOpen(false);setPasswordOpen(true);}}/>}{passwordOpen && <ChangePasswordModal onClose={()=>setPasswordOpen(false)}/>}
    {cardOpen && <CashierCardModal user={currentUser} onClose={()=>setCardOpen(false)}/>}
  </div>;
}

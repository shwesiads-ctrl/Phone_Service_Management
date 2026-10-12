import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ServiceJob } from '../types';
export function CashierJobModal({ job, onClose, onPrint }: { job: ServiceJob; onClose: () => void; onPrint: (job: ServiceJob) => void }) {
  const { recordPayment, availablePaymentMethods, formatCurrency, currentUser, language } = useApp();
  const [reference,setReference]=useState('');
  const [amount, setAmount] = useState(''); const [method, setMethod] = useState(availablePaymentMethods[0]?.id || 'cash');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [success, setSuccess] = useState(false);
  return <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center"><div role="dialog" aria-modal="true" aria-labelledby="cashier-ticket-title" className="w-full max-w-lg p-6 bg-[var(--surface)] rounded-xl space-y-4">
    <h2 id="cashier-ticket-title" className="text-xl font-bold">{job.service_number}</h2><p>{job.customer?.name} · {job.device?.brand} {job.device?.model}</p>
    <p>Total: {formatCurrency(job.total_cost,job.currency_code)} · Paid: {formatCurrency(job.amount_paid,job.currency_code)}</p>
    {error && <p role="alert" className="text-rose-500">{error}</p>}{success && <p role="status" className="text-emerald-500">{language === 'my' ? 'Payment လက်ခံပြီးပါပြီ။' : 'Payment recorded.'}</p>}
    <form className="space-y-3" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try {await recordPayment({service_job_id:job.id,amount:Number(amount),currency_code:job.currency_code || 'MMK',payment_method:method,received_by:currentUser.full_name,reference_number:reference});setAmount('');setReference('');setSuccess(true);}catch(e:any){setError(e.message);}finally{setBusy(false);}}}>
      <label>Amount ({job.currency_code || 'MMK'})<input type="number" min="0.01" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)} className="block w-full p-2 rounded bg-[var(--surface-2)]" /></label>
      <label>Payment method<select value={method} onChange={e=>setMethod(e.target.value)} className="block w-full p-2 bg-[var(--surface-2)]">{availablePaymentMethods.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      {availablePaymentMethods.find(m=>m.id===method)?.qr_code && <div className="space-y-2"><img src={availablePaymentMethods.find(m=>m.id===method)!.qr_code} alt="Merchant payment QR" className="w-40 h-40 object-contain bg-white rounded-lg p-2"/><p className="text-xs text-[var(--text-muted)]">Scan the merchant QR and verify receipt in the bank/wallet app before collecting payment.</p></div>}
      <label>Bank / Wallet Reference<input value={reference} onChange={e=>setReference(e.target.value)} className="block w-full p-2 rounded bg-[var(--surface-2)]"/></label>
      <button disabled={busy} className="px-4 py-2 rounded bg-blue-600 text-white">{language === 'my' ? 'ငွေလက်ခံရန်' : 'Collect Payment'}</button>
    </form><div className="flex gap-4"><button onClick={()=>onPrint(job)}>{language === 'my' ? 'Receipt ထုတ်ရန်' : 'Print Receipt'}</button><button onClick={onClose}>{language === 'my' ? 'ပိတ်ရန်' : 'Close'}</button></div>
  </div></div>;
}

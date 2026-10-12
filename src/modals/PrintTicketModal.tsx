import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ServiceJob } from '../types';
import { X, Printer, Download } from 'lucide-react';
import { printReceipt, receiptStyles, saveReceipt } from '../utils/receipt';
import { imageValidationError } from '../utils/imageUpload';

interface PrintTicketModalProps { job: ServiceJob; onClose: () => void }
export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({job,onClose}) => {
  const { settings, technicians, payments, formatCurrency, formatDate, t, language } = useApp();
  const receipt=useRef<HTMLElement>(null);
  const [saved,setSaved]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(false);
  const assigned=technicians.find(tech=>tech.id===job.technician_id) || job.technician;
  const records=(job.payments ?? payments.filter(payment=>payment.service_job_id===job.id)).filter(payment=>!payment.is_deleted);
  const sameCurrency=records.filter(payment=>payment.currency_code===(job.currency_code || 'MMK'));
  const paid=records.length ? sameCurrency.reduce((sum,payment)=>sum+Number(payment.amount || 0),0) : (job.payments ? 0 : Number(job.amount_paid || 0));
  const balance=Math.max(0,job.total_cost-paid);
  const receivers=[...new Set(records.map(payment=>payment.received_by?.trim() || payment.created_by || '').filter(Boolean))];
  const money=(value:number)=>formatCurrency(value,job.currency_code);
  const my=language==='my';
  return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
    <div role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title" className="w-full max-w-3xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl flex flex-col max-h-[94vh]">
      <header className="flex flex-wrap gap-3 items-center justify-between p-4 border-b border-[var(--border)]">
        <div><h2 id="receipt-modal-title" className="font-bold">{my ? 'ငွေလက်ခံပြေစာ' : 'Service Receipt'}</h2><p className="text-xs text-[var(--text-muted)]">{job.service_number} · {settings.paperSize}</p></div>
        <div className="flex items-center gap-2"><button disabled={saving} onClick={async()=>{if(!receipt.current || saving)return;setSaving(true);setSaved(false);setError('');try {await saveReceipt(receipt.current,job.service_number,settings.paperSize);setSaved(true);}catch(e:any){setError(e.message || 'Receipt could not be saved.');}finally{setSaving(false);}}} className="px-3 py-2 rounded-lg border border-[var(--border)] flex items-center gap-2 text-xs font-bold"><Download className="w-4 h-4"/>{saving ? 'Saving…' : my ? 'JPEG သိမ်းရန်' : 'Save JPEG'}</button><button onClick={()=>{setError('');try {if(receipt.current)printReceipt(receipt.current.outerHTML,settings.paperSize);}catch(e:any){setError(e.message);}}} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white flex items-center gap-2 text-xs font-bold"><Printer className="w-4 h-4"/>{my ? 'Print ထုတ်ရန်' : 'Print Receipt'}</button><button aria-label="Close receipt" onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface-2)]"><X className="w-5 h-5"/></button></div>
      </header>
      {saved && <p role="status" className="px-4 py-2 text-xs text-emerald-500">{my ? 'Receipt ကို JPEG ပုံအဖြစ် သိမ်းပြီးပါပြီ။' : 'Receipt saved as a JPEG image.'}</p>}
      {error && <p role="alert" className="px-4 py-2 text-xs text-rose-500">{error}</p>}
      <div className="overflow-y-auto p-3 sm:p-5 bg-slate-100 rounded-b-2xl"><style>{receiptStyles.replace(/body\{[^}]*\}/g, '')}</style>
        <article ref={receipt} className={`receipt ${settings.paperSize==='80mm' ? 'receipt-thermal' : ''}`}>
          <div className="receipt-header">{settings.shopLogo && !imageValidationError(settings.shopLogo) && <img src={settings.shopLogo} alt="Shop logo"/>}<h1>{settings.shopName || 'FixFlow Workshop'}</h1>{settings.address && <p>{settings.address}</p>}<p>{settings.phone}{settings.email ? ` · ${settings.email}` : ''}</p>{settings.taxEnabled && settings.taxId && <p>Tax ID: {settings.taxId}</p>}</div>
          <div className="receipt-title"><h2>{my ? 'ငွေလက်ခံပြေစာ' : 'SERVICE RECEIPT'}</h2><strong>{job.service_number}</strong></div>
          <div className="receipt-details">
            <div><span className="receipt-label">Date</span>{formatDate(job.received_at)}</div><div><span className="receipt-label">Status</span>{t(`status_${job.status_id}` as any)}</div>
            <div><span className="receipt-label">Customer</span><b>{job.customer?.name || '—'}</b><br/>{job.customer?.phone}</div><div><span className="receipt-label">Device / IMEI</span>{job.device ? `${job.device.brand} ${job.device.model}` : '—'}<br/>{job.device?.serial_or_imei}</div>
            <div><span className="receipt-label">Assigned technician</span>{assigned?.full_name || '—'}<br/><small>{job.technician_id}</small></div><div><span className="receipt-label">Cashier / Payment received by</span><b>{receivers.join(', ') || job.intake_received_by || (my ? 'မှတ်တမ်းမရှိပါ' : 'Not recorded')}</b>{job.intake_received_by && <><br/><small>Intake: {job.intake_received_by}</small></>}</div>
          </div>
          <div className="receipt-note"><span className="receipt-label">Reported problem</span>{job.problem_description}{job.diagnosis && <><br/><span className="receipt-label">Diagnosis</span>{job.diagnosis}</>}</div>
          <table aria-label="Receipt charges"><thead><tr><th>Description</th><th className="amount">Amount ({job.currency_code || 'MMK'})</th></tr></thead><tbody><tr><td>Service charge</td><td className="amount">{money(job.service_charge)}</td></tr>{job.parts_cost>0 && <tr><td>Parts</td><td className="amount">{money(job.parts_cost)}</td></tr>}<tr className="receipt-total"><td>Total</td><td className="amount">{money(job.total_cost)}</td></tr><tr><td>Paid</td><td className="amount">{money(paid)}</td></tr><tr className="receipt-total"><td>Balance due</td><td className="amount">{money(balance)}</td></tr></tbody></table>
          {records.length>0 && <><h3 className="receipt-label">Payment records</h3><table className="receipt-payments" aria-label="Receipt payments"><thead><tr><th>Payment / Date</th><th>Cashier</th><th className="amount">Amount</th></tr></thead><tbody>{records.map(payment=><tr key={payment.id}><td><b>{payment.id}</b><br/>{formatDate(payment.paid_at)}<br/>{payment.payment_method}{payment.reference_number && <><br/>Ref: {payment.reference_number}</>}</td><td>{payment.received_by || payment.created_by || 'Not recorded'}</td><td className="amount">{formatCurrency(payment.amount,payment.currency_code)}</td></tr>)}</tbody></table></>}
          <div className="receipt-footer"><b>Warranty: {job.warranty_days} days</b><br/>{settings.receiptFooterNote}</div><div className="receipt-signatures"><span>Staff signature</span><span>Customer signature</span></div>
        </article>
      </div>
    </div>
  </div>;
};

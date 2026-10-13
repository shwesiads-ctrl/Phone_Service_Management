import { jobPaymentSummary } from '../utils/jobPayments';
import { paymentMethodLabel } from '../utils/paymentMethodLabel';
import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ServiceJob } from '../types';
import { X, Printer, Download } from 'lucide-react';
import { printReceipt, receiptStyles, saveReceipt } from '../utils/receipt';
import { imageValidationError } from '../utils/imageUpload';
import {receiptLabels} from '../i18n/receiptLabels';

interface PrintTicketModalProps { job: ServiceJob; onClose: () => void }
export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({job,onClose}) => {
  const { settings, technicians, payments, formatCurrency, formatDate, t, language } = useApp();
  const receipt=useRef<HTMLElement>(null);
  const [saved,setSaved]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(false);
  const assigned=technicians.find(tech=>tech.id===job.technician_id) || job.technician;
  const { records, paid, currency } = jobPaymentSummary(job, payments);
  const receiptPayments=records.filter(payment=>payment.currency_code===currency);
  const receivers=[...new Set(receiptPayments.map(payment=>payment.received_by?.trim() || payment.created_by || '').filter(Boolean))];
  const money=(value:number)=>formatCurrency(value,currency);
  const l=receiptLabels(language);
  const subtotal=Number(job.service_charge||0)+Number(job.parts_cost||0);
  const discount=Number(job.discount_amount||0);
  const remaining=Math.max(0,Math.round((job.total_cost-paid)*100)/100);
  const change=Math.max(0,Math.round((paid-job.total_cost)*100)/100);
  return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
    <div role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title" className="w-full max-w-3xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl flex flex-col max-h-[94vh]">
      <header className="flex flex-wrap gap-3 items-center justify-between p-4 border-b border-[var(--border)]">
        <div><h2 id="receipt-modal-title" className="font-bold">{l.title}</h2><p className="text-xs text-[var(--text-muted)]">{job.service_number} · {settings.paperSize}</p></div>
        <div className="flex items-center gap-2"><button disabled={saving} onClick={async()=>{if(!receipt.current || saving)return;setSaving(true);setSaved(false);setError('');try {await saveReceipt(receipt.current,job.service_number,settings.paperSize);setSaved(true);}catch(e:any){setError(e.message || 'Receipt could not be saved.');}finally{setSaving(false);}}} className="px-3 py-2 rounded-lg border border-[var(--border)] flex items-center gap-2 text-xs font-bold"><Download className="w-4 h-4"/>{saving ? l.saving : l.saveJpeg}</button><button onClick={()=>{setError('');try {if(receipt.current)printReceipt(receipt.current.outerHTML,settings.paperSize);}catch(e:any){setError(e.message);}}} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white flex items-center gap-2 text-xs font-bold"><Printer className="w-4 h-4"/>{l.print}</button><button aria-label="Close receipt" onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface-2)]"><X className="w-5 h-5"/></button></div>
      </header>
      {saved && <p role="status" className="px-4 py-2 text-xs text-emerald-500">{l.saved}</p>}
      {error && <p role="alert" className="px-4 py-2 text-xs text-rose-500">{error}</p>}
      <div className="overflow-y-auto p-3 sm:p-5 bg-slate-100 rounded-b-2xl"><style>{receiptStyles.replace(/body\{[^}]*\}/g, '')}</style>
        <article ref={receipt} className={`receipt ${settings.paperSize==='80mm' ? 'receipt-thermal' : ''}`}>
          <div className="receipt-header">{settings.shopLogo && !imageValidationError(settings.shopLogo) && <img src={settings.shopLogo} alt="Shop logo"/>}<h1>{settings.shopName || 'FixFlow Workshop'}</h1>{settings.address && <p>{settings.address}</p>}<p>{settings.phone}{settings.secondaryPhone?` / ${settings.secondaryPhone}`:''}{settings.email ? ` · ${settings.email}` : ''}</p>{settings.website && <p>{settings.website}</p>}{settings.businessHours && <p>{settings.businessHours}</p>}{settings.taxEnabled && settings.taxId && <p>Tax ID: {settings.taxId}</p>}</div>
          <div className="receipt-title"><h2>{l.title}</h2><strong>{job.service_number}</strong></div>
          <div className="receipt-details">
            <div><span className="receipt-label">{l.date}</span>{formatDate(job.received_at)}</div><div><span className="receipt-label">{l.status}</span>{t(`status_${job.status_id}` as any)}</div>
            <div><span className="receipt-label">{l.customer}</span><b>{job.customer?.name || '—'}</b><br/>{job.customer?.phone}</div><div><span className="receipt-label">{l.device}</span>{job.device ? `${job.device.brand} ${job.device.model}` : '—'}<br/>{job.device?.serial_or_imei}</div>
            <div><span className="receipt-label">{l.technician}</span>{assigned?.full_name || '—'}<br/><small>{job.technician_id}</small></div><div><span className="receipt-label">{l.cashier}</span><b>{receivers.join(', ') || job.intake_received_by || l.notRecorded}</b>{job.intake_received_by && <><br/><small>{l.intake}: {job.intake_received_by}</small></>}</div>
          </div>
          <div className="receipt-note"><span className="receipt-label">{l.problem}</span>{job.problem_description}{job.diagnosis && <><br/><span className="receipt-label">{l.diagnosis}</span>{job.diagnosis}</>}</div>
          <table aria-label="Receipt charges"><thead><tr><th>{l.description}</th><th className="amount">{l.amount} ({currency})</th></tr></thead><tbody>
            <tr><td>{l.parts}</td><td className="amount">{money(job.parts_cost)}</td></tr>
            <tr><td>{l.labor}</td><td className="amount">{money(job.service_charge)}</td></tr>
            <tr className="receipt-subtotal"><td>{l.subtotal}</td><td className="amount">{money(subtotal)}</td></tr>
            <tr><td>{l.discount} {job.discount_type==='percent'&&discount>0?`(${job.discount_value}%)`:''}</td><td className="amount">−{money(discount)}</td></tr>
            <tr className="receipt-total"><td>{l.total}</td><td className="amount">{money(job.total_cost)}</td></tr>
            <tr><td>{l.paid}</td><td className="amount">−{money(paid)}</td></tr>
            {remaining>0&&<tr className="receipt-settlement"><td>{l.remaining}</td><td className="amount">{money(remaining)}</td></tr>}
            {change>0&&<tr className="receipt-settlement"><td>{l.change}</td><td className="amount">{money(change)}</td></tr>}
          </tbody></table>
          {receiptPayments.length>0 && <><h3 className="receipt-label">{l.payments}</h3><table className="receipt-payments" aria-label="Receipt payments"><thead><tr><th>{l.paymentDate}</th><th>{l.paymentCashier}</th><th className="amount">{l.amount}</th></tr></thead><tbody>{receiptPayments.map(payment=><tr key={payment.id}><td><b>{payment.id}</b><br/>{formatDate(payment.paid_at)}<br/>{paymentMethodLabel({id:payment.payment_method,name:payment.payment_method,enabled:true},language)}{payment.reference_number && <><br/>{l.reference}: {payment.reference_number}</>}</td><td>{payment.received_by || payment.created_by || l.notRecorded}</td><td className="amount">{money(payment.amount)}</td></tr>)}</tbody></table></>}
          <div className="receipt-footer"><b>{l.warranty}: {settings.defaultWarrantyDays ?? 90} {l.days}</b><br/>{settings.receiptFooterNote}</div><div className="receipt-signatures"><span>{l.signature}</span></div>
        </article>
      </div>
    </div>
  </div>;
};

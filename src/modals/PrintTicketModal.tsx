import React from 'react';
import { useApp } from '../context/AppContext';
import { ServiceJob } from '../types';
import { X, Printer } from 'lucide-react';

interface PrintTicketModalProps {
  job: ServiceJob;
  onClose: () => void;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({ job, onClose }) => {
  const { settings, technicians, payments, formatCurrency, formatDate, t } = useApp();

  const handlePrint = () => {
    window.print();
  };

  // MUST resolve technician using: service_jobs.technician_id -> technicians.name
  // Do NOT show currently logged-in user's name!
  const assignedTech = technicians.find((t) => t.id === job.technician_id);
  const assignedTechName = assignedTech ? assignedTech.full_name : (job.technician?.full_name || 'Assigned Technician');

  // Job specific payments
  const jobPayments = (job.payments && job.payments.length > 0
    ? job.payments
    : payments.filter((p) => p.service_job_id === job.id)
  );

  const totalPaid = jobPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || job.amount_paid;
  const balanceDue = Math.max(0, job.total_cost - totalPaid);
  const is80mm = settings.paperSize === '80mm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Controls bar (Hidden on print) */}
        <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface-2)]/30 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs sm:text-sm font-bold text-[var(--text)]">
              {t('printReceipt')} ({settings.paperSize})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0">
          <div
            className={`mx-auto bg-white border border-slate-300 rounded-lg p-6 shadow-xs ${
              is80mm ? 'max-w-[340px] text-xs' : 'max-w-md text-sm'
            }`}
          >
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-3 space-y-1">
              <div className="text-[10px] tracking-widest font-bold text-slate-500 uppercase">
                ================================================
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                {settings.shopName || 'PHONE SERVICE WORKSHOP'}
              </h1>
              {settings.address && (
                <p className="text-[11px] text-slate-700 font-medium px-2">{settings.address}</p>
              )}
              <p className="text-[11px] text-slate-600 font-mono">
                {settings.phone} {settings.email ? `• ${settings.email}` : ''}
              </p>
              <div className="text-[10px] tracking-widest font-bold text-slate-500 uppercase">
                ================================================
              </div>
            </div>

            {/* Receipt Content */}
            <div className="space-y-3 font-sans">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Service No:</span>
                <span className="text-base font-black font-mono text-blue-700 tracking-wider">
                  {job.service_number}
                </span>
              </div>

              <div className="flex justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Date:</span>
                  <span className="font-semibold text-slate-800">{formatDate(job.received_at)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Status:</span>
                  <span className="font-bold text-slate-900 uppercase">{t(`status_${job.status_id}` as any)}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Customer:</span>
                <span className="font-bold text-slate-900 text-sm">{job.customer?.name}</span>
                <span className="text-xs font-mono text-slate-600 block">{job.customer?.phone}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Phone / Device:</span>
                <span className="font-bold text-slate-900">
                  {job.device ? `${job.device.brand} ${job.device.model}` : 'Phone Device'}
                </span>
              </div>

              {job.device?.serial_or_imei && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">IMEI:</span>
                  <span className="font-mono text-slate-700">{job.device.serial_or_imei}</span>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Problem:</span>
                <span className="text-slate-800 leading-snug">{job.problem_description}</span>
              </div>

              {job.diagnosis && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Diagnosis:</span>
                  <span className="text-slate-800 leading-snug">{job.diagnosis}</span>
                </div>
              )}

              {/* ------------------------------------------------ */}
              {/* MANDATORY TECHNICIAN RELATIONSHIP SECTION       */}
              {/* ------------------------------------------------ */}
              <div className="my-3 py-2 border-y-2 border-dashed border-slate-400 bg-slate-50 px-2 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Technician:
                </span>
                <span className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  {assignedTechName}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block">
                  (ID: {job.technician_id})
                </span>
              </div>

              {/* Financial Charges using actual currency */}
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Service Charge:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(job.service_charge, job.currency_code)}
                  </span>
                </div>

                {job.parts_cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Parts Cost:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(job.parts_cost, job.currency_code)}
                    </span>
                  </div>
                )}

                {settings.taxEnabled !== false && settings.taxPercentage > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({settings.taxPercentage}% {settings.taxId ? `[${settings.taxId}]` : ''}):</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(((job.service_charge + (job.parts_cost || 0)) * settings.taxPercentage) / 100, job.currency_code)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-sm">
                  <span>Total Cost:</span>
                  <span className="font-mono text-slate-900">
                    {formatCurrency(job.total_cost, job.currency_code)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Paid:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatCurrency(totalPaid, job.currency_code)}
                  </span>
                </div>

                <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200">
                  <span className={balanceDue > 0 ? 'text-amber-800' : 'text-emerald-700'}>
                    Balance:
                  </span>
                  <span className={`font-mono ${balanceDue > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {formatCurrency(balanceDue, job.currency_code)}
                  </span>
                </div>

                {/* Recorded Payment Transactions Breakdown */}
                {jobPayments.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Payment History:
                    </span>
                    {jobPayments.map((p) => (
                      <div key={p.id} className="flex justify-between text-[11px] text-slate-700 font-mono">
                        <span>
                          {formatDate(p.paid_at)} · {p.payment_method}
                          {p.reference_number ? ` [Ref: ${p.reference_number}]` : ''}
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(p.amount, p.currency_code)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warranty and Footer Note */}
              <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 uppercase">
                  Warranty: {job.warranty_days} Days Limited Service Warranty
                </div>
                <p className="leading-tight">{settings.receiptFooterNote}</p>
                <div className="text-[10px] tracking-widest font-bold text-slate-500 uppercase pt-1">
                  ================================================
                </div>
              </div>

              {/* Customer and Technician signature lines */}
              <div className="mt-6 pt-3 border-t border-dashed border-slate-300 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500">
                <div>
                  <div className="h-6 border-b border-slate-400"></div>
                  <span className="block mt-1">Technician Signature</span>
                </div>
                <div>
                  <div className="h-6 border-b border-slate-400"></div>
                  <span className="block mt-1">Customer Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

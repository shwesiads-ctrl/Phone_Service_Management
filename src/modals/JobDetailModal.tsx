import {DiscountFields} from '../components/DiscountFields';
import {calculateJobPricing,type DiscountType} from '../utils/jobPricing';
import { jobPaymentSummary } from '../utils/jobPayments';
import { usePaymentSelection } from '../hooks/usePaymentSelection';
import { PaymentProfileSelector } from '../components/PaymentProfileSelector';
import { paymentMethodLabel } from '../utils/paymentMethodLabel';
import { formatCurrency as formatMoney, getCurrencySymbol as currencySymbol } from '../utils/formatters';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceJob, ServiceJobPart, ServiceStatus, TicketPriority } from '../types';
import { ThaiBankPaymentScreen } from '../components/ThaiBankPaymentScreen';
import {
  X,
  Printer,
  Save,
  Trash2,
  Plus,
  Wrench,
  Shield,
  Smartphone,
  User,
  CheckCircle2,
  AlertTriangle,
  Lock,
  CreditCard,
  Calendar,
  Check,
  Landmark,
} from 'lucide-react';

interface JobDetailModalProps {
  job: ServiceJob;
  onClose: () => void;
  onPrint: (job: ServiceJob) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, onPrint }) => {
  const {
    currentUser,
    role,
    technicians,
    currency: shopCurrency,
    updateJob,
    deleteJob,
    recordPayment,
    payments,
    formatDate,
    t,
    settings,
    language,
  } = useApp();

  const currency = job.currency_code || 'MMK';
  const formatCurrency = (amount: number, code = currency) => formatMoney(amount, code);
  const getCurrencySymbol = () => currencySymbol(currency);

  const {profile:activePaymentProfile,selectProfile,methods:availablePaymentMethods}=usePaymentSelection();
  // Local states
  const [statusId, setStatusId] = useState<ServiceStatus>(job.status_id);
  const [priority, setPriority] = useState<TicketPriority>(job.priority);
  const [technicianId, setTechnicianId] = useState<string>(job.technician_id);
  const [diagnosis, setDiagnosis] = useState<string>(job.diagnosis || '');
  const [repairNotes, setRepairNotes] = useState<string>(job.repair_notes || '');
  const [completionNotes, setCompletionNotes] = useState<string>(job.completion_notes || '');
  const [serviceCharge, setServiceCharge] = useState<number>(job.service_charge);
  const [discountType,setDiscountType]=useState<DiscountType>(job.discount_type || 'amount');
  const [discountValue,setDiscountValue]=useState(String(job.discount_value || 0));
  const [parts, setParts] = useState<ServiceJobPart[]>(job.parts_used || []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New part inputs
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartUnitCost, setNewPartUnitCost] = useState('');
  const [newPartWarranty, setNewPartWarranty] = useState(`${settings.defaultWarrantyDays ?? 90} Days`);

  // New payment recording inputs
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(() => {
    return availablePaymentMethods[0]?.id || availablePaymentMethods[0]?.name || 'Cash';
  });
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [receivedBy, setReceivedBy] = useState(currentUser.full_name || currentUser.username || 'Admin');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState(false);

  // Permissions
  const isTechnician = role === 'technician';
  const isAssignedTech = currentUser.technician_id === job.technician_id;

  // Enforce access rule
  if (isTechnician && !isAssignedTech) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="max-w-md w-full bg-[var(--surface)] border border-rose-500/30 rounded-xl p-6 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-[var(--text)]">Access Restricted</h2>
          <p className="text-xs text-[var(--text-muted)]">
            {t('forbiddenError')}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer"
          >
            {t('close')}
          </button>
        </div>
      </div>
    );
  }

  const { records: jobPayments, paid: totalPaid } = jobPaymentSummary(job, payments);
  const partsCost = parts.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  let pricing, pricingError='';
  try{pricing=calculateJobPricing(Number(serviceCharge || 0),partsCost,discountType,Number(discountValue || 0),currency);}catch(error:any){pricingError=error.message;}
  const totalCost = pricing?.total_cost ?? Number(serviceCharge || 0)+partsCost;
  const balanceDue = Math.max(0, totalCost - totalPaid);

  const selectedMethodConfig = availablePaymentMethods.find(
    (m) => m.id === paymentMethod || m.name === paymentMethod
  ) || availablePaymentMethods[0];

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    const unitCost = parseFloat(newPartUnitCost) || 0;
    const qty = Math.max(1, Number(newPartQty) || 1);
    const newPart: ServiceJobPart = {
      id: `PART-${Date.now()}`,
      service_job_id: job.id,
      part_name: newPartName.trim(),
      quantity: qty,
      unit_cost: unitCost,
      total_cost: unitCost * qty,
      warranty: newPartWarranty.trim() || `${settings.defaultWarrantyDays ?? 90} Days`,
    };
    setParts([...parts, newPart]);
    setNewPartName('');
    setNewPartUnitCost('');
    setNewPartQty(1);
  };

  const handleRemovePart = (partId: string) => {
    setParts(parts.filter((p) => p.id !== partId));
  };

  const handleSave = async () => {
    setErrorMsg(null);
    if(pricingError){setErrorMsg(pricingError);return;}
    setSaving(true);
    try {
      const payload: Partial<ServiceJob> = {
        status_id: statusId,
        priority,
        diagnosis,
        repair_notes: repairNotes,
        completion_notes: completionNotes,
        parts_used: parts,
      };

      // Financial control: Only Administrator can alter service charge or payment totals
      if (!isTechnician) {
        payload.discount_type = discountType;
        payload.discount_value = Number(discountValue || 0);
        payload.service_charge = Number(serviceCharge);
        payload.parts_cost = partsCost;
        payload.total_cost = totalCost;
        payload.amount_paid = totalPaid;
        payload.technician_id = technicianId;
      }

      await updateJob(job.id, payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (paymentSaving) return;
    if (!Number.isFinite(amountNum) || amountNum <= 0) {setErrorMsg('Enter a positive payment amount.');return;}
    setErrorMsg(null);

    setPaymentSaving(true);
    try {
      const methodName = selectedMethodConfig ? paymentMethodLabel(selectedMethodConfig, language) : paymentMethod;
      await recordPayment({
        service_job_id: job.id,
        amount: amountNum,
        payment_method: selectedMethodConfig ? selectedMethodConfig.id : paymentMethod,
        currency_code: currency,
        reference_number: referenceNumber.trim(),
        payment_note: paymentNotes.trim() || `${methodName} settlement`,
        notes: paymentNotes.trim() || `${methodName} settlement`,
        received_by: receivedBy.trim() || currentUser.username,
      });

      setPaymentAmount('');
      setReferenceNumber('');
      setPaymentNotes('');
      setShowPaymentForm(false);
      setPaymentSuccessToast(true);
      window.setTimeout(() => setPaymentSuccessToast(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment');
    } finally {
      setPaymentSaving(false);
    }
  };

  const currentAssignedTech = technicians.find((t) => t.id === job.technician_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface-2)]/30">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm sm:text-base font-black text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-lg border border-[var(--primary)]/20">
              {job.service_number}
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text)]">
                {job.device ? `${job.device.brand} ${job.device.model}` : 'Phone Device'}
              </h2>
              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                <span>Received {formatDate(job.received_at)}</span>
                {job.device?.serial_or_imei && (
                  <>
                    <span>·</span>
                    <span className="font-mono">IMEI: {job.device.serial_or_imei}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(job)}
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] transition-colors cursor-pointer"
              title={t('printReceipt')}
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mx-4 mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs sm:text-sm">
          {/* Workflow Status Bar & Assignment Control */}
          <div className="p-4 rounded-xl bg-[var(--surface-2)]/40 border border-[var(--border)] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Service Workflow Status */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  {t('status')} (Workflow)
                </label>
                <select
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value as ServiceStatus)}
                  className="w-full text-xs font-bold bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
                >
                  <option value="received">{t('status_received')}</option>
                  <option value="diagnosing">{t('status_diagnosing')}</option>
                  <option value="waiting_parts">{t('status_waiting_parts')}</option>
                  <option value="repairing">{t('status_repairing')}</option>
                  <option value="ready">{t('status_ready')}</option>
                  <option value="completed">{t('status_completed')}</option>
                  <option value="delivered">{t('status_delivered')}</option>
                  <option value="cancelled">{t('status_cancelled')}</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  {t('priority')}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full text-xs font-semibold bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
                >
                  <option value="normal">{t('priority_normal')}</option>
                  <option value="urgent">{t('priority_urgent')}</option>
                  <option value="express">{t('priority_express')}</option>
                </select>
              </div>

              {/* Assigned Technician: ADMIN can reassign; TECHNICIAN is locked */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1 flex items-center justify-between">
                  <span>{t('assignedTechnician')}</span>
                  {isTechnician && (
                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </label>

                {isTechnician ? (
                  <div className="px-2.5 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      {currentAssignedTech?.full_name || 'Assigned Technician'} ({job.technician_id})
                    </span>
                  </div>
                ) : (
                  <select
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                    className="w-full text-xs font-bold bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.id})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Device Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/20 space-y-1.5">
              <div className="text-[11px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Customer Information</span>
              </div>
              <div className="font-bold text-sm text-[var(--text)]">{job.customer?.name}</div>
              <div className="text-xs text-[var(--text-muted)] font-mono">{job.customer?.phone}</div>
              {job.customer?.address && (
                <div className="text-xs text-[var(--text-muted)]">{job.customer.address}</div>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/20 space-y-1.5">
              <div className="text-[11px] font-bold uppercase text-[var(--text-muted)] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Device Intake Details</span>
              </div>
              <div className="font-bold text-sm text-[var(--text)]">
                {job.device?.brand} {job.device?.model}
              </div>
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-3">
                {job.device?.serial_or_imei && (
                  <span className="font-mono">IMEI: {job.device.serial_or_imei}</span>
                )}
                {job.passlock_pin && (
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                    Lock PIN: {job.passlock_pin}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Problem & Diagnosis */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1">
                Customer Reported Problem
              </label>
              <div className="p-3 rounded-lg bg-[var(--surface-2)]/30 border border-[var(--border)] text-xs text-[var(--text)]">
                {job.problem_description}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Technician Diagnosis Notes
                </label>
                <textarea
                  rows={2}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Logic board capacitor short circuit on PP_VCC_MAIN rail..."
                  className="w-full p-2.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  Repair & Workmanship Notes
                </label>
                <textarea
                  rows={2}
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  placeholder="e.g. Micro-soldering jumper applied, replaced PMIC..."
                  className="w-full p-2.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Parts Used Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text)]">
                {t('partsUsed')} ({parts.length})
              </label>
              <span className="text-xs font-mono font-bold text-[var(--text)]">
                {formatCurrency(partsCost)}
              </span>
            </div>

            {parts.length > 0 && (
              <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface-2)]/20">
                {parts.map((p) => (
                  <div key={p.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[var(--text)]">{p.part_name}</div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono">
                        Qty: {p.quantity} × {formatCurrency(p.unit_cost)} · Warranty: {p.warranty}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[var(--text)]">
                        {formatCurrency(p.total_cost)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePart(p.id)}
                        className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Part sub-form */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <input
                type="text"
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                placeholder="Part Description (e.g. OLED Display Assembly / PMIC Chip)"
                className="sm:col-span-5 px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
              <input
                type="number"
                min="1"
                value={newPartQty}
                onChange={(e) => setNewPartQty(parseInt(e.target.value) || 1)}
                placeholder="Qty"
                className="sm:col-span-2 px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
              />
              <input
                type="number"
                value={newPartUnitCost}
                onChange={(e) => setNewPartUnitCost(e.target.value)}
                placeholder="Unit Cost"
                className="sm:col-span-3 px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
              />
              <button
                type="button"
                onClick={handleAddPart}
                className="sm:col-span-2 px-3 py-1.5 font-bold rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 text-[var(--text)] border border-[var(--border)] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* PAYMENT HISTORY & PAYMENT RECORDING (CURRENCY AUTO SYNC)     */}
          {/* ============================================================ */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[var(--text)] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[var(--primary)]" />
                  <span>{t('paymentRecords')} & Settlement</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Service job currency: <strong className="text-[var(--primary)]">{currency} ({getCurrencySymbol()})</strong>
                  {currency !== shopCurrency && <p className="mt-1">{language==='my' ? 'အပေါ်ဘားမှ currency ပြောင်းခြင်းသည် job အသစ်များအတွက်သာ ဖြစ်သည်။ ဒီ job ၏ currency ကို မပြောင်းပါ။' : language==='th' ? 'สกุลเงินบนแถบด้านบนใช้กับงานใหม่ งานนี้ยังใช้สกุลเงินที่บันทึกไว้' : language==='zh' ? '顶部币种选择适用于新工作，此工作仍使用已保存的币种。' : 'Toolbar currency applies to new jobs. This job keeps its saved currency.'}</p>}
                </div>
              </div>

              {isTechnician ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Admin Only Settlement Lock</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('recordPayment')}</span>
                </button>
              )}
            </div>

            {isTechnician && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Technician Financial Lock: Payment collection, settlement, and service charge modifications are restricted to Administrators only.
                </span>
              </div>
            )}

            {paymentSuccessToast && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{t('paymentSaved')}</span>
              </div>
            )}

            {/* Sub-form: Record New Payment with Automatic Currency Display & Bank Integration */}
            {showPaymentForm && (
              <div className="space-y-3">
                {/* Method Selector Bar */}
                <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[var(--primary)]" />
                      <span>{t('recordPayment')}</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">
                      Profile: {activePaymentProfile.toUpperCase()} ({currency})
                    </span>
                  </div>

                  <PaymentProfileSelector value={activePaymentProfile} onChange={value=>{selectProfile(value);setPaymentMethod('cash');}}/>

                  {/* Payment Amount Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                        {t('paymentAmount')} *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-[var(--primary)] text-xs">
                          {getCurrencySymbol()}
                        </span>
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder={balanceDue > 0 ? String(balanceDue) : (currency === 'MMK' ? '50000' : '1500.00')}
                          className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      </div>
                      {balanceDue > 0 && (
                        <button
                          type="button"
                          onClick={() => setPaymentAmount(String(balanceDue))}
                          className="text-[10px] text-[var(--primary)] hover:underline mt-1 cursor-pointer"
                        >
                          Fill full balance: {formatCurrency(balanceDue, currency)}
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                        {t('paymentMethod')} *
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold cursor-pointer"
                      >
                        {availablePaymentMethods.map((m) => (
                          <option key={m.id} value={m.id}>
                            {paymentMethodLabel(m,language)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* If Bank or Mobile Wallet Method: Show Dedicated Bank Payment Screen (K PLUS, SCB EASY, PromptPay, etc.) */}
                {selectedMethodConfig && (selectedMethodConfig.account_number || selectedMethodConfig.id === 'kplus' || selectedMethodConfig.id === 'scb_easy' || selectedMethodConfig.id === 'promptpay' || selectedMethodConfig.id === 'truemoney' || selectedMethodConfig.id === 'bank_transfer') ? (
                  <ThaiBankPaymentScreen
                    methodConfig={selectedMethodConfig}
                    amount={parseFloat(paymentAmount) || 0}
                    currency={currency}
                    serviceNumber={job.service_number}
                    customerName={job.customer?.name}
                    referenceNumber={referenceNumber}
                    setReferenceNumber={setReferenceNumber}
                    notes={paymentNotes}
                    setNotes={setPaymentNotes}
                    onConfirm={() => handleRecordPayment()}
                    confirmLoading={paymentSaving}
                    onCancel={() => setShowPaymentForm(false)}
                  />
                ) : (
                  /* Standard Cash / Card / Other Settlement Form */
                  <form onSubmit={handleRecordPayment} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                          {t('referenceNumber')}
                        </label>
                        <input
                          type="text"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          placeholder="e.g. Receipt / Card approval code"
                          className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                          {t('receivedBy')}
                        </label>
                        <input
                          type="text"
                          value={receivedBy}
                          onChange={(e) => setReceivedBy(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                        {t('notes')}
                      </label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="e.g. Paid in full upon pickup"
                        className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setShowPaymentForm(false)}
                        className="px-3 py-1 text-xs rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={paymentSaving}
                        className="px-5 py-1.5 text-xs font-bold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{paymentSaving ? 'Saving...' : `[ ${t('confirmPayment')} ]`}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Payment History List */}
            {jobPayments.length > 0 ? (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)] bg-[var(--surface)] text-xs">
                {jobPayments.map((pay) => (
                  <div key={pay.id} className="p-2.5 flex items-center justify-between hover:bg-[var(--surface-2)]/30">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text)] uppercase tracking-wide">
                          {pay.payment_method}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] font-bold">
                          {pay.currency_code}
                        </span>
                        {pay.reference_number && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Ref: {pay.reference_number}
                          </span>
                        )}
                        <span className="text-[11px] text-[var(--text-muted)]">
                          by {pay.received_by}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                        <span>{formatDate(pay.paid_at)}</span>
                        {(pay.payment_note || pay.notes) && <span>· {pay.payment_note || pay.notes}</span>}
                      </div>
                    </div>

                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      +{formatCurrency(pay.amount, pay.currency_code)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-lg">
                No payments recorded yet for this service job.
              </div>
            )}

            {/* Financial Summary Calculation */}
            <div className="pt-3 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1 flex items-center justify-between">
                  <span>{t('serviceCharge')} (Labor)</span>
                  {isTechnician && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </label>
                {isTechnician ? (
                  <div className="relative">
                    <input
                      type="number"
                      disabled
                      value={serviceCharge}
                      className="w-full pl-3 pr-8 py-1.5 text-xs bg-[var(--surface-2)]/80 border border-[var(--border)] rounded-lg text-[var(--text-muted)] font-mono font-bold cursor-not-allowed"
                    />
                    <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                ) : (
                  <input
                    type="number"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono font-bold"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">
                  Parts Replacement Cost
                </label>
                <div className="w-full px-3 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono font-bold">
                  {formatCurrency(partsCost)}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">
                  {t('warrantyDays')}
                </label>
                <input
                  type="number"
                  aria-label="Service warranty policy"
                  value={settings.defaultWarrantyDays ?? 90}
                  readOnly
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono font-bold"
                />
              </div>
            </div>

            {!isTechnician && <DiscountFields type={discountType} value={discountValue} currency={currency} disabled={saving} onChange={(type,value)=>{setDiscountType(type);setDiscountValue(value);}}/>}
            {pricingError && <p role="alert" className="text-xs text-rose-500">{pricingError}</p>}
            {(pricing?.discount_amount || 0)>0 && <p className="text-xs">Discount: −{formatCurrency(pricing!.discount_amount)} {discountType==='percent'?`(${discountValue}%)`:''}</p>}
            {/* Totals & Balance Bar */}
            <div className="pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div>
                  <span className="text-[var(--text-muted)]">Parts Total: </span>
                  <span className="font-mono font-bold">{formatCurrency(partsCost)}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Labor / Service Charge: </span>
                  <span className="font-mono font-bold">{formatCurrency(serviceCharge)}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Total Paid: </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-sm font-black text-[var(--text)] font-mono">
                  {t('total')}: {formatCurrency(totalCost)}
                </div>
                <div className="text-xs font-mono font-bold mt-0.5">
                  {balanceDue > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400">
                      Balance Due: {formatCurrency(balanceDue)}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 sm:justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Paid in Full
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)]/30 flex items-center justify-between shrink-0">
          <div>
            {!isTechnician && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete service job ${job.service_number}?`)) {
                    deleteJob(job.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
              >
                {t('delete')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : t('save')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

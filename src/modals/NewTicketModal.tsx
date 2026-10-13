import {DiscountFields} from '../components/DiscountFields';
import {calculateJobPricing,type DiscountType} from '../utils/jobPricing';
import { usePaymentSelection } from '../hooks/usePaymentSelection';
import { PaymentProfileSelector } from '../components/PaymentProfileSelector';
import { paymentMethodLabel } from '../utils/paymentMethodLabel';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TicketPriority } from '../types';
import { X, Plus, User, Smartphone, Wrench, Shield, Check, CreditCard } from 'lucide-react';

interface NewTicketModalProps {
  onClose: () => void;
  onCreated: (jobId: string) => void;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({ onClose, onCreated }) => {
  const {
    customers,
    technicians,
    devices,
    settings,
    currency,
    getCurrencySymbol,
    createCustomer,
    createDevice,
    createJob,
    t,
    language,
  } = useApp();

  const {profile:activePaymentProfile,selectProfile,methods:availablePaymentMethods}=usePaymentSelection();
  // Mode: select existing customer or new customer
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Device fields
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('');
  const [serialOrImei, setSerialOrImei] = useState('');
  const [passlockPin, setPasslockPin] = useState('');

  // Service Job fields
  const [problemDescription, setProblemDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  // MANDATORY: Admin must assign the job to a technician
  const [technicianId, setTechnicianId] = useState<string>(technicians[0]?.id || '');
  const [serviceCharge, setServiceCharge] = useState('');
  const [discountType,setDiscountType]=useState<DiscountType>('amount');
  const [discountValue,setDiscountValue]=useState('0');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(() => {
    return availablePaymentMethods[0]?.id || 'cash';
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDescription.trim() || !model.trim()) return;

    if (!technicianId) {
      setErrorMsg('A technician must be assigned to this service job.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      calculateJobPricing(parseFloat(serviceCharge) || 0,0,discountType,Number(discountValue || 0),currency);
      let finalCustomerId = selectedCustomerId;

      // Create new customer if toggled
      if (isNewCustomer) {
        if (!custName.trim() || !custPhone.trim()) {
          setErrorMsg('Customer name and phone number are required.');
          setSubmitting(false);
          return;
        }
        const createdCust = await createCustomer({ name: custName.trim(), phone: custPhone.trim() });
        finalCustomerId = createdCust.id;
      }

      // Create device
      const createdDev = await createDevice({
        brand,
        model,
        category: 'smartphone',
        serial_or_imei: serialOrImei,
        customer_id: finalCustomerId,
        condition_notes: `Intake: ${problemDescription.slice(0, 50)}`,
      });

      // Create service job with mandatory technician_id foreign key
      const createdJob = await createJob({
        customer_id: finalCustomerId,
        device_id: createdDev.id,
        technician_id: technicianId, // FOREIGN KEY to technicians.id
        problem_description: problemDescription,
        priority,
        service_charge: parseFloat(serviceCharge) || 0,
        discount_type:discountType,
        discount_value:Number(discountValue || 0),
        amount_paid: parseFloat(amountPaid) || 0,
        currency_code: currency,
        payment_method: paymentMethod,
        warranty_days: settings.defaultWarrantyDays ?? 90,
        passlock_pin: passlockPin,
      });

      onCreated(createdJob.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface-2)]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                {t('newTicket')}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Intake new device repair and assign to workshop technician workbench
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mx-4 mt-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Section 1: Customer Intake */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>1. Customer Details</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
                className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
              >
                {isNewCustomer ? 'Select Existing Customer' : '+ New Customer'}
              </button>
            </div>

            {isNewCustomer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Daw Khin Lay"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="e.g. +95 9 790 123 456"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                  Choose Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Section 2: Device Details */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/20 space-y-3">
            <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>2. Device Specification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text)] mb-1">Brand</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] cursor-pointer"
                >
                  {['Apple', 'Samsung', 'Xiaomi / Redmi', 'Oppo', 'Vivo', 'Google Pixel', 'Realme', 'Huawei', 'Other'].map(
                    (b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                  Model Name / Number *
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro Max / Galaxy S24 Ultra"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                  Serial Number or IMEI
                </label>
                <input
                  type="text"
                  value={serialOrImei}
                  onChange={(e) => setSerialOrImei(e.target.value)}
                  placeholder="e.g. 352140123456789"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                  Screen Passcode / Pattern PIN
                </label>
                <input
                  type="text"
                  value={passlockPin}
                  onChange={(e) => setPasslockPin(e.target.value)}
                  placeholder="e.g. 123456 / L-pattern"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: MANDATORY TECHNICIAN ASSIGNMENT */}
          <div className="p-3.5 rounded-xl border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-[var(--primary)] flex items-center gap-1.5 uppercase tracking-wider">
                <Wrench className="w-4 h-4" />
                <span>3. Technician Assignment (Mandatory)</span>
              </div>
              <span className="text-[10px] font-bold bg-[var(--primary)] text-white px-2 py-0.5 rounded">
                Required FK
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                  Assigned Technician *
                </label>
                <select
                  required
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[var(--surface)] border-2 border-[var(--primary)]/40 rounded-lg text-[var(--text)] font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
                >
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name} ({tech.id}) · {tech.status === 'active' ? 'Active' : 'Inactive'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Relationship: <code>service_jobs.technician_id → technicians.id</code>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                  Service Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] cursor-pointer"
                >
                  <option value="normal">{t('priority_normal')}</option>
                  <option value="urgent">{t('priority_urgent')}</option>
                  <option value="express">{t('priority_express')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Problem Description */}
          <div>
            <label className="block text-xs font-bold text-[var(--text)] mb-1">
              Problem Description / Customer Complaint *
            </label>
            <textarea
              required
              rows={2}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="e.g. No Power, Water Damage, Screen cracked, Charging port loose..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
            />
          </div>

          {/* Section 5: Pricing & Advance Deposit (Auto-Currency Formatted) */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Financial & Advance Deposit</span>
              </span>
              <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">
                Currency: {currency} ({getCurrencySymbol()})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                  {t('serviceCharge')}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-[var(--primary)] text-xs">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(e.target.value)}
                    placeholder={currency === 'MMK' ? '50000' : '50.00'}
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono font-bold"
                  />
                </div>
              </div>

              <DiscountFields type={discountType} value={discountValue} currency={currency} onChange={(type,value)=>{setDiscountType(type);setDiscountValue(value);}}/>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                  Advance Deposit Paid
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <PaymentProfileSelector value={activePaymentProfile} onChange={value=>{selectProfile(value);setPaymentMethod('cash');}}/>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                  {t('paymentMethod')}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold cursor-pointer"
                >
                  {availablePaymentMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {paymentMethodLabel(m,language)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick banking helper if advance deposit is recorded */}
            {parseFloat(amountPaid) > 0 && (() => {
              const selectedM = availablePaymentMethods.find((m) => m.id === paymentMethod);
              if (!selectedM || !selectedM.account_number) return null;
              return (
                <div className="mt-2 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[var(--text)]">{selectedM.thai_name || selectedM.name}</span>
                    <span className="text-[11px] text-[var(--text-muted)] ml-2">
                      {selectedM.account_name} · Acc: <strong className="font-mono text-[var(--text)]">{selectedM.account_number}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Ready for Scan
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Creating...' : t('newTicket')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

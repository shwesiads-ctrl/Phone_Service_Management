import React, { useState } from 'react';
import { X, Save, Shield, QrCode as QrIcon, Check, Landmark } from 'lucide-react';
import { PaymentMethodConfig, PaymentProfile } from '../types';
import { useApp } from '../context/AppContext';

interface PaymentMethodConfigModalProps {
  profile: PaymentProfile;
  method: PaymentMethodConfig;
  onClose: () => void;
  onSave: (updated: PaymentMethodConfig) => Promise<void>;
}

export const PaymentMethodConfigModal: React.FC<PaymentMethodConfigModalProps> = ({
  profile,
  method,
  onClose,
  onSave,
}) => {
  const { t } = useApp();

  const [name, setName] = useState(method.name);
  const [thaiName, setThaiName] = useState(method.thai_name || method.name);
  const [enabled, setEnabled] = useState(method.enabled);
  const [bankName, setBankName] = useState(method.bank_name || '');
  const [accountName, setAccountName] = useState(method.account_name || '');
  const [accountNumber, setAccountNumber] = useState(method.account_number || '');
  const [instructions, setInstructions] = useState(method.instructions || '');
  const [qrCode, setQrCode] = useState(method.qr_code || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaving(true);
    try {
      await onSave({
        ...method,
        name,
        thai_name: thaiName,
        enabled,
        bank_name: bankName.trim(),
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
        instructions: instructions.trim(),
        qr_code: qrCode.trim(),
      });
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save payment method config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text)]">
                Configure Payment: {method.thai_name || method.name}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Bank credentials & instruction settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Enable/Disable */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30">
            <div>
              <span className="text-xs font-bold text-[var(--text)] block">
                Payment Channel Status
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Enable or disable this payment option across checkout forms
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Display Title (EN)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Display Title (TH)
              </label>
              <input
                type="text"
                value={thaiName}
                onChange={(e) => setThaiName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)]"
              />
            </div>
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Bank Name / Provider
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. Kasikornbank (KBank) / Siam Commercial Bank (SCB)"
              className="w-full px-3 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Account Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                {t('accountName')} (บัญชีผู้รับ / ชื่อบัญชี)
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. FixFlow Mobile Co., Ltd."
                className="w-full px-3 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)]"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                {t('accountNumber')} (เลขที่บัญชี)
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 045-2-98765-4"
                className="w-full px-3 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Payment Instructions / Step Guide
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Open K PLUS app > scan QR code or wire money directly to KBank account number."
              className="w-full px-3 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] resize-none"
            />
          </div>

          {/* Custom QR Code payload or URL */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Custom QR Code (Optional URL / Image Data)
            </label>
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Bank-issued QR image URL or data:image/png;base64,..."
              className="w-full px-3 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono text-[11px]"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Use the QR image issued by your bank or wallet. Check the recipient and amount in the banking app before confirming payment.
            </p>
          </div>

          {saveError && <p role="alert" className="text-xs text-rose-600">{saveError}</p>}
          {/* Footer Actions */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : t('save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

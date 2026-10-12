import React, { useEffect, useState } from 'react';
import { Copy, Check, QrCode as QrIcon, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { PaymentMethodConfig, Currency } from '../types';
import { useApp } from '../context/AppContext';

interface ThaiBankPaymentScreenProps {
  methodConfig: PaymentMethodConfig;
  amount: number;
  currency: Currency;
  serviceNumber?: string;
  customerName?: string;
  referenceNumber: string;
  setReferenceNumber: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  onConfirm: () => void;
  confirmLoading?: boolean;
  onCancel?: () => void;
  compact?: boolean;
}

export const ThaiBankPaymentScreen: React.FC<ThaiBankPaymentScreenProps> = ({
  methodConfig,
  amount,
  currency,
  serviceNumber,
  customerName,
  referenceNumber,
  setReferenceNumber,
  notes,
  setNotes,
  onConfirm,
  confirmLoading = false,
  onCancel,
  compact = false,
}) => {
  const { formatCurrency, t, language } = useApp();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const isKPlus = methodConfig.id === 'kplus' || methodConfig.name.toLowerCase().includes('k plus');
  const isScbEasy = methodConfig.id === 'scb_easy' || methodConfig.name.toLowerCase().includes('scb');
  const isPromptPay = methodConfig.id === 'promptpay' || methodConfig.name.toLowerCase().includes('promptpay');
  const isTrueMoney = methodConfig.id === 'truemoney' || methodConfig.name.toLowerCase().includes('truemoney');
  const isKBZPay = methodConfig.id === 'kbz_pay' || methodConfig.name.toLowerCase().includes('kbz');
  const isWavePay = methodConfig.id === 'wave_pay' || methodConfig.name.toLowerCase().includes('wave');

  // Account labels based on requirement
  // K PLUS: บัญชีผู้รับ: [ Account Name ], เลขที่บัญชี: [ Account Number ]
  // SCB EASY: ชื่อบัญชี: [ Account Name ], เลขที่บัญชี: [ Account Number ]
  // KBZPay: Account Name: [ Hacked Shop ], Account Number / Phone: [ 09256060722 ]
  const accountNameLabel = isKPlus
    ? (language === 'th' ? 'บัญชีผู้รับ' : language === 'my' ? 'လက်ခံသူအမည်' : 'Account Name')
    : (language === 'th' ? 'ชื่อบัญชี' : language === 'my' ? 'အကောင့်ပိုင်ရှင်အမည်' : 'Account Name');

  const accountNumberLabel = language === 'th' ? 'เลขที่บัญชี' : language === 'my' ? 'အကောင့် / ဖုန်းနံပါတ်' : 'Account / Phone Number';

  // Bank theme colors
  let brandColor = '#0f766e'; // default teal
  let brandHeaderBg = 'from-teal-600 to-emerald-700';
  let brandBadge = 'PAY';
  let brandCategory = 'Mobile Banking';
  let defaultBankName = methodConfig.bank_name || 'Payment Service';

  if (isKBZPay) {
    brandColor = '#005BBB'; // KBZ Blue
    brandHeaderBg = 'from-[#005BBB] to-[#003875]';
    brandBadge = 'KBZ';
    brandCategory = 'KBZPay Digital';
    defaultBankName = 'KBZPay Mobile Wallet';
  } else if (isWavePay) {
    brandColor = '#FDE047'; // Wave Yellow
    brandHeaderBg = 'from-amber-500 to-yellow-600';
    brandBadge = 'Wave';
    brandCategory = 'Wave Pay';
    defaultBankName = 'Wave Money Wallet';
  } else if (isKPlus) {
    brandColor = '#00A950'; // Kasikorn Green
    brandHeaderBg = 'from-[#00A950] to-[#007b3a]';
    brandBadge = 'KBank';
    brandCategory = 'Thai Banking';
    defaultBankName = methodConfig.bank_name || 'Kasikornbank (KBank)';
  } else if (isScbEasy) {
    brandColor = '#4E2A84'; // SCB Purple
    brandHeaderBg = 'from-[#4E2A84] to-[#341b5a]';
    brandBadge = 'SCB';
    brandCategory = 'Thai Banking';
    defaultBankName = methodConfig.bank_name || 'Siam Commercial Bank (SCB)';
  } else if (isPromptPay) {
    brandColor = '#003B71'; // PromptPay Navy Blue
    brandHeaderBg = 'from-[#003B71] to-[#002244]';
    brandBadge = 'PromptPay';
    brandCategory = 'Thai PromptPay';
    defaultBankName = 'พร้อมเพย์ (PromptPay e-Payment)';
  } else if (isTrueMoney) {
    brandColor = '#FF8800'; // TrueMoney Orange
    brandHeaderBg = 'from-[#FF8800] to-[#d66f00]';
    brandBadge = 'TrueMoney';
    brandCategory = 'TrueMoney';
    defaultBankName = 'TrueMoney Wallet';
  }

  // Generate QR Code data URL
  useEffect(() => {
    if (methodConfig.qr_code && /^(data:image\/(png|jpeg|webp);base64,|https?:\/\/)/i.test(methodConfig.qr_code)) {
      setQrDataUrl(methodConfig.qr_code);
      return;
    }

    setQrDataUrl('');
  }, [methodConfig.qr_code]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-lg transition-all animate-in fade-in duration-200">
      {/* Brand Header */}
      <div className={`p-4 bg-gradient-to-r ${brandHeaderBg} text-white flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-sm tracking-tight border border-white/30 shadow-inner">
            {brandBadge}
          </div>
          <div>
            <h3 className="font-extrabold text-base leading-tight tracking-wide flex items-center gap-2">
              <span>{methodConfig.thai_name || methodConfig.name}</span>
            </h3>
            <p className="text-xs text-white/80 font-medium">{defaultBankName}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-sm">
            {brandCategory}
          </span>
          {serviceNumber && (
            <p className="text-[11px] text-white/90 font-mono font-semibold mt-0.5">
              {serviceNumber}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Account Info Box */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)] space-y-2.5">
          {/* Account Name */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[var(--border)]/60 pb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              {accountNameLabel}:
            </span>
            <span className="text-sm font-bold text-[var(--text)] tracking-wide">
              {methodConfig.account_name || '—'}
            </span>
          </div>

          {/* Account Number */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-[var(--text-muted)] block">
                {accountNumberLabel}:
              </span>
              <span className="text-base font-mono font-extrabold text-[var(--text)] tracking-wider">
                {methodConfig.account_number || '—'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(methodConfig.account_number || '')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]'
              }`}
              title="Copy account number"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('copyAccountNumber')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Amount & QR Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* QR Code Presentation */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-[var(--border)] bg-white text-slate-900 shadow-sm">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1.5">
              <QrIcon className="w-3.5 h-3.5 text-slate-700" />
              <span>[ QR CODE ]</span>
            </div>

            {qrDataUrl ? (
              <div className="relative p-1 bg-white rounded-lg border border-slate-200">
                <img
                  src={qrDataUrl}
                  alt="Payment QR Code"
                  className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="w-36 h-36 flex items-center justify-center bg-slate-100 rounded-lg text-xs text-slate-400">
                {language === 'my' ? 'Payment Settings တွင် ဘဏ် QR အစစ်ကို ထည့်ပါ။' : 'Upload your bank-issued QR in Payment Settings.'}
              </div>
            )}

            <p className="text-[10px] text-slate-500 font-medium mt-1.5 text-center">
              {t('scanQrCode')}
            </p>
          </div>

          {/* Amount Display & Reference Input */}
          <div className="space-y-3">
            {/* Amount Box */}
            <div className="p-3.5 rounded-xl border-2 border-[var(--primary)]/30 bg-[var(--primary)]/5 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
                Amount
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text)] tabular-nums">
                {formatCurrency(amount, currency)}
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Selected currency: {currency} (No live exchange conversion)
              </p>
            </div>

            {/* Reference Number Field */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1">
                {t('referenceNumber')}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. 20261008-98421"
                className="w-full px-3 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Payment Note Field */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1">
                {t('notes')}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Deposit / Paid via mobile banking slip"
                className="w-full px-3 py-1.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        {methodConfig.instructions && (
          <div className="text-[11px] text-[var(--text-muted)] bg-[var(--surface-2)]/30 p-2.5 rounded-lg border border-[var(--border)] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{methodConfig.instructions}</span>
          </div>
        )}

        {/* Action Button: [ Confirm Payment ] */}
        <div className="pt-2 border-t border-[var(--border)] flex items-center justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] cursor-pointer"
            >
              {t('cancel')}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmLoading || amount <= 0}
            className="flex-1 sm:flex-none px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {confirmLoading ? (
              <span>Saving Payment...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>[ {t('confirmPayment')} ]</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

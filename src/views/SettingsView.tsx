import { TelegramSummaryPanel } from '../components/TelegramSummaryPanel';
import release from '../config/release.json';
import { DeveloperInfo } from '../components/DeveloperInfo';
import { ShopSettings } from '../components/ShopSettings';
import { RecoveryKeySettings } from '../components/RecoveryKeySettings';
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Currency, DateFormat, Language, Theme, PaymentMethodConfig, PaymentProfile } from '../types';
import { PaymentMethodConfigModal } from '../modals/PaymentMethodConfigModal';
import { ThaiBankPaymentScreen } from '../components/ThaiBankPaymentScreen';
import {
  Sliders,
  Wrench,
  Users,
  CreditCard,
  DollarSign,
  Languages,
  Palette,
  Printer,
  Database,
  ShieldCheck,
  Check,
  Save,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Landmark,
  Edit2,
  Eye,
  Settings as SettingsIcon,
  X,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Shield,
  FileText,
  KeyRound,
  Trash2,
  Send,
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  ExternalLink,
  Sparkles,
  Heart,
  Wand2,
  Bot,
  HelpCircle,
  Network,
  Wifi,
  QrCode,
  Terminal,
  Smartphone,
  Tablet,
  Laptop,
  Play,
  Square,
} from 'lucide-react';
import QRCode from 'qrcode';

export const SettingsView: React.FC = () => {
  const {
    role,
    settings,
    updateSettings,
    currency,
    setCurrency,
    language,
    setLanguage,
    theme,
    setTheme,
    jobs,
    customers,
    devices,
    technicians,
    activePaymentProfile,
    setPaymentProfile,
    updatePaymentMethodConfig,
    backupMetadata,
    createBackup,
    restoreBackup,
    license,
    verifyLicense,
    activateLicense,
    removeLicense,
    canAccessFeature,
    telegramBot,
    updateTelegramBot,
    testTelegramBot,
    getTelegramChatIds,
    sendDailyTelegramSummary,
    formatDate,
    t,
    isInternetOnline,
    currentUser,
    getAuthHeaders,
    navigate,
  } = useApp();

  const [activeSection, setActiveSection] = useState<string>('general');
  const [saveToast, setSaveToast] = useState(false);

  // License State and Feedback
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licenseActivating, setLicenseActivating] = useState(false);
  const [licenseVerifying, setLicenseVerifying] = useState(false);
  const [licenseRemoving, setLicenseRemoving] = useState(false);
  const [licenseNotice, setLicenseNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const [adminLicenses, setAdminLicenses] = useState<any[]>([]);
  const [generatingLicense, setGeneratingLicense] = useState(false);
  const [newLicenseDays, setNewLicenseDays] = useState(365);
  const [newLicensePlan, setNewLicensePlan] = useState<'PAID' | 'FREE'>('PAID');

  const fetchAdminLicenses = async () => {
    try {
      const res = await fetch('/api/admin/licenses', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setAdminLicenses(data.licenses || []);
      }
    } catch (e) {
      console.warn('Failed fetching admin licenses', e);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAdminLicenses();
    }
  }, [currentUser]);

  // Telegram Bot State
  const [telegramBotToken, setTelegramBotToken] = useState(telegramBot.bot_token || '');
  const [telegramChatId, setTelegramChatId] = useState(telegramBot.chat_id || '');
  const [telegramChannel, setTelegramChannel] = useState(telegramBot.channel_username || '');
  const [telegramNotifyNew, setTelegramNotifyNew] = useState(telegramBot.notify_on_new_job);
  const [telegramNotifyStatus, setTelegramNotifyStatus] = useState(telegramBot.notify_on_status_change);
  const [telegramNotifyPay, setTelegramNotifyPay] = useState(telegramBot.notify_on_payment);
  const [telegramNotifyDaily, setTelegramNotifyDaily] = useState(telegramBot.notify_on_daily_summary);
  const [telegramEnabled, setTelegramEnabled] = useState(telegramBot.enabled);
  const [telegramSaving, setTelegramSaving] = useState(false);
  useEffect(() => {
    setTelegramBotToken(telegramBot.bot_token || ''); setTelegramChatId(telegramBot.chat_id || '');
    setTelegramChannel(telegramBot.channel_username || ''); setTelegramEnabled(telegramBot.enabled);
    setTelegramNotifyNew(telegramBot.notify_on_new_job); setTelegramNotifyStatus(telegramBot.notify_on_status_change);
    setTelegramNotifyPay(telegramBot.notify_on_payment); setTelegramNotifyDaily(telegramBot.notify_on_daily_summary);
  }, [telegramBot.bot_token, telegramBot.chat_id, telegramBot.channel_username, telegramBot.enabled, telegramBot.notify_on_new_job, telegramBot.notify_on_status_change, telegramBot.notify_on_payment, telegramBot.notify_on_daily_summary]);
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [dailyDispatching, setDailyDispatching] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Chat ID Maker state
  const [showChatIdMaker, setShowChatIdMaker] = useState(false);
  const [makerChatId, setMakerChatId] = useState(telegramBot.chat_id || '');
  const [makerLoading, setMakerLoading] = useState(false);
  const [makerDetectedChats, setMakerDetectedChats] = useState<any[]>([]);
  const [makerNotice, setMakerNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (telegramBot.chat_id && !makerChatId) {
      setMakerChatId(telegramBot.chat_id);
    }
  }, [telegramBot.chat_id]);

  const handleAutoDetectChatId = async () => {
    if (!telegramBotToken.trim()) {
      setMakerNotice({
        type: 'error',
        message: 'Please enter a Telegram Bot Token first to detect chat IDs.',
      });
      return;
    }
    setMakerLoading(true);
    setMakerNotice(null);
    try {
      const res = await getTelegramChatIds(telegramBotToken.trim());
      if (res.success && res.chats && res.chats.length > 0) {
        setMakerDetectedChats(res.chats);
        const topChat = res.chats[0];
        setMakerChatId(topChat.chat_id);
        setTelegramChatId(topChat.chat_id);
        setMakerNotice({
          type: 'success',
          message: `Found ${res.chats.length} active chat(s)! Applied latest Chat ID: ${topChat.chat_id} (${topChat.title || topChat.username || 'Direct'})`,
        });
      } else if (res.success) {
        setMakerDetectedChats([]);
        setMakerNotice({
          type: 'info',
          message: 'No recent messages found. Open Telegram, send "/start" or a message to your bot, then click Detect again.',
        });
      } else {
        setMakerNotice({
          type: 'error',
          message: res.error || 'Failed to detect Chat IDs from Telegram.',
        });
      }
    } catch (err: any) {
      setMakerNotice({
        type: 'error',
        message: err.message || 'Error communicating with Telegram Bot API.',
      });
    } finally {
      setMakerLoading(false);
    }
  };

  const handleApplyChatId = (idToApply?: string) => {
    const target = (idToApply !== undefined ? idToApply : makerChatId).trim();
    if (!target) {
      setMakerNotice({ type: 'error', message: 'Chat ID cannot be empty.' });
      return;
    }
    setTelegramChatId(target);
    setMakerChatId(target);
    setMakerNotice({ type: 'success', message: `Chat ID ${target} applied to Telegram configuration!` });
  };

  const handleFormatSupergroup = () => {
    let clean = makerChatId.trim();
    if (!clean) return;
    if (!clean.startsWith('-100')) {
      if (clean.startsWith('-')) {
        clean = '-100' + clean.slice(1);
      } else {
        clean = '-100' + clean;
      }
    }
    setMakerChatId(clean);
    setTelegramChatId(clean);
    setMakerNotice({
      type: 'info',
      message: `Formatted with -100 prefix: ${clean}`,
    });
  };

  // Local Network & Multi-Device (PHP CLI) state
  const portInitialized=useRef(false);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedNetworkProtocol, setSelectedNetworkProtocol] = useState<'node' | 'php'>('node');
  const [customPhpPort, setCustomPhpPort] = useState<number>(8080);
  const [phpActionLoading, setPhpActionLoading] = useState(false);
  const [phpActionNotice, setPhpActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedNetworkUrl, setCopiedNetworkUrl] = useState(false);
  const [copiedFirewallCmd, setCopiedFirewallCmd] = useState(false);
  const [copiedPhpCmd, setCopiedPhpCmd] = useState(false);

  const fetchNetworkInfo = async () => {
    setNetworkLoading(true);
    try {
      const res = await fetch('/api/system/network-info');
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data);
        if (data.php_cli?.port && (!portInitialized.current || data.php_cli.is_running)) {
          portInitialized.current=true;
          setCustomPhpPort(data.php_cli.port);
        }
      }
    } catch (e) {
      console.warn('Failed fetching network info', e);
    } finally {
      setNetworkLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'network') {
      void fetchNetworkInfo();
      const timer=window.setInterval(()=>void fetchNetworkInfo(),5000);
      return()=>window.clearInterval(timer);
    }
  }, [activeSection]);

  useEffect(() => {
    if (networkInfo?.primary_ip) {
      const targetPort = selectedNetworkProtocol === 'php' ? (customPhpPort || 8080) : (networkInfo.node_port || 3000);
      const url = `http://${networkInfo.primary_ip}:${targetPort}`;
      QRCode.toDataURL(url, { margin: 1, width: 220 })
        .then((dataUrl: string) => setQrCodeDataUrl(dataUrl))
        .catch((err: any) => console.error('QR code generation failed', err));
    }
  }, [networkInfo, selectedNetworkProtocol, customPhpPort]);

  const handleStartPhpCli = async () => {
    setPhpActionLoading(true);
    setPhpActionNotice(null);
    try {
      const res = await fetch('/api/system/php-cli/start', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: customPhpPort }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedNetworkProtocol('php');
        setPhpActionNotice({ type: 'success', message: data.message });
        await fetchNetworkInfo();
      } else {
        setPhpActionNotice({ type: 'error', message: data.error || 'Failed to start PHP CLI server' });
      }
    } catch (e: any) {
      setPhpActionNotice({ type: 'error', message: e.message || 'Network error' });
    } finally {
      setPhpActionLoading(false);
    }
  };

  const handleStopPhpCli = async () => {
    setPhpActionLoading(true);
    setPhpActionNotice(null);
    try {
      const res = await fetch('/api/system/php-cli/stop', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setPhpActionNotice({ type: 'success', message: data.message });
        await fetchNetworkInfo();
      } else {
        setPhpActionNotice({ type: 'error', message: data.error || 'Failed to stop PHP CLI server' });
      }
    } catch (e: any) {
      setPhpActionNotice({ type: 'error', message: e.message || 'Network error' });
    } finally {
      setPhpActionLoading(false);
    }
  };

  // Backup & Restore states
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSuccessToast, setBackupSuccessToast] = useState<string | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restorePayload, setRestorePayload] = useState<any>(null);
  const [restoreFileName, setRestoreFileName] = useState<string>('');
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [backupLogs, setBackupLogs] = useState<any[]>([
    {
      id: 'BAK-SYSTEM-INIT',
      created_at: new Date().toISOString(),
      size_bytes: 48920,
      status: 'valid',
      item_counts: { service_jobs: 14, customers: 6, devices: 6, payments: 12 },
    },
  ]);

  // Payment settings state
  const [selectedProfileTab, setSelectedProfileTab] = useState<PaymentProfile>(activePaymentProfile);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);
  const [previewMethod, setPreviewMethod] = useState<PaymentMethodConfig | null>(null);

  // Form states initialized from settings
  const [receiptFooterNote, setReceiptFooterNote] = useState(settings.receiptFooterNote);
  const [defaultWarrantyDays, setDefaultWarrantyDays] = useState(settings.defaultWarrantyDays);
  const [dateFormat, setDateFormat] = useState<DateFormat>(settings.dateFormat);
  const [paperSize, setPaperSize] = useState<'A4' | '80mm'>(settings.paperSize);
  useEffect(() => {
    setDefaultWarrantyDays(settings.defaultWarrantyDays); setDateFormat(settings.dateFormat);
    setPaperSize(settings.paperSize); setReceiptFooterNote(settings.receiptFooterNote);
  }, [settings.defaultWarrantyDays, settings.dateFormat, settings.paperSize, settings.receiptFooterNote]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    await updateSettings(activeSection === 'service' ? {
      defaultWarrantyDays: Number(defaultWarrantyDays), dateFormat,
    } : { paperSize, receiptFooterNote });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings.');
    }
  };

  const sections = [
    { id: 'network', label: 'Local Network & Multi-Device (PHP CLI)', icon: Network },
    { id: 'telegram', label: 'Telegram Bot Service', icon: Send },
    { id: 'donate', label: 'Support Developer & Donate', icon: Heart },
    { id: 'general', label: t('settings_general'), icon: Sliders },
    { id: 'service', label: t('settings_service'), icon: Wrench },
    { id: 'customers', label: t('settings_customers'), icon: Users },
    { id: 'payments', label: t('settings_payments'), icon: CreditCard },
    { id: 'currency', label: t('settings_currency'), icon: DollarSign },
    { id: 'language', label: t('settings_language'), icon: Languages },
    { id: 'appearance', label: t('settings_appearance'), icon: Palette },
    { id: 'print', label: t('settings_print'), icon: Printer },
    { id: 'backup', label: t('settings_backup'), icon: Database },
    { id: 'security', label: t('settings_security'), icon: ShieldCheck },
  ];

  // Currency options
  const currencyOptions: { code: Currency; name: string; symbolDisplay: string; flag: string; example: string }[] = [
    {
      code: 'MMK',
      name: 'Myanmar Kyat',
      symbolDisplay: 'MMK / Ks',
      flag: '🇲🇲',
      example: 'Ks 50,000',
    },
    {
      code: 'USD',
      name: 'US Dollar',
      symbolDisplay: 'USD / $',
      flag: '🇺🇸',
      example: '$50.00',
    },
    {
      code: 'THB',
      name: 'Thai Baht',
      symbolDisplay: 'THB / ฿',
      flag: '🇹🇭',
      example: '฿1,500.00',
    },
    { code: 'CNY', name: 'Chinese Yuan', symbolDisplay: 'CNY / ¥', flag: '🇨🇳', example: '¥50.00' },
  ];

  // Language options
  const languageOptions: { code: Language; name: string; flag: string; country: string }[] = [
    { code: 'en', name: 'English', flag: '🇬🇧', country: 'Global / US / UK' },
    { code: 'my', name: 'မြန်မာ', flag: '🇲🇲', country: 'Myanmar' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭', country: 'Thailand' },
    { code: 'zh', name: '中文 (简体)', flag: '🇨🇳', country: 'China / Singapore' },
  ];

  // Theme options
  const themeOptions: { code: Theme; label: string; icon: React.ReactNode; desc: string }[] = [
    { code: 'light', label: 'Light', icon: <Sun className="w-4 h-4" />, desc: 'Light background' },
    { code: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" />, desc: 'Dark background' },
    { code: 'system', label: 'System', icon: <Monitor className="w-4 h-4" />, desc: 'Follow device appearance' },
  ];

  // Backup Export
  const handleExportBackup = () => {
    const fullBackup = {
      version: release.version,
      timestamp: new Date().toISOString(),
      settings,
      jobs,
      customers,
      devices,
      technicians,
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            {t('settings')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Configure workshop policies, regional localization, appearance, and backups
          </p>
        </div>

        {saveToast && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in duration-150">
            <Check className="w-4 h-4" />
            <span>{t('dataSaved')}</span>
          </div>
        )}
      </div>

      {/* Main Settings Layout: Sub-navigation sidebar on left, content on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Section Tabs */}
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-2 space-y-1">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-[var(--primary)] text-white font-semibold shadow-xs'
                    : 'text-[var(--text)] hover:bg-[var(--surface-2)] text-opacity-80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-[var(--text-muted)]'
                  }`}
                />
                <span className="truncate">{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Section Detail Content Panels */}
        <div className="lg:col-span-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] p-5 sm:p-7">
          {/* 0.4. LOCAL NETWORK & MULTI-DEVICE (PHP CLI / NO XAMPP) */}
          {activeSection === 'network' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-[var(--border)] pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                    <Network className="w-5 h-5 text-[var(--primary)]" />
                    <span>Local Network & Multi-Device Setup (PHP CLI)</span>
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Connect multiple phones, tablets, and POS terminals on the same Wi-Fi — No XAMPP required!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchNetworkInfo}
                  disabled={networkLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 text-xs font-semibold text-[var(--text)] cursor-pointer disabled:opacity-50 transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${networkLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Network</span>
                </button>
              </div>

              {/* Status Metric Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Host Computer</div>
                    <div className="text-xs font-mono font-bold text-[var(--text)] truncate">
                      {networkInfo?.hostname || 'Windows POS Host'}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Local IP Address</div>
                    <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
                      {networkInfo?.primary_ip || 'Detecting...'}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">PHP CLI Engine</div>
                    <div className="text-xs font-bold text-[var(--text)] truncate">
                      {networkInfo?.php_cli?.installed ? (
                        <span className="text-emerald-600 dark:text-emerald-400">PHP CLI Ready</span>
                      ) : (
                        <span className="text-amber-500">Not in PATH</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Multi-Device POS</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{selectedNetworkProtocol==='php'?(networkInfo?.php_cli?.is_running?'PHP access ON':'PHP access OFF'):'Node server online'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Hub: QR Code & LAN Connection Details */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface-2)]/30 to-[var(--surface-2)]/10 space-y-6">
                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                  {/* Left: Dynamic QR Code */}
                  <div className="flex flex-col items-center text-center shrink-0">
                    <div className="p-3 rounded-2xl bg-white shadow-md border border-slate-200">
                      {selectedNetworkProtocol==='php'&&!networkInfo?.php_cli?.is_running?<div className="w-44 h-44 flex items-center justify-center text-slate-500 text-sm p-4">PHP access is OFF. Turn it ON to show the connection QR.</div>:qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="Multi-Device Scan QR Code"
                          className="w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center text-slate-400">
                          <QrCode className="w-12 h-12 animate-pulse" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-[var(--primary)]">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan with Phone or Tablet</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] max-w-[210px] mt-0.5">
                      Open camera on iOS / Android connected to same Wi-Fi
                    </span>
                  </div>

                  {/* Right: URL & Protocol Switcher */}
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                        Select Server Mode to Connect
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedNetworkProtocol('node')}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            selectedNetworkProtocol === 'node'
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]'
                              : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--text)]">FixFlow Node Server</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--primary)]/20 text-[var(--primary)] font-bold">
                              :3000
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1">
                            Primary system engine running Express & Vite SPA
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedNetworkProtocol('php')}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            selectedNetworkProtocol === 'php'
                              ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500'
                              : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--text)]">PHP CLI Server (No XAMPP)</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                              :{customPhpPort || 8080}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1">
                            Ultra-lightweight PHP CLI built-in web server router
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Active URL Bar */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                        Multi-Device Connection Link (Same Wi-Fi)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] font-mono text-xs text-[var(--text)] font-bold flex items-center justify-between overflow-x-auto">
                          <span className="select-all">
                            http://{networkInfo?.primary_ip || '127.0.0.1'}:
                            {selectedNetworkProtocol === 'php' ? (customPhpPort || 8080) : 3000}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `http://${networkInfo?.primary_ip || '127.0.0.1'}:${
                              selectedNetworkProtocol === 'php' ? (customPhpPort || 8080) : 3000
                            }`;
                            navigator.clipboard.writeText(url);
                            setCopiedNetworkUrl(true);
                            setTimeout(() => setCopiedNetworkUrl(false), 2000);
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs"
                          title="Copy Link to Clipboard"
                        >
                          {copiedNetworkUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedNetworkUrl ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={`http://${networkInfo?.primary_ip || 'localhost'}:${
                            selectedNetworkProtocol === 'php' ? (customPhpPort || 8080) : 3000
                          }`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] text-xs font-bold flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                          title="Open Link in New Tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Network Adapters list */}
                    {networkInfo?.interfaces && networkInfo.interfaces.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border)]/50">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">
                          Detected Local Network Adapters:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {networkInfo.interfaces.map((iface: any, idx: number) => (
                            <div
                              key={idx}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-2 ${
                                iface.is_primary
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
                              }`}
                            >
                              <span>{iface.name}:</span>
                              <span>{iface.ip}</span>
                              {iface.is_primary && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
                                  Primary
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PHP CLI SERVER (NO XAMPP) SECTION */}
              <div className="p-5 sm:p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-500" />
                      <span>PHP CLI Built-in Web Server (No XAMPP Required)</span>
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Lightweight command-line runner using router.php — Zero Apache, Zero MySQL bloat
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {networkInfo?.php_cli?.is_running ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active on Port {networkInfo?.php_cli?.port || 8080}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 border border-slate-500/30 text-slate-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Standby / Stopped</span>
                      </span>
                    )}
                  </div>
                </div>

                {phpActionNotice && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      phpActionNotice.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {phpActionNotice.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{phpActionNotice.message}</span>
                  </div>
                )}

                {/* PHP CLI Notice / Explanation */}
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-muted)] space-y-1.5">
                  <div className="font-bold text-[var(--text)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Why use PHP CLI instead of XAMPP?</span>
                  </div>
                  <p>
                    Traditional XAMPP runs bulky Apache and MySQL background services that consume 200MB+ of RAM, often clash with Windows IIS/Skype ports, and require manual Control Panel clicking.
                  </p>
                  <p>
                    With <b>FixFlow's PHP CLI router</b>, you run a single lightweight command: <code>php -S 0.0.0.0:8080 router.php</code>. Keep the Node backend running first; PHP forwards API requests to Node and serves the built frontend to devices on the same local network.
                  </p>
                </div>

                {/* Controls and Port setting */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[var(--text)] shrink-0">PHP Port:</label>
                    <input
                      type="number"
                      value={customPhpPort}
                      disabled={networkInfo?.php_cli?.is_running}
                      onChange={(e) => setCustomPhpPort(Number(e.target.value) || 8080)}
                      className="w-24 px-3 py-1.5 text-xs font-mono bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] disabled:opacity-50"
                    />
                    <span className="text-[11px] text-[var(--text-muted)]">Default: 8080</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" role="switch" aria-label="PHP CLI server" aria-checked={Boolean(networkInfo?.php_cli?.is_running)} disabled={phpActionLoading||networkLoading||!networkInfo?.php_cli?.installed||networkInfo?.php_cli?.is_starting||networkInfo?.php_cli?.is_stopping} onClick={()=>networkInfo?.php_cli?.is_running||networkInfo?.php_cli?.process_alive?handleStopPhpCli():handleStartPhpCli()} className={`flex items-center gap-3 px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 ${networkInfo?.php_cli?.is_running?'bg-emerald-600 text-white':'bg-[var(--surface-2)] border border-[var(--border)]'}`}><span className={`w-9 h-5 rounded-full p-0.5 ${networkInfo?.php_cli?.is_running?'bg-white/30':'bg-slate-400'}`}><span className={`block w-4 h-4 rounded-full bg-white transition-transform ${networkInfo?.php_cli?.is_running?'translate-x-4':''}`}/></span>{phpActionLoading?'Checking…':networkInfo?.php_cli?.is_running?'ON':networkInfo?.php_cli?.process_alive?'Error • Stop':'OFF'}</button>

                  </div>
                </div>

                {/* Command & Batch runner */}
                <div className="pt-2 border-t border-[var(--border)]/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text)]">
                      Run from Windows Command Prompt / PowerShell:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const cmd = `php -S 0.0.0.0:${customPhpPort || 8080} router.php`;
                        navigator.clipboard.writeText(cmd);
                        setCopiedPhpCmd(true);
                        setTimeout(() => setCopiedPhpCmd(false), 2000);
                      }}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPhpCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPhpCmd ? 'Command Copied' : 'Copy Command'}</span>
                    </button>
                  </div>
                  <div className="px-3.5 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] font-mono text-xs text-indigo-600 dark:text-indigo-300 font-bold select-all overflow-x-auto">
                    php -S 0.0.0.0:{customPhpPort || 8080} router.php
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Start Node first with <code>npm run start:production</code>. If its port is not 3000, set <code>PORT={networkInfo?.node_port || 3000}</code> in the PHP terminal before running the command. Tip: You can also double-click <code>start-pos-php-cli.bat</code> in the project directory anytime to start with 1-click on Windows!
                  </p>
                </div>
              </div>

              {/* WINDOWS DEFENDER FIREWALL HELPER */}
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-[var(--text)]">
                      Windows Defender Firewall Configuration (Inbound Traffic)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const cmd = `netsh advfirewall firewall add rule name="FixFlow POS Multi-Device" dir=in action=allow protocol=TCP localport=3000,${customPhpPort || 8080}`;
                      navigator.clipboard.writeText(cmd);
                      setCopiedFirewallCmd(true);
                      setTimeout(() => setCopiedFirewallCmd(false), 2000);
                    }}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedFirewallCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedFirewallCmd ? 'Command Copied' : 'Copy Firewall Rule'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  If tablets or phones cannot reach the host computer, Windows Firewall may be blocking port 3000/8080. Open PowerShell or Command Prompt as Administrator and run:
                </p>
                <div className="px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] font-mono text-[11px] text-amber-600 dark:text-amber-300 font-bold select-all overflow-x-auto">
                  netsh advfirewall firewall add rule name="FixFlow POS Multi-Device" dir=in action=allow protocol=TCP localport=3000,{customPhpPort || 8080}
                </div>
              </div>

              {/* MULTI-DEVICE STATION SETUP GUIDE */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Multi-Device Workshop Station Roles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                      <Laptop className="w-4 h-4 text-[var(--primary)]" />
                      <span>1. Main Counter PC</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Runs the main FixFlow application and database. Used for full admin management, financial reports, settings, and printer integration.
                    </p>
                    <div className="text-[11px] font-mono text-[var(--text)] font-semibold">
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                      <Tablet className="w-4 h-4 text-emerald-500" />
                      <span>2. Technician Tablet</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Placed at repair desks. Technicians log into their individual account to view assigned jobs, update diagnoses, record parts used, and mark repairs ready.
                    </p>
                    <div className="text-[11px] font-mono text-[var(--text)] font-semibold">
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                      <Smartphone className="w-4 h-4 text-indigo-500" />
                      <span>3. Mobile / Cashier POS</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Smartphones or secondary tablets on the same Wi-Fi. Cashiers intake walk-ins, scan serial barcodes, record payments, and print QR receipts.
                    </p>
                    <div className="text-[11px] font-mono text-[var(--text)] font-semibold">
                      Access: Scan QR Code
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 0.5. TELEGRAM BOT SERVICE */}
          {activeSection === 'telegram' && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                      <Send className="w-5 h-5 text-[var(--primary)]" />
                      <span>Telegram Bot Service</span>
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Automated repair ticket dispatches and workshop event notifications
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">FREE · All plans</span>
                </div>
              </div>
              <TelegramSummaryPanel/>
              <div className="space-y-5">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={telegramEnabled} onChange={e => setTelegramEnabled(e.target.checked)} />Enable automatic Telegram alerts</label>
                  <p className="text-xs text-[var(--text-muted)]">Save configuration before testing or sending. Use the summary panel to preview reports and enable a daily schedule.</p>
                  {/* Status Banner */}
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full ${telegramBot.is_connected ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-400'}`} />
                      <span className="text-xs font-bold text-[var(--text)]">
                        Bot Status: {telegramBot.is_connected ? 'Connected' : 'Disconnected / Not Verified'}
                      </span>
                    </div>
                    {telegramBot.is_connected && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Last Telegram delivery succeeded
                      </span>
                    )}
                  </div>

                  {telegramTestResult && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        telegramTestResult.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {telegramTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                        <span>{telegramTestResult.message || (telegramTestResult as any).error}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTelegramTestResult(null)}
                        className="text-[var(--text-muted)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text)] mb-1">
                        Telegram Bot Token
                      </label>
                      <input
                        type="password"
                        value={telegramBotToken}
                        onChange={(e) => setTelegramBotToken(e.target.value)}
                        placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                        className="w-full px-3.5 py-2 text-xs font-mono bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-[var(--text)]">
                            Chat ID / Group ID
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setShowChatIdMaker((prev) => !prev);
                              if (!makerChatId && telegramChatId) {
                                setMakerChatId(telegramChatId);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                            title="Open Chat ID Maker Assistant to discover or format your Chat ID"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>Chat ID Maker {showChatIdMaker ? '▲' : '▼'}</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={telegramChatId}
                          onChange={(e) => {
                            setTelegramChatId(e.target.value);
                            setMakerChatId(e.target.value);
                          }}
                          placeholder="-1001234567890"
                          className="w-full px-3.5 py-2 text-xs font-mono bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--text)] mb-1">
                          Channel Username (Optional)
                        </label>
                        <input
                          type="text"
                          value={telegramChannel}
                          onChange={(e) => setTelegramChannel(e.target.value)}
                          placeholder="@fixflow_workshop_alerts"
                          className="w-full px-3.5 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      </div>
                    </div>

                    {/* Chat ID Maker Assistant Card */}
                    {showChatIdMaker && (
                      <div className="p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 space-y-3 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)]">
                              <Wand2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-[var(--text)]">Chat ID Maker Assistant</h4>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] font-semibold">
                                  Auto-Detect & Formatter
                                </span>
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                Discover your Chat ID automatically from recent bot messages or format channel IDs.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowChatIdMaker(false)}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] rounded-md hover:bg-[var(--surface)] cursor-pointer"
                            title="Close Chat ID Maker"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {makerNotice && (
                          <div
                            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                              makerNotice.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                : makerNotice.type === 'error'
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                : 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {makerNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                            {makerNotice.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
                            {makerNotice.type === 'info' && <HelpCircle className="w-4 h-4 shrink-0" />}
                            <span>{makerNotice.message}</span>
                          </div>
                        )}

                        {/* Chat ID Maker Text Field and Actions */}
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                            Chat ID Maker Text Field
                          </label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={makerChatId}
                              onChange={(e) => setMakerChatId(e.target.value)}
                              placeholder="e.g. 123456789 or -1001234567890"
                              className="flex-1 px-3 py-1.5 text-xs font-mono bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            />
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                disabled={makerLoading || !telegramBotToken.trim()}
                                onClick={handleAutoDetectChatId}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs transition-colors"
                                title="Fetch recent messages sent to your bot to discover your Chat ID"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${makerLoading ? 'animate-spin' : ''}`} />
                                <span>{makerLoading ? 'Detecting...' : 'Detect from Bot'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleFormatSupergroup}
                                disabled={!makerChatId.trim()}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs text-[var(--text)] font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                                title="Prepend -100 for Telegram Supergroup / Channel"
                              >
                                <span>Prefix -100</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleApplyChatId()}
                                disabled={!makerChatId.trim()}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Apply to Chat ID</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Detected Chats List */}
                        {makerDetectedChats.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            <span className="text-[11px] font-bold text-[var(--text-muted)] block">
                              Detected Chats from Telegram Updates ({makerDetectedChats.length}):
                            </span>
                            <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-[var(--border)] p-1.5 bg-[var(--surface-2)]/40">
                              {makerDetectedChats.map((c, idx) => (
                                <div
                                  key={c.chat_id || idx}
                                  className="p-2 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs hover:border-[var(--primary)]/50 transition-colors"
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5 font-bold text-[var(--text)] truncate">
                                      <span>{c.title}</span>
                                      {c.username && <span className="text-[10px] text-[var(--text-muted)] font-normal">{c.username}</span>}
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--surface-2)] text-[var(--text-muted)] font-mono uppercase">
                                        {c.type}
                                      </span>
                                    </div>
                                    <div className="text-[10px] font-mono text-[var(--primary)] truncate">
                                      ID: {c.chat_id}
                                    </div>
                                    {c.last_message && (
                                      <div className="text-[10px] text-[var(--text-muted)] truncate max-w-xs">
                                        "{c.last_message}"
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyChatId(c.chat_id)}
                                    className="shrink-0 px-2 py-1 rounded bg-[var(--primary)]/10 hover:bg-[var(--primary)] text-[var(--primary)] hover:text-white text-[11px] font-semibold cursor-pointer transition-colors"
                                  >
                                    Use this ID
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tips / External helper bots */}
                        <div className="pt-1 border-t border-[var(--border)]/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                          <div className="flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                            <span>Tip: Send <b>/start</b> or any message to your bot on Telegram first, then click <b>Detect from Bot</b>.</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span>Get ID from Telegram bots:</span>
                            <a
                              href="https://t.me/userinfobot"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-semibold"
                            >
                              @userinfobot <ExternalLink className="w-3 h-3" />
                            </a>
                            <a
                              href="https://t.me/getmyid_bot"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-semibold"
                            >
                              @getmyid_bot <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Trigger Checkboxes */}
                    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 space-y-2.5">
                      <span className="text-xs font-bold text-[var(--text)] block mb-1">
                        Automated Triggers
                      </span>
                      <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={telegramNotifyNew}
                          onChange={(e) => setTelegramNotifyNew(e.target.checked)}
                          className="rounded text-[var(--primary)]"
                        />
                        <span>Send alert when a new service job is received</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={telegramNotifyStatus}
                          onChange={(e) => setTelegramNotifyStatus(e.target.checked)}
                          className="rounded text-[var(--primary)]"
                        />
                        <span>Send alert when repair status changes (e.g. Ready for pickup)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={telegramNotifyPay}
                          onChange={(e) => setTelegramNotifyPay(e.target.checked)}
                          className="rounded text-[var(--primary)]"
                        />
                        <span>Send alert when customer payment is recorded</span>
                      </label>

                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        type="button"
                        disabled={telegramTesting || !telegramBotToken.trim()}
                        onClick={async () => {
                          setTelegramTesting(true);
                          setTelegramTestResult(null);
                          try {
                            const res = await testTelegramBot(telegramBotToken, telegramChatId);
                            setTelegramTestResult({
                              success: res.success,
                              message: res.message || (res.success ? 'Telegram bot connected successfully.' : (res.error || 'Connection failed')),
                            });
                          } catch (err: any) {
                            setTelegramTestResult({ success: false, message: err.message || 'Test failed' });
                          } finally {
                            setTelegramTesting(false);
                          }
                        }}
                        className="px-3.5 py-2 rounded-lg border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer disabled:opacity-50"
                      >
                        {telegramTesting ? 'Testing...' : 'Test Bot Connection'}
                      </button>

                      <button
                        type="button"
                        disabled={dailyDispatching || !telegramBot.bot_token || !telegramBot.chat_id || telegramBotToken.trim() !== telegramBot.bot_token || telegramChatId.trim() !== telegramBot.chat_id || telegramChannel.trim() !== (telegramBot.channel_username || '')}
                        onClick={async () => {
                          setDailyDispatching(true);
                          setTelegramTestResult(null);
                          try {
                            const res = await sendDailyTelegramSummary();
                            setTelegramTestResult({
                              success: res.success,
                              message: res.message || (res.success ? "Today's repair summary dispatched successfully." : (res.error || 'Dispatch failed')),
                            });
                          } catch (err: any) {
                            setTelegramTestResult({
                              success: false,
                              message: err.message || 'Failed to dispatch daily summary',
                            });
                          } finally {
                            setDailyDispatching(false);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer disabled:opacity-50"
                        title="Dispatch today's repair summary to Telegram"
                      >
                        <Send className={`w-3.5 h-3.5 ${dailyDispatching ? 'animate-pulse' : ''}`} />
                        <span>{dailyDispatching ? 'Sending Summary...' : 'Send Daily Summary Now'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={telegramSaving}
                        onClick={async () => {
                          setTelegramSaving(true);
                          try {
                          await updateTelegramBot({
                            enabled: telegramEnabled,
                            bot_token: telegramBotToken,
                            chat_id: telegramChatId,
                            channel_username: telegramChannel,
                            notify_on_new_job: telegramNotifyNew,
                            notify_on_status_change: telegramNotifyStatus,
                            notify_on_payment: telegramNotifyPay,
                            notify_on_daily_summary: telegramNotifyDaily,
                          });
                          setSaveToast(true);
                          setTimeout(() => setSaveToast(false), 2000);
                          } catch (err) { setTelegramTestResult({ success: false, message: err instanceof Error ? err.message : 'Save failed.' }); }
                          finally { setTelegramSaving(false); }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Bot Configuration</span>
                      </button>
                    </div>
                  </div>
                </div>
            </div>
          )}

          {/* 1. GENERAL */}
          {activeSection === 'general' && <ShopSettings />}

          {/* 2. SERVICE */}
          {activeSection === 'service' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3 mb-4">
                <h2 className="text-base font-bold text-[var(--text)]">
                  {t('settings_service')} Policy & Workflow
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Default warranties and diagnostic protocols
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  {t('defaultWarranty')} (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={defaultWarrantyDays}
                  onChange={(e) => setDefaultWarrantyDays(Number(e.target.value))}
                  className="w-full max-w-xs px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Standard warranty applied automatically to completed hardware repairs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  {t('dateFormatSetting')}
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value as any)}
                  className="w-full max-w-xs px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
                >
                  <option value="DD MMM YYYY">08 Oct 2026 (Standard English)</option>
                  <option value="DD-MM-YYYY">08-10-2026 (Myanmar Standard)</option>
                  <option value="YYYY-MM-DD">2026-10-08 (ISO Date)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('save')}</span>
                </button>
              </div>
            </form>
          )}

          {/* 4. CUSTOMERS */}
          {activeSection === 'customers' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3 mb-4">
                <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--primary)]" />
                  <span>{t('settings_customers')} Configuration & Directory</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Customer directory policies, phone matching, and automated contact defaults
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 space-y-2">
                  <span className="text-xs font-bold text-[var(--text)] block">Customer Records Registry</span>
                  <div className="text-2xl font-black font-mono text-[var(--primary)]">{customers.length}</div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Phone numbers act as primary unique identifiers for tracking recurring customer devices and repair history across visits.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 space-y-2">
                  <span className="text-xs font-bold text-[var(--text)] block">Customer Validation Rules</span>
                  <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer pt-1">
                    <input type="checkbox" defaultChecked className="rounded text-[var(--primary)]" />
                    <span>Require valid phone number for all new repair bookings</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[var(--primary)]" />
                    <span>Auto-match returning customer on phone number entry</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 5. PAYMENTS */}
          {activeSection === 'payments' && (
            <div className="space-y-5">
              <div className="border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono mb-1">
                  <span>Settings</span>
                  <span>→</span>
                  <span>Payments</span>
                  <span>→</span>
                  <span className="text-[var(--primary)] font-bold capitalize">{selectedProfileTab}</span>
                </div>
                <h2 className="text-base font-bold text-[var(--text)]">
                  {t('settings_payments')} Configuration & Banking Channels
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Configure payment gateways, account names, account numbers, and enable/disable methods for each region.
                </p>
              </div>

              {/* PAYMENT PROFILE TABS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40">
                <div>
                  <span className="text-xs font-bold text-[var(--text)] block">
                    {t('paymentProfile')}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Active Profile: <strong className="text-[var(--primary)] uppercase">{activePaymentProfile}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setSelectedProfileTab('thailand')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedProfileTab === 'thailand'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span>🇹🇭</span>
                    <span>{t('thailandPayments')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProfileTab('myanmar')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedProfileTab === 'myanmar'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span>🇲🇲</span>
                    <span>{t('myanmarPayments')}</span>
                  </button>

                  <button type="button" onClick={()=>setSelectedProfileTab('china')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${selectedProfileTab==='china'?'bg-[var(--primary)] text-white':'text-[var(--text-muted)]'}`}>🇨🇳 China</button>

                  <button
                    type="button"
                    onClick={() => setSelectedProfileTab('global')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedProfileTab === 'global'
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span>🌐</span>
                    <span>{t('globalPayments')}</span>
                  </button>
                </div>
              </div>

              <label className="flex flex-wrap items-center gap-3 text-sm font-semibold">{language==='my'?'အသုံးပြုမည့် Payment Profile':'Choose active payment profile'}
                <select aria-label="Active payment profile" value={activePaymentProfile} onChange={e=>setPaymentProfile(e.target.value as PaymentProfile).catch(error=>alert(error.message))} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <option value="global">Global</option><option value="myanmar">Myanmar</option><option value="thailand">Thailand</option><option value="china">China</option>
                </select>
              </label>

              {selectedProfileTab === 'china' && <section className="space-y-3" aria-labelledby="china-payment-title">
                <h3 id="china-payment-title" className="font-bold">🇨🇳 China Payment Channels · CNY / ¥</h3>
                <p className="text-xs text-[var(--text-muted)]">Alipay, WeChat Pay, UnionPay, Chinese bank transfer and cash. Upload your actual merchant/bank QR.</p>
                <button type="button" onClick={() => setPaymentProfile('china').catch(e=>alert(e.message))} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white">Use China Payment Profile</button>
                {(settings.paymentSettings?.china?.methods || []).map(method => <div key={method.id} className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-[var(--border)]">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={method.enabled} onChange={e=>updatePaymentMethodConfig('china',method.id,{enabled:e.target.checked}).catch(error=>alert(error.message))} />{method.name}</label>
                  <span className="flex-1 text-xs text-[var(--text-muted)]">{method.account_name || method.instructions}</span>
                  {method.qr_code && <span className="text-xs text-emerald-500">QR configured</span>}
                  <button type="button" onClick={()=>setEditingMethod(method)} className="px-3 py-2 rounded-lg border border-[var(--border)]">Configure / Upload QR</button>
                </div>)}
              </section>}

              {/* THAILAND PAYMENT METHODS LIST */}
              {selectedProfileTab === 'thailand' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                        <span>🇹🇭 Thailand Banking Payment Methods</span>
                        <span className="text-[10px] font-normal text-[var(--text-muted)] lowercase">(thb / ฿)</span>
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Admin can enable/disable each method, configure account names, account numbers, instructions, and QR codes.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {(settings.paymentSettings?.thailand?.methods || []).map((method) => {
                      const isKPlus = method.id === 'kplus';
                      const isScbEasy = method.id === 'scb_easy';
                      const isPromptPay = method.id === 'promptpay';
                      const isTrueMoney = method.id === 'truemoney';

                      let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                      if (isKPlus) badgeColor = 'bg-[#00A950]/15 text-[#00A950] border border-[#00A950]/30';
                      else if (isScbEasy) badgeColor = 'bg-[#4E2A84]/15 text-[#6c3cb7] dark:text-[#a074e8] border border-[#4E2A84]/30';
                      else if (isPromptPay) badgeColor = 'bg-[#003B71]/15 text-[#00529b] dark:text-[#388bfd] border border-[#003B71]/30';
                      else if (isTrueMoney) badgeColor = 'bg-[#FF8800]/15 text-[#FF8800] border border-[#FF8800]/30';

                      return (
                        <div
                          key={method.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            method.enabled
                              ? 'border-[var(--border)] bg-[var(--surface)] shadow-xs'
                              : 'border-dashed border-[var(--border)] bg-[var(--surface-2)]/30 opacity-70'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Left: Info */}
                            <div className="flex items-start gap-3">
                              <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                                <input
                                  type="checkbox"
                                  checked={method.enabled}
                                  onChange={async (e) => {
                                    await updatePaymentMethodConfig('thailand', method.id, {
                                      enabled: e.target.checked,
                                    });
                                    setSaveToast(true);
                                    setTimeout(() => setSaveToast(false), 2000);
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                              </label>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${badgeColor}`}>
                                    {isKPlus ? 'KBank' : isScbEasy ? 'SCB' : isPromptPay ? 'PromptPay' : method.id}
                                  </span>
                                  <span className="text-xs font-bold text-[var(--text)]">
                                    {method.thai_name || method.name}
                                  </span>
                                  {method.bank_name && (
                                    <span className="text-[11px] text-[var(--text-muted)]">
                                      · {method.bank_name}
                                    </span>
                                  )}
                                </div>

                                {method.account_name && (
                                  <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-3 flex-wrap">
                                    <span>
                                      {isKPlus ? 'บัญชีผู้รับ' : 'ชื่อบัญชี'}: <strong className="text-[var(--text)]">{method.account_name}</strong>
                                    </span>
                                    {method.account_number && (
                                      <span>
                                        เลขที่บัญชี: <strong className="text-[var(--text)] font-mono">{method.account_number}</strong>
                                      </span>
                                    )}
                                  </div>
                                )}

                                {method.instructions && (
                                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                                    {method.instructions}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              {(isKPlus || isScbEasy || isPromptPay || method.account_number) && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewMethod(method)}
                                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer transition-all"
                                  title="Preview customer payment screen"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[var(--primary)]" />
                                  <span>Preview</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setEditingMethod(method)}
                                className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--primary)] hover:text-white text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 cursor-pointer transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>{t('edit')}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MYANMAR PAYMENT METHODS */}
              {selectedProfileTab === 'myanmar' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                        🇲🇲 Myanmar Payment Methods (MMK / Ks)
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        KBZ Pay, Wave Pay, AYA Pay, CB Pay, Cash, and Bank Wire.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {(settings.paymentSettings?.myanmar?.methods || []).map((method) => (
                      <div
                        key={method.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          method.enabled ? 'border-[var(--border)] bg-[var(--surface)]' : 'border-dashed border-[var(--border)] opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={method.enabled}
                              onChange={async (e) => {
                                await updatePaymentMethodConfig('myanmar', method.id, {
                                  enabled: e.target.checked,
                                });
                                setSaveToast(true);
                                setTimeout(() => setSaveToast(false), 2000);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                          </label>
                          <div>
                            <span className="text-xs font-bold text-[var(--text)]">{method.name}</span>
                            {method.account_number && (
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {method.account_name} · {method.account_number}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditingMethod(method)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--primary)] hover:text-white text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{t('edit')}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GLOBAL PAYMENT METHODS */}
              {selectedProfileTab === 'global' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                        🌐 Global Payment Methods (USD / $)
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        International Wire / ACH, Cards, PayPal, and Cash.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {(settings.paymentSettings?.global?.methods || []).map((method) => (
                      <div
                        key={method.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          method.enabled ? 'border-[var(--border)] bg-[var(--surface)]' : 'border-dashed border-[var(--border)] opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={method.enabled}
                              onChange={async (e) => {
                                await updatePaymentMethodConfig('global', method.id, {
                                  enabled: e.target.checked,
                                });
                                setSaveToast(true);
                                setTimeout(() => setSaveToast(false), 2000);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                          </label>
                          <div>
                            <span className="text-xs font-bold text-[var(--text)]">{method.name}</span>
                            {method.instructions && (
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {method.instructions}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditingMethod(method)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--primary)] hover:text-white text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{t('edit')}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informational Note */}
              <div className="p-3.5 rounded-lg bg-[var(--surface-2)]/50 border border-[var(--border)] text-xs text-[var(--text-muted)] space-y-1">
                <p className="font-semibold text-[var(--text)]">Payment Method vs Currency Decoupling:</p>
                <p>
                  Payment methods and currencies are independent concepts. K PLUS and SCB EASY do NOT perform automatic currency conversion. All credentials and accounts are stored securely in database settings.
                </p>
              </div>
            </div>
          )}

          {/* 6. CURRENCY (MANDATORY REQUIREMENT) */}
          {activeSection === 'currency' && (
            <div className="space-y-5">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-base font-bold text-[var(--text)]">
                  {t('settings_currency')} Selection
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('currencySettingDesc')}
                </p>
              </div>

              <p className="text-sm text-[var(--text-muted)]">{language === 'my' ? 'ငွေကြေးကို စိတ်ကြိုက်ရွေးပါ။ Language ပြောင်းလဲခြင်းက ငွေကြေးကို မပြောင်းပါ။' : 'Choose your currency. Changing language never changes currency.'}</p>

              {/* CURRENCY CARDS */}
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-2">
                  Active Currency ({currency})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currencyOptions.map((opt) => {
                    const isSelected = currency === opt.code;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => {
                          setCurrency(opt.code);
                          setSaveToast(true);
                          setTimeout(() => setSaveToast(false), 2000);
                        }}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)]/30 hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{opt.flag}</span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        <div className="mt-3">
                          <div className="font-bold text-sm text-[var(--text)]">
                            {opt.symbolDisplay}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            {opt.name}
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-[var(--border)] text-xs font-mono font-semibold text-[var(--primary)]">
                            Sample: {opt.example}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[var(--surface-2)]/50 border border-[var(--border)] text-xs text-[var(--text-muted)] space-y-1">
                <p className="font-semibold text-[var(--text)]">Accounting & Formatting Rule:</p>
                <p>
                  Monetary values are stored safely as numeric values in the database. When you select a currency here, all tickets, charges, balance dues, receipts, and reports format accordingly across the entire application without needing manual conversion formulas.
                </p>
              </div>
            </div>
          )}

          {/* 7. LANGUAGE (MANDATORY REQUIREMENT) */}
          {activeSection === 'language' && (
            <div className="space-y-5">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-base font-bold text-[var(--text)]">
                  {t('settings_language')} Selection
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('languageSettingDesc')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {languageOptions.map((opt) => {
                  const isSelected = language === opt.code;
                  return (
                    <button
                      key={opt.code}
                      onClick={() => {
                        setLanguage(opt.code);
                        setSaveToast(true);
                        setTimeout(() => setSaveToast(false), 2000);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-2)]/30 hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{opt.flag}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5">
                        <div className="font-bold text-xs sm:text-sm text-[var(--text)] truncate">
                          {opt.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                          {opt.country}
                        </div>
                        <div className="text-[10px] text-[var(--primary)] mt-1 font-mono uppercase">
                          Code: {opt.code}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-[var(--text-muted)]">
                Selected language persists automatically after refresh, logout, or browser restart.
              </p>
            </div>
          )}

          {/* 8. APPEARANCE (MANDATORY REQUIREMENT) */}
          {activeSection === 'appearance' && (
            <div className="space-y-5">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-base font-bold text-[var(--text)]">
                  {t('settings_appearance')} (Theme)
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('appearanceSettingDesc')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {themeOptions.map((opt) => {
                  const isSelected = theme === opt.code;
                  return (
                    <button
                      key={opt.code}
                      onClick={() => setTheme(opt.code)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-2)]/30 hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                          {opt.icon}
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="font-bold text-sm text-[var(--text)]">
                          {opt.label}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 9. PRINT */}
          {activeSection === 'print' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3 mb-4">
                <h2 className="text-base font-bold text-[var(--text)]">
                  {t('settings_print')} Layout
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Format for printed repair intake sheets and payment receipts
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  {t('paperSizeSetting')}
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setPaperSize('80mm')}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      paperSize === '80mm'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)]/40 text-[var(--text)]'
                    }`}
                  >
                    <div className="text-sm font-semibold">80mm Thermal Paper</div>
                    <div className="text-xs text-[var(--text-muted)]">POS-style strip receipt</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaperSize('A4')}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      paperSize === 'A4'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)]/40 text-[var(--text)]'
                    }`}
                  >
                    <div className="text-sm font-semibold">A4 Standard Sheet</div>
                    <div className="text-xs text-[var(--text-muted)]">Full page service agreement</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  {t('receiptFooter')}
                </label>
                <textarea
                  rows={3}
                  value={receiptFooterNote}
                  onChange={(e) => setReceiptFooterNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('save')}</span>
                </button>
              </div>
            </form>
          )}

          {/* 10. BACKUP & RESTORE */}
          {activeSection === 'backup' && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                      <Database className="w-4 h-4 text-[var(--primary)]" />
                      <span>{t('backupAndRestore')}</span>
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Full database archival, safe system restore with safety snapshots, and integrity audit.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Admin Exclusive
                  </span>
                </div>
              </div>

              {/* Status messages */}
              {backupSuccessToast && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{backupSuccessToast}</span>
                </div>
              )}

              {restoreSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{restoreSuccess}</span>
                </div>
              )}

              {restoreError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              {/* Action Cards: Create Backup & Restore Backup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Create Backup Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                      <Download className="w-4 h-4 text-emerald-500" />
                      <span>{t('createBackup')}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Exports a certified JSON database snapshot containing all service jobs, customer accounts, devices, technicians, repair notes, parts, payments, warranties, income, expenses, settings, and security audits.
                    </p>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono space-y-0.5 pt-1">
                      <div>· Customers ({customers.length}) · Devices ({devices.length})</div>
                      <div>· Service Jobs ({jobs.length}) · Technicians ({technicians.length})</div>
                      <div>· Warranties & Payments · Income & Expenses</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={backupLoading}
                    onClick={async () => {
                      setBackupLoading(true);
                      setBackupSuccessToast(null);
                      try {
                        const backup = await createBackup();
                        const blob = new Blob([JSON.stringify(backup.data, null, 2)], {
                          type: 'application/json',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = backup.metadata.filename || `fixflow_backup_${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);

                        setBackupLogs((prev) => [backup.metadata, ...prev]);
                        setBackupSuccessToast(
                          `Database backup (${(backup.metadata.size_bytes / 1024).toFixed(1)} KB) created successfully.`
                        );
                        setTimeout(() => setBackupSuccessToast(null), 4000);
                      } catch (err: any) {
                        alert(err.message || 'Failed to create backup');
                      } finally {
                        setBackupLoading(false);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{backupLoading ? 'Creating Snapshot...' : `[ ${t('createBackup')} ]`}</span>
                  </button>
                </div>

                {/* 2. Restore Backup Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                      <Upload className="w-4 h-4 text-blue-500" />
                      <span>{t('restoreBackup')}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Restores database from an existing backup file. Performs schema validation, structural integrity checks, and creates an automatic safety rollback backup before restoration.
                    </p>
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-semibold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <span>Safety mechanism creates automatic pre-restore safety copy.</span>
                    </div>
                  </div>

                  <div>
                    <label className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>[ {t('restoreBackup')} ]</span>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setRestoreFileName(file.name);
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const parsed = JSON.parse(event.target?.result as string);
                              setRestorePayload(parsed);
                              setRestoreError(null);
                              setRestoreModalOpen(true);
                            } catch (err) {
                              setRestoreError('Invalid backup file: Not valid JSON formatting.');
                            }
                          };
                          reader.readAsText(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Store Data Card */}
              <div className="p-4 sm:p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <Save className="w-4 h-4" />
                    <span>Save Store Data & Persistent State</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Safely commits and persists all workshop store data, settings, service records, and customer accounts to secure disk storage.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await createBackup();
                      setBackupSuccessToast('Store data saved and persisted securely to server storage!');
                      setTimeout(() => setBackupSuccessToast(null), 4000);
                    } catch (err: any) {
                      alert(err.message || 'Failed to save store data');
                    }
                  }}
                  className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>[ Save Store Data ]</span>
                </button>
              </div>

              {/* Backup History Table */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
                <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                    Recent Backup Archives & Integrity State
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    Safe Database Storage
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--surface-2)]/60 text-[var(--text-muted)] uppercase text-[10px] font-bold border-b border-[var(--border)]">
                      <tr>
                        <th className="py-2.5 px-4">Backup Date</th>
                        <th className="py-2.5 px-4">Filename / ID</th>
                        <th className="py-2.5 px-4">Backup Size</th>
                        <th className="py-2.5 px-4">Contents</th>
                        <th className="py-2.5 px-4 text-center">Backup Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] font-mono text-[11px]">
                      {backupLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[var(--surface-2)]/30">
                          <td className="py-3 px-4 font-sans text-xs">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="py-3 px-4 font-bold text-[var(--text)]">
                            {log.filename || log.id}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                            {(log.size_bytes / 1024).toFixed(1)} KB
                          </td>
                          <td className="py-3 px-4 font-sans text-[11px] text-[var(--text-muted)]">
                            {log.item_counts?.service_jobs ?? jobs.length} Jobs ·{' '}
                            {log.item_counts?.customers ?? customers.length} Cust ·{' '}
                            {log.item_counts?.technicians ?? technicians.length} Techs
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase font-sans">
                              {log.status || 'valid'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CONFIRMATION RESTORE MODAL */}
          {restoreModalOpen && restorePayload && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
              <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 border-b border-[var(--border)] bg-amber-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Confirm Database Restoration</span>
                  </div>
                  <button
                    onClick={() => {
                      setRestoreModalOpen(false);
                      setRestorePayload(null);
                    }}
                    className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <p className="text-[var(--text)]">
                    You are about to restore the system database from:
                    <strong className="block font-mono text-sm text-[var(--primary)] mt-1">
                      {restoreFileName}
                    </strong>
                  </p>

                  <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] space-y-1 font-mono text-[11px]">
                    <div className="font-bold text-[var(--text)] font-sans mb-1">
                      Detected Backup Contents:
                    </div>
                    <div>· Service Jobs: {restorePayload.service_jobs?.length || 0}</div>
                    <div>· Customers: {restorePayload.customers?.length || 0}</div>
                    <div>· Devices: {restorePayload.devices?.length || 0}</div>
                    <div>· Technicians: {restorePayload.technicians?.length || 0}</div>
                    <div>· Payments: {restorePayload.service_payments?.length || 0}</div>
                    <div>· Income Records: {restorePayload.income_records?.length || 0}</div>
                    <div>· Expense Records: {restorePayload.expense_records?.length || 0}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Automatic Pre-Restore Safety Snapshot</span>
                    </div>
                    <p className="text-[11px]">
                      The server will automatically generate a safety backup before overwriting current data. If any schema mismatch is detected, changes are immediately rolled back.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={restoreLoading}
                      onClick={() => {
                        setRestoreModalOpen(false);
                        setRestorePayload(null);
                      }}
                      className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={restoreLoading}
                      onClick={async () => {
                        setRestoreLoading(true);
                        setRestoreError(null);
                        setRestoreSuccess(null);
                        try {
                          const result = await restoreBackup(restorePayload);
                          if (result.success) {
                            setRestoreModalOpen(false);
                            setRestorePayload(null);
                            setRestoreSuccess(result.message || 'Database successfully restored and verified.');
                            setTimeout(() => setRestoreSuccess(null), 5000);
                          } else {
                            setRestoreError(result.error || 'Failed to restore database.');
                          }
                        } catch (err: any) {
                          setRestoreError(err.message || 'Restoration failed.');
                        } finally {
                          setRestoreLoading(false);
                        }
                      }}
                      className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{restoreLoading ? 'Verifying & Restoring...' : 'Confirm & Restore'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUPPORT DEVELOPER & DONATE */}
          {activeSection === 'donate' && (
            <div className="space-y-5">
              <div className="border-b border-[var(--border)] pb-3 mb-4">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span>Support Developer & Donate</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Support the continued development and maintenance of FixFlow Phone Service Management System.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DeveloperInfo />

                {/* Donation Card (KPay) */}
                <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>KBZPay Donation</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase">
                      Direct Support
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2 text-center">
                    <div className="text-xs text-[var(--text-muted)]">KBZPay Account Number</div>
                    <div className="font-mono font-black text-lg sm:text-xl text-[var(--text)] tracking-wider">
                      09256060722
                    </div>
                    <div className="text-xs font-semibold text-[var(--text)]">
                      Name: MyominAung
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('09256060722');
                        alert('KPay number 09256060722 copied to clipboard!');
                      }}
                      className="mt-2 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy KBZPay Number</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] text-center">
                    Your generous contribution helps keep this project free, open, and actively maintained. Thank you! 🙏
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 11. SECURITY */}
          {activeSection === 'security' && (
            <div className="space-y-4">
              <RecoveryKeySettings />
              <button onClick={()=>navigate('/users')} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Account Management</button>
              <div className="border-b border-[var(--border)] pb-3 mb-4">
                <h2 className="text-base font-bold text-[var(--text)]">
                  {t('settings_security')} & Role Governance
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Role-based access boundaries for Admin, Cashiers and Technicians
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
                  <div className="font-semibold text-sm text-[var(--text)] mb-1">
                    Role Privileges
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[var(--text-muted)]">
                    <li>
                      <strong>Administrator:</strong> Unrestricted access to Dashboard, All Services, Customers, Devices, Technicians, Financial Reports, and Settings.
                    </li>
                    <li>
                      <strong>Cashier:</strong> Service intake, payment collection and receipts. No staff, settings, backup, repair editing or deletion permissions.
                    </li>
                    <li>
                      <strong>Technician:</strong> Streamlined access restricted to Dashboard, My Services (assigned queue), Customer info, Devices, and About.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Configuration Modal */}
      {editingMethod && (
        <PaymentMethodConfigModal
          profile={selectedProfileTab}
          method={editingMethod}
          onClose={() => setEditingMethod(null)}
          onSave={async (updated) => {
            await updatePaymentMethodConfig(selectedProfileTab, updated.id, updated);
            setEditingMethod(null);
            setSaveToast(true);
            setTimeout(() => setSaveToast(false), 2000);
          }}
        />
      )}

      {/* Customer Payment Screen Live Preview Modal */}
      {previewMethod && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 text-white">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
                Interactive Preview (Amount: ฿1,500.00)
              </span>
              <button
                type="button"
                onClick={() => setPreviewMethod(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ThaiBankPaymentScreen
              methodConfig={previewMethod}
              amount={currency === 'THB' ? 1500 : (currency === 'MMK' ? 50000 : 50)}
              currency={currency}
              serviceNumber="SRV-202610-0001"
              customerName="Khun Somchai / Demo Customer"
              referenceNumber="KBANK-202610-09821"
              setReferenceNumber={() => {}}
              notes="Advance / repair settlement sample"
              setNotes={() => {}}
              onConfirm={() => {
                setPreviewMethod(null);
                setSaveToast(true);
                setTimeout(() => setSaveToast(false), 2000);
              }}
              onCancel={() => setPreviewMethod(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
